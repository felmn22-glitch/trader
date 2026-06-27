export type Direction = 'LONG' | 'SHORT'
export type TradeResult = 'WIN' | 'LOSS' | 'BREAKEVEN'
export type EmotionalState = 'calm' | 'anxious' | 'confident' | 'frustrated' | 'fearful' | 'greedy'
export type MarketSession = 'pre-market' | 'opening' | 'mid-day' | 'closing' | 'after-hours'

export interface Trade {
  id: string
  date: string
  asset: string
  direction: Direction
  entryPrice: number
  exitPrice: number
  quantity: number
  stopLoss: number
  target: number
  result: TradeResult
  pnl: number
  pnlPercent: number
  riskReward: number
  setup: string
  session: MarketSession
  emotionalState: EmotionalState
  followedPlan: boolean
  notes: string
  tags: string[]
  screenshot?: string
  duration: number // minutes
}

export interface DayStats {
  date: string
  totalPnl: number
  trades: number
  wins: number
  losses: number
  breakevens: number
  winRate: number
  maxDrawdown: number
  bestTrade: number
  worstTrade: number
}

export interface Rule {
  id: string
  title: string
  description: string
  category: 'entry' | 'exit' | 'risk' | 'psychology' | 'routine'
  active: boolean
}

export interface JournalEntry {
  id: string
  date: string
  preMarket: {
    marketBias: 'bullish' | 'bearish' | 'neutral'
    keyLevels: string
    plan: string
    mentalState: EmotionalState
    sleepQuality: 1 | 2 | 3 | 4 | 5
  }
  postMarket: {
    summary: string
    lessons: string
    improvements: string
    followedRules: boolean
    overallRating: 1 | 2 | 3 | 4 | 5
  }
}

export interface RiskSettings {
  accountSize: number
  maxDailyLoss: number
  maxDailyLossPercent: number
  maxTradeRisk: number
  maxTradeRiskPercent: number
  maxPositions: number
  dailyTarget: number
  dailyTargetPercent: number
}

export interface AppState {
  trades: Trade[]
  journalEntries: JournalEntry[]
  rules: Rule[]
  riskSettings: RiskSettings
  addTrade: (trade: Omit<Trade, 'id'>) => Promise<void>
  updateTrade: (id: string, trade: Partial<Trade>) => Promise<void>
  deleteTrade: (id: string) => Promise<void>
  addJournalEntry: (entry: Omit<JournalEntry, 'id'>) => Promise<void>
  updateJournalEntry: (id: string, entry: Partial<JournalEntry>) => Promise<void>
  addRule: (rule: Omit<Rule, 'id'>) => Promise<void>
  toggleRule: (id: string) => Promise<void>
  deleteRule: (id: string) => Promise<void>
  updateRiskSettings: (settings: Partial<RiskSettings>) => Promise<void>
}
