import { createClient } from '@supabase/supabase-js';

// ================================
// CONFIGURAÇÃO SUPABASE (REAL)
// ================================

// URL do projeto (Settings > API)
const supabaseUrl = 'https://vhkujlxcwrmfelydtzla.supabase.co';

// Chave anon public (Settings > API > anon public)
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkamJnYXphdG5zcG52YW95YXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwOTQ0NDAsImV4cCI6MjA4NDY3MDQ0MH0.bDLAKoh6RKgXpCfmtLt37fP72ters-25ovhGFVEHY6w';

// Cliente Supabase REAL
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Flag opcional (caso queira checar em componentes)
export const isSupabaseConfigured = true;
