import { AsyncLocalStorage } from 'node:async_hooks';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { env } from '../config/env.js';

export const authStorage = new AsyncLocalStorage<{ client: SupabaseClient; token: string }>();

const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'sb_publishable_gW9F6rIiSfO2gTRROGwVHA_aYaihiDQ';

const isRealServiceKey =
  env.SUPABASE_SERVICE_ROLE_KEY &&
  !env.SUPABASE_SERVICE_ROLE_KEY.startsWith('super-secret-') &&
  env.SUPABASE_SERVICE_ROLE_KEY.length > 25;

const rawSupabaseAdmin = createClient(
  env.SUPABASE_URL,
  isRealServiceKey ? env.SUPABASE_SERVICE_ROLE_KEY : anonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

/**
 * Server-side Supabase client.
 * In request contexts without a service role key, queries automatically run
 * with the caller's JWT so Row-Level Security policies evaluate correctly.
 */
export const supabaseAdmin = new Proxy(rawSupabaseAdmin, {
  get(target, prop, receiver) {
    if (isRealServiceKey) {
      const val = Reflect.get(target, prop, receiver);
      return typeof val === 'function' ? val.bind(target) : val;
    }
    const store = authStorage.getStore();
    const active = store?.client ?? target;
    const val = Reflect.get(active, prop, receiver);
    return typeof val === 'function' ? val.bind(active) : val;
  },
});

/**
 * Returns a Supabase client scoped to the user's Bearer token.
 */
export function getScopedClient(userToken?: string): SupabaseClient {
  if (isRealServiceKey || !userToken) {
    return rawSupabaseAdmin;
  }
  return createClient(env.SUPABASE_URL, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    },
  });
}


