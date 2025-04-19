"use client";

import React from "react";
import { useCalendar } from "../providers/calendar-provider";
import { canEditEvent, canManageEvents } from "@/lib/utils/permissions";
import { useSession } from "next-auth/react";

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function EventDetailsModal({ isOpen, onClose, userId }: EventDetailsModalProps) {
  const { data: session } = useSession();
  const { selectedEvent, setSelectedEvent, setIsCreatingEvent, deleteEvent } = useCalendar();
  
  if (!isOpen || !selectedEvent) return null;
  
  // Format dates for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  
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
  
  // Check if user can edit this event
  const userCanEditEvent = canEditEvent(session, selectedEvent.createdById);
  
  // Handle editing event
  const handleEditEvent = () => {
    setIsCreatingEvent(true);
    onClose();
  };
  
  // Handle deleting event
  const handleDeleteEvent = async () => {
    if (confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      try {
        // Call API to delete event
        await fetch(`/api/calendar/events/${selectedEvent.id}`, {
          method: "DELETE",
        });
        
        // Remove event from state
        deleteEvent(selectedEvent.id);
        onClose();
      } catch (error) {
        console.error("Failed to delete event:", error);
        alert("Failed to delete event. Please try again.");
      }
    }
  };
  
  return (
    <div className="fixed inset-0 bg-background/50 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-lg shadow-lg">
        <div className="flex justify-between items-start p-6 pb-0">
          <h2 className="text-xl font-bold">{selectedEvent.title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted"
            aria-label="Close"
          >
            <XIcon />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <EventTypeIcon type={selectedEvent.eventType} />
            <span>{formatEventType(selectedEvent.eventType)}</span>
            {selectedEvent.isBlitz && (
              <span className="ml-2 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 rounded-sm text-xs">
                BLITZ
              </span>
            )}
          </div>
          
          <div className="flex items-start space-x-2">
            <CalendarIcon className="mt-1 flex-shrink-0" />
            <div>
              <div>{formatDate(selectedEvent.startDate)}</div>
              {selectedEvent.allDay ? (
                <div className="text-sm text-muted-foreground">All day</div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {formatTime(selectedEvent.startDate)} - {formatTime(selectedEvent.endDate)}
                </div>
              )}
              {!isSameDay(selectedEvent.startDate, selectedEvent.endDate) && (
                <div className="text-sm mt-1">
                  Until {formatDate(selectedEvent.endDate)}
                  {!selectedEvent.allDay && <span> at {formatTime(selectedEvent.endDate)}</span>}
                </div>
              )}
            </div>
          </div>
          
          {selectedEvent.location && (
            <div className="flex items-start space-x-2">
              <LocationIcon className="mt-1 flex-shrink-0" />
              <div>
                <div>{selectedEvent.location}</div>
                {selectedEvent.locationUrl && (
                  <a
                    href={selectedEvent.locationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Join meeting
                  </a>
                )}
              </div>
            </div>
          )}
          
          {selectedEvent.description && (
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium mb-2">Description</h3>
              <div className="text-sm whitespace-pre-wrap">{selectedEvent.description}</div>
            </div>
          )}
          
          {selectedEvent.attendees.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium mb-2">Attendees</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedEvent.attendees.map((attendee) => (
                  <div key={attendee.id} className="flex items-center">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs mr-2">
                      {attendee.user.name?.[0] || attendee.user.email[0]}
                    </div>
                    <div className="text-sm">
                      <div>{attendee.user.name || attendee.user.email}</div>
                      <div className="text-xs text-muted-foreground">
                        {attendee.status === "ACCEPTED" 
                          ? "Attending" 
                          : attendee.status === "DECLINED" 
                            ? "Declined" 
                            : "Pending"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="border-t pt-4 mt-4 flex items-center text-xs text-muted-foreground">
            <span>Created by {selectedEvent.createdBy.name || selectedEvent.createdBy.email}</span>
          </div>
          
          {userCanEditEvent && (
            <div className="flex justify-end space-x-2 border-t pt-4 mt-4">
              {canManageEvents(session) && (
                <button
                  onClick={handleDeleteEvent}
                  className="px-3 py-1.5 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 text-sm"
                >
                  Delete
                </button>
              )}
              <button
                onClick={handleEditEvent}
                className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </div>
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

// Icon components
function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}

function CalendarIcon({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );
}

function LocationIcon({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  );
}

function EventTypeIcon({ type }: { type: string }) {
  // Define icon based on event type
  const iconMap: Record<string, React.ReactNode> = {
    TRAINING: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
    ),
    MEETING: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
    APPOINTMENT: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
        <line x1="10" y1="14" x2="14" y2="18"></line>
        <line x1="14" y1="14" x2="10" y2="18"></line>
      </svg>
    ),
    BLITZ: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
      </svg>
    ),
    CONTEST: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="8 6 21 6 21 20 8 20"></polyline>
        <path d="M16 14l-4-4 4-4"></path>
        <path d="M3 6v14"></path>
      </svg>
    ),
    HOLIDAY: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
      </svg>
    ),
    OTHER: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    ),
  };
  
  return iconMap[type] || iconMap.OTHER;
}