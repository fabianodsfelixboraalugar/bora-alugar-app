
import { createClient } from '@supabase/supabase-js';

// === CONFIGURAÇÃO DO BANCO DE DADOS (SUPABASE) ===

// 1. Sua URL do projeto (Baseado no seu log de erro)
const supabaseUrl = 'https://udjbgazatnspnvaoyatf.supabase.co'; 

// 2. Sua Chave ANON (Pegue em Settings > API > anon public no painel do Supabase)
// A chave correta deve começar obrigatoriamente com "eyJ..."
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkamJnYXphdG5zcG52YW95YXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwOTQ0NDAsImV4cCI6MjA4NDY3MDQ0MH0.bDLAKoh6RKgXpCfmtLt37fP72ters-25ovhGFVEHY6w'; 

const isDefault = (val: string) => 
  !val || 
  val.includes('SUA_CHAVE') || 
  val.includes('COLE_AQUI') ||
  val.startsWith('sb_') || 
  val.length < 40;

export const isSupabaseConfigured = !isDefault(supabaseUrl) && !isDefault(supabaseAnonKey);

// Objeto mock para quando o Supabase não está configurado
const mockClient = {
  from: () => ({
    select: () => ({ 
      order: () => Promise.resolve({ data: [], error: null }),
      eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) })
    }),
    insert: () => Promise.resolve({ data: null, error: { message: 'Supabase não configurado.' } }),
    update: () => ({ eq: () => Promise.resolve({ error: { message: 'Supabase não configurado.' } }) }),
    delete: () => ({ eq: () => Promise.resolve({ error: { message: 'Supabase não configurado.' } }) }),
  }),
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ data: null, error: { message: 'Supabase não configurado.' } }),
    signUp: async () => ({ data: null, error: { message: 'Supabase não configurado.' } }),
    signOut: async () => ({ error: null }),
  },
  storage: { 
    from: () => ({ 
      upload: async () => ({ data: null, error: true }), 
      getPublicUrl: () => ({ data: { publicUrl: '' } }) 
    }) 
  }
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (mockClient as any);

