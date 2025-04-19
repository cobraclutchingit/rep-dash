"use client";

import React from "react";
import { ImportantLink } from "../providers/communication-provider";

interface LinkCardProps {
  link: ImportantLink;
}

export default function LinkCard({ link }: LinkCardProps) {
  // Get the icon to display
  const getIcon = () => {
    if (link.icon) return link.icon;
    
    // Default icons based on URL pattern
    if (link.url.includes("docs.google.com")) return "📄";
    if (link.url.includes("drive.google.com")) return "📁";
    if (link.url.includes("sheets.google.com")) return "📊";
    if (link.url.includes("forms.google.com")) return "📝";
    if (link.url.includes("youtube.com") || link.url.includes("vimeo.com")) return "📺";
    if (link.url.includes("zoom.us") || link.url.includes("teams.microsoft.com")) return "🎥";
    if (link.url.includes("github.com")) return "💻";
    if (link.url.includes("salesforce.com")) return "📈";
    
    // Default fallback
    return "🔗";
  };

  return (
    <a 
      href={link.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="block bg-card text-card-foreground rounded-lg shadow p-4 hover:shadow-md transition-all hover:bg-muted/10"
    >
      <div className="flex items-center">
        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl mr-3">
          {getIcon()}
        </div>
        <div>
          <h3 className="font-medium">{link.title}</h3>
          {link.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">{link.description}</p>
          )}
        </div>
      </div>
    </a>
  );
}