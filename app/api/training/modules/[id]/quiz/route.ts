import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/training/modules/[id]/quiz - Submit quiz answers
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const moduleId = params.id;
    const userId = session.user.id;
    const data = await request.json();

    const { progressId, answers } = data;

    // Verify ownership of progress record
    const progress = await prisma.trainingProgress.findUnique({
      where: { id: progressId },
    });

    if (!progress || progress.userId !== userId || progress.moduleId !== moduleId) {
      return NextResponse.json({ error: 'Invalid progress record' }, { status: 400 });
    }

    // Process each answer
    // Match the exact shape of the data we're going to add
    interface ProcessedAnswer {
      id: string;
      questionId: string;
      isCorrect: boolean | null;
      progressId: string;
      selectedOptions: string[];
      textAnswer: string | null;
      attemptNumber: number;
      answeredAt: Date;
    }
    const processedAnswers: ProcessedAnswer[] = [];
    let correctAnswers = 0;
    const totalQuestions = answers.length;

    for (const answer of answers) {
      // Get the question to check if answer is correct
      const question = await prisma.quizQuestion.findUnique({
        where: { id: answer.questionId },
        include: {
          options: true,
        },
      });

      if (!question) {
        continue;
      }

      // Determine if answer is correct
      let isCorrect = false;

      if (question.questionType === 'MULTIPLE_CHOICE') {
        // Check if selected options match the correct options
        const correctOptions = question.options.filter((opt) => opt.isCorrect).map((opt) => opt.id);

        const selectedOptions = answer.selectedOptions || [];

        isCorrect =
          correctOptions.length === selectedOptions.length &&
          correctOptions.every((opt) => selectedOptions.includes(opt));
      } else if (question.questionType === 'TRUE_FALSE') {
        // For true/false, there's a single answer
        const correctAnswer = question.options.find((opt) => opt.isCorrect)?.id;
        isCorrect = answer.selectedOptions?.[0] === correctAnswer;
      } else if (question.questionType === 'OPEN_ENDED') {
        // For open-ended, we'd need some logic to verify or mark for review
        // For now, we'll count them as correct
        isCorrect = true;
      }

      // Save the answer
      const quizAnswer = await prisma.quizAnswer.create({
        data: {
          questionId: answer.questionId,
          progressId,
          selectedOptions: answer.selectedOptions || [],
          textAnswer: answer.textAnswer || null,
          isCorrect,
          attemptNumber: 1, // Could be incremented for retakes
          answeredAt: new Date(), // Set current date
        },
      });

      processedAnswers.push(quizAnswer);

      if (isCorrect) {
        correctAnswers++;
      }
    }

    // Calculate score
    const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    // Update progress with quiz score
    await prisma.trainingProgress.update({
      where: { id: progressId },
      data: {
        quizScore: score,
      },
    });

    return NextResponse.json({
      score,
      correctAnswers,
      totalQuestions,
      answers: processedAnswers,
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return NextResponse.json({ error: 'Failed to submit quiz' }, { status: 500 });
  }
}
