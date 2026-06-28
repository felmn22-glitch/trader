import { create } from 'zustand'
import type { AppState, Rule, RiskSettings } from './types'
import {
  fetchTrades, insertTrade, updateTradeDb, deleteTradeDb,
  fetchJournalEntries, insertJournalEntry, updateJournalEntryDb,
  fetchRules, insertRule, updateRuleDb, deleteRuleDb,
  fetchRiskSettings, upsertRiskSettings,
} from './lib/database'

const defaultRules: Omit<Rule, 'id'>[] = [
  { title: 'Nunca arriscar mais de 1% por trade', description: 'Proteger o capital é a prioridade número 1', category: 'risk', active: true },
  { title: 'Sempre definir stop loss antes de entrar', description: 'Sem stop definido = sem entrada', category: 'entry', active: true },
  { title: 'Não operar nas primeiras 15 min', description: 'Deixar o mercado mostrar direção', category: 'routine', active: true },
  { title: 'Parar após 2 perdas seguidas', description: 'Evitar revenge trading', category: 'psychology', active: true },
  { title: 'Não entrar sem setup confirmado', description: 'Aguardar confirmação do setup', category: 'entry', active: true },
  { title: 'Proteger lucro acima de 1:1', description: 'Mover stop para breakeven ao atingir R:R 1:1', category: 'exit', active: true },
  { title: 'Parar ao atingir meta diária', description: 'Não ser ganancioso. Meta batida = acabou.', category: 'psychology', active: true },
  { title: 'Revisar o plano antes de operar', description: 'Ler o plano do dia toda manhã', category: 'routine', active: true },
]

const defaultRiskSettings: RiskSettings = {
  accountSize: 10000,
  maxDailyLoss: 300,
  maxDailyLossPercent: 3,
  maxTradeRisk: 100,
  maxTradeRiskPercent: 1,
  maxPositions: 2,
  dailyTarget: 200,
  dailyTargetPercent: 2,
  accountType: 'proprio',
  propFirmSplit: 80,
}

interface StoreState extends AppState {
  loading: boolean
  loadData: () => Promise<void>
}

export const useStore = create<StoreState>((set, get) => ({
  trades: [],
  journalEntries: [],
  rules: [],
  riskSettings: defaultRiskSettings,
  loading: true,

  loadData: async () => {
    set({ loading: true })
    try {
      const [trades, journalEntries, rules, riskSettings] = await Promise.all([
        fetchTrades(),
        fetchJournalEntries(),
        fetchRules(),
        fetchRiskSettings(),
      ])

      // Seed default rules if none exist
      let finalRules = rules
      if (rules.length === 0) {
        const inserted = await Promise.all(defaultRules.map((r) => insertRule(r)))
        finalRules = inserted
      }

      set({
        trades,
        journalEntries,
        rules: finalRules,
        riskSettings: riskSettings ?? defaultRiskSettings,
        loading: false,
      })
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      set({ loading: false })
    }
  },

  addTrade: async (trade) => {
    const saved = await insertTrade(trade)
    set((s) => ({ trades: [saved, ...s.trades] }))
  },

  updateTrade: async (id, updated) => {
    const prev = get().trades
    set((s) => ({ trades: s.trades.map((t) => (t.id === id ? { ...t, ...updated } : t)) }))
    try {
      await updateTradeDb(id, updated)
    } catch (err) {
      set({ trades: prev })
      console.error('Erro ao atualizar trade:', err)
    }
  },

  deleteTrade: async (id) => {
    const prev = get().trades
    set((s) => ({ trades: s.trades.filter((t) => t.id !== id) }))
    try {
      await deleteTradeDb(id)
    } catch (err) {
      set({ trades: prev })
      console.error('Erro ao deletar trade:', err)
    }
  },

  addJournalEntry: async (entry) => {
    const saved = await insertJournalEntry(entry)
    set((s) => ({ journalEntries: [saved, ...s.journalEntries] }))
  },

  updateJournalEntry: async (id, updated) => {
    const prev = get().journalEntries
    set((s) => ({
      journalEntries: s.journalEntries.map((e) => (e.id === id ? { ...e, ...updated } : e)),
    }))
    try {
      await updateJournalEntryDb(id, updated)
    } catch (err) {
      set({ journalEntries: prev })
      console.error('Erro ao atualizar journal:', err)
    }
  },

  addRule: async (rule) => {
    const saved = await insertRule(rule)
    set((s) => ({ rules: [...s.rules, saved] }))
  },

  toggleRule: async (id) => {
    const rule = get().rules.find((r) => r.id === id)
    if (!rule) return
    const prev = get().rules
    const active = !rule.active
    set((s) => ({ rules: s.rules.map((r) => (r.id === id ? { ...r, active } : r)) }))
    try {
      await updateRuleDb(id, { active })
    } catch (err) {
      set({ rules: prev })
      console.error('Erro ao atualizar regra:', err)
    }
  },

  deleteRule: async (id) => {
    const prev = get().rules
    set((s) => ({ rules: s.rules.filter((r) => r.id !== id) }))
    try {
      await deleteRuleDb(id)
    } catch (err) {
      set({ rules: prev })
      console.error('Erro ao deletar regra:', err)
    }
  },

  updateRiskSettings: async (settings) => {
    const prev = get().riskSettings
    const next = { ...prev, ...settings }
    set({ riskSettings: next })
    try {
      await upsertRiskSettings(next)
    } catch (err) {
      set({ riskSettings: prev })
      console.error('Erro ao salvar configurações de risco:', err)
    }
  },
}))
