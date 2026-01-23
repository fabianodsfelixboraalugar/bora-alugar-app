
-- ==========================================
-- SCRIPT DE BANCO DE DADOS COMPLETO - BORA ALUGAR
-- Copie e cole no SQL Editor do Supabase e clique em RUN
-- ==========================================

-- 1. LIMPEZA (OPCIONAL - CUIDADO: APAGA DADOS EXISTENTES)
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.rentals CASCADE;
DROP TABLE IF EXISTS public.items CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. TABELA DE PERFIS (PROFILES)
CREATE TABLE public.profiles (
  "id" UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "userType" TEXT DEFAULT 'Pessoa Física',
  "cpf" TEXT,
  "cnpj" TEXT,
  "city" TEXT,
  "state" TEXT,
  "address" TEXT,
  "addressNumber" TEXT,
  "complement" TEXT,
  "neighborhood" TEXT,
  "zipCode" TEXT,
  "jobTitle" TEXT,
  "bio" TEXT,
  "avatar" TEXT,
  "joinedDate" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  "plan" TEXT DEFAULT 'Gratuito',
  "role" TEXT DEFAULT 'USER',
  "verificationStatus" TEXT DEFAULT 'Não Iniciado',
  "verified" BOOLEAN DEFAULT FALSE,
  "isActive" BOOLEAN DEFAULT TRUE,
  "blockedUserIds" TEXT[] DEFAULT '{}',
  "trustStats" JSONB DEFAULT '{"score": 50, "level": "NEUTRAL", "completedTransactions": 0, "cancellations": 0, "avgRatingAsOwner": 0, "countRatingAsOwner": 0, "avgRatingAsRenter": 0, "countRatingAsRenter": 0}'::jsonb
);

-- 3. TABELA DE ITENS
CREATE TABLE public.items (
  "id" TEXT PRIMARY KEY,
  "ownerId" UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  "ownerName" TEXT,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT,
  "contractTerms" TEXT,
  "images" TEXT[] DEFAULT '{}',
  "videoUrl" TEXT,
  "pricePerDay" NUMERIC NOT NULL,
  "city" TEXT,
  "state" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  "rating" NUMERIC DEFAULT 5,
  "reviewCount" INTEGER DEFAULT 0,
  "available" BOOLEAN DEFAULT TRUE,
  "status" TEXT DEFAULT 'Disponível',
  "lat" DOUBLE PRECISION,
  "lng" DOUBLE PRECISION,
  "deliveryConfig" JSONB DEFAULT '{"available": false, "fee": 0, "maxDistanceKm": 10}'::jsonb
);

-- 4. TABELA DE ALUGUÉIS (RENTALS)
CREATE TABLE public.rentals (
  "id" TEXT PRIMARY KEY,
  "itemId" TEXT REFERENCES public.items(id) ON DELETE CASCADE,
  "itemTitle" TEXT,
  "itemImage" TEXT,
  "renterId" UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  "ownerId" UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "totalPrice" NUMERIC NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  "deliveryInfo" JSONB,
  "contractAccepted" BOOLEAN DEFAULT FALSE
);

-- 5. TABELA DE MENSAGENS (CHAT)
CREATE TABLE public.messages (
  "id" BIGSERIAL PRIMARY KEY,
  "senderId" UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  "receiverId" UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  "content" TEXT NOT NULL,
  "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  "read" BOOLEAN DEFAULT FALSE
);

-- 6. TABELA DE NOTIFICAÇÕES
CREATE TABLE public.notifications (
  "id" BIGSERIAL PRIMARY KEY,
  "userId" UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "link" TEXT,
  "read" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. TABELA DE AVALIAÇÕES (REVIEWS)
CREATE TABLE public.reviews (
  "id" TEXT PRIMARY KEY,
  "transactionId" TEXT REFERENCES public.rentals(id) ON DELETE CASCADE,
  "itemId" TEXT REFERENCES public.items(id) ON DELETE SET NULL,
  "reviewerId" UUID REFERENCES public.profiles(id),
  "reviewedId" UUID REFERENCES public.profiles(id),
  "reviewerName" TEXT,
  "role" TEXT,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "date" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  "tags" TEXT[] DEFAULT '{}',
  "isAnonymous" BOOLEAN DEFAULT FALSE,
  "criteria" JSONB
);

-- 8. CONFIGURAÇÕES DE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rentals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 9. POLÍTICAS DE SEGURANÇA BÁSICA (RLS) - Permite leitura por todos, escrita por autenticados
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Profiles Read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users Update Own Profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Items Read" ON public.items FOR SELECT USING (true);
CREATE POLICY "Users Insert Own Items" ON public.items FOR INSERT WITH CHECK (auth.uid() = "ownerId");
CREATE POLICY "Users Update Own Items" ON public.items FOR UPDATE USING (auth.uid() = "ownerId");
CREATE POLICY "Users Delete Own Items" ON public.items FOR DELETE USING (auth.uid() = "ownerId");

-- (Adicionar políticas similares para outras tabelas conforme necessário)
