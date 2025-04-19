# Sales Rep Dashboard

A comprehensive Next.js application for sales teams with training, onboarding, calendar management, communication, and leaderboards.

## Features

- **User Authentication**: Secure login and registration with role-based access control
- **Dashboard**: Personalized overview of important metrics and activities
- **Training**: Access training materials and track progress
- **Onboarding**: Guided steps for new sales representatives
- **Calendar**: Schedule and manage meetings and events
- **Communication**: Company announcements and team updates
- **Leaderboard**: Performance metrics and achievements
- **Mobile Responsive**: Fully responsive design with dark mode support

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with dark mode
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **State Management**: React Query
- **UI Components**: Custom components with shadcn UI inspiration
- **Calendar**: React Big Calendar
- **Form Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd rep-dash
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Create a .env file with the following
   DATABASE_URL="postgresql://username:password@localhost:5432/repdash"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"
   ```

4. Run database setup script:
   ```bash
   # Make the script executable
   chmod +x scripts/setup-db.sh
   
   # Run the script
   ./scripts/setup-db.sh
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `/app`: Application routes and pages using Next.js App Router
  - `/(auth)`: Authentication pages (login, register)
  - `/(dashboard)`: Main dashboard layout and pages
  - `/api`: API routes for authentication and data
- `/components`: Reusable UI components
  - `/providers`: Context providers for auth and theme
  - `/ui`: UI components like buttons, cards, etc.
- `/lib`: Utility functions and configuration
  - `/api`: API utilities, middleware, and client
- `/prisma`: Database schema and migrations
- `/__tests__`: Unit and integration tests
- `/cypress`: End-to-end tests
- `/.github`: CI/CD workflows

## Database Schema

The application uses the following data models:

- **User**: User accounts with roles and profiles
- **TrainingContent**: Training materials and courses
- **TrainingProgress**: User progress on training materials
- **OnboardingStep**: Steps required for new user onboarding
- **OnboardingProgress**: User progress on onboarding steps
- **CalendarEvent**: Meetings and events
- **Announcement**: Company-wide or team announcements
- **Achievement**: User achievements and badges

## Authentication

Authentication is implemented using NextAuth.js with the following:

- Credential provider for email/password login
- JWT-based sessions
- Role-based access control (User/Admin)
- Protected routes via middleware

## Testing and Quality Assurance

The project includes a comprehensive testing suite:

### Unit & Integration Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Generate coverage report
npm run test:coverage
```

### End-to-End Tests

```bash
# Run Cypress tests interactively
npm run cypress

# Run Cypress tests headlessly
npm run cypress:headless

# Run E2E tests with app running
npm run e2e
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Check TypeScript types
npm run typecheck

# Format code with Prettier
npm run format
```

For more details, see [TESTING.md](TESTING.md)

## CI/CD

The project uses GitHub Actions for:

- Continuous Integration: Lint, Type Check, Unit Tests, Integration Tests, E2E Tests
- Continuous Deployment: Build, Deploy, Database Migrations

## Deployment

For production deployment, you can use platforms like:

- Vercel
- Netlify
- AWS Amplify

Make sure to set the appropriate environment variables on your hosting platform.

## License

This project is licensed under the MIT License - see the LICENSE file for details.