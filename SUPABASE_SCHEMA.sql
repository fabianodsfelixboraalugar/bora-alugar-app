
-- ========================================================
-- SCRIPT DE REINSTALAÇÃO TOTAL V6 - BORA ALUGAR
-- ATENÇÃO: Execute este script no SQL Editor do Supabase para corrigir erros de cadastro (422).
-- ========================================================

-- 1. TABELA DE PERFIS (GARANTINDO CAMPOS NECESSÁRIOS)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  user_type TEXT DEFAULT 'Pessoa Física',
  cpf TEXT,
  cnpj TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  avatar TEXT,
  joined_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  plan TEXT DEFAULT 'Gratuito',
  role TEXT DEFAULT 'USER',
  verification_status TEXT DEFAULT 'Não Iniciado',
  verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  trust_stats JSONB DEFAULT '{"score": 50, "level": "NEUTRAL", "completed_transactions": 0, "cancellations": 0, "avg_rating_as_owner": 0, "count_rating_as_owner": 0, "avg_rating_as_renter": 0, "count_rating_as_renter": 0}'::jsonb,
  document_url TEXT,
  selfie_url TEXT
);

-- 2. FUNÇÃO DE GATILHO ROBUSTA
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta_user_type TEXT;
BEGIN
  -- Extrai o tipo de usuário com fallback
  meta_user_type := COALESCE(new.raw_user_meta_data->>'user_type', 'Pessoa Física');

  INSERT INTO public.profiles (
    id, 
    name, 
    email, 
    user_type, 
    city, 
    state, 
    zip_code, 
    cpf, 
    cnpj
  )
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', 'Novo Usuário'), 
    new.email,
    meta_user_type,
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'state',
    new.raw_user_meta_data->>'zip_code',
    -- Lógica para CPF/CNPJ
    CASE WHEN meta_user_type = 'Pessoa Física' THEN new.raw_user_meta_data->>'tax_id' ELSE NULL END,
    CASE WHEN meta_user_type = 'Pessoa Jurídica' THEN new.raw_user_meta_data->>'tax_id' ELSE NULL END
  );
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Se falhar a inserção de metadados, tenta inserir apenas o perfil básico
  -- Isso evita o erro 422 que impede a criação do usuário no Auth
  INSERT INTO public.profiles (id, name, email)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', 'Novo Usuário'), new.email);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RE-CRIAR O GATILHO
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. HABILITAR RLS (Segurança)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso público aos perfis" ON public.profiles;
CREATE POLICY "Acesso público aos perfis" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Usuário edita próprio perfil" ON public.profiles;
CREATE POLICY "Usuário edita próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);
