'use client';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

const isConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!isConfigured) {
  console.warn("ATENÇÃO: Chaves do Supabase não configuradas na Vercel. O sistema funcionará de forma limitada até a configuração das Environment Variables.");
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      fetch: (...args) => fetch(...args).catch(err => {
        console.error("Erro de Conexão Supabase (Failed to Fetch):", err.message);
        return new Response(JSON.stringify({ error: "Failed to fetch" }), { status: 500 });
      })
    }
  }
);