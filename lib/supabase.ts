
import { createClient } from '@supabase/supabase-js';

// Alterado para process.env para evitar erros de tipagem no ImportMeta e manter consistência com o uso de process.env.API_KEY no projeto
const supabaseUrl = (process.env as any).VITE_SUPABASE_URL;
const supabaseAnonKey = (process.env as any).VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "ERRO DE CONFIGURAÇÃO: Variáveis VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY ausentes no ambiente."
  );
}

// Client exportado com verificação de segurança
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
