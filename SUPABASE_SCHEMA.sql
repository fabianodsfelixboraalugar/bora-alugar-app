
-- ========================================================
-- SCRIPT DE MANUTENÇÃO V9 - BORA ALUGAR
-- RESILIÊNCIA TOTAL CONTRA ERRO 422 E PERFIS ÓRFÃOS
-- ========================================================

-- 1. FUNÇÃO DE GATILHO REVISADA COM UPSERT
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta_user_type TEXT;
BEGIN
  -- Extração segura de metadados
  meta_user_type := COALESCE(new.raw_user_meta_data->>'user_type', 'Pessoa Física');

  -- INSERT com ON CONFLICT (UPSERT)
  -- Se o perfil já existir (por tentativa anterior ou erro de sync), ele atualiza os dados
  INSERT INTO public.profiles (
    id, 
    name, 
    email, 
    user_type, 
    city, 
    state, 
    zip_code, 
    cpf, 
    cnpj,
    is_active
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
    CASE WHEN meta_user_type = 'Pessoa Jurídica' THEN new.raw_user_meta_data->>'tax_id' ELSE NULL END,
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    user_type = EXCLUDED.user_type,
    is_active = TRUE;
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Garante que falhas no profile não impeçam a criação da conta no Auth
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. RE-CRIAR O GATILHO
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
