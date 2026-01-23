
-- SCRIPT DE ATUALIZAÇÃO COMPLETA - BORA ALUGAR
-- Copie e cole no SQL Editor do Supabase e clique em RUN

DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  userType TEXT DEFAULT 'Pessoa Física',
  cpf TEXT,
  cnpj TEXT,
  city TEXT,
  state TEXT,
  address TEXT,
  addressNumber TEXT,
  complement TEXT,
  neighborhood TEXT,
  zipCode TEXT,
  jobTitle TEXT,
  bio TEXT,
  avatar TEXT,
  joinedDate TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  plan TEXT DEFAULT 'Gratuito',
  role TEXT DEFAULT 'USER',
  verificationStatus TEXT DEFAULT 'Não Iniciado',
  verified BOOLEAN DEFAULT FALSE,
  isActive BOOLEAN DEFAULT TRUE,
  blockedUserIds TEXT[] DEFAULT '{}',
  trustStats JSONB DEFAULT '{"score": 50, "level": "NEUTRAL", "completedTransactions": 0, "cancellations": 0, "avgRatingAsOwner": 0, "countRatingAsOwner": 0, "avgRatingAsRenter": 0, "countRatingAsRenter": 0}'::jsonb
);

-- Garante que o bucket de imagens exista (rode isso se der erro de storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('item-images', 'item-images', true) ON CONFLICT DO NOTHING;

-- Habilitar Realtime para a tabela profiles
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
