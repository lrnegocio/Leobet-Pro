import { createClient } from '@supabase/supabase-js';

// Blindagem absoluta: O sistema usa chaves de segurança para evitar o erro "supabaseUrl is required" durante o build no Vercel.
// As chaves reais inseridas no painel da Vercel serão detectadas automaticamente no navegador.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-resiliente.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.resiliente';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
