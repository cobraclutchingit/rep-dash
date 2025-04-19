# Communication Hub

This module provides a comprehensive communication center for the sales web application.

## Features

### User-facing features

- **Announcements**: Important company-wide or team communications with priority levels
- **Important Links**: Quick access to resources organized by category
- **Contests & Challenges**: Information about current and upcoming sales contests
- **Notifications**: Real-time alerts for new content

### Admin features

- **Content Management**: Create, edit, and delete all communication items
- **Publishing Controls**: Draft mode and scheduling options for content
- **Visibility Settings**: Target content by role and position
- **Category Management**: Organize content with custom categories

## Components

### User Components

- `announcement-card.tsx`: Display card for announcements with priority indicators
- `link-card.tsx`: Component for displaying important links
- `contest-card.tsx`: Card for displaying contests with status indicators
- `notification-center.tsx`: Dropdown for viewing notifications

### Section Components

- `announcements-section.tsx`: Section component for filtering and displaying announcements
- `links-section.tsx`: Section component for filtering and displaying links by category
- `contests-section.tsx`: Section component for filtering and displaying contests

### Providers

- `communication-provider.tsx`: Context provider for managing communication data and filtering
- `notification-provider.tsx`: Global provider for managing user notifications

## API Endpoints

### Announcements

- `GET /api/communication/announcements`: Get all visible announcements
- `POST /api/communication/announcements`: Create a new announcement
- `GET /api/communication/announcements/[id]`: Get a specific announcement
- `PUT /api/communication/announcements/[id]`: Update an announcement
- `DELETE /api/communication/announcements/[id]`: Delete an announcement

### Links

- `GET /api/communication/links`: Get all visible links
- `POST /api/communication/links`: Create a new link
- `GET /api/communication/links/[id]`: Get a specific link
- `PUT /api/communication/links/[id]`: Update a link
- `DELETE /api/communication/links/[id]`: Delete a link

### Contests

- `GET /api/communication/contests`: Get all visible contests
- `POST /api/communication/contests`: Create a new contest
- `GET /api/communication/contests/[id]`: Get a specific contest
- `PUT /api/communication/contests/[id]`: Update a contest
- `DELETE /api/communication/contests/[id]`: Delete a contest

### Notifications

- `GET /api/communication/notifications`: Get notifications for the current user
- `POST /api/communication/notifications`: Create a notification (admin only)
- `POST /api/communication/notifications/[id]/read`: Mark a notification as read
- `POST /api/communication/notifications/read-all`: Mark all notifications as read

## Database Schema

The communication hub uses the following models:

- `Announcement`: Company-wide or team communications
- `ImportantLink`: Quick access links to resources
- `Contest`: Sales contests and challenges
- `ContestParticipant`: User participation in contests
- `Notification`: User notifications for new content

## Permissions

Communication management is controlled by several permission checks:

- `canManageCommunications`: Base permission for managing all communication
- `canCreateAnnouncement`: Permission to create/edit announcements
- `canManageLinks`: Permission to manage important links
- `canManageContests`: Permission to manage contests and challenges

By default, users with the `ADMIN` role or `MANAGER` position can manage all communications.