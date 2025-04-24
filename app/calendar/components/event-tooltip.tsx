'use client';

import React, { useEffect, useRef, useState } from 'react';

import { CalendarEvent } from '../providers/calendar-provider';

interface EventTooltipProps {
  event: CalendarEvent;
  position: { x: number; y: number };
  onClose: () => void;
}

export default function EventTooltip({ event, position, onClose }: EventTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    // Calculate tooltip position
    if (tooltipRef.current) {
      const tooltipHeight = tooltipRef.current.offsetHeight;
      const tooltipWidth = tooltipRef.current.offsetWidth;
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;

      // Check if tooltip would go off screen to the right
      let left = position.x + 10;
      if (left + tooltipWidth > windowWidth) {
        left = position.x - tooltipWidth - 10;
      }

      // Check if tooltip would go off screen to the bottom
      let top = position.y + 10;
      if (top + tooltipHeight > windowHeight) {
        top = position.y - tooltipHeight - 10;
      }

      setTooltipPos({ top, left });
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [position, onClose]);

  // Format date for display
  const formatDate = (date: Date) => {
    if (event.allDay) {
      return new Date(date).toLocaleDateString();
    }
    return new Date(date).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Format event type for display
  const formatEventType = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div
      ref={tooltipRef}
      className="bg-card absolute z-50 max-w-72 min-w-60 rounded-md border p-3 shadow-lg"
      style={{
        borderColor: 'hsl(var(--border))',
        top: tooltipPos.top,
        left: tooltipPos.left,
      }}
    >
      <div className="mb-1 text-sm font-medium">{event.title}</div>

      <div className="text-muted-foreground mb-2 flex items-center text-xs">
        <span
          className={`mr-1 inline-block h-2 w-2 rounded-full ${getEventTypeColor(event.eventType)}`}
        ></span>
        <span>{formatEventType(event.eventType)}</span>
        {event.isBlitz && (
          <span className="ml-2 rounded-sm bg-orange-100 px-1.5 py-0.5 text-[10px] text-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
            BLITZ
          </span>
        )}
      </div>

      <div className="mb-2 text-xs">
        <div className="flex items-start">
          <CalendarIcon className="mt-0.5 mr-1 flex-shrink-0" />
          <div>
            <div>{formatDate(event.startDate)}</div>
            {!isSameDay(event.startDate, event.endDate) && (
              <div className="mt-0.5">to {formatDate(event.endDate)}</div>
            )}
          </div>
        </div>
      </div>

      {event.location && (
        <div className="mb-2 flex items-start text-xs">
          <LocationIcon className="mt-0.5 mr-1 flex-shrink-0" />
          <div>{event.location}</div>
        </div>
      )}

      {event.description && (
        <div className="mt-2 line-clamp-2 border-t pt-2 text-xs">{event.description}</div>
      )}
    </div>
  );
}

// Helper function to check if dates are the same day
function isSameDay(date1: Date, date2: Date) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// Return CSS class for event type color
function getEventTypeColor(eventType: string) {
  const eventColors: Record<string, string> = {
    TRAINING: 'bg-blue-500',
    MEETING: 'bg-purple-500',
    APPOINTMENT: 'bg-green-500',
    BLITZ: 'bg-orange-500',
    CONTEST: 'bg-pink-500',
    HOLIDAY: 'bg-slate-500',
    OTHER: 'bg-gray-500',
  };

  return eventColors[eventType] || eventColors.OTHER;
}

// Icon components
function CalendarIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );
}

function LocationIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  );
}
