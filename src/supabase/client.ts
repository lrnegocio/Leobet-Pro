
import { createClient } from '@supabase/supabase-js';

// Blindagem contra erro de build: URLs e chaves são carregadas apenas no navegador.
// Se as variáveis de ambiente não estiverem no Vercel, o sistema usa placeholders para não travar o build.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url-to-prevent-build-error.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
