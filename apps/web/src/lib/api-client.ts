import axios from 'axios';

import { supabase } from './supabase';

const BASE_URL = import.meta.env['VITE_API_BASE_URL'] as string ?? '/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

// Attach Supabase JWT to every request
apiClient.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) {
    config.headers['Authorization'] = `Bearer ${data.session.access_token}`;
  }
  return config;
});

// Normalise error responses
apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      // Token expired — sign out and redirect to login
      await supabase.auth.signOut();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);
