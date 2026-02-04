
import { createClient } from '@supabase/supabase-js';

// Detecção obrigatória de ambiente usando casting para evitar erros de tipagem do Vite/TS em ImportMeta
export const IS_PREVIEW = 
  typeof window !== 'undefined' && 
  (!(import.meta as any).env?.VITE_SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL === '');

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// O cliente é criado mas as chamadas serão interceptadas pelo IS_PREVIEW nos contextos
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
