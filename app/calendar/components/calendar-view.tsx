"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import { useCalendar } from "../providers/calendar-provider";
import EventDetailsModal from "./event-details-modal";
import EventFormModal from "./event-form-modal";
import EventAgendaItem from "./event-agenda-item";
import "react-big-calendar/lib/css/react-big-calendar.css";
import EventTooltip from "./event-tooltip";
import { canManageEvents } from "@/lib/utils/permissions";
import { useSession } from "next-auth/react";

// Set up the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

interface CalendarViewProps {
  userId: string;
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
  
  const [tooltipEvent, setTooltipEvent] = useState<any>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  // Format events for react-big-calendar
  const formattedEvents = useMemo(() => {
    return filteredEvents.map(event => ({
      id: event.id,
      title: event.title,
      start: new Date(event.startDate),
      end: new Date(event.endDate),
      allDay: event.allDay,
      resource: event, // Store the original event data
    }));
  }, [filteredEvents]);
  
  // Custom event styling
  const eventStyleGetter = useCallback((event: any) => {
    const { resource } = event;
    const eventType = resource.eventType;
    
    // Define colors for each event type
    const eventColors: Record<string, { backgroundColor: string; borderColor: string; textColor: string }> = {
      TRAINING: { 
        backgroundColor: 'rgba(59, 130, 246, 0.15)', 
        borderColor: '#3b82f6', 
        textColor: '#3b82f6' 
      },
      MEETING: { 
        backgroundColor: 'rgba(139, 92, 246, 0.15)', 
        borderColor: '#8b5cf6', 
        textColor: '#8b5cf6' 
      },
      APPOINTMENT: { 
        backgroundColor: 'rgba(34, 197, 94, 0.15)', 
        borderColor: '#22c55e', 
        textColor: '#22c55e' 
      },
      BLITZ: { 
        backgroundColor: 'rgba(249, 115, 22, 0.15)', 
        borderColor: '#f97316', 
        textColor: '#f97316' 
      },
      CONTEST: { 
        backgroundColor: 'rgba(236, 72, 153, 0.15)', 
        borderColor: '#ec4899', 
        textColor: '#ec4899' 
      },
      HOLIDAY: { 
        backgroundColor: 'rgba(100, 116, 139, 0.15)', 
        borderColor: '#64748b', 
        textColor: '#64748b' 
      },
      OTHER: { 
        backgroundColor: 'rgba(156, 163, 175, 0.15)', 
        borderColor: '#9ca3af', 
        textColor: '#9ca3af' 
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
        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(249, 115, 22, 0.1) 10px, rgba(249, 115, 22, 0.1) 20px)',
        borderLeft: '3px solid #f97316',
      };
    }
    
    return {
      style,
      className: resource.isBlitz ? 'blitz-event' : '',
    };
  }, []);
  
  // Custom toolbar component
  const CustomToolbar = ({ label, onNavigate, onView }: any) => {
    return (
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 p-2">
        <div className="flex items-center mb-2 md:mb-0">
          <button
            type="button"
            onClick={() => onNavigate('TODAY')}
            className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm font-medium mr-2"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => onNavigate('PREV')}
            className="p-1 rounded hover:bg-muted mr-1"
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            onClick={() => onNavigate('NEXT')}
            className="p-1 rounded hover:bg-muted mr-3"
          >
            <ChevronRightIcon />
          </button>
          <h2 className="text-lg font-semibold">{label}</h2>
        </div>
        
        <div className="flex space-x-1 border rounded overflow-hidden">
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
  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event.resource);
    setIsEventModalOpen(true);
  };
  
  // Handle slot selection (creating new event)
  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    if (canManageEvents(session)) {
      setSelectedDate(start);
      setIsCreatingEvent(true);
    }
  };
  
  // Handle event tooltip
  const handleEventMouseEnter = (event: any, e: React.MouseEvent) => {
    setTooltipEvent(event.resource);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };
  
  const handleEventMouseLeave = () => {
    setTooltipEvent(null);
  };
  
  // Custom agenda component to add more details to agenda view
  const AgendaEvent = ({ event }: any) => {
    return <EventAgendaItem event={event.resource} />;
  };
  
  return (
    <div className="h-[70vh] lg:h-[75vh] relative">
      <Calendar
        localizer={localizer}
        events={formattedEvents}
        startAccessor="start"
        endAccessor="end"
        defaultView={Views.MONTH}
        view={view}
        onView={setView as any}
        date={selectedDate}
        onNavigate={setSelectedDate}
        selectable={canManageEvents(session)}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        eventPropGetter={eventStyleGetter}
        components={{
          toolbar: CustomToolbar,
          agenda: {
            event: AgendaEvent,
          },
          month: {
            // @ts-ignore - custom component
            eventContainerWrapper: (props: any) => <EventTooltipWrapper 
              {...props} 
              onEventMouseEnter={handleEventMouseEnter}
              onEventMouseLeave={handleEventMouseLeave}
            />
          }
        }}
        popup
        resizable
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
function EventTooltipWrapper({ children, onEventMouseEnter, onEventMouseLeave, ...props }: any) {
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child) && child.props.event) {
      return React.cloneElement(child, {
        onMouseEnter: (e: React.MouseEvent) => onEventMouseEnter(child.props.event, e),
        onMouseLeave: () => onEventMouseLeave(),
      });
    }
    return child;
  });

  return <div {...props}>{childrenWithProps}</div>;
}

// Simple icon components
function ChevronLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  );
}