
'use client';
import { createClient } from '@supabase/supabase-js';

// Essas são as variáveis que você está configurando no Netlify agora
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
        console.warn("Supabase Fetch Warning:", err.message);
        return new Response(JSON.stringify({ error: "Network/Sync issue" }), { status: 500 });
      })
    }
  }
);
