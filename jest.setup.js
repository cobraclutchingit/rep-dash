/* eslint-disable @typescript-eslint/no-require-imports */
import '@testing-library/jest-dom';
import 'jest-fetch-mock';
import { jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

global.fetch = require('jest-fetch-mock');

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    route: '/',
    query: {},
    asPath: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
  usePathname: jest.fn().mockReturnValue('/'),
  useSearchParams: jest.fn().mockReturnValue(new URLSearchParams()),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn().mockReturnValue({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        position: 'ENERGY_CONSULTANT',
        isActive: true,
      },
      expires: new Date(Date.now() + 86400000).toISOString(),
    },
    status: 'authenticated',
  }),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
}));

const mockedPrisma = new PrismaClient();
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockedPrisma),
}));
global.mockedPrisma = mockedPrisma;

jest.mock('mockdate', () => ({
  set: (date) => {
    global.Date.now = () => (typeof date === 'string' ? new Date(date) : date).getTime();
  },
  reset: () => {
    global.Date.now = () => new Date().getTime();
  },
}));

jest.mock('@/components/ui/toast', () => ({
  toast: jest.fn(),
  successToast: jest.fn(),
  errorToast: jest.fn(),
  warningToast: jest.fn(),
  infoToast: jest.fn(),
  ToastProvider: jest.fn().mockImplementation(({ children }) => children),
}));

beforeEach(() => {
  fetch.resetMocks();
  jest.clearAllMocks();
  mockedPrisma.$transaction = jest.fn();
  mockedPrisma.leaderboard.findUnique = jest.fn();
  mockedPrisma.leaderboardEntry.findMany = jest.fn();
  mockedPrisma.user.findMany = jest.fn();
  mockedPrisma.user.count = jest.fn();
  mockedPrisma.user.findUnique = jest.fn();
  mockedPrisma.leaderboardEntry.create = jest.fn();
  mockedPrisma.calendarEvent.findUnique = jest.fn();
  mockedPrisma.calendarEvent.update = jest.fn();
  mockedPrisma.calendarEvent.delete = jest.fn();
  mockedPrisma.announcement.findUnique = jest.fn();
  mockedPrisma.announcement.findMany = jest.fn();
  mockedPrisma.notification.findMany = jest.fn();
  mockedPrisma.onboardingStep.findUnique = jest.fn();
  mockedPrisma.onboardingStep.update = jest.fn();
});
