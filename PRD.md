# Product Requirements Document: Sales Web Application

## Project Overview

Modern, mobile-friendly sales web application for a solar energy sales team with user management, training, calendar, onboarding, communications, and leaderboards. The application has dark mode design and supports up to 500 users.

## Tech Stack

- Frontend: Next.js 14+ with App Router
- Backend: Next.js API routes
- Database: PostgreSQL with Prisma ORM
- Styling: Tailwind CSS
- Authentication: NextAuth.js
- State Management: React Query + Context API
- Deployment: Ubuntu 24.04 with Nginx

## Feature Requirements

### 1. User Management

- User roles: User and Admin
- Sales positions: Junior EC, Energy Consultant, Energy Specialist, Manager
- Junior EC, Energy Consultant, Energy Specialist have User permissions
- Managers have Admin permissions
- User profile with editable settings
- Persistent authentication across all app sections

### 2. Training Portal

- Organized training modules by sections (onboarding, technology, appointment setting, in-home closing)
- Admin interface for managing training content
- Progress tracking for all users
- Mobile-optimized content display
- Video and document embedding support

### 3. Team Calendar

- Team calendar with meeting links and special events
- Support for "Blitz" events (10-12 days) with visual distinction
- Role-based permissions for viewing/editing
- Multiple calendar views (month, week, day)
- Event categorization with professional styling
- Clickable event links

### 4. Getting Started / Onboarding

- Guided process for new hires
- Step-by-step instructions with completion tracking
- Manager-editable content
- Prominent placement for new users
- Progress visualization

### 5. Communication Hub

- Important links section
- Company announcements section
- Contest information section
- Admin interface for content management
- Modern, card-based layout

### 6. Leaderboard System

- Multiple leaderboard types (Appointment Setters, Closers)
- Time period filtering (daily, weekly, monthly, quarterly, yearly)
- Manager interface for score entry
- Modern data visualization
- Mobile-responsive design

## Non-Functional Requirements

- Mobile-first design with responsive layouts
- Dark mode UI with professional styling
- Performance optimization for low-end devices
- Secure authentication and data protection
- Scalable architecture for up to 500 users
- Support for monetization features
