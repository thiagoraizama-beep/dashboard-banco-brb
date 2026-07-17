CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  nome TEXT NOT NULL,
  papel TEXT NOT NULL CHECK (papel IN ('agencia', 'veiculo', 'cliente')),
  veiculos TEXT[] NOT NULL DEFAULT '{}',
  foto_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMP NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS foto_url TEXT;

CREATE TABLE IF NOT EXISTS creatives (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  ad_name TEXT,
  campanha TEXT NOT NULL,
  conjunto TEXT,
  descricao TEXT,
  observacoes TEXT,
  periodo_inicio DATE,
  periodo_fim DATE,
  veiculo TEXT NOT NULL,
  cloudinary_public_id TEXT NOT NULL,
  cloudinary_url TEXT NOT NULL,
  tipo_midia TEXT NOT NULL CHECK (tipo_midia IN ('image', 'video')),
  status TEXT NOT NULL DEFAULT 'Programado',
  criado_por INTEGER NOT NULL REFERENCES users(id),
  criado_em TIMESTAMP NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT now()
);

ALTER TABLE creatives ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS periodo_inicio DATE;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS periodo_fim DATE;
-- Formato/posicionamento do criativo (ex: Stories, Reels, Feed) para cruzar com a planilha.
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS formato TEXT;

-- Novos campos da matriz expandida
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS campaign_name TEXT;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS url_destino TEXT;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS impulsionado BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS segmentacao TEXT;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS titulo TEXT;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS tipos_compra TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS posicionamento TEXT;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS plataforma TEXT;

ALTER TABLE creatives DROP CONSTRAINT IF EXISTS creatives_status_check;
ALTER TABLE creatives ADD CONSTRAINT creatives_status_check
  CHECK (status IN (
    'Em veiculação', 'Com erro', 'Programado', 'Pausado',
    'Em aprovação', 'Aprovado', 'Aguardando implementação', 'Ativo',
    'Interrompido', 'Finalizado'
  ));

CREATE TABLE IF NOT EXISTS creative_status_history (
  id SERIAL PRIMARY KEY,
  creative_id INTEGER NOT NULL REFERENCES creatives(id) ON DELETE CASCADE,
  status_anterior TEXT,
  status_novo TEXT NOT NULL,
  alterado_por INTEGER NOT NULL REFERENCES users(id),
  alterado_em TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_creatives_veiculo ON creatives(veiculo);
CREATE INDEX IF NOT EXISTS idx_creatives_ad_name ON creatives(ad_name);
CREATE INDEX IF NOT EXISTS idx_status_history_creative ON creative_status_history(creative_id);

-- tipo: redes_sociais = aparece no menu Analise por Criativo (Meta, TikTok, YouTube, Kwai...)
--       online_outros = Display, Programatica, portais — nao aparece no menu criativos
--       offline = TV, Radio, OOH — aparece em Midia Offline
CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  plataformas TEXT[] NOT NULL DEFAULT '{}',
  tipo TEXT NOT NULL DEFAULT 'redes_sociais',
  criado_em TIMESTAMP NOT NULL DEFAULT now()
);

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS plataformas TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'online';
-- Atualiza o check para incluir 'redes_sociais' como categoria especifica de veiculos
-- que aparecem no menu "Analise por Criativo" (Meta, TikTok, YouTube, Kwai, etc.)
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_tipo_check;

