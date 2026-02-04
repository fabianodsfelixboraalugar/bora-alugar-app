
import { createClient } from '@supabase/supabase-js';

// No Vite, preferimos import.meta.env, mas o mapeamento no vite.config também expõe via process.env
// Fix: Property 'env' does not exist on type 'ImportMeta' by casting to any
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || (process.env as any).VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (process.env as any).VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'undefined') {
  console.error(
    "ERRO CRÍTICO: Configurações do Supabase não encontradas. Verifique se VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão configuradas no painel da Vercel (Environment Variables)."
  );
}

// Inicializamos com URLs de placeholder caso as variáveis falhem, para evitar quebra fatal do app durante o build
export const supabase = createClient(
  (supabaseUrl && supabaseUrl !== 'undefined') ? supabaseUrl : 'https://placeholder.supabase.co',
  (supabaseAnonKey && supabaseAnonKey !== 'undefined') ? supabaseAnonKey : 'placeholder'
);
