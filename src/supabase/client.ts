import { createClient } from '@supabase/supabase-js';

// Chaves protegidas. Devem ser configuradas no painel do Vercel (Settings > Environment Variables)
// Blindagem para evitar erro "supabaseUrl is required" durante o build do Next.js
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
