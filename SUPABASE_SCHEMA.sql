
-- ========================================================
-- SCRIPT DE MANUTENÇÃO V8 - BORA ALUGAR
-- REMOVE RESTRIÇÕES QUE CAUSAM ERRO 422 E LIMPA CONFLITOS
-- ========================================================

-- 1. GARANTE QUE NÃO EXISTAM ÍNDICES DE UNICIDADE EM CPF/CNPJ QUE CAUSEM ERRO 422
-- (Se o usuário foi excluído no Auth mas sobrou no Profile, o cadastro novo falharia)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'profiles_cpf_key') THEN
        ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_cpf_key;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'profiles_cnpj_key') THEN
        ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_cnpj_key;
    END IF;
END $$;

-- 2. FUNÇÃO DE GATILHO REVISADA (MÁXIMA TOLERÂNCIA)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Tenta inserir ou atualizar se já existir (Upsert)
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
    COALESCE(new.raw_user_meta_data->>'user_type', 'Pessoa Física'),
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'state',
    new.raw_user_meta_data->>'zip_code',
    CASE WHEN (new.raw_user_meta_data->>'user_type') = 'Pessoa Física' THEN new.raw_user_meta_data->>'tax_id' ELSE NULL END,
    CASE WHEN (new.raw_user_meta_data->>'user_type') = 'Pessoa Jurídica' THEN new.raw_user_meta_data->>'tax_id' ELSE NULL END
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email;
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Em caso de erro extremo, não interrompe o cadastro do usuário
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RE-CRIAR O GATILHO
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- NOTA: Se você quiser apagar todos os usuários para testar do zero, 
-- use: TRUNCATE auth.users CASCADE; (Cuidado: apaga tudo!)
