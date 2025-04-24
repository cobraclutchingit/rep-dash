'use client';

import { AnnouncementPriority } from '@prisma/client';
import { formatDistanceToNow } from 'date-fns';
import React, { useState } from 'react';

import { Announcement } from '../providers/communication-provider';

interface AnnouncementCardProps {
  announcement: Announcement;
  compact?: boolean;
}

export default function AnnouncementCard({ announcement, compact = false }: AnnouncementCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Priority color mapping
  const getPriorityColor = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'URGENT':
        return 'border-destructive bg-destructive/10 text-destructive';
      case 'HIGH':
        return 'border-amber-500 bg-amber-500/10 text-amber-500';
      case 'MEDIUM':
        return 'border-blue-500 bg-blue-500/10 text-blue-500';
      case 'LOW':
      default:
        return 'border-green-500 bg-green-500/10 text-green-500';
    }
  };

  // Format the date for display
  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  // Priority label display
  const priorityLabel =
    announcement.priority.charAt(0) + announcement.priority.slice(1).toLowerCase();

  return (
    <div
      className={`bg-card text-card-foreground rounded-lg border-l-4 p-6 shadow ${getPriorityColor(announcement.priority)} transition-all hover:shadow-md ${announcement.isPinned ? 'ring-primary/20 ring-2' : ''}`}
    >
      <div className="mb-2 flex items-start">
        <div className="flex-1">
          <h3 className="font-semibold">{announcement.title}</h3>
          <p className="text-muted-foreground text-xs">
            {formatDate(announcement.publishDate)}
            {announcement.category && <> · {announcement.category}</>}
            {announcement.isPinned && <> · 📌 Pinned</>}
          </p>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs ${getPriorityColor(announcement.priority)}`}
        >
          {priorityLabel}
        </span>
      </div>

      <div className={`text-sm ${compact && !isExpanded ? 'line-clamp-3' : ''}`}>
        {announcement.content.split('\n').map((paragraph, i) => (
          <p key={i} className="mb-2">
            {paragraph}
          </p>
        ))}
      </div>

      {compact && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-primary mt-2 text-sm hover:underline"
        >
          {isExpanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}
