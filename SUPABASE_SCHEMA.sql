
-- SCRIPT DE CRIAÇÃO DO BANCO BORA ALUGAR
-- Cole este código no SQL Editor do Supabase e clique em RUN.

-- 1. Tabela de Perfis de Usuário
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  userType TEXT DEFAULT 'Pessoa Física',
  city TEXT,
  state TEXT,
  plan TEXT DEFAULT 'Gratuito',
  role TEXT DEFAULT 'USER',
  verificationStatus TEXT DEFAULT 'Não Iniciado',
  joinedDate TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  avatar TEXT,
  verified BOOLEAN DEFAULT FALSE,
  trustStats JSONB DEFAULT '{"score": 50, "level": "NEUTRAL", "completedTransactions": 0}'::jsonb
);

-- 2. Tabela de Itens para Aluguel
CREATE TABLE IF NOT EXISTS public.items (
  id TEXT PRIMARY KEY,
  ownerId UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ownerName TEXT,
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  images TEXT[] DEFAULT '{}',
  videoUrl TEXT,
  pricePerDay NUMERIC NOT NULL,
  city TEXT,
  state TEXT,
  available BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'Disponível',
  deliveryConfig JSONB,
  contractTerms TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Tabela de Aluguéis (Transações)
CREATE TABLE IF NOT EXISTS public.rentals (
  id TEXT PRIMARY KEY,
  itemId TEXT REFERENCES public.items(id) ON DELETE CASCADE,
  itemTitle TEXT,
  itemImage TEXT,
  renterId UUID REFERENCES auth.users(id),
  ownerId UUID REFERENCES auth.users(id),
  startDate DATE,
  endDate DATE,
  totalPrice NUMERIC,
  status TEXT DEFAULT 'Pendente',
  deliveryInfo JSONB,
  contractAccepted BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Tabela de Mensagens (Chat)
CREATE TABLE IF NOT EXISTS public.messages (
  id BIGSERIAL PRIMARY KEY,
  senderId UUID REFERENCES auth.users(id),
  receiverId UUID REFERENCES auth.users(id),
  content TEXT,
  read BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Tabela de Notificações
CREATE TABLE IF NOT EXISTS public.notifications (
  id BIGSERIAL PRIMARY KEY,
  userId UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT,
  title TEXT,
  message TEXT,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Tabela de Avaliações
CREATE TABLE IF NOT EXISTS public.reviews (
  id BIGSERIAL PRIMARY KEY,
  transactionId TEXT,
  itemId TEXT,
  reviewerId UUID,
  reviewedId UUID,
  reviewerName TEXT,
  role TEXT,
  rating INTEGER,
  criteria JSONB,
  comment TEXT,
  tags TEXT[],
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar Realtime para as tabelas principais
ALTER PUBLICATION supabase_realtime ADD TABLE profiles, items, rentals, messages, notifications, reviews;
