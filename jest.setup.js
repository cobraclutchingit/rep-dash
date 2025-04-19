// Optional: configure or set up a testing framework before each test
import '@testing-library/jest-dom';
import 'jest-fetch-mock';

// Mock the fetch API
global.fetch = require('jest-fetch-mock');

// Mock ResizeObserver (not available in jsdom)
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver (not available in jsdom)
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock next/router
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

// Mock next-auth
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

// Mock date for consistent testing
jest.mock('mockdate', () => ({
  set: (date) => {
    global.Date.now = () => (typeof date === 'string' ? new Date(date) : date).getTime();
  },
  reset: () => {
    global.Date.now = () => new Date().getTime();
  },
}));

// Mock the toast component
jest.mock('@/components/ui/toast', () => ({
  toast: jest.fn(),
  successToast: jest.fn(),
  errorToast: jest.fn(),
  warningToast: jest.fn(),
  infoToast: jest.fn(),
  ToastProvider: jest.fn().mockImplementation(({ children }) => children),
}));

// Reset mocks before each test
beforeEach(() => {
  fetch.resetMocks();
  jest.clearAllMocks();
});