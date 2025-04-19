"use client";

import { CalendarEvent } from "../providers/calendar-provider";

interface EventAgendaItemProps {
  event: CalendarEvent;
}

export default function EventAgendaItem({ event }: EventAgendaItemProps) {
  // Format time for display
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  };
  
  // Format event type for display
  const formatEventType = (type: string) => {
    return type.replace(/_/g, " ").toLowerCase()
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  
  // Get color based on event type
  const getEventColor = (eventType: string) => {
    const colorMap: Record<string, string> = {
      TRAINING: "border-blue-500",
      MEETING: "border-purple-500",
      APPOINTMENT: "border-green-500",
      BLITZ: "border-orange-500",
      CONTEST: "border-pink-500",
      HOLIDAY: "border-slate-500",
      OTHER: "border-gray-500",
    };
    
    return colorMap[eventType] || colorMap.OTHER;
  };
  
  // Get background color based on event type (lighter version)
  const getEventBgColor = (eventType: string) => {
    const colorMap: Record<string, string> = {
      TRAINING: "bg-blue-500/10",
      MEETING: "bg-purple-500/10",
      APPOINTMENT: "bg-green-500/10",
      BLITZ: "bg-orange-500/10",
      CONTEST: "bg-pink-500/10",
      HOLIDAY: "bg-slate-500/10",
      OTHER: "bg-gray-500/10",
    };
    
    return colorMap[eventType] || colorMap.OTHER;
  };
  
  // Get text color based on event type
  const getEventTextColor = (eventType: string) => {
    const colorMap: Record<string, string> = {
      TRAINING: "text-blue-600 dark:text-blue-400",
      MEETING: "text-purple-600 dark:text-purple-400",
      APPOINTMENT: "text-green-600 dark:text-green-400",
      BLITZ: "text-orange-600 dark:text-orange-400",
      CONTEST: "text-pink-600 dark:text-pink-400",
      HOLIDAY: "text-slate-600 dark:text-slate-400",
      OTHER: "text-gray-600 dark:text-gray-400",
    };
    
    return colorMap[eventType] || colorMap.OTHER;
  };
  
  return (
    <div className={`pl-3 py-2 border-l-2 ${getEventColor(event.eventType)} ${getEventBgColor(event.eventType)}`}>
      <div className="font-medium">{event.title}</div>
      <div className={`text-xs ${getEventTextColor(event.eventType)} flex items-center`}>
        <span>{formatEventType(event.eventType)}</span>
        {event.isBlitz && (
          <span className="ml-2 px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 rounded text-[10px]">
            BLITZ
          </span>
        )}
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        {event.allDay ? (
          <span>All day</span>
        ) : (
          <span>
            {formatTime(event.startDate)} - {formatTime(event.endDate)}
          </span>
        )}
        {event.location && (
          <span className="ml-2">• {event.location}</span>
        )}
      </div>
      {event.description && (
        <div className="text-xs mt-1 line-clamp-1">{event.description}</div>
      )}
    </div>
  );
}