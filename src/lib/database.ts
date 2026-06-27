import { supabase } from './supabase'
import type { Trade, JournalEntry, Rule, RiskSettings } from '../types'

// ── Trades ──────────────────────────────────────────────────────────────────

export async function fetchTrades() {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .order('date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(dbToTrade)
}

export async function insertTrade(trade: Omit<Trade, 'id'>) {
  const { data, error } = await supabase
    .from('trades')
    .insert(tradeToDb(trade))
    .select()
    .single()
  if (error) throw error
  return dbToTrade(data)
}

export async function updateTradeDb(id: string, trade: Partial<Trade>) {
  const { error } = await supabase
    .from('trades')
    .update(partialTradeToDb(trade))
    .eq('id', id)
  if (error) throw error
}

export async function deleteTradeDb(id: string) {
  const { error } = await supabase.from('trades').delete().eq('id', id)
  if (error) throw error
}

// ── Journal ──────────────────────────────────────────────────────────────────

export async function fetchJournalEntries() {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .order('date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(dbToJournal)
}

export async function insertJournalEntry(entry: Omit<JournalEntry, 'id'>) {
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({ date: entry.date, pre_market: entry.preMarket, post_market: entry.postMarket })
    .select()
    .single()
  if (error) throw error
  return dbToJournal(data)
}

export async function updateJournalEntryDb(id: string, entry: Partial<JournalEntry>) {
  const updates: Record<string, unknown> = {}
  if (entry.date) updates.date = entry.date
  if (entry.preMarket) updates.pre_market = entry.preMarket
  if (entry.postMarket) updates.post_market = entry.postMarket
  const { error } = await supabase.from('journal_entries').update(updates).eq('id', id)
  if (error) throw error
}

// ── Rules ─────────────────────────────────────────────────────────────────────

export async function fetchRules() {
  const { data, error } = await supabase.from('rules').select('*').order('created_at')
  if (error) throw error
  return (data ?? []) as Rule[]
}

export async function insertRule(rule: Omit<Rule, 'id'>) {
  const { data, error } = await supabase.from('rules').insert(rule).select().single()
  if (error) throw error
  return data as Rule
}

export async function updateRuleDb(id: string, fields: Partial<Rule>) {
  const { error } = await supabase.from('rules').update(fields).eq('id', id)
  if (error) throw error
}

export async function deleteRuleDb(id: string) {
  const { error } = await supabase.from('rules').delete().eq('id', id)
  if (error) throw error
}

// ── Risk Settings ─────────────────────────────────────────────────────────────

export async function fetchRiskSettings(): Promise<RiskSettings | null> {
  const { data, error } = await supabase.from('risk_settings').select('*').maybeSingle()
  if (error) throw error
  return data ? dbToRisk(data) : null
}

export async function upsertRiskSettings(settings: RiskSettings) {
  const { error } = await supabase.from('risk_settings').upsert(riskToDb(settings))
  if (error) throw error
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function tradeToDb(t: Omit<Trade, 'id'>) {
  return {
    date: t.date,
    asset: t.asset,
    direction: t.direction,
    entry_price: t.entryPrice,
    exit_price: t.exitPrice,
    quantity: t.quantity,
    stop_loss: t.stopLoss,
    target: t.target,
    result: t.result,
    pnl: t.pnl,
    pnl_percent: t.pnlPercent,
    risk_reward: t.riskReward,
    setup: t.setup,
    session: t.session,
    emotional_state: t.emotionalState,
    followed_plan: t.followedPlan,
    notes: t.notes,
    tags: t.tags,
    duration: t.duration,
  }
}

function partialTradeToDb(t: Partial<Trade>) {
  const m: Record<string, unknown> = {}
  if (t.date !== undefined) m.date = t.date
  if (t.asset !== undefined) m.asset = t.asset
  if (t.direction !== undefined) m.direction = t.direction
  if (t.entryPrice !== undefined) m.entry_price = t.entryPrice
  if (t.exitPrice !== undefined) m.exit_price = t.exitPrice
  if (t.quantity !== undefined) m.quantity = t.quantity
  if (t.stopLoss !== undefined) m.stop_loss = t.stopLoss
  if (t.target !== undefined) m.target = t.target
  if (t.result !== undefined) m.result = t.result
  if (t.pnl !== undefined) m.pnl = t.pnl
  if (t.pnlPercent !== undefined) m.pnl_percent = t.pnlPercent
  if (t.riskReward !== undefined) m.risk_reward = t.riskReward
  if (t.setup !== undefined) m.setup = t.setup
  if (t.session !== undefined) m.session = t.session
  if (t.emotionalState !== undefined) m.emotional_state = t.emotionalState
  if (t.followedPlan !== undefined) m.followed_plan = t.followedPlan
  if (t.notes !== undefined) m.notes = t.notes
  if (t.tags !== undefined) m.tags = t.tags
  if (t.duration !== undefined) m.duration = t.duration
  return m
}

function dbToTrade(r: Record<string, unknown>): Trade {
  return {
    id: r.id as string,
    date: r.date as string,
    asset: r.asset as string,
    direction: r.direction as Trade['direction'],
    entryPrice: Number(r.entry_price),
    exitPrice: Number(r.exit_price),
    quantity: Number(r.quantity),
    stopLoss: Number(r.stop_loss),
    target: Number(r.target),
    result: r.result as Trade['result'],
    pnl: Number(r.pnl),
    pnlPercent: Number(r.pnl_percent),
    riskReward: Number(r.risk_reward),
    setup: r.setup as string,
    session: r.session as Trade['session'],
    emotionalState: r.emotional_state as Trade['emotionalState'],
    followedPlan: Boolean(r.followed_plan),
    notes: r.notes as string,
    tags: (r.tags as string[]) ?? [],
    duration: Number(r.duration),
  }
}

function dbToJournal(r: Record<string, unknown>): JournalEntry {
  return {
    id: r.id as string,
    date: r.date as string,
    preMarket: r.pre_market as JournalEntry['preMarket'],
    postMarket: r.post_market as JournalEntry['postMarket'],
  }
}

function riskToDb(s: RiskSettings) {
  return {
    account_size: s.accountSize,
    max_daily_loss: s.maxDailyLoss,
    max_daily_loss_percent: s.maxDailyLossPercent,
    max_trade_risk: s.maxTradeRisk,
    max_trade_risk_percent: s.maxTradeRiskPercent,
    max_positions: s.maxPositions,
    daily_target: s.dailyTarget,
    daily_target_percent: s.dailyTargetPercent,
  }
}

function dbToRisk(r: Record<string, unknown>): RiskSettings {
  return {
    accountSize: Number(r.account_size),
    maxDailyLoss: Number(r.max_daily_loss),
    maxDailyLossPercent: Number(r.max_daily_loss_percent),
    maxTradeRisk: Number(r.max_trade_risk),
    maxTradeRiskPercent: Number(r.max_trade_risk_percent),
    maxPositions: Number(r.max_positions),
    dailyTarget: Number(r.daily_target),
    dailyTargetPercent: Number(r.daily_target_percent),
  }
}
