'use client';

import React from 'react';

import { ImportantLink } from '../providers/communication-provider';

interface LinkCardProps {
  link: ImportantLink;
}

export default function LinkCard({ link }: LinkCardProps) {
  // Get the icon to display
  const getIcon = () => {
    if (link.icon) return link.icon;

    // Default icons based on URL pattern
    if (link.url.includes('docs.google.com')) return '📄';
    if (link.url.includes('drive.google.com')) return '📁';
    if (link.url.includes('sheets.google.com')) return '📊';
    if (link.url.includes('forms.google.com')) return '📝';
    if (link.url.includes('youtube.com') || link.url.includes('vimeo.com')) return '📺';
    if (link.url.includes('zoom.us') || link.url.includes('teams.microsoft.com')) return '🎥';
    if (link.url.includes('github.com')) return '💻';
    if (link.url.includes('salesforce.com')) return '📈';

    // Default fallback
    return '🔗';
  };

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-card text-card-foreground hover:bg-muted/10 block rounded-lg p-4 shadow transition-all hover:shadow-md"
    >
      <div className="flex items-center">
        <div className="bg-primary/10 text-primary mr-3 flex h-10 w-10 items-center justify-center rounded-full text-xl">
          {getIcon()}
        </div>
        <div>
          <h3 className="font-medium">{link.title}</h3>
          {link.description && (
            <p className="text-muted-foreground line-clamp-1 text-sm">{link.description}</p>
          )}
        </div>
      </div>
    </a>
  );
}
