import { createClient } from '@supabase/supabase-js';

// As chaves são lidas exclusivamente das variáveis de ambiente do Vercel/Ambiente
// NUNCA deixe chaves expostas aqui como texto puro.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Configurações do Banco de Dados não detectadas. Verifique as variáveis de ambiente.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
