
import { createClient } from '@supabase/supabase-js';

// Blindagem absoluta para evitar erros durante build ou falta de chaves
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: (...args) => fetch(...args).catch(err => {
      // Falha silenciosa para não travar a UI, logando no console apenas
      console.warn("Supabase Fetch Warning (Verifique as chaves no Vercel):", err.message);
      return new Response(JSON.stringify({ error: "Failed to fetch" }), { status: 500 });
    })
  }
});
