
import { createClient } from '@supabase/supabase-js';

// As variáveis são injetadas durante o build via vite.config.ts
const supabaseUrl = (process.env as any).VITE_SUPABASE_URL;
const supabaseAnonKey = (process.env as any).VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "AVISO: Configurações do Supabase não encontradas. Verifique as 'Environment Variables' no painel da Vercel."
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);
