-- TraderPro Schema
-- Cole este SQL no SQL Editor do seu projeto Supabase (em uma única execução)

-- TABELA: trades
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  date text not null,
  asset text not null,
  direction text not null check (direction in ('LONG','SHORT')),
  entry_price numeric not null,
  exit_price numeric not null,
  quantity numeric not null,
  stop_loss numeric default 0,
  target numeric default 0,
  result text not null check (result in ('WIN','LOSS','BREAKEVEN')),
  pnl numeric not null,
  pnl_percent numeric default 0,
  risk_reward numeric default 0,
  setup text default '',
  session text default 'opening',
  emotional_state text default 'calm',
  followed_plan boolean default true,
  notes text default '',
  tags text[] default '{}',
  duration integer default 0,
  created_at timestamptz default now()
);

-- TABELA: journal_entries
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  date text not null,
  pre_market jsonb not null default '{}',
  post_market jsonb not null default '{}',
  created_at timestamptz default now()
);

-- TABELA: rules
create table if not exists public.rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  title text not null,
  description text default '',
  category text not null,
  active boolean default true,
  created_at timestamptz default now()
);

-- TABELA: risk_settings (uma por usuário)
create table if not exists public.risk_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique default auth.uid(),
  account_size numeric default 10000,
  max_daily_loss numeric default 300,
  max_daily_loss_percent numeric default 3,
  max_trade_risk numeric default 100,
  max_trade_risk_percent numeric default 1,
  max_positions integer default 2,
  daily_target numeric default 200,
  daily_target_percent numeric default 2,
  updated_at timestamptz default now()
);

-- ROW LEVEL SECURITY
alter table public.trades enable row level security;
alter table public.journal_entries enable row level security;
alter table public.rules enable row level security;
alter table public.risk_settings enable row level security;

create policy "trades: usuario proprio" on public.trades
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "journal: usuario proprio" on public.journal_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "rules: usuario proprio" on public.rules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "risk_settings: usuario proprio" on public.risk_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
