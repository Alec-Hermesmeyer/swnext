/**
 * Test Setup Utilities
 * Provides common mocks and setup for initialization testing
 */

import { jest } from '@jest/globals';

// Mock Next.js router
export const mockRouter = {
  push: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(() => Promise.resolve()),
  replace: jest.fn(),
  reload: jest.fn(),
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
};

// Mock Supabase client
export const mockSupabase = {
  auth: {
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
    signOut: jest.fn(),
    signIn: jest.fn(),
    signUp: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  })),
};

// Mock service worker
export const mockServiceWorker = {
  register: jest.fn(() => Promise.resolve()),
  unregister: jest.fn(() => Promise.resolve()),
  getRegistration: jest.fn(() => Promise.resolve(null)),
};

// Mock Analytics components
export const MockAnalytics = () => null;
export const MockSpeedInsights = () => null;

// Mock layout components
export const MockTWLayout = ({ children }) => <div data-testid="tw-layout">{children}</div>;
export const MockTWAdminLayout = ({ children }) => <div data-testid="admin-layout">{children}</div>;

// Test user data fixtures
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: { name: 'Test User' },
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

export const mockProfile = {
  id: 'test-user-id',
  role: 'user',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

// Mock session data
export const mockSession = {
  access_token: 'mock-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: mockUser,
};

// Helper to setup component testing environment
export const setupComponentTest = () => {
  // Mock window.navigator for service worker tests
  Object.defineProperty(window, 'navigator', {
    value: {
      serviceWorker: mockServiceWorker,
    },
    writable: true,
  });

  // Mock window.addEventListener
  const addEventListener = jest.fn();
  Object.defineProperty(window, 'addEventListener', {
    value: addEventListener,
    writable: true,
  });

  return { addEventListener };
};

// Helper to create auth state scenarios
export const createAuthState = (scenario) => {
  switch (scenario) {
    case 'authenticated':
      return {
        user: mockUser,
        session: mockSession,
        loading: false,
        role: 'user',
      };
    case 'loading':
      return {
        user: null,
        session: null,
        loading: true,
        role: null,
      };
    case 'unauthenticated':
      return {
        user: null,
        session: null,
        loading: false,
        role: null,
      };
    case 'admin':
      return {
        user: mockUser,
        session: mockSession,
        loading: false,
        role: 'admin',
      };
    default:
      return {
        user: null,
        session: null,
        loading: true,
        role: null,
      };
  }
};

// Test timeout helpers
export const TEST_TIMEOUTS = {
  FAST: 100,
  MEDIUM: 1000,
  SLOW: 5000,
};

export default {
  mockRouter,
  mockSupabase,
  mockServiceWorker,
  MockAnalytics,
  MockSpeedInsights,
  MockTWLayout,
  MockTWAdminLayout,
  mockUser,
  mockProfile,
  mockSession,
  setupComponentTest,
  createAuthState,
  TEST_TIMEOUTS,
};