CREATE TABLE IF NOT EXISTS programacoes (
  id SERIAL PRIMARY KEY,
  veiculo TEXT NOT NULL,
  categoria TEXT,
  programa TEXT NOT NULL,
  data DATE NOT NULL,
  hora_inicio TEXT NOT NULL,
  hora_fim TEXT NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_programacoes_data ON programacoes(data);

-- Parceiros: empresas que operam canais de midia em nome do Senado.
-- tipo define se o parceiro atende midia online, offline ou ambas.
CREATE TABLE IF NOT EXISTS parceiros (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL CHECK (tipo IN ('online', 'offline', 'ambos')),
  criado_em TIMESTAMP NOT NULL DEFAULT now()
);

-- Escopos: define quais campanhas e canais cada parceiro atendeu.
-- Um parceiro pode ter N escopos (um por campanha que participou).
-- canais: nomes que batem com o campo "veiculo" na planilha realizado
--   (ex: ["Meta", "TikTok", "Kwai", "YouTube"] para parceiro online;
--        ["Globo", "SBT", "Record"] para parceiro offline).
CREATE TABLE IF NOT EXISTS parceiro_escopos (
  id SERIAL PRIMARY KEY,
  parceiro_id INTEGER NOT NULL REFERENCES parceiros(id) ON DELETE CASCADE,
  campanha TEXT NOT NULL,
  canais TEXT[] NOT NULL DEFAULT '{}',
  criado_em TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (parceiro_id, campanha)
);

CREATE INDEX IF NOT EXISTS idx_escopos_parceiro ON parceiro_escopos(parceiro_id);

-- Plataformas de mídia cadastradas pela agência.
-- subcanais: nomes que esta plataforma engloba na planilha de realizado
-- (ex: Meta Ads -> ["Facebook", "Instagram"]; R7 Portal -> ["Portal R7"]).
CREATE TABLE IF NOT EXISTS plataformas (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL DEFAULT 'online' CHECK (tipo IN ('online', 'offline', 'ambos')),
  subcanais TEXT[] NOT NULL DEFAULT '{}',
  criado_em TIMESTAMP NOT NULL DEFAULT now()
);

-- Campanhas cadastradas pela agencia.
CREATE TABLE IF NOT EXISTS campanhas (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  criado_em TIMESTAMP NOT NULL DEFAULT now()
);

-- Vinculo campanha -> veiculo -> plataformas que aquele veiculo trabalha nesta campanha.
-- tipo_midia: o escopo de midia do veiculo NESTA campanha especifica, que pode ser mais
-- restrito que o tipo geral do veiculo (ex: Go On e "ambos" no cadastro geral, mas so
-- trabalha "online" na Campanha Institucional -- nao deve ver nada de offline ali).
CREATE TABLE IF NOT EXISTS campanha_veiculos (
  id SERIAL PRIMARY KEY,
  campanha_id INTEGER NOT NULL REFERENCES campanhas(id) ON DELETE CASCADE,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  plataformas TEXT[] NOT NULL DEFAULT '{}',
  tipo_midia TEXT NOT NULL DEFAULT 'online' CHECK (tipo_midia IN ('online', 'offline', 'ambos')),
  UNIQUE (campanha_id, vehicle_id)
);

ALTER TABLE campanha_veiculos ADD COLUMN IF NOT EXISTS tipo_midia TEXT NOT NULL DEFAULT 'online';

CREATE INDEX IF NOT EXISTS idx_campanha_veiculos_campanha ON campanha_veiculos(campanha_id);
CREATE INDEX IF NOT EXISTS idx_campanha_veiculos_vehicle ON campanha_veiculos(vehicle_id);

-- Compatibilidade: mantém a tabela antiga mas agora é derivada das campanhas acima
CREATE TABLE IF NOT EXISTS campanhas_plataformas (
  id SERIAL PRIMARY KEY,
  campanha TEXT NOT NULL UNIQUE,
  plataformas TEXT[] NOT NULL DEFAULT '{}',
  criado_em TIMESTAMP NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT now()
);

-- Tokens de recuperacao de senha. Cada solicitacao gera um token novo;
-- os anteriores do mesmo usuario sao invalidados ao gerar um novo (ver authService).
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expira_em TIMESTAMP NOT NULL,
  usado BOOLEAN NOT NULL DEFAULT false,
  criado_em TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);

-- Vincula um usuario do papel 'parceiro' ao seu Parceiro cadastrado.
ALTER TABLE users ADD COLUMN IF NOT EXISTS parceiro_id INTEGER REFERENCES parceiros(id);
-- Expande os papeis aceitos para incluir 'parceiro'.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_papel_check;
ALTER TABLE users ADD CONSTRAINT users_papel_check
  CHECK (papel IN ('agencia', 'veiculo', 'cliente', 'parceiro'));
