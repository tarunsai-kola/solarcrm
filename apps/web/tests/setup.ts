import '@testing-library/jest-dom';

// Provide default test env vars for Vitest
Object.assign(import.meta.env, {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321',
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-anon-key-for-tests',
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
});
