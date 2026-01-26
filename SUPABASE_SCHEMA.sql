
-- ========================================================
-- SCRIPT DE REINSTALAÇÃO TOTAL V7 - BORA ALUGAR
-- PROTEÇÃO CONTRA ERRO 422 E CONFLITOS DE IDENTIDADE
-- ========================================================

-- 1. TABELA DE PERFIS
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

-- 2. FUNÇÃO DE GATILHO ULTRA-RESILIENTE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta_user_type TEXT;
BEGIN
  meta_user_type := COALESCE(new.raw_user_meta_data->>'user_type', 'Pessoa Física');

  -- INSERT com ON CONFLICT para evitar erro 422 por duplicidade ou falha de trigger
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
    CASE WHEN meta_user_type = 'Pessoa Física' THEN new.raw_user_meta_data->>'tax_id' ELSE NULL END,
    CASE WHEN meta_user_type = 'Pessoa Jurídica' THEN new.raw_user_meta_data->>'tax_id' ELSE NULL END
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    user_type = EXCLUDED.user_type;
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Fallback total: garante que o usuário seja criado no Auth mesmo se o perfil falhar
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RE-CRIAR O GATILHO
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. POLÍTICAS DE SEGURANÇA (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso público aos perfis" ON public.profiles;
CREATE POLICY "Acesso público aos perfis" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Usuário edita próprio perfil" ON public.profiles;
CREATE POLICY "Usuário edita próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);
