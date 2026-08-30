-- Persistência mínima de atendimentos EmerIQ.
-- Acesso só via service role / chave server-side do Next.js.
-- Sem políticas para anon/authenticated: o PostgREST público não lê nem grava.

create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'active'
    check (status in ('active', 'finalized')),
  transcript text not null default '',
  clinical_state jsonb not null default '{}'::jsonb,
  soap jsonb,
  finalize_warning text
);

create index if not exists consultations_updated_at_idx
  on public.consultations (updated_at desc);

alter table public.consultations enable row level security;
