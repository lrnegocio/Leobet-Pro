import { createClient } from '@supabase/supabase-js';

// Prioriza variáveis de ambiente do Vercel, com fallback para as chaves hardcoded
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sjlnkpqmfmajszcqlguv.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_wynH5nejXXQJrRWnXfsNag_zPPOG9JS';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
