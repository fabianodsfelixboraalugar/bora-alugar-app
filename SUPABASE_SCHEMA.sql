
-- ========================================================
-- SCRIPT DE REINSTALAÇÃO TOTAL - BORA ALUGAR
-- ATENÇÃO: Este script apaga as tabelas existentes para corrigir as colunas.
-- ========================================================

-- 1. LIMPEZA (DROP)
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.rentals CASCADE;
DROP TABLE IF EXISTS public.items CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. TABELA DE PERFIS (PROFILES)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
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

-- 3. TABELA DE ITENS
CREATE TABLE public.items (
  id TEXT PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_name TEXT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  contract_terms TEXT,
  images TEXT[] DEFAULT '{}',
  video_url TEXT,
  price_per_day NUMERIC NOT NULL,
  city TEXT,
  state TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  rating NUMERIC DEFAULT 5,
  review_count INTEGER DEFAULT 0,
  available BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'Disponível',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  delivery_config JSONB DEFAULT '{"available": false, "fee": 0, "max_distance_km": 10}'::jsonb
);

-- 4. TABELA DE ALUGUÉIS (RENTALS)
CREATE TABLE public.rentals (
  id TEXT PRIMARY KEY,
  item_id TEXT REFERENCES public.items(id) ON DELETE CASCADE,
  item_title TEXT,
  item_image TEXT,
  renter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_price NUMERIC NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  delivery_info JSONB,
  contract_accepted BOOLEAN DEFAULT FALSE
);

-- 5. TABELA DE MENSAGENS (CHAT)
CREATE TABLE public.messages (
  id BIGSERIAL PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  read BOOLEAN DEFAULT FALSE
);

-- 6. TABELA DE NOTIFICAÇÕES
CREATE TABLE public.notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. TABELA DE AVALIAÇÕES (REVIEWS)
CREATE TABLE public.reviews (
  id BIGSERIAL PRIMARY KEY,
  transaction_id TEXT REFERENCES public.rentals(id) ON DELETE CASCADE,
  item_id TEXT REFERENCES public.items(id) ON DELETE SET NULL,
  reviewer_id UUID REFERENCES public.profiles(id),
  reviewed_id UUID REFERENCES public.profiles(id),
  reviewer_name TEXT,
  role TEXT,
  rating INTEGER NOT NULL,
  comment TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  tags TEXT[] DEFAULT '{}',
  is_anonymous BOOLEAN DEFAULT FALSE,
  criteria JSONB
);

-- 8. POLÍTICAS DE SEGURANÇA (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura pública" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Permitir tudo ao próprio" ON public.profiles FOR ALL USING (auth.uid() = id);

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Items leitura pública" ON public.items FOR SELECT USING (true);
CREATE POLICY "Items dono gerencia" ON public.items FOR ALL USING (auth.uid() = owner_id);

ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rentals leitura participantes" ON public.rentals FOR SELECT USING (auth.uid() = renter_id OR auth.uid() = owner_id);
CREATE POLICY "Rentals locatário cria" ON public.rentals FOR INSERT WITH CHECK (auth.uid() = renter_id);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mensagens ver participantes" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Mensagens enviar" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notificações ver dono" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

-- 9. HABILITAR REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles, public.items, public.rentals, public.messages, public.notifications;
