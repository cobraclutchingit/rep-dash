"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ContentFormat, TrainingSection } from "@prisma/client";

interface ModuleNavigationProps {
  moduleId: string;
  sections: TrainingSection[];
  currentSection: number;
}

export default function ModuleNavigation({ 
  moduleId, 
  sections, 
  currentSection 
}: ModuleNavigationProps) {
  const router = useRouter();
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  
  const handleSectionClick = (sectionIndex: number) => {
    // Navigate to update the current section via API
    fetch(`/api/training/modules/${moduleId}/progress`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
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
        console.error("Failed to update current section:", error);
      });
  };
  
  // Generate content type icon based on format
  const getContentIcon = (format: ContentFormat) => {
    switch (format) {
      case "HTML":
      case "MARKDOWN":
        return "📄";
      case "VIDEO":
        return "🎬";
      case "PDF":
        return "📑";
      case "QUIZ":
        return "❓";
      default:
        return "📝";
    }
  };
  
  return (
    <div className="mb-6">
      <div className="bg-card text-card-foreground rounded-lg shadow overflow-hidden">
        <div 
          className="p-4 flex justify-between items-center cursor-pointer hover:bg-muted/50"
          onClick={() => setIsNavExpanded(!isNavExpanded)}
        >
          <h2 className="font-semibold">Module Sections</h2>
          <span>{isNavExpanded ? "▲" : "▼"}</span>
        </div>
        
        {isNavExpanded && (
          <div className="border-t p-4">
            <div className="space-y-2">
              {sections.map((section, index) => (
                <div 
                  key={section.id}
                  onClick={() => handleSectionClick(index)} 
                  className={`p-3 rounded-md flex items-center cursor-pointer transition-colors ${
                    currentSection === index 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="flex-shrink-0 mr-3">{getContentIcon(section.contentFormat)}</div>
                  <div className="flex-grow">
                    <h3 className="font-medium">{section.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {section.contentFormat}
                      {section.isOptional && " • Optional"}
                    </p>
                  </div>
                  {currentSection === index && (
                    <div className="flex-shrink-0 ml-2 text-sm">
                      Current
                    </div>
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