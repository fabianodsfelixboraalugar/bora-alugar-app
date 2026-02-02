
import { createClient } from '@supabase/supabase-js';

// Em aplicações Vite, as variáveis de ambiente são acessadas via import.meta.env
// Usamos o cast 'as any' para evitar erros de tipagem caso o ambiente TS não esteja configurado com as definições do Vite
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("AVISO: Variáveis do Supabase não encontradas em import.meta.env. Verifique o arquivo .env.");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);
