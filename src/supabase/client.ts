
'use client';
import { createClient } from '@supabase/supabase-js';

// Fallbacks para evitar crash se as envs demorarem a carregar
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

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
        // Erro silencioso em produção para não derrubar a UI
        console.warn("Supabase Fetch Warning:", err.message);
        return new Response(JSON.stringify({ error: "Network/Sync issue" }), { status: 500 });
      })
    }
  }
);
