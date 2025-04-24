'use client';

import { ContentFormat, TrainingSection } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ModuleNavigationProps {
  moduleId: string;
  sections: TrainingSection[];
  currentSection: number;
}

export default function ModuleNavigation({
  moduleId,
  sections,
  currentSection,
}: ModuleNavigationProps) {
  const router = useRouter();
  const [isNavExpanded, setIsNavExpanded] = useState(false);

  const handleSectionClick = (sectionIndex: number) => {
    // Navigate to update the current section via API
    fetch(`/api/training/modules/${moduleId}/progress`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currentSection: sectionIndex }),
    })
      .then((res) => {
        if (res.ok) {
          // Refresh the page to show the new section
          router.refresh();
        }
      })
      .catch((error) => {
        console.error('Failed to update current section:', error);
      });
  };

  // Generate content type icon based on format
  const getContentIcon = (format: ContentFormat) => {
    switch (format) {
      case 'HTML':
      case 'MARKDOWN':
        return '📄';
      case 'VIDEO':
        return '🎬';
      case 'PDF':
        return '📑';
      case 'QUIZ':
        return '❓';
      default:
        return '📝';
    }
  };

  return (
    <div className="mb-6">
      <div className="bg-card text-card-foreground overflow-hidden rounded-lg shadow">
        <div
          className="hover:bg-muted/50 flex cursor-pointer items-center justify-between p-4"
          onClick={() => setIsNavExpanded(!isNavExpanded)}
        >
          <h2 className="font-semibold">Module Sections</h2>
          <span>{isNavExpanded ? '▲' : '▼'}</span>
        </div>

        {isNavExpanded && (
          <div className="border-t p-4">
            <div className="space-y-2">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  onClick={() => handleSectionClick(index)}
                  className={`flex cursor-pointer items-center rounded-md p-3 transition-colors ${
                    currentSection === index
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="mr-3 flex-shrink-0">{getContentIcon(section.contentFormat)}</div>
                  <div className="flex-grow">
                    <h3 className="font-medium">{section.title}</h3>
                    <p className="text-muted-foreground text-xs">
                      {section.contentFormat}
                      {section.isOptional && ' • Optional'}
                    </p>
                  </div>
                  {currentSection === index && (
                    <div className="ml-2 flex-shrink-0 text-sm">Current</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
