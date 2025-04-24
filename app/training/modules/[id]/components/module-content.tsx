'use client';

import { TrainingSection, TrainingProgress } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import SectionQuiz from './section-quiz';

interface Resource {
  id: string;
  title: string;
  url: string;
  description: string | null;
}

interface QuizQuestion {
  id: string;
  question: string;
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'OPEN_ENDED';
  points: number;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
}

interface ModuleContentProps {
  moduleId: string;
  section: TrainingSection & {
    resources: Resource[];
    quizQuestions: QuizQuestion[];
  };
  progress: TrainingProgress;
  totalSections: number;
}

export default function ModuleContent({
  moduleId,
  section,
  progress,
  totalSections,
}: ModuleContentProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentSectionIndex = progress.currentSection || 0;
  const isLastSection = currentSectionIndex === totalSections - 1;

  const handleNextSection = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Calculate new progress percentage
      const newSectionIndex = currentSectionIndex + 1;
      const percentComplete = Math.round((newSectionIndex / totalSections) * 100);

      // Determine if module is complete
      const isComplete = isLastSection;

      // Update progress
      const response = await fetch(`/api/training/modules/${moduleId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentSection: isComplete ? currentSectionIndex : newSectionIndex,
          percentComplete,
          status: isComplete ? 'COMPLETED' : 'IN_PROGRESS',
          completedAt: isComplete ? new Date().toISOString() : null,
        }),
      });

      if (response.ok) {
        if (isComplete) {
          // Redirect to completion page or certificate
          router.push(`/training/modules/${moduleId}/complete`);
        } else {
          // Refresh to show the next section
          router.refresh();
        }
      } else {
        console.error('Failed to update progress');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    switch (section.contentFormat) {
      case 'HTML':
        return (
          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: section.content }}
          />
        );

      case 'MARKDOWN':
        return (
          <div className="prose dark:prose-invert max-w-none">
            {/* In a real app, you would use a markdown parser here */}
            <pre className="whitespace-pre-wrap">{section.content}</pre>
          </div>
        );

      case 'VIDEO':
        return (
          <div className="mb-4 aspect-video">
            <iframe
              src={section.content}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full rounded-md"
            />
          </div>
        );

      case 'PDF':
        return (
          <div className="mb-4">
            <iframe
              src={`/api/training/resources/view?url=${encodeURIComponent(section.content)}`}
              className="h-[600px] w-full rounded-md border"
            />
          </div>
        );

      case 'QUIZ':
        return (
          <SectionQuiz
            moduleId={moduleId}
            section={section}
            progressId={progress.id}
            onComplete={handleNextSection}
          />
        );

      default:
        return <p>Unsupported content format: {section.contentFormat}</p>;
    }
  };

  return (
    <div className="bg-card text-card-foreground mb-8 rounded-lg p-6 shadow">
      <h2 className="mb-6 text-2xl font-bold">{section.title}</h2>

      <div className="mb-8">{renderContent()}</div>

      {section.resources.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-semibold">Additional Resources</h3>
          <div className="space-y-2">
            {section.resources.map((resource) => (
              <a
                key={resource.id}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-secondary/50 hover:bg-secondary flex items-center rounded-md p-3"
              >
                <span className="mr-2">📎</span>
                <div>
                  <p className="font-medium">{resource.title}</p>
                  {resource.description && (
                    <p className="text-muted-foreground text-sm">{resource.description}</p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {section.contentFormat !== 'QUIZ' && (
        <div className="flex justify-end">
          <button
            onClick={handleNextSection}
            disabled={isSubmitting}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 disabled:opacity-50"
          >
            {isLastSection ? 'Complete Module' : 'Next Section'}
          </button>
        </div>
      )}
    </div>
  );
}
