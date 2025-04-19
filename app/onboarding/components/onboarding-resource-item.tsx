"use client";

import { Resource } from "../providers/onboarding-provider";

interface OnboardingResourceItemProps {
  resource: Resource;
}

export default function OnboardingResourceItem({ resource }: OnboardingResourceItemProps) {
  // Get icon based on resource type
  const getResourceIcon = (type: string) => {
    switch (type) {
      case "LINK":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        );
      case "VIDEO":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case "PDF":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case "DOCUMENT":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case "PRESENTATION":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        );
      case "SPREADSHEET":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case "IMAGE":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case "AUDIO":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 01.707-7.07l.354-.354" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
    }
  };
  
  // Build badge text based on type
  const getBadgeText = (type: string) => {
    switch (type) {
      case "LINK": return "Link";
      case "VIDEO": return "Video";
      case "PDF": return "PDF";
      case "DOCUMENT": return "Document";
      case "PRESENTATION": return "Presentation";
      case "SPREADSHEET": return "Spreadsheet";
      case "IMAGE": return "Image";
      case "AUDIO": return "Audio";
      default: return "Resource";
    }
  };
  
  // Get color based on type
  const getTypeColor = (type: string) => {
    switch (type) {
      case "LINK": return "bg-blue-500/10 text-blue-500";
      case "VIDEO": return "bg-red-500/10 text-red-500";
      case "PDF": return "bg-orange-500/10 text-orange-500";
      case "DOCUMENT": return "bg-amber-500/10 text-amber-500";
      case "PRESENTATION": return "bg-purple-500/10 text-purple-500";
      case "SPREADSHEET": return "bg-green-500/10 text-green-500";
      case "IMAGE": return "bg-indigo-500/10 text-indigo-500";
      case "AUDIO": return "bg-pink-500/10 text-pink-500";
      default: return "bg-secondary text-secondary-foreground";
    }
  };
  
  return (
    <a 
      href={resource.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center p-3 rounded-md bg-muted/30 hover:bg-muted transition-colors"
    >
      <div className="mr-3 text-muted-foreground">{getResourceIcon(resource.type)}</div>
      
      <div className="flex-grow min-w-0">
        <h4 className="font-medium truncate">{resource.title}</h4>
        {resource.description && (
          <p className="text-xs text-muted-foreground truncate">{resource.description}</p>
        )}
      </div>
      
      <div className="ml-3 flex-shrink-0">
        <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(resource.type)}`}>
          {getBadgeText(resource.type)}
        </span>
      </div>
    </a>
  );
}