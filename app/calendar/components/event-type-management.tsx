'use client';

import { useState } from 'react';

interface EventTypeStats {
  type: string;
  count: number;
}

interface EventTypeManagementProps {
  eventTypes: EventTypeStats[];
}

export default function EventTypeManagement({ eventTypes }: EventTypeManagementProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Format event type for display
  const formatEventType = (type: string): string => {
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get event type color
  const getEventTypeColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      TRAINING: 'border-blue-500 bg-blue-500/10',
      MEETING: 'border-purple-500 bg-purple-500/10',
      APPOINTMENT: 'border-green-500 bg-green-500/10',
      BLITZ: 'border-orange-500 bg-orange-500/10',
      CONTEST: 'border-pink-500 bg-pink-500/10',
      HOLIDAY: 'border-slate-500 bg-slate-500/10',
      OTHER: 'border-gray-500 bg-gray-500/10',
    };

    return colorMap[type] || colorMap.OTHER;
  };

  // Get event type icon
  const getEventTypeIcon = (type: string): React.ReactNode => {
    const iconMap: Record<string, React.ReactNode> = {
      TRAINING: <BookIcon />,
      MEETING: <UsersIcon />,
      APPOINTMENT: <CalendarIcon />,
      BLITZ: <BoltIcon />,
      CONTEST: <TrophyIcon />,
      HOLIDAY: <GiftIcon />,
      OTHER: <CircleIcon />,
    };

    return iconMap[type] || iconMap.OTHER;
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {eventTypes.map((eventType) => (
          <div
            key={eventType.type}
            className={`rounded-lg border p-4 ${getEventTypeColor(eventType.type)} cursor-pointer transition-opacity hover:opacity-90`}
            onClick={() => setSelectedType(eventType.type)}
          >
            <div className="flex items-center">
              <div className="mr-3">{getEventTypeIcon(eventType.type)}</div>
              <div>
                <div className="font-medium">{formatEventType(eventType.type)}</div>
                <div className="text-muted-foreground text-sm">{eventType.count} events</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedType && (
        <div className="mt-6 rounded-lg border p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium">{formatEventType(selectedType)} Settings</h3>
            <button
              onClick={() => setSelectedType(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <XIcon />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Default Visibility</label>
              <select
                className="border-input bg-background w-full rounded-md border p-2"
                defaultValue="all"
              >
                <option value="all">All Users</option>
                <option value="admin">Admins Only</option>
                <option value="managers">Managers & Admins</option>
                <option value="custom">Custom Roles</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Color Customization</label>
              <div className="grid grid-cols-6 gap-2">
                <button className="h-8 w-8 rounded-full bg-blue-500"></button>
                <button className="h-8 w-8 rounded-full bg-purple-500"></button>
                <button className="h-8 w-8 rounded-full bg-green-500"></button>
                <button className="h-8 w-8 rounded-full bg-orange-500"></button>
                <button className="h-8 w-8 rounded-full bg-pink-500"></button>
                <button className="h-8 w-8 rounded-full bg-slate-500"></button>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1.5">
                Save Settings
              </button>
            </div>

            <div className="text-muted-foreground border-t pt-4 text-xs">
              Note: This is a UI demonstration. Event type customization functionality is not fully
              implemented in this version.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Icon components
function BookIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
      <path d="M4 22h16"></path>
      <path d="M10 22V8a2 2 0 1 1 4 0v14"></path>
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 12 20 22 4 22 4 12"></polyline>
      <rect x="2" y="7" width="20" height="5"></rect>
      <line x1="12" y1="22" x2="12" y2="7"></line>
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
    </svg>
  );
}

function CircleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10"></circle>
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
