import { createClient } from '@supabase/supabase-js';

// No Vite, as variáveis devem começar com VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fallbacks para evitar o erro "supabaseUrl is required" que causa a tela branca
const placeholderUrl = 'https://placeholder-project.supabase.co';
const placeholderKey = 'placeholder-key';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ ATENÇÃO: Variáveis de ambiente Supabase não configuradas no Vercel.\n" +
    "O App abrirá, mas as funcionalidades de banco de dados estarão inativas.\n" +
    "Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas configurações do projeto."
  );
}

export const supabase = createClient(
  supabaseUrl || placeholderUrl,
  supabaseAnonKey || placeholderKey
);