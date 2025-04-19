"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ContentFormat, TrainingSection, TrainingProgress } from "@prisma/client";
import SectionQuiz from "./section-quiz";

interface ModuleContentProps {
  moduleId: string;
  section: TrainingSection & {
    resources: any[];
    quizQuestions: any[];
  };
  progress: TrainingProgress;
  totalSections: number;
}

export default function ModuleContent({ 
  moduleId, 
  section, 
  progress, 
  totalSections 
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
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentSection: isComplete ? currentSectionIndex : newSectionIndex,
          percentComplete,
          status: isComplete ? "COMPLETED" : "IN_PROGRESS",
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
        console.error("Failed to update progress");
      }
    } catch (error) {
      console.error("Error updating progress:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderContent = () => {
    switch (section.contentFormat) {
      case "HTML":
        return (
          <div className="prose dark:prose-invert max-w-none" 
               dangerouslySetInnerHTML={{ __html: section.content }} 
          />
        );
      
      case "MARKDOWN":
        return (
          <div className="prose dark:prose-invert max-w-none">
            {/* In a real app, you would use a markdown parser here */}
            <pre className="whitespace-pre-wrap">{section.content}</pre>
          </div>
        );
        
      case "VIDEO":
        return (
          <div className="aspect-video mb-4">
            <iframe
              src={section.content}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full rounded-md"
            />
          </div>
        );
        
      case "PDF":
        return (
          <div className="mb-4">
            <iframe
              src={`/api/training/resources/view?url=${encodeURIComponent(section.content)}`}
              className="w-full h-[600px] rounded-md border"
            />
          </div>
        );
        
      case "QUIZ":
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
    <div className="bg-card text-card-foreground rounded-lg shadow p-6 mb-8">
      <h2 className="text-2xl font-bold mb-6">{section.title}</h2>
      
      <div className="mb-8">
        {renderContent()}
      </div>
      
      {section.resources.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Additional Resources</h3>
          <div className="space-y-2">
            {section.resources.map((resource) => (
              <a
                key={resource.id}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-3 rounded-md bg-secondary/50 hover:bg-secondary"
              >
                <span className="mr-2">📎</span>
                <div>
                  <p className="font-medium">{resource.title}</p>
                  {resource.description && (
                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
      
      {section.contentFormat !== "QUIZ" && (
        <div className="flex justify-end">
          <button
            onClick={handleNextSection}
            disabled={isSubmitting}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {isLastSection ? "Complete Module" : "Next Section"}
          </button>
        </div>
      )}
    </div>
  );
}