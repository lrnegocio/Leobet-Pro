import { createClient } from '@supabase/supabase-js';

// Chaves fornecidas pelo usuário
const supabaseUrl = 'https://sjlnkpqmfmajszcqlguv.supabase.co';
const supabaseAnonKey = 'sb_publishable_wynH5nejXXQJrRWnXfsNag_zPPOG9JS';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
