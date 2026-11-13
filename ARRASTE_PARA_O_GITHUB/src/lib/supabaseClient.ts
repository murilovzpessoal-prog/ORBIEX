import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://ywmhjdcuztfwhlatvlzp.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_yOFFvnPP5ZH2-SwMHF_JLw_tM9VRGXS';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

