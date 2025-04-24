'use client';

import { formatDistanceToNow } from 'date-fns';
import React, { useState } from 'react';

import { useNotifications } from '../providers/notification-provider';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  // Handler for clicking a notification
  const handleNotificationClick = (id: string, type: string, resourceId: string | null) => {
    markAsRead(id);
    setIsOpen(false);

    // Navigate to the appropriate page based on the notification type
    if (resourceId) {
      switch (type) {
        case 'ANNOUNCEMENT':
          // Navigate to specific announcement
          // router.push(`/communication/announcements/${resourceId}`);
          break;
        case 'CONTEST':
          // Navigate to specific contest
          // router.push(`/communication/contests/${resourceId}`);
          break;
        case 'LINK':
          // Open link in new tab or navigate to links section
          break;
        default:
          // Generic navigation
          break;
      }
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ANNOUNCEMENT':
        return '📢';
      case 'CONTEST':
        return '🏆';
      case 'LINK':
        return '🔗';
      default:
        return '📌';
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hover:bg-muted relative rounded-full p-2 focus:outline-none"
        aria-label="Open notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <path d="M12.02 2.90991C8.70997 2.90991 6.01997 5.59991 6.01997 8.90991V11.7999C6.01997 12.4099 5.75997 13.3399 5.44997 13.8599L4.29997 15.7699C3.58997 16.9499 4.07997 18.2599 5.37997 18.6999C9.68997 20.1399 14.34 20.1399 18.65 18.6999C19.86 18.2999 20.39 16.8699 19.73 15.7699L18.58 13.8599C18.28 13.3399 18.02 12.4099 18.02 11.7999V8.90991C18.02 5.60991 15.32 2.90991 12.02 2.90991Z" />
          <path d="M13.87 3.19994C13.56 3.10994 13.24 3.03994 12.91 2.99994C11.95 2.87994 11.03 2.94994 10.17 3.19994C10.46 2.45994 11.18 1.93994 12.02 1.93994C12.86 1.93994 13.58 2.45994 13.87 3.19994Z" />
          <path d="M15.02 19.0601C15.02 20.7101 13.67 22.0601 12.02 22.0601C11.2 22.0601 10.44 21.7201 9.90002 21.1801C9.36002 20.6401 9.02002 19.8801 9.02002 19.0601" />
        </svg>

        {unreadCount > 0 && (
          <span className="bg-primary text-primary-foreground absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full text-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="bg-card absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-md border shadow-lg sm:w-96">
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="font-medium">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-primary text-xs hover:underline">
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-muted-foreground p-6 text-center">
                <div className="mb-2 text-2xl">🔔</div>
                <p>No notifications yet</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() =>
                      handleNotificationClick(
                        notification.id,
                        notification.type,
                        notification.resourceId
                      )
                    }
                    className={`hover:bg-muted/30 cursor-pointer border-b p-4 ${
                      !notification.isRead ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex">
                      <div className="mr-3 text-xl">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{notification.title}</div>
                        <p className="text-muted-foreground mt-1 mb-1 text-sm">
                          {notification.message}
                        </p>
                        <div className="text-muted-foreground text-xs">
                          {formatDate(notification.createdAt)}
                        </div>
                      </div>
                      {!notification.isRead && (
                        <div className="bg-primary mt-1 h-2 w-2 rounded-full"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t p-3 text-center">
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
