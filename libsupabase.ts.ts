
import { createClient } from '@supabase/supabase-js';

// SUBSTITUA ESTAS DUAS LINHAS COM OS DADOS QUE VOCÊ PEGOU NO PASSO 1
const supabaseUrl = 'https://vhkujlxcwrmfelydtzla.supabase.co';
const supabaseAnonKey = 'sb_publishable_3_-0jjtBRAgQSZaOx-j_Gw_ZmrSrAD1';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
