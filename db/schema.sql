-- Schema do app de presenças do Hacoré.
-- Idempotente: pode ser rodado de novo a cada mudança (create ... if not exists / on conflict do nothing).

create extension if not exists unaccent;

-- Jovens (e admins também têm um registro aqui quando fazem login).
create table if not exists users (
  id          text primary key default gen_random_uuid()::text,
  email       text not null unique,            -- sempre minúsculo
  name        text not null,
  photo_url   text,
  made_camp   boolean not null default false,  -- já fez o acampamento?
  camp_year   int check (camp_year is null or camp_year between 1990 and 2100),
  onboarded   boolean not null default false,  -- já respondeu o cadastro inicial
  created_at  timestamptz not null default now()
);

-- Admins cadastrados pelo painel. Os de ADMIN_EMAILS (variável de ambiente) também são admins.
create table if not exists admins (
  email     text primary key,
  added_by  text not null,
  added_at  timestamptz not null default now()
);

-- Locais das reuniões. A localização do ponto é definida pelo admin no painel.
create table if not exists places (
  id          text primary key default gen_random_uuid()::text,
  name        text not null,
  address     text not null default '',
  lat         double precision,
  lng         double precision,
  radius_m    int not null default 150 check (radius_m between 20 and 5000),
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Ciclos: o "zerar presenças" fecha o ciclo atual e abre outro. O histórico nunca é apagado.
create table if not exists cycles (
  id          text primary key default gen_random_uuid()::text,
  name        text not null,
  started_at  timestamptz not null default now(),
  ended_at    timestamptz
);
create unique index if not exists cycles_one_open on cycles ((ended_at is null)) where ended_at is null;

create table if not exists meetings (
  id           text primary key default gen_random_uuid()::text,
  cycle_id     text not null references cycles(id),
  place_id     text references places(id) on delete set null,
  theme        text not null,
  description  text not null default '',
  date         date not null,
  starts_at    timestamptz not null,           -- início da reunião (abre a presença)
  closes_at    timestamptz not null,           -- fim da janela de presença (padrão: 23:59 do dia)
  is_visible   boolean not null default true,
  created_by   text not null,
  created_at   timestamptz not null default now(),
  check (closes_at > starts_at)
);
create index if not exists meetings_cycle_date on meetings (cycle_id, date desc);

-- Presença. A localização do jovem NÃO é guardada: só o resultado da verificação.
create table if not exists presences (
  meeting_id   text not null references meetings(id) on delete cascade,
  user_id      text not null references users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  source       text not null check (source in ('self', 'admin')),
  location     text not null check (location in ('ok', 'none')),  -- none = sem localização (GPS falhou/negado)
  marked_by    text,                                              -- email do admin quando source = admin
  primary key (meeting_id, user_id)
);
create index if not exists presences_user on presences (user_id);

-- Mural de avisos.
create table if not exists notices (
  id          text primary key default gen_random_uuid()::text,
  title       text not null,
  body        text not null default '',
  link_url    text,
  pinned      boolean not null default false,
  expires_on  date,                              -- some do mural depois deste dia
  created_by  text not null,
  created_at  timestamptz not null default now()
);

-- Dados iniciais.
insert into cycles (id, name) values ('ciclo-inicial', 'Pós-acampamento de novembro 2026') on conflict do nothing;
insert into places (id, name, address, is_default)
  values ('escola-hallel', 'Escola Hallel', 'Av. Vereador José Granzotte, 2379 - Franca/SP', true)
  on conflict do nothing;
