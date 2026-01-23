
import { createClient } from '@supabase/supabase-js';

// === CONFIGURAÇÃO DO BANCO DE DADOS (SUPABASE) ===

// URL e Chave fornecidas pelo usuário
const supabaseUrl = 'https://udjbgazatnspnvaoyatf.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkamJnYXphdG5zcG52YW95YXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwOTQ0NDAsImV4cCI6MjA4NDY3MDQ0MH0.bDLAKoh6RKgXpCfmtLt37fP72ters-25ovhGFVEHY6w'; 

export const isSupabaseConfigured = true;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
