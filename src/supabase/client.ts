'use client';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isConfigured = supabaseUrl && supabaseAnonKey;

if (!isConfigured && typeof window !== 'undefined') {
  console.warn("Chaves do Supabase ausentes. Configure as variáveis de ambiente na Vercel.");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      fetch: (...args) => fetch(...args).catch(err => {
        console.error("Erro de Rede Supabase:", err.message);
        throw err;
      })
    }
  }
);