"use client";

import React, { useState } from "react";
import { useCalendar } from "../providers/calendar-provider";
import { EventType } from "@prisma/client";
import { canManageEvents } from "@/lib/utils/permissions";
import { useSession } from "next-auth/react";

interface CalendarToolbarProps {
  eventTypes: EventType[];
  userId: string;
}

export default function CalendarToolbar({ eventTypes, userId }: CalendarToolbarProps) {
  const { data: session } = useSession();
  const { filters, setFilters, setIsCreatingEvent } = useCalendar();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ searchQuery: e.target.value });
  };
  
  const toggleEventType = (eventType: EventType) => {
    const currentTypes = filters.eventTypes;
    if (currentTypes.includes(eventType)) {
      // Remove the event type if it's already selected
      setFilters({
        eventTypes: currentTypes.filter(type => type !== eventType),
      });
    } else {
      // Add the event type if it's not selected
      setFilters({
        eventTypes: [...currentTypes, eventType],
      });
    }
  };
  
  const clearFilters = () => {
    setFilters({
      eventTypes: Object.values(EventType),
      searchQuery: "",
      dateRange: {
        start: null,
        end: null,
      },
    });
  };
  
  return (
    <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2">
      <div className="w-full md:w-auto flex md:flex-row space-x-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search events..."
            className="px-3 py-2 rounded-md border border-input bg-background w-full md:w-48"
            value={filters.searchQuery}
            onChange={handleSearch}
          />
          {filters.searchQuery && (
            <button
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setFilters({ searchQuery: "" })}
            >
              <ClearIcon />
            </button>
          )}
        </div>
        
        <button
          type="button"
          className="px-3 py-2 rounded-md border border-input bg-background flex items-center"
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
        >
          <FilterIcon className="mr-1" />
          <span className="text-sm">Filter</span>
        </button>
      </div>
      
      {canManageEvents(session) && (
        <button
          type="button"
          className="px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center w-full md:w-auto justify-center"
          onClick={() => setIsCreatingEvent(true)}
        >
          <PlusIcon className="mr-1" />
          <span className="text-sm">New Event</span>
        </button>
      )}
      
      {isFiltersOpen && (
        <div className="absolute top-full right-0 mt-2 z-10 w-72 rounded-md shadow-lg bg-card border border-border p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Filter Events</h3>
            <button
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setIsFiltersOpen(false)}
            >
              <XIcon />
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium mb-2">Event Types</h4>
              <div className="flex flex-wrap gap-2">
                {eventTypes.map((type) => (
                  <button
                    key={type}
                    className={`px-2 py-1 text-xs rounded-full ${
                      filters.eventTypes.includes(type)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                    onClick={() => toggleEventType(type)}
                  >
                    {formatEventType(type)}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Date Range</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Start</label>
                  <input
                    type="date"
                    className="w-full px-2 py-1 text-sm rounded-md border border-input bg-background"
                    value={filters.dateRange.start ? formatDate(filters.dateRange.start) : ""}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : null;
                      setFilters({
                        dateRange: {
                          ...filters.dateRange,
                          start: date,
                        },
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">End</label>
                  <input
                    type="date"
                    className="w-full px-2 py-1 text-sm rounded-md border border-input bg-background"
                    value={filters.dateRange.end ? formatDate(filters.dateRange.end) : ""}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : null;
                      setFilters({
                        dateRange: {
                          ...filters.dateRange,
                          end: date,
                        },
                      });
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-2 flex justify-end">
              <button
                className="text-xs text-primary hover:underline"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to format event type display
function formatEventType(type: EventType): string {
  return type.replace(/_/g, " ").toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Helper function to format date for date input
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Simple icon components
function FilterIcon({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
    </svg>
  );
}

function PlusIcon({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}