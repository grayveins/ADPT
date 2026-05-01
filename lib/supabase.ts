import { createClient } from '@supabase/supabase-js';
// TODO Sprint 2: wire Database types into createClient<Database>(...)
// import type { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);
export const supabaseConfigError = hasSupabaseConfig
  ? null
  : 'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in the build environment.';

type SupabaseClientInstance = ReturnType<typeof createClient>;

const missingConfigHandler: ProxyHandler<SupabaseClientInstance> = {
  get() {
    throw new Error(
      supabaseConfigError ?? 'Supabase is not configured for this build.'
    );
  },
};

let supabaseInstance: SupabaseClientInstance;

if (supabaseUrl && supabaseAnonKey) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
} else {
  supabaseInstance = new Proxy(
    {} as SupabaseClientInstance,
    missingConfigHandler
  );
}

export const supabase = supabaseInstance;
