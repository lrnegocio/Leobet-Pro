
import { createClient } from '@supabase/supabase-js';

// MÁSCARA DE PROTEÇÃO: AS CHAVES NUNCA SÃO HARDCODED.
// O SISTEMA LÊ DAS VARIÁVEIS DE AMBIENTE DO VERCEL DURANTE O RUNTIME.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.warn("⚠️ Banco de dados em modo offline (Local). Verifique seu arquivo .env.local");
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
