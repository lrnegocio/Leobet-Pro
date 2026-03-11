
import { createClient } from '@supabase/supabase-js';

// PROTEÇÃO MÁXIMA: Nenhuma chave está escrita aqui.
// O sistema lê do Vercel no deploy e do .env.local no desenvolvimento.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  // Silencioso em produção para não dar pistas a hackers
  if (process.env.NODE_ENV === 'development') {
    console.warn("⚠️ Configurações do Banco de Dados não detectadas.");
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
