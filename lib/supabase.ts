import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseReady = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl ?? 'https://example.supabase.co', supabaseAnonKey ?? 'demo-key', {
  auth: { persistSession: true, autoRefreshToken: true }
});

export const buckets = {
  templates: 'template-papers',
  answers: 'answer-papers',
  annotated: 'annotated-papers'
};
