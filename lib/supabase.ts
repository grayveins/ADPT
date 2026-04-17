import { createClient } from '@supabase/supabase-js';
// TODO Sprint 2: wire Database types into createClient<Database>(...)
// import type { Database } from '@/types/database';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

