'use client';

import moment from 'moment';
import { useSession } from 'next-auth/react';
import React, { useState, useMemo, useCallback } from 'react';
import { Calendar, momentLocalizer, Views, View, Event } from 'react-big-calendar';

import { canManageEvents } from '@/lib/utils/permissions';

import EventAgendaItem from './event-agenda-item';
import EventDetailsModal from './event-details-modal';
import EventFormModal from './event-form-modal';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import EventTooltip from './event-tooltip';
import { useCalendar } from '../providers/calendar-provider';

// Set up the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

interface CalendarViewProps {
  userId: string;
}

interface CalendarViewEvent extends Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: any; // This will hold the full CalendarEvent from the provider
}

export default function CalendarView({ userId }: CalendarViewProps) {
  const { data: session } = useSession();
  const {
    filteredEvents,
    selectedEvent,
    selectedDate,
    view,
    isEventModalOpen,
    isCreatingEvent,
    setSelectedEvent,
    setSelectedDate,
    setView,
    setIsEventModalOpen,
    setIsCreatingEvent,
  } = useCalendar();

  const [tooltipEvent, setTooltipEvent] = useState<any | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Format events for react-big-calendar
  const formattedEvents = useMemo(() => {
    return filteredEvents.map((event) => ({
      id: event.id,
      title: event.title,
      start: new Date(event.startDate),
      end: new Date(event.endDate),
      allDay: event.allDay,
      resource: event,
    }));
  }, [filteredEvents]);

  // Custom event styling
  const eventStyleGetter = useCallback((event: CalendarViewEvent) => {
    const { resource } = event;
    const eventType = resource.eventType;

    // Define colors for each event type
    const eventColors: Record<
      string,
      { backgroundColor: string; borderColor: string; textColor: string }
    > = {
      TRAINING: {
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        borderColor: '#3b82f6',
        textColor: '#3b82f6',
      },
      MEETING: {
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        borderColor: '#8b5cf6',
        textColor: '#8b5cf6',
      },
      APPOINTMENT: {
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
        borderColor: '#22c55e',
        textColor: '#22c55e',
      },
      BLITZ: {
        backgroundColor: 'rgba(249, 115, 22, 0.15)',
        borderColor: '#f97316',
        textColor: '#f97316',
      },
      CONTEST: {
        backgroundColor: 'rgba(236, 72, 153, 0.15)',
        borderColor: '#ec4899',
        textColor: '#ec4899',
      },
      HOLIDAY: {
        backgroundColor: 'rgba(100, 116, 139, 0.15)',
        borderColor: '#64748b',
        textColor: '#64748b',
      },
      OTHER: {
        backgroundColor: 'rgba(156, 163, 175, 0.15)',
        borderColor: '#9ca3af',
        textColor: '#9ca3af',
      },
    };

    // Get color based on event type
    const color = eventColors[eventType] || eventColors.OTHER;

    // Add special styling for "blitz" events
    let style: React.CSSProperties = {
      backgroundColor: color.backgroundColor,
      color: color.textColor,
      borderLeft: `3px solid ${color.borderColor}`,
      borderRadius: '4px',
      fontWeight: 500,
    };

    if (resource.isBlitz) {
      style = {
        ...style,
        backgroundColor: 'rgba(249, 115, 22, 0.2)',
        backgroundImage:
          'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(249, 115, 22, 0.1) 10px, rgba(249, 115, 22, 0.1) 20px)',
        borderLeft: '3px solid #f97316',
      };
    }

    return {
      style,
      className: resource.isBlitz ? 'blitz-event' : '',
    };
  }, []);

  // Custom toolbar component
  // Custom toolbar with compatible type definitions
  const CustomToolbar = (props: any) => {
    const { label, onNavigate, onView } = props;
    return (
      <div className="mb-4 flex flex-col items-center justify-between p-2 md:flex-row">
        <div className="mb-2 flex items-center md:mb-0">
          <button
            type="button"
            onClick={() => onNavigate('TODAY')}
            className="bg-primary text-primary-foreground mr-2 rounded px-3 py-1 text-sm font-medium"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => onNavigate('PREV')}
            className="hover:bg-muted mr-1 rounded p-1"
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            onClick={() => onNavigate('NEXT')}
            className="hover:bg-muted mr-3 rounded p-1"
          >
            <ChevronRightIcon />
          </button>
          <h2 className="text-lg font-semibold">{label}</h2>
        </div>

        <div className="flex space-x-1 overflow-hidden rounded border">
          <button
            type="button"
            onClick={() => onView('month')}
            className={`px-3 py-1.5 text-sm font-medium ${
              view === 'month' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            Month
          </button>
          <button
            type="button"
            onClick={() => onView('week')}
            className={`px-3 py-1.5 text-sm font-medium ${
              view === 'week' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            Week
          </button>
          <button
            type="button"
            onClick={() => onView('day')}
            className={`px-3 py-1.5 text-sm font-medium ${
              view === 'day' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            Day
          </button>
          <button
            type="button"
            onClick={() => onView('agenda')}
            className={`px-3 py-1.5 text-sm font-medium ${
              view === 'agenda' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            Agenda
          </button>
        </div>
      </div>
    );
  };

  // Handle event selection
  const _handleSelectEvent = (event: CalendarViewEvent) => {
    setSelectedEvent(event.resource);
    setIsEventModalOpen(true);
  };

  // Handle slot selection (creating new event)
  const handleSelectSlot = (slotInfo: any) => {
    if (canManageEvents(session)) {
      setSelectedDate(slotInfo.start);
      setIsCreatingEvent(true);
    }
  };

  // Since we can't use the custom eventContainerWrapper, we'll use onSelectEvent for tooltips
  // Handle event tooltip - using standard event selection
  const handleEventSelect = (event: CalendarViewEvent) => {
    // Show tooltip temporarily
    setTooltipEvent(event.resource);
    // Position near the center of screen
    setTooltipPosition({ x: window.innerWidth / 2, y: window.innerHeight / 3 });

    // Auto-hide tooltip after 2 seconds
    setTimeout(() => {
      setTooltipEvent(null);
    }, 2000);
  };

  // Keep these for proper typing but not used
  // Unused but needed for type requirements
  const _handleEventMouseEnter = (_: CalendarViewEvent, __: React.MouseEvent) => {};
  // Unused but needed for type requirements
  const _handleEventMouseLeave = () => {};

  // Custom agenda component to add more details to agenda view
  const AgendaEvent = ({ event }: { event: CalendarViewEvent }) => {
    return <EventAgendaItem event={event.resource} />;
  };

  return (
    <div className="relative h-[70vh] lg:h-[75vh]">
      {/* 
        We need a type assertion here because the react-big-calendar library's
        type definitions don't align perfectly with our custom components
      */}
      <Calendar<CalendarViewEvent>
        localizer={localizer}
        events={formattedEvents}
        startAccessor="start"
        endAccessor="end"
        defaultView={Views.MONTH}
        // Use type assertion only where specifically needed
        view={view as View}
        onView={(newView: View) => setView(newView as typeof view)}
        date={selectedDate}
        onNavigate={setSelectedDate}
        selectable={canManageEvents(session)}
        onSelectEvent={handleEventSelect}
        onSelectSlot={handleSelectSlot}
        eventPropGetter={eventStyleGetter}
        // Only use the supported component interfaces from react-big-calendar
        components={{
          toolbar: CustomToolbar,
          agenda: {
            event: AgendaEvent,
          },
          // Removing the unsupported eventContainerWrapper
          // We'll use another approach for tooltips
        }}
        popup
        className="calendar-container"
      />

      {/* Event tooltip */}
      {tooltipEvent && (
        <EventTooltip
          event={tooltipEvent}
          position={tooltipPosition}
          onClose={() => setTooltipEvent(null)}
        />
      )}

      {/* Event details modal */}
      <EventDetailsModal
        isOpen={isEventModalOpen && selectedEvent !== null}
        onClose={() => {
          setIsEventModalOpen(false);
          setSelectedEvent(null);
        }}
        userId={userId}
      />

      {/* Event creation/edit modal */}
      <EventFormModal
        isOpen={isCreatingEvent}
        onClose={() => setIsCreatingEvent(false)}
        userId={userId}
        selectedDate={selectedDate}
      />
    </div>
  );
}

// Custom wrapper to add tooltips to events
interface EventTooltipWrapperProps {
  children: React.ReactNode;
  onEventMouseEnter: (event: CalendarViewEvent, e: React.MouseEvent) => void;
  onEventMouseLeave: () => void;
  _event: CalendarViewEvent; // Required by react-big-calendar
}

function _EventTooltipWrapper({
  children,
  onEventMouseEnter,
  onEventMouseLeave,
  _event,
  ...props
}: EventTooltipWrapperProps) {
  // React.Children.map with proper typing
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.props.event) {
      // Create a new props object that TypeScript will accept
      const eventHandlers = {
        // React event handlers are properly typed here
        onMouseEnter: (e: React.MouseEvent) => onEventMouseEnter(child.props.event, e),
        onMouseLeave: () => onEventMouseLeave(),
      };

      // Use type assertion only for the specific component where needed
      return React.cloneElement(child, eventHandlers as React.HTMLAttributes<HTMLElement>);
    }
    return child;
  });

  return <div {...props}>{childrenWithProps}</div>;
}

// Simple icon components
function ChevronLeftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  );
}
