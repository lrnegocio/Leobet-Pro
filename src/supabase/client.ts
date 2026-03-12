
import { createClient } from '@supabase/supabase-js';

// Blindagem absoluta contra erros de build no Vercel e Internal Server Error
// Se as chaves não existirem, o sistema usa placeholders para não travar a renderização
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-resiliente.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.resiliente';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
});
