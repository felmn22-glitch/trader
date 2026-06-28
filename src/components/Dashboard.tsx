import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Target, AlertTriangle, Award, BarChart2, Zap } from 'lucide-react'
import { useIsMobile } from '../hooks'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts'
import { useStore } from '../store'
import { calcMetrics, groupTradesByDay, formatCurrency } from '../utils'
import { format, subDays } from 'date-fns'

function StatCard({
  label, value, sub, color, icon: Icon
}: { label: string; value: string; sub?: string; color: string; icon: React.ElementType }) {
  return (
    <div className="rounded-xl p-5 flex flex-col gap-3" style={{ background: '#1a1d2e', border: '1px solid #1e2235' }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-widest" style={{ color: '#8892a4' }}>{label}</span>
        <div className="p-2 rounded-lg" style={{ background: `${color}20` }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color }}>{value}</p>
        {sub && <p className="text-xs mt-1" style={{ color: '#8892a4' }}>{sub}</p>}
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg p-3 text-sm" style={{ background: '#1e2235', border: '1px solid #2a2d3e' }}>
      <p style={{ color: '#8892a4' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

const sessionLabel: Record<string, string> = {
  'pre-market': 'Pré-mercado', opening: 'Abertura', 'mid-day': 'Meio-dia', closing: 'Fechamento', 'after-hours': 'After hours',
}

export function Dashboard({ setPage }: { setPage: (p: string) => void }) {
  const { trades, riskSettings, journalEntries } = useStore()
  const isMobile = useIsMobile()
  const metrics = useMemo(() => calcMetrics(trades), [trades])
  const dayStats = useMemo(() => groupTradesByDay(trades), [trades])

  const today = format(new Date(), 'yyyy-MM-dd')
  const todayTrades = trades.filter((t) => t.date.startsWith(today))
  const todayPnl = todayTrades.reduce((s, t) => s + t.pnl, 0)
  const todayWins = todayTrades.filter((t) => t.result === 'WIN').length
  const todayLosses = todayTrades.filter((t) => t.result === 'LOSS').length

  const dailyLimitHit = Math.abs(Math.min(todayPnl, 0)) >= riskSettings.maxDailyLoss
  const targetHit = todayPnl >= riskSettings.dailyTarget

  const last30 = useMemo(() => {
    const days = []
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
      const stat = dayStats.find((s) => s.date === d)
      days.push({ date: format(subDays(new Date(), i), 'dd/MM'), pnl: stat?.totalPnl ?? 0 })
    }
    return days
  }, [dayStats])

  const emotionWinRate = useMemo(() => {
    const map: Record<string, { wins: number; total: number }> = {}
    for (const t of trades) {
      if (!map[t.emotionalState]) map[t.emotionalState] = { wins: 0, total: 0 }
      map[t.emotionalState].total++
      if (t.result === 'WIN') map[t.emotionalState].wins++
    }
    return Object.entries(map).map(([emotion, { wins, total }]) => ({
      emotion,
      winRate: Math.round((wins / total) * 100),
    }))
  }, [trades])

  const assetPerf = useMemo(() => {
    const map: Record<string, { pnl: number; total: number; wins: number }> = {}
    for (const t of trades) {
      if (!map[t.asset]) map[t.asset] = { pnl: 0, total: 0, wins: 0 }
      map[t.asset].pnl += t.pnl
      map[t.asset].total++
      if (t.result === 'WIN') map[t.asset].wins++
    }
    return Object.entries(map)
      .map(([asset, { pnl, total, wins }]) => ({ asset, pnl: Math.round(pnl * 100) / 100, total, wr: Math.round((wins / total) * 100) }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 6)
  }, [trades])

  const sessionPerf = useMemo(() => {
    const map: Record<string, { wins: number; total: number }> = {}
    for (const t of trades) {
      const s = t.session || 'opening'
      if (!map[s]) map[s] = { wins: 0, total: 0 }
      map[s].total++
      if (t.result === 'WIN') map[s].wins++
    }
    return Object.entries(map)
      .map(([session, { wins, total }]) => ({ session: sessionLabel[session] || session, winRate: Math.round((wins / total) * 100), total }))
      .sort((a, b) => b.winRate - a.winRate)
  }, [trades])

  const sleepPerf = useMemo(() => {
    const map: Record<number, { wins: number; total: number }> = {}
    for (const entry of journalEntries) {
      const dayTrades = trades.filter(t => t.date.startsWith(entry.date))
      if (!dayTrades.length) continue
      const sleep = entry.preMarket.sleepQuality
      if (!map[sleep]) map[sleep] = { wins: 0, total: 0 }
      for (const t of dayTrades) {
        map[sleep].total++
        if (t.result === 'WIN') map[sleep].wins++
      }
    }
    return Object.entries(map)
      .map(([sleep, { wins, total }]) => ({ sleep: `${sleep}★`, winRate: Math.round((wins / total) * 100) }))
      .sort((a, b) => a.sleep.localeCompare(b.sleep))
  }, [trades, journalEntries])

  const setupPerf = useMemo(() => {
    const map: Record<string, { pnl: number; total: number; wins: number }> = {}
    for (const t of trades) {
      const s = t.setup || 'Sem setup'
      if (!map[s]) map[s] = { pnl: 0, total: 0, wins: 0 }
      map[s].pnl += t.pnl
      map[s].total++
      if (t.result === 'WIN') map[s].wins++
    }
    return Object.entries(map)
      .map(([setup, { pnl, total, wins }]) => ({ setup, pnl: Math.round(pnl * 100) / 100, total, wr: Math.round((wins / total) * 100) }))
      .sort((a, b) => b.wr - a.wr || b.total - a.total)
      .slice(0, 5)
  }, [trades])

  const durationStats = useMemo(() => {
    const withDur = trades.filter(t => t.duration != null && t.duration > 0)
    if (!withDur.length) return []
    const buckets = [
      { label: '<5min', min: 0, max: 5 },
      { label: '5–15min', min: 5, max: 15 },
      { label: '15–30min', min: 15, max: 30 },
      { label: '30–60min', min: 30, max: 60 },
      { label: '>60min', min: 60, max: Infinity },
    ]
    return buckets.map(({ label, min, max }) => {
      const b = withDur.filter(t => t.duration! >= min && t.duration! < max)
      const wins = b.filter(t => t.result === 'WIN').length
      return { label, total: b.length, wr: b.length ? Math.round((wins / b.length) * 100) : 0, pnl: Math.round(b.reduce((s, t) => s + t.pnl, 0) * 100) / 100 }
    }).filter(b => b.total > 0)
  }, [trades])

  if (!trades.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 24, padding: 40 }}>
        <div style={{ padding: 28, borderRadius: 24, background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.25)' }}>
          <BarChart2 size={52} color="#6c63ff" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 10px' }}>Bem-vindo ao TraderPro</h2>
          <p style={{ color: '#5a6280', fontSize: 15 }}>Comece registrando sua primeira operação para ver o dashboard</p>
        </div>
        <button
          onClick={() => setPage('trades')}
          style={{ padding: '13px 28px', borderRadius: 12, fontWeight: 600, fontSize: 15, color: '#fff', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', boxShadow: '0 4px 20px rgba(108,99,255,0.35)' }}
        >
          Registrar Primeira Operação
        </button>
      </div>
    )
  }

  const pad = isMobile ? '12px 14px 80px' : '20px 28px 28px'

  return (
    <div style={{ padding: pad }} className="space-y-5">
      {/* Alerts */}
      {(dailyLimitHit || targetHit) && (
        <div className="flex gap-3">
          {dailyLimitHit && (
            <div className="flex-1 flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)' }}>
              <AlertTriangle size={20} color="#ff4d4d" />
              <div>
                <p className="font-semibold text-sm" style={{ color: '#ff4d4d' }}>Limite de Perda Diária Atingido</p>
                <p className="text-xs" style={{ color: '#8892a4' }}>Pare de operar hoje. Proteja seu capital.</p>
              </div>
            </div>
          )}
          {targetHit && (
            <div className="flex-1 flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(0,208,132,0.1)', border: '1px solid rgba(0,208,132,0.3)' }}>
              <Award size={20} color="#00d084" />
              <div>
                <p className="font-semibold text-sm" style={{ color: '#00d084' }}>Meta Diária Atingida!</p>
                <p className="text-xs" style={{ color: '#8892a4' }}>Parabéns! Considere encerrar as operações.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Today quick stats */}
      <div className="rounded-xl p-5" style={{ background: '#1a1d2e', border: '1px solid #1e2235' }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#8892a4' }}>Hoje</p>
        <div className="flex gap-6 flex-wrap">
          <div>
            <p className="text-3xl font-bold" style={{ color: todayPnl >= 0 ? '#00d084' : '#ff4d4d' }}>
              {formatCurrency(todayPnl)}
            </p>
            <p className="text-xs mt-1" style={{ color: '#8892a4' }}>P&L do dia</p>
          </div>
          <div className="w-px" style={{ background: '#1e2235' }} />
          <div><p className="text-2xl font-bold text-white">{todayTrades.length}</p><p className="text-xs" style={{ color: '#8892a4' }}>Operações</p></div>
          <div><p className="text-2xl font-bold" style={{ color: '#00d084' }}>{todayWins}</p><p className="text-xs" style={{ color: '#8892a4' }}>Ganhos</p></div>
          <div><p className="text-2xl font-bold" style={{ color: '#ff4d4d' }}>{todayLosses}</p><p className="text-xs" style={{ color: '#8892a4' }}>Perdas</p></div>
          <div className="ml-auto flex flex-col justify-end">
            <div className="flex gap-2">
              <div className="text-right">
                <p className="text-xs" style={{ color: '#8892a4' }}>Meta</p>
                <p className="text-sm font-semibold" style={{ color: '#6c63ff' }}>{formatCurrency(riskSettings.dailyTarget)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: '#8892a4' }}>Limite</p>
                <p className="text-sm font-semibold" style={{ color: '#ff4d4d' }}>{formatCurrency(-riskSettings.maxDailyLoss)}</p>
              </div>
            </div>
            <div className="mt-2 h-2 rounded-full" style={{ background: '#12141f', width: 200 }}>
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${riskSettings.dailyTarget > 0 ? Math.min(100, Math.max(0, (todayPnl / riskSettings.dailyTarget) * 100)) : 0}%`,
                  background: todayPnl >= 0 ? 'linear-gradient(90deg,#6c63ff,#00d084)' : '#ff4d4d',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="P&L Total" value={formatCurrency(metrics!.totalPnl)} color={metrics!.totalPnl >= 0 ? '#00d084' : '#ff4d4d'} icon={metrics!.totalPnl >= 0 ? TrendingUp : TrendingDown} sub={`${metrics!.totalTrades} operações`} />
        <StatCard label="Win Rate" value={`${metrics!.winRate}%`} color="#6c63ff" icon={Target} sub={`${metrics!.wins}W / ${metrics!.losses}L`} />
        <StatCard label="Profit Factor" value={metrics!.profitFactor.toFixed(2)} color="#ffd700" icon={Zap} sub="Acima de 1.5 é bom" />
        <StatCard label="Expectativa" value={formatCurrency(metrics!.expectancy)} color={metrics!.expectancy >= 0 ? '#00d084' : '#ff4d4d'} icon={BarChart2} sub="Por operação" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cumulative PnL */}
        <div className="lg:col-span-2 rounded-xl p-5" style={{ background: '#1a1d2e', border: '1px solid #1e2235' }}>
          <p className="text-sm font-semibold mb-4 text-white">Curva de Capital</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={metrics!.cumulativePnl}>
              <defs>
                <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e2235" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: '#8892a4', fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fill: '#8892a4', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="pnl" stroke="#6c63ff" strokeWidth={2} fill="url(#pnlGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Emotion Win Rate */}
        <div className="rounded-xl p-5" style={{ background: '#1a1d2e', border: '1px solid #1e2235' }}>
          <p className="text-sm font-semibold mb-4 text-white">Win Rate por Emoção</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={emotionWinRate} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#8892a4', fontSize: 10 }} tickLine={false} />
              <YAxis dataKey="emotion" type="category" tick={{ fill: '#8892a4', fontSize: 10 }} tickLine={false} axisLine={false} width={70} />
              <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: '#1e2235', border: '1px solid #2a2d3e' }} labelStyle={{ color: '#8892a4' }} itemStyle={{ color: '#a78bfa' }} />
              <Bar dataKey="winRate" radius={[0, 4, 4, 0]}>
                {emotionWinRate.map((e, i) => (
                  <Cell key={i} fill={e.winRate >= 60 ? '#00d084' : e.winRate >= 40 ? '#ffd700' : '#ff4d4d'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Last 30 days + Setup perf */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl p-5" style={{ background: '#1a1d2e', border: '1px solid #1e2235' }}>
          <p className="text-sm font-semibold mb-4 text-white">P&L Últimos 30 Dias</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={last30}>
              <CartesianGrid stroke="#1e2235" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#8892a4', fontSize: 9 }} tickLine={false} interval={4} />
              <YAxis tick={{ fill: '#8892a4', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {last30.map((d, i) => (
                  <Cell key={i} fill={d.pnl >= 0 ? '#00d084' : '#ff4d4d'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl p-5" style={{ background: '#1a1d2e', border: '1px solid #1e2235' }}>
          <p className="text-sm font-semibold mb-4 text-white">Top Setups</p>
          <div className="space-y-3">
            {setupPerf.length === 0 && <p className="text-xs" style={{ color: '#8892a4' }}>Nenhum setup registrado</p>}
            {setupPerf.map((s) => (
              <div key={s.setup} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{s.setup}</p>
                  <p className="text-xs" style={{ color: '#8892a4' }}>{s.total} ops · <span style={{ color: s.wr >= 60 ? '#00d084' : s.wr >= 40 ? '#ffd700' : '#ff4d4d' }}>{s.wr}% WR</span></p>
                </div>
                <span className="text-sm font-bold" style={{ color: s.pnl >= 0 ? '#00d084' : '#ff4d4d', whiteSpace: 'nowrap' }}>
                  {formatCurrency(s.pnl)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Follow plan rate */}
      <div className="rounded-xl p-5 flex items-center gap-6" style={{ background: '#1a1d2e', border: '1px solid #1e2235' }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#8892a4' }}>Disciplina</p>
          <p className="text-4xl font-bold mt-1" style={{ color: metrics!.followedPlanRate >= 80 ? '#00d084' : metrics!.followedPlanRate >= 60 ? '#ffd700' : '#ff4d4d' }}>
            {metrics!.followedPlanRate}%
          </p>
          <p className="text-xs mt-1" style={{ color: '#8892a4' }}>das operações seguiram o plano</p>
        </div>
        <div className="flex-1">
          <div className="h-3 rounded-full" style={{ background: '#12141f' }}>
            <div
              className="h-3 rounded-full transition-all"
              style={{
                width: `${metrics!.followedPlanRate}%`,
                background: metrics!.followedPlanRate >= 80 ? 'linear-gradient(90deg,#6c63ff,#00d084)' : metrics!.followedPlanRate >= 60 ? '#ffd700' : '#ff4d4d',
              }}
            />
          </div>
          <p className="text-xs mt-2" style={{ color: '#8892a4' }}>
            {metrics!.followedPlanRate >= 80 ? 'Excelente disciplina! Mantenha assim.' : metrics!.followedPlanRate >= 60 ? 'Bom, mas pode melhorar. Revise suas regras.' : 'Atenção: falta de disciplina afeta os resultados.'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs" style={{ color: '#8892a4' }}>Max Drawdown</p>
          <p className="text-xl font-bold" style={{ color: '#ff4d4d' }}>{formatCurrency(metrics!.maxDrawdown)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs" style={{ color: '#8892a4' }}>Média Ganho</p>
          <p className="text-xl font-bold" style={{ color: '#00d084' }}>{formatCurrency(metrics!.avgWin)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs" style={{ color: '#8892a4' }}>Média Perda</p>
          <p className="text-xl font-bold" style={{ color: '#ff4d4d' }}>{formatCurrency(metrics!.avgLoss)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs" style={{ color: '#8892a4' }}>Perdas Consec.</p>
          <p className="text-xl font-bold" style={{ color: metrics!.maxConsecutiveLosses >= 5 ? '#ff4d4d' : metrics!.maxConsecutiveLosses >= 3 ? '#ffd700' : '#8892a4' }}>{metrics!.maxConsecutiveLosses}</p>
        </div>
      </div>

      {/* Asset performance + Session win rate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ background: '#1a1d2e', border: '1px solid #1e2235' }}>
          <p className="text-sm font-semibold mb-4 text-white">Desempenho por Ativo</p>
          {assetPerf.length === 0 ? (
            <p className="text-xs" style={{ color: '#8892a4' }}>Nenhum dado disponível</p>
          ) : (
            <div className="space-y-3">
              {assetPerf.map((a) => (
                <div key={a.asset} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-white" style={{ minWidth: 56, fontFamily: 'monospace' }}>{a.asset}</span>
                  <div className="flex-1 h-2 rounded-full" style={{ background: '#12141f' }}>
                    <div className="h-2 rounded-full" style={{ width: `${a.wr}%`, background: a.pnl >= 0 ? 'linear-gradient(90deg,#6c63ff,#00d084)' : '#ff4d4d' }} />
                  </div>
                  <span className="text-xs" style={{ color: '#4a5170', minWidth: 40, textAlign: 'right' }}>{a.wr}% WR</span>
                  <span className="text-sm font-bold" style={{ color: a.pnl >= 0 ? '#00d084' : '#ff4d4d', minWidth: 80, textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(a.pnl)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl p-5" style={{ background: '#1a1d2e', border: '1px solid #1e2235' }}>
          <p className="text-sm font-semibold mb-4 text-white">Win Rate por Sessão</p>
          {sessionPerf.length === 0 ? (
            <p className="text-xs" style={{ color: '#8892a4' }}>Nenhum dado disponível</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={sessionPerf} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#8892a4', fontSize: 10 }} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <YAxis dataKey="session" type="category" tick={{ fill: '#8892a4', fontSize: 10 }} tickLine={false} axisLine={false} width={90} />
                <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: '#1e2235', border: '1px solid #2a2d3e' }} labelStyle={{ color: '#8892a4' }} itemStyle={{ color: '#a78bfa' }} />
                <Bar dataKey="winRate" radius={[0, 4, 4, 0]}>
                  {sessionPerf.map((s, i) => (
                    <Cell key={i} fill={s.winRate >= 60 ? '#00d084' : s.winRate >= 40 ? '#ffd700' : '#ff4d4d'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Duration analysis (only when trades have duration recorded) */}
      {durationStats.length >= 2 && (
        <div className="rounded-xl p-5" style={{ background: '#1a1d2e', border: '1px solid #1e2235' }}>
          <p className="text-sm font-semibold mb-1 text-white">Desempenho por Duração</p>
          <p className="text-xs mb-4" style={{ color: '#4a5170' }}>Win rate e P&L total por tempo médio de permanência na operação</p>
          <div className="space-y-3">
            {durationStats.map((d) => (
              <div key={d.label} className="flex items-center gap-3">
                <span className="text-xs font-bold" style={{ color: '#8892a4', minWidth: 56 }}>{d.label}</span>
                <div className="flex-1 h-2 rounded-full" style={{ background: '#12141f' }}>
                  <div className="h-2 rounded-full" style={{ width: `${d.wr}%`, background: d.pnl >= 0 ? 'linear-gradient(90deg,#6c63ff,#00d084)' : '#ff4d4d' }} />
                </div>
                <span className="text-xs" style={{ color: '#4a5170', minWidth: 42, textAlign: 'right' }}>{d.wr}% WR</span>
                <span className="text-xs" style={{ color: '#4a5170', minWidth: 28, textAlign: 'right' }}>{d.total} ops</span>
                <span className="text-sm font-bold" style={{ color: d.pnl >= 0 ? '#00d084' : '#ff4d4d', minWidth: 80, textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(d.pnl)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sleep × Win Rate (only shown when journal data exists) */}
      {sleepPerf.length >= 2 && (
        <div className="rounded-xl p-5" style={{ background: '#1a1d2e', border: '1px solid #1e2235' }}>
          <p className="text-sm font-semibold mb-1 text-white">Sono × Win Rate</p>
          <p className="text-xs mb-4" style={{ color: '#4a5170' }}>Correlação entre qualidade do sono (diário) e win rate nas operações do dia</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={sleepPerf}>
              <CartesianGrid stroke="#1e2235" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="sleep" tick={{ fill: '#8892a4', fontSize: 11 }} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#8892a4', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: '#1e2235', border: '1px solid #2a2d3e' }} labelStyle={{ color: '#8892a4' }} itemStyle={{ color: '#6c63ff' }} />
              <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                {sleepPerf.map((s, i) => (
                  <Cell key={i} fill={s.winRate >= 60 ? '#00d084' : s.winRate >= 40 ? '#ffd700' : '#ff4d4d'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
