
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Using process.env instead of import.meta.env to fix "Property 'env' does not exist on type 'ImportMeta'" errors
const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Using process.env instead of import.meta.env to fix "Property 'env' does not exist on type 'ImportMeta'" errors
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERRO CRÍTICO: Variáveis do Supabase não configuradas no arquivo .env ou no Vercel.");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);
