import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Ensure WebSocket constructor exists in non-browser / older Node environments
if (typeof (globalThis as any).WebSocket === 'undefined') {
  class UniversalWebSocket {
    constructor() {}
    close() {}
    send() {}
    addEventListener() {}
    removeEventListener() {}
  }
  (globalThis as any).WebSocket = UniversalWebSocket;
}

/**
 * Anonymous public Supabase client.
 * Respects RLS and uses the public anon key.
 * Used as the default unprivileged client across repositories.
 */
export const supabaseAnonClient: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

/**
 * Privileged Service-Role Supabase client.
 * Bypasses RLS. NEVER expose to frontend or client context.
 * Used EXCLUSIVELY for:
 * 1. Initial auth token verification in AuthRepository.getUserByAuthId (safe privileged bootstrap before context exists).
 */
export const supabaseAdminClient: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

/**
 * Creates a scoped Supabase client for backend operations.
 * The backend handles its own authentication and RBAC authorization,
 * so it uses the privileged service_role client for database access.
 */
export function createScopedClient(_accessToken?: string): SupabaseClient {
  return supabaseAdminClient;
}

/**
 * Returns the provided client or defaults to the privileged supabaseAdminClient.
 * The backend handles its own authentication and RBAC authorization.
 */
export function getClient(client?: SupabaseClient): SupabaseClient {
  return client || supabaseAdminClient;
}

