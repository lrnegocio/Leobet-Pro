'use client';
import { createClient } from '@supabase/supabase-js';

// Chaves oficiais configuradas para o ambiente de produção
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://woknbjmkhpkxahzbkdic.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_g-jp4nu7n4iRDJV_ns0k_g_aZNqOEvZ';

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
        console.warn("Supabase Sync:", err.message);
        return new Response(JSON.stringify({ error: "Sync issue" }), { status: 500 });
      })
    }
  }
);
