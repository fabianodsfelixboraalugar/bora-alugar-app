
import { createClient } from '@supabase/supabase-js';

// OBSERVAÇÃO: Substitua os valores abaixo pelos dados do seu painel Supabase
// A URL do projeto fica em Settings > API > Project URL
const supabaseUrl = "https://vhkujlxcwrmfelydtzla.supabase.co"; 
const supabaseAnonKey = "sb_publishable_3_-0jjtBRAgQSZaOx-j_Gw_ZmrSrAD1"; 
// Função para validar se a URL é válida antes de criar o cliente
const isValidUrl = (url: string) => {
  try {
    return url.startsWith('https://') && url.includes('.supabase.co');
  } catch {
    return false;
  }
};

// Se a URL for inválida, criamos um cliente "dummy" para evitar tela branca
export const supabase = isValidUrl(supabaseUrl) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : ({
      from: () => ({
        select: () => ({ order: () => ({ data: [], error: { message: 'Configuração Pendente' } }), limit: () => ({ data: [], error: { message: 'Configuração Pendente' } }) }),
        insert: () => ({ error: { message: 'Configuração Pendente' } }),
        update: () => ({ eq: () => ({ error: { message: 'Configuração Pendente' } }) }),
        delete: () => ({ eq: () => ({ error: { message: 'Configuração Pendente' } }) }),
      }),
      auth: {
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ error: { message: 'Configuração Pendente' } }),
        signOut: async () => {},
      },
      channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
      removeChannel: () => {},
      storage: { from: () => ({ upload: async () => ({}), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) }
    } as any);

export const isSupabaseConfigured = isValidUrl(supabaseUrl) && supabaseAnonKey.length > 50;
