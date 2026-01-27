
import { createClient } from '@supabase/supabase-js';

// No Vite, usa-se import.meta.env para variáveis em tempo de execução no cliente.
// Certifique-se de que no painel do Vercel as chaves começam com VITE_
// Use type assertion to bypass TypeScript check for missing 'env' on ImportMeta
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing. Ensure environment variables start with VITE_ in Vercel settings.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
