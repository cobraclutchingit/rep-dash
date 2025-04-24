'use client';

import { EventType } from '@prisma/client';
import React, { createContext, useContext, useState, useEffect } from 'react';

// Define calendar event type
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  eventType: EventType;
  isBlitz: boolean;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  location?: string | null;
  locationUrl?: string | null;
  recurrence: string;
  recurrenceEndDate?: Date | null;
  isPublic: boolean;
  visibleToRoles: string[];
  visibleToPositions: string[];
  createdById: string;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
    profileImageUrl: string | null;
  };
  attendees: Array<{
    id: string;
    status: string;
    isRequired: boolean;
    user: {
      id: string;
      name: string | null;
      email: string;
      profileImageUrl: string | null;
    };
  }>;
}

interface EventFilters {
  eventTypes: EventType[];
  searchQuery: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

interface CalendarContextType {
  events: CalendarEvent[];
  filteredEvents: CalendarEvent[];
  filters: EventFilters;
  selectedEvent: CalendarEvent | null;
  selectedDate: Date;
  view: 'month' | 'week' | 'day' | 'agenda';
  isEventModalOpen: boolean;
  isCreatingEvent: boolean;

  setEvents: (events: CalendarEvent[]) => void;
  setFilters: (filters: Partial<EventFilters>) => void;
  setSelectedEvent: (event: CalendarEvent | null) => void;
  setSelectedDate: (date: Date) => void;
  setView: (view: 'month' | 'week' | 'day' | 'agenda') => void;
  setIsEventModalOpen: (isOpen: boolean) => void;
  setIsCreatingEvent: (isCreating: boolean) => void;

  addEvent: (event: CalendarEvent) => void;
  updateEvent: (event: CalendarEvent) => void;
  deleteEvent: (eventId: string) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};

export default function CalendarProvider({
  children,
  initialEvents = [],
}: {
  children: React.ReactNode;
  initialEvents: CalendarEvent[];
}) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [isEventModalOpen, setIsEventModalOpen] = useState<boolean>(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState<boolean>(false);
  const [filters, setFiltersState] = useState<EventFilters>({
    eventTypes: Object.values(EventType),
    searchQuery: '',
    dateRange: {
      start: null,
      end: null,
    },
  });

  // Parse dates from string to Date objects
  useEffect(() => {
    const parsedEvents = initialEvents.map((event) => ({
      ...event,
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
      recurrenceEndDate: event.recurrenceEndDate ? new Date(event.recurrenceEndDate) : null,
    }));
    setEvents(parsedEvents);
  }, [initialEvents]);

  const setFilters = (newFilters: Partial<EventFilters>) => {
    setFiltersState((prev) => ({
      ...prev,
      ...newFilters,
    }));
  };

  // Filter events based on filters
  const filteredEvents = events.filter((event) => {
    // Filter by event type
    if (filters.eventTypes.length > 0 && !filters.eventTypes.includes(event.eventType)) {
      return false;
    }

    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesTitle = event.title.toLowerCase().includes(query);
      const matchesDescription = event.description?.toLowerCase().includes(query) || false;
      const matchesLocation = event.location?.toLowerCase().includes(query) || false;

      if (!matchesTitle && !matchesDescription && !matchesLocation) {
        return false;
      }
    }

    // Filter by date range
    if (filters.dateRange.start && filters.dateRange.end) {
      const { start, end } = filters.dateRange;
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);

      // Check if event is within the date range
      if (eventEnd < start || eventStart > end) {
        return false;
      }
    }

    return true;
  });

  // Event CRUD operations
  const addEvent = (event: CalendarEvent) => {
    setEvents((prev) => [...prev, event]);
  };

  const updateEvent = (updatedEvent: CalendarEvent) => {
    setEvents((prev) => prev.map((event) => (event.id === updatedEvent.id ? updatedEvent : event)));
  };

  const deleteEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== eventId));
  };

  return (
    <CalendarContext.Provider
      value={{
        events,
        filteredEvents,
        filters,
        selectedEvent,
        selectedDate,
        view,
        isEventModalOpen,
        isCreatingEvent,
        setEvents,
        setFilters,
        setSelectedEvent,
        setSelectedDate,
        setView,
        setIsEventModalOpen,
        setIsCreatingEvent,
        addEvent,
        updateEvent,
        deleteEvent,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}
