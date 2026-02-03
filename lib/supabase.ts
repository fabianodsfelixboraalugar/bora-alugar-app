
import { createClient } from '@supabase/supabase-js';

// As variáveis são injetadas via define no vite.config.ts
const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "AVISO: Variáveis do Supabase não encontradas. Verifique as 'Environment Variables' no painel do Vercel."
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);
