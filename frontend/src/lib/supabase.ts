import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cjobumpzdfnbukrutqga.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_0moPn36mJz1G2GDfV5BCmw__lXfzldL';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
