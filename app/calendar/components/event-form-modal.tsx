"use client";

import React, { useState, useEffect } from "react";
import { useCalendar } from "../providers/calendar-provider";
import { EventType, EventRecurrence, UserRole, SalesPosition } from "@prisma/client";

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  selectedDate: Date;
}

export default function EventFormModal({ isOpen, onClose, userId, selectedDate }: EventFormModalProps) {
  const { selectedEvent, addEvent, updateEvent } = useCalendar();
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventType: "MEETING" as EventType,
    isBlitz: false,
    startDate: new Date(),
    startTime: "09:00",
    endDate: new Date(),
    endTime: "10:00",
    allDay: false,
    location: "",
    locationUrl: "",
    recurrence: "NONE" as EventRecurrence,
    recurrenceEndDate: null as Date | null,
    isPublic: true,
    visibleToRoles: [UserRole.USER, UserRole.ADMIN],
    visibleToPositions: [] as SalesPosition[],
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Set initial form values based on selected event (for editing)
  useEffect(() => {
    if (selectedEvent) {
      const startDate = new Date(selectedEvent.startDate);
      const endDate = new Date(selectedEvent.endDate);
      
      setFormData({
        title: selectedEvent.title,
        description: selectedEvent.description || "",
        eventType: selectedEvent.eventType,
        isBlitz: selectedEvent.isBlitz,
        startDate: startDate,
        startTime: formatTimeForInput(startDate),
        endDate: endDate,
        endTime: formatTimeForInput(endDate),
        allDay: selectedEvent.allDay,
        location: selectedEvent.location || "",
        locationUrl: selectedEvent.locationUrl || "",
        recurrence: selectedEvent.recurrence as EventRecurrence,
        recurrenceEndDate: selectedEvent.recurrenceEndDate 
          ? new Date(selectedEvent.recurrenceEndDate) 
          : null,
        isPublic: selectedEvent.isPublic,
        visibleToRoles: selectedEvent.visibleToRoles as UserRole[],
        visibleToPositions: selectedEvent.visibleToPositions as SalesPosition[],
      });
    } else {
      // For new events, set start/end date to the selected date from calendar
      const endDate = new Date(selectedDate);
      endDate.setHours(selectedDate.getHours() + 1);
      
      setFormData({
        title: "",
        description: "",
        eventType: "MEETING" as EventType,
        isBlitz: false,
        startDate: selectedDate,
        startTime: formatTimeForInput(selectedDate),
        endDate: endDate,
        endTime: formatTimeForInput(endDate),
        allDay: false,
        location: "",
        locationUrl: "",
        recurrence: "NONE" as EventRecurrence,
        recurrenceEndDate: null,
        isPublic: true,
        visibleToRoles: [UserRole.USER, UserRole.ADMIN],
        visibleToPositions: [] as SalesPosition[],
      });
    }
  }, [selectedEvent, selectedDate]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: new Date(value) }));
  };
  
  const toggleRole = (role: UserRole) => {
    setFormData(prev => {
      const roles = [...prev.visibleToRoles];
      const index = roles.indexOf(role);
      
      if (index === -1) {
        roles.push(role);
      } else {
        roles.splice(index, 1);
      }
      
      return { ...prev, visibleToRoles: roles };
    });
  };
  
  const togglePosition = (position: SalesPosition) => {
    setFormData(prev => {
      const positions = [...prev.visibleToPositions];
      const index = positions.indexOf(position);
      
      if (index === -1) {
        positions.push(position);
      } else {
        positions.splice(index, 1);
      }
      
      return { ...prev, visibleToPositions: positions };
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // Combine date and time
      const startDateTime = combineDateAndTime(formData.startDate, formData.startTime);
      const endDateTime = combineDateAndTime(formData.endDate, formData.endTime);
      
      // Validate dates
      if (endDateTime < startDateTime) {
        setError("End date cannot be before start date");
        setLoading(false);
        return;
      }
      
      // Format data for API
      const eventData = {
        id: selectedEvent?.id,
        title: formData.title,
        description: formData.description,
        eventType: formData.eventType,
        isBlitz: formData.isBlitz,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        allDay: formData.allDay,
        location: formData.location,
        locationUrl: formData.locationUrl,
        recurrence: formData.recurrence,
        recurrenceEndDate: formData.recurrenceEndDate ? formData.recurrenceEndDate.toISOString() : null,
        isPublic: formData.isPublic,
        visibleToRoles: formData.visibleToRoles,
        visibleToPositions: formData.visibleToPositions,
      };
      
      // Submit to API
      const url = selectedEvent 
        ? `/api/calendar/events/${selectedEvent.id}` 
        : "/api/calendar/events";
      
      const response = await fetch(url, {
        method: selectedEvent ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to save event");
      }
      
      const savedEvent = await response.json();
      
      // Update local state
      if (selectedEvent) {
        updateEvent({
          ...savedEvent,
          startDate: new Date(savedEvent.startDate),
          endDate: new Date(savedEvent.endDate),
          recurrenceEndDate: savedEvent.recurrenceEndDate ? new Date(savedEvent.recurrenceEndDate) : null,
        });
      } else {
        addEvent({
          ...savedEvent,
          startDate: new Date(savedEvent.startDate),
          endDate: new Date(savedEvent.endDate),
          recurrenceEndDate: savedEvent.recurrenceEndDate ? new Date(savedEvent.recurrenceEndDate) : null,
        });
      }
      
      onClose();
    } catch (error) {
      console.error("Error saving event:", error);
      setError("Failed to save event. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-background/50 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card rounded-lg shadow-lg">
        <div className="flex justify-between items-center p-6 pb-2">
          <h2 className="text-xl font-bold">
            {selectedEvent ? "Edit Event" : "New Event"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted"
            aria-label="Close"
          >
            <XIcon />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 pt-2">
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full p-2 rounded-md border border-input bg-background"
              />
            </div>
            
            {/* Event Type & Blitz */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="eventType" className="block text-sm font-medium mb-1">
                  Event Type *
                </label>
                <select
                  id="eventType"
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  className="w-full p-2 rounded-md border border-input bg-background"
                >
                  {Object.values(EventType).map((type) => (
                    <option key={type} value={type}>
                      {formatEventType(type)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isBlitz"
                    checked={formData.isBlitz}
                    onChange={handleChange}
                    className="mr-2 h-4 w-4"
                  />
                  <span className="text-sm">Mark as Blitz Event</span>
                </label>
              </div>
            </div>
            
            {/* Date and Time */}
            <div>
              <div className="flex items-center mb-2">
                <label htmlFor="startDate" className="block text-sm font-medium">
                  Date & Time *
                </label>
                <label className="ml-auto flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="allDay"
                    checked={formData.allDay}
                    onChange={handleChange}
                    className="mr-2 h-4 w-4"
                  />
                  <span className="text-sm">All Day</span>
                </label>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="startDate" className="block text-xs text-muted-foreground mb-1">
                        Start Date
                      </label>
                      <input
                        id="startDate"
                        name="startDate"
                        type="date"
                        value={formatDateForInput(formData.startDate)}
                        onChange={handleDateChange}
                        className="w-full p-2 rounded-md border border-input bg-background text-sm"
                        required
                      />
                    </div>
                    
                    {!formData.allDay && (
                      <div>
                        <label htmlFor="startTime" className="block text-xs text-muted-foreground mb-1">
                          Start Time
                        </label>
                        <input
                          id="startTime"
                          name="startTime"
                          type="time"
                          value={formData.startTime}
                          onChange={handleChange}
                          className="w-full p-2 rounded-md border border-input bg-background text-sm"
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="endDate" className="block text-xs text-muted-foreground mb-1">
                        End Date
                      </label>
                      <input
                        id="endDate"
                        name="endDate"
                        type="date"
                        value={formatDateForInput(formData.endDate)}
                        onChange={handleDateChange}
                        className="w-full p-2 rounded-md border border-input bg-background text-sm"
                        required
                      />
                    </div>
                    
                    {!formData.allDay && (
                      <div>
                        <label htmlFor="endTime" className="block text-xs text-muted-foreground mb-1">
                          End Time
                        </label>
                        <input
                          id="endTime"
                          name="endTime"
                          type="time"
                          value={formData.endTime}
                          onChange={handleChange}
                          className="w-full p-2 rounded-md border border-input bg-background text-sm"
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="location" className="block text-sm font-medium mb-1">
                  Location
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Location or meeting room"
                  className="w-full p-2 rounded-md border border-input bg-background"
                />
              </div>
              
              <div>
                <label htmlFor="locationUrl" className="block text-sm font-medium mb-1">
                  Location URL
                </label>
                <input
                  id="locationUrl"
                  name="locationUrl"
                  type="url"
                  value={formData.locationUrl}
                  onChange={handleChange}
                  placeholder="https://meeting-link.com"
                  className="w-full p-2 rounded-md border border-input bg-background"
                />
              </div>
            </div>
            
            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full p-2 rounded-md border border-input bg-background"
              />
            </div>
            
            {/* Advanced Options */}
            <div className="border-t pt-4">
              <details className="group">
                <summary className="flex cursor-pointer items-center justify-between">
                  <span className="text-sm font-medium">Advanced Options</span>
                  <span className="transition group-open:rotate-180">
                    <ChevronDownIcon />
                  </span>
                </summary>
                
                <div className="mt-4 space-y-4">
                  {/* Recurrence */}
                  <div>
                    <label htmlFor="recurrence" className="block text-sm font-medium mb-1">
                      Recurrence
                    </label>
                    <select
                      id="recurrence"
                      name="recurrence"
                      value={formData.recurrence}
                      onChange={handleChange}
                      className="w-full p-2 rounded-md border border-input bg-background"
                    >
                      {Object.values(EventRecurrence).map((recurrence) => (
                        <option key={recurrence} value={recurrence}>
                          {formatRecurrence(recurrence)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Recurrence End Date */}
                  {formData.recurrence !== "NONE" && (
                    <div>
                      <label htmlFor="recurrenceEndDate" className="block text-sm font-medium mb-1">
                        Recurrence End Date
                      </label>
                      <input
                        id="recurrenceEndDate"
                        name="recurrenceEndDate"
                        type="date"
                        value={formData.recurrenceEndDate ? formatDateForInput(formData.recurrenceEndDate) : ""}
                        onChange={handleDateChange}
                        className="w-full p-2 rounded-md border border-input bg-background"
                      />
                    </div>
                  )}
                  
                  {/* Visibility Options */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Visibility</label>
                    
                    <div className="mb-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="isPublic"
                          checked={formData.isPublic}
                          onChange={handleChange}
                          className="mr-2 h-4 w-4"
                        />
                        <span className="text-sm">Public Event (visible to all users)</span>
                      </label>
                    </div>
                    
                    {!formData.isPublic && (
                      <>
                        <div className="mb-2">
                          <div className="text-xs font-medium mb-1 text-muted-foreground">
                            Visible to Roles
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {Object.values(UserRole).map((role) => (
                              <label key={role} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={formData.visibleToRoles.includes(role)}
                                  onChange={() => toggleRole(role)}
                                  className="mr-1 h-3 w-3"
                                />
                                <span className="text-xs">{role}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-xs font-medium mb-1 text-muted-foreground">
                            Visible to Positions
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {Object.values(SalesPosition).map((position) => (
                              <label key={position} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={formData.visibleToPositions.includes(position)}
                                  onChange={() => togglePosition(position)}
                                  className="mr-1 h-3 w-3"
                                />
                                <span className="text-xs">{formatPosition(position)}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </details>
            </div>
            
            {/* Form Actions */}
            <div className="flex justify-end pt-4 space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? "Saving..." : selectedEvent ? "Update Event" : "Create Event"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helper function to format date for input
function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Helper function to format time for input
function formatTimeForInput(date: Date): string {
  return date.toTimeString().slice(0, 5);
}

// Helper function to combine date and time
function combineDateAndTime(date: Date, time: string): Date {
  const result = new Date(date);
  const [hours, minutes] = time.split(":").map(Number);
  result.setHours(hours, minutes);
  return result;
}

// Helper function to format event type
function formatEventType(type: string): string {
  return type.replace(/_/g, " ").toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Helper function to format recurrence
function formatRecurrence(recurrence: string): string {
  if (recurrence === "NONE") return "No Recurrence";
  return recurrence.charAt(0) + recurrence.slice(1).toLowerCase();
}

// Helper function to format position
function formatPosition(position: string): string {
  return position.replace(/_/g, " ");
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

function ChevronDownIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );
}