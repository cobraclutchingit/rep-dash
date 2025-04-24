'use client';

import { useTheme } from '@/components/providers/theme-provider';

interface EventTypeStats {
  type: string;
  count: number;
}

interface EventsByDate {
  createdAt: Date;
  _count: {
    id: number;
  };
}

interface CalendarAnalyticsProps {
  eventTypeStats: EventTypeStats[];
  eventsByDate: EventsByDate[];
}

export default function CalendarAnalytics({
  eventTypeStats,
  eventsByDate,
}: CalendarAnalyticsProps) {
  const { theme } = useTheme();

  // Prepare data for the chart
  const sortedStats = [...eventTypeStats].sort((a, b) => b.count - a.count);
  const totalEvents = sortedStats.reduce((total, item) => total + item.count, 0);

  // Colors for the chart (matching the event colors in the calendar)
  const colorMap: Record<string, string> = {
    TRAINING: theme === 'dark' ? '#3b82f6' : '#3b82f6',
    MEETING: theme === 'dark' ? '#8b5cf6' : '#8b5cf6',
    APPOINTMENT: theme === 'dark' ? '#22c55e' : '#22c55e',
    BLITZ: theme === 'dark' ? '#f97316' : '#f97316',
    CONTEST: theme === 'dark' ? '#ec4899' : '#ec4899',
    HOLIDAY: theme === 'dark' ? '#64748b' : '#64748b',
    OTHER: theme === 'dark' ? '#9ca3af' : '#9ca3af',
  };

  // Group events by day for the time series chart
  const eventsByDay: Record<string, number> = {};

  // Initialize the last 30 days
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    eventsByDay[dateKey] = 0;
  }

  // Fill with actual data
  eventsByDate.forEach((item) => {
    const dateKey = new Date(item.createdAt).toISOString().split('T')[0];
    eventsByDay[dateKey] = (eventsByDay[dateKey] || 0) + item._count.id;
  });

  // Format event type for display
  const formatEventType = (type: string): string => {
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-medium">Events by Type</h3>
        {totalEvents > 0 ? (
          <div className="space-y-3">
            {sortedStats.map((item) => (
              <div key={item.type} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{formatEventType(item.type)}</span>
                  <span>
                    {item.count} ({Math.round((item.count / totalEvents) * 100)}%)
                  </span>
                </div>
                <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(item.count / totalEvents) * 100}%`,
                      backgroundColor: colorMap[item.type] || '#9ca3af',
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground py-4 text-center">No event data available</div>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Events Created (Last 30 Days)</h3>
        {Object.keys(eventsByDay).length > 0 ? (
          <div className="h-40">
            <div className="flex h-full items-end">
              {Object.entries(eventsByDay).map(([date, count], index) => {
                // Only show every 5th day label on mobile
                const showLabel = window.innerWidth > 768 || index % 5 === 0;
                return (
                  <div key={date} className="flex flex-1 flex-col items-center">
                    <div
                      className="bg-primary mx-auto w-full max-w-[8px] rounded-t"
                      style={{
                        height: `${count ? (count * 100) / Math.max(...Object.values(eventsByDay)) : 0}%`,
                        minHeight: count ? '4px' : '0',
                        opacity: count ? 1 : 0.3,
                      }}
                    ></div>
                    {showLabel && (
                      <div className="text-muted-foreground mt-1 w-full truncate text-center text-[9px]">
                        {new Date(date).getDate()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground py-4 text-center">No event data available</div>
        )}
      </div>
    </div>
  );
}
