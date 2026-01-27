
import { createClient } from '@supabase/supabase-js';

// No Vite, usa-se process.env para variáveis em tempo de execução no cliente
// Fix: Use process.env instead of import.meta.env to resolve Property 'env' does not exist on type 'ImportMeta'
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing. Check your Vercel Environment Variables (prefix with VITE_).");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
