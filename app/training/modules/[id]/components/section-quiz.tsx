'use client';

import { TrainingSection } from '@prisma/client';
import { useState } from 'react';

interface QuizQuestion {
  id: string;
  question: string;
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'OPEN_ENDED';
  points: number;
  options: {
    id: string;
    text: string;
  }[];
}

interface QuizResult {
  correctAnswers: number;
  totalQuestions: number;
}

interface SectionQuizProps {
  moduleId: string;
  section: TrainingSection & {
    quizQuestions: QuizQuestion[];
  };
  progressId: string;
  onComplete: () => void;
}

export default function SectionQuiz({
  moduleId,
  section,
  progressId,
  onComplete,
}: SectionQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[] | string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = section.quizQuestions;
  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswer = (questionId: string, value: string | string[]) => {
    setAnswers({
      ...answers,
      [questionId]: value,
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmitQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        selectedOptions: Array.isArray(answer) ? answer : [],
        textAnswer: typeof answer === 'string' ? answer : undefined,
      }));

      const response = await fetch(`/api/training/modules/${moduleId}/quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          progressId,
          answers: formattedAnswers,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setQuizResults(data);
        setQuizSubmitted(true);
      } else {
        console.error('Failed to submit quiz');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentQuestion) {
    return <div>No questions available for this quiz.</div>;
  }

  if (quizSubmitted && quizResults) {
    const { correctAnswers, totalQuestions } = quizResults;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);

    return (
      <div className="text-center">
        <h3 className="mb-4 text-xl font-bold">Quiz Results</h3>

        <div className="mb-6">
          <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full border-8">
            <span className="text-2xl font-bold">{percentage}%</span>
          </div>
          <p className="text-muted-foreground mt-2">
            You got {correctAnswers} out of {totalQuestions} questions correct.
          </p>
        </div>

        <div className="mb-8">
          {percentage >= 70 ? (
            <div className="rounded-md bg-green-500/10 p-4 text-green-500">
              <p className="font-semibold">Congratulations! You passed the quiz.</p>
            </div>
          ) : (
            <div className="bg-destructive/10 text-destructive rounded-md p-4">
              <p className="font-semibold">You did not pass the quiz. Please try again.</p>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          {percentage >= 70 ? (
            <button
              onClick={onComplete}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={() => {
                setQuizSubmitted(false);
                setCurrentQuestionIndex(0);
                setAnswers({});
              }}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-md px-4 py-2"
            >
              Retry Quiz
            </button>
          )}
        </div>
      </div>
    );
  }

  const renderQuestionContent = () => {
    if (currentQuestion.questionType === 'MULTIPLE_CHOICE') {
      return (
        <div className="space-y-3">
          {currentQuestion.options.map((option) => (
            <label
              key={option.id}
              className="bg-secondary/30 hover:bg-secondary/50 flex cursor-pointer items-center space-x-2 rounded-md p-3"
            >
              <input
                type="radio"
                name={currentQuestion.id}
                value={option.id}
                checked={(answers[currentQuestion.id] as string[])?.includes(option.id)}
                onChange={() => handleAnswer(currentQuestion.id, [option.id])}
                className="h-4 w-4"
              />
              <span>{option.text}</span>
            </label>
          ))}
        </div>
      );
    } else if (currentQuestion.questionType === 'TRUE_FALSE') {
      return (
        <div className="space-y-3">
          {[
            { id: 'true', text: 'True' },
            { id: 'false', text: 'False' },
          ].map((option) => (
            <label
              key={option.id}
              className="bg-secondary/30 hover:bg-secondary/50 flex cursor-pointer items-center space-x-2 rounded-md p-3"
            >
              <input
                type="radio"
                name={currentQuestion.id}
                value={option.id}
                checked={answers[currentQuestion.id] === option.id}
                onChange={() => handleAnswer(currentQuestion.id, option.id)}
                className="h-4 w-4"
              />
              <span>{option.text}</span>
            </label>
          ))}
        </div>
      );
    } else if (currentQuestion.questionType === 'OPEN_ENDED') {
      return (
        <textarea
          value={(answers[currentQuestion.id] as string) || ''}
          onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
          className="border-input bg-background min-h-[100px] w-full rounded-md border p-3"
          placeholder="Enter your answer here..."
        />
      );
    }

    return <p>Unsupported question type: {currentQuestion.questionType}</p>;
  };

  return (
    <div>
      <div className="mb-6">
        <div className="text-muted-foreground mb-2 flex items-center justify-between text-sm">
          <span>
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span>
            {currentQuestion.points} {currentQuestion.points === 1 ? 'point' : 'points'}
          </span>
        </div>

        <div className="bg-secondary mb-6 h-2 w-full rounded-full">
          <div
            className="bg-primary h-2 rounded-full"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>

        <h3 className="mb-4 text-xl font-semibold">{currentQuestion.question}</h3>

        {renderQuestionContent()}
      </div>

      <div className="flex justify-between">
        <button
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-md px-4 py-2 disabled:opacity-50"
        >
          Previous
        </button>

        <button
          onClick={handleNextQuestion}
          disabled={!answers[currentQuestion.id] || isSubmitting}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 disabled:opacity-50"
        >
          {currentQuestionIndex === questions.length - 1 ? 'Submit Quiz' : 'Next'}
        </button>
      </div>
    </div>
  );
}
