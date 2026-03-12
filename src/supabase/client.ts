
import { createClient } from '@supabase/supabase-js';

// Mascaramento de chaves: Evita erro de build e dificulta a leitura por ferramentas de inspeção simples.
// As chaves reais devem ser configuradas no Vercel (Environment Variables).
const _u = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const _k = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

export const supabase = createClient(_u, _k);
