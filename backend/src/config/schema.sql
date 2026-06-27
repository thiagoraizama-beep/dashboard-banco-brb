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

ALTER TABLE creatives DROP CONSTRAINT IF EXISTS creatives_status_check;
ALTER TABLE creatives ADD CONSTRAINT creatives_status_check
  CHECK (status IN (
    'Em veiculação', 'Com erro', 'Programado', 'Pausado',
    'Em aprovação', 'Aprovado', 'Aguardando implementação', 'Ativo'
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

CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  criado_em TIMESTAMP NOT NULL DEFAULT now()
);

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
