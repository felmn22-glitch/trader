import type { Trade, DayStats } from './types'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function calcPnl(trade: Pick<Trade, 'direction' | 'entryPrice' | 'exitPrice' | 'quantity' | 'stopLoss' | 'target'>) {
  const raw = trade.direction === 'LONG'
    ? (trade.exitPrice - trade.entryPrice) * trade.quantity
    : (trade.entryPrice - trade.exitPrice) * trade.quantity
  return Math.round(raw * 100) / 100
}

export function calcRiskReward(trade: Pick<Trade, 'entryPrice' | 'exitPrice' | 'stopLoss' | 'target' | 'direction'>) {
  const risk = Math.abs(trade.entryPrice - trade.stopLoss)
  const reward = Math.abs(trade.target - trade.entryPrice)
  if (risk === 0) return 0
  return Math.round((reward / risk) * 100) / 100
}

export function getResult(pnl: number): Trade['result'] {
  if (pnl > 0) return 'WIN'
  if (pnl < 0) return 'LOSS'
  return 'BREAKEVEN'
}

export function groupTradesByDay(trades: Trade[]): DayStats[] {
  const map = new Map<string, Trade[]>()
  for (const t of trades) {
    const key = t.date.slice(0, 10)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(t)
  }

  return Array.from(map.entries())
    .map(([date, dayTrades]) => {
      const totalPnl = dayTrades.reduce((s, t) => s + t.pnl, 0)
      const wins = dayTrades.filter((t) => t.result === 'WIN').length
      const losses = dayTrades.filter((t) => t.result === 'LOSS').length
      const breakevens = dayTrades.filter((t) => t.result === 'BREAKEVEN').length
      const pnls = dayTrades.map((t) => t.pnl)
      let running = 0
      let peak = 0
      let maxDD = 0
      for (const p of pnls) {
        running += p
        if (running > peak) peak = running
        const dd = peak - running
        if (dd > maxDD) maxDD = dd
      }
      return {
        date,
        totalPnl: Math.round(totalPnl * 100) / 100,
        trades: dayTrades.length,
        wins,
        losses,
        breakevens,
        winRate: dayTrades.length > 0 ? Math.round((wins / dayTrades.length) * 100) : 0,
        maxDrawdown: Math.round(maxDD * 100) / 100,
        bestTrade: Math.max(...pnls),
        worstTrade: Math.min(...pnls),
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function calcMetrics(trades: Trade[]) {
  if (!trades.length) return null
  const wins = trades.filter((t) => t.result === 'WIN')
  const losses = trades.filter((t) => t.result === 'LOSS')
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0)
  const avgWin = wins.length ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0
  const avgLoss = losses.length ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : 0
  const winRate = (wins.length / trades.length) * 100
  const profitFactor = losses.length && avgLoss !== 0 ? Math.abs(avgWin * wins.length) / Math.abs(avgLoss * losses.length) : 0

  let peak = 0
  let running = 0
  let maxDD = 0
  let curLoss = 0
  let maxConsLoss = 0
  for (const t of [...trades].sort((a, b) => a.date.localeCompare(b.date))) {
    running += t.pnl
    if (running > peak) peak = running
    const dd = peak - running
    if (dd > maxDD) maxDD = dd
    if (t.result === 'LOSS') { curLoss++; if (curLoss > maxConsLoss) maxConsLoss = curLoss }
    else curLoss = 0
  }

  const cumulativePnl: { date: string; pnl: number }[] = []
  let cum = 0
  for (const t of [...trades].sort((a, b) => a.date.localeCompare(b.date))) {
    cum += t.pnl
    cumulativePnl.push({ date: t.date.slice(0, 10), pnl: Math.round(cum * 100) / 100 })
  }

  return {
    totalPnl: Math.round(totalPnl * 100) / 100,
    totalTrades: trades.length,
    wins: wins.length,
    losses: losses.length,
    winRate: Math.round(winRate * 10) / 10,
    avgWin: Math.round(avgWin * 100) / 100,
    avgLoss: Math.round(avgLoss * 100) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    maxDrawdown: Math.round(maxDD * 100) / 100,
    maxConsecutiveLosses: maxConsLoss,
    expectancy: Math.round(((winRate / 100) * avgWin + (1 - winRate / 100) * avgLoss) * 100) / 100,
    cumulativePnl,
    followedPlanRate: Math.round((trades.filter((t) => t.followedPlan).length / trades.length) * 100),
  }
}

export function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export function formatDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy", { locale: ptBR })
  } catch {
    return dateStr
  }
}

export function today() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function calcPositionSize(accountSize: number, riskPercent: number, entryPrice: number, stopLoss: number) {
  const riskAmount = accountSize * (riskPercent / 100)
  const riskPerUnit = Math.abs(entryPrice - stopLoss)
  if (riskPerUnit === 0) return 0
  return Math.floor(riskAmount / riskPerUnit)
}
