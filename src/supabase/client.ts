
import { createClient } from '@supabase/supabase-js';

// Proteção contra Erro de Build: O Next.js exige que estas strings existam durante a compilação.
// Substituímos por placeholders se as variáveis de ambiente não forem detectadas.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
