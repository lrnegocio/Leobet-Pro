
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
      console.warn("Erro de Rede Supabase (Verifique as chaves no Vercel):", err.message || "Sem conexão");
      return new Response(JSON.stringify({ 
        error: "Failed to fetch", 
        message: err.message,
        details: "Verifique se as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão configuradas na Vercel."
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    })
  }
});
