
import { createClient } from '@supabase/supabase-js';

// No Vite, a forma correta e segura de acessar variáveis de ambiente é via import.meta.env
// Isso garante que o bundler injete os valores corretamente durante o build do Vercel
// Fix: Accessing environment variables via process.env because Property 'env' does not exist on type 'ImportMeta'.
// These variables are explicitly defined in vite.config.ts.
const supabaseUrl = (process.env as any).VITE_SUPABASE_URL;
const supabaseAnonKey = (process.env as any).VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "AVISO: Chaves do Supabase não encontradas. Certifique-se de configurá-las no painel da Vercel (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY)."
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);
