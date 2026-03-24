import { createClient } from '@supabase/supabase-js';

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
      console.warn("Rede instável ou chaves ausentes. Verifique NEXT_PUBLIC_SUPABASE_URL na Vercel.", err.message);
      return new Response(JSON.stringify({ 
        error: "Network Error", 
        details: err.message,
        hint: "Verifique se as variáveis de ambiente do Supabase estão configuradas no painel da Vercel."
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    })
  }
});