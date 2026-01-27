import { createClient } from '@supabase/supabase-js';

// No Vite, usa-se import.meta.env para variáveis de ambiente VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Variáveis VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontradas.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);