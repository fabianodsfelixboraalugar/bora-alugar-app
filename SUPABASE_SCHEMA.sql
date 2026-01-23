
-- ========================================================
-- SCRIPT DE REINSTALAÇÃO TOTAL V4 - BORA ALUGAR
-- ATENÇÃO: Execute este script no SQL Editor do Supabase.
-- ========================================================

-- 1. LIMPEZA TOTAL
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.rentals CASCADE;
DROP TABLE IF EXISTS public.items CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. TABELA DE PERFIS (PROFILES)
CREATE TABLE public.profiles (
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

-- 3. AUTOMAÇÃO DE PERFIL
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (new.id, new.raw_user_meta_data->>'name', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. OUTRAS TABELAS (REDUZIDO PARA CABER NO XML)
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

CREATE TABLE public.messages (
  id BIGSERIAL PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  read BOOLEAN DEFAULT FALSE
);

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

-- 5. POLÍTICAS DE SEGURANÇA (RLS) - LIBERANDO SELECT PÚBLICO
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura pública" ON public.profiles;
CREATE POLICY "Leitura pública" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Próprio usuário edita" ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Itens públicos" ON public.items FOR SELECT USING (true);
CREATE POLICY "Dono gerencia" ON public.items FOR ALL USING (auth.uid() = owner_id);

ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver aluguéis" ON public.rentals FOR SELECT USING (auth.uid() = renter_id OR auth.uid() = owner_id);
CREATE POLICY "Criar aluguel" ON public.rentals FOR INSERT WITH CHECK (auth.uid() = renter_id);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mensagens" ON public.messages FOR ALL USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver notificações" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

-- 6. HABILITAR REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles, public.items, public.rentals, public.messages, public.notifications;
