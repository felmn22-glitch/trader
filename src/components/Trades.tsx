import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Search, ChevronUp, ChevronDown } from 'lucide-react'
import { useStore } from '../store'
import { TradeForm } from './TradeForm'
import { formatCurrency, formatDate } from '../utils'
import type { Trade } from '../types'

const emotionLabel: Record<string, string> = {
  calm: 'Calmo', confident: 'Confiante', anxious: 'Ansioso',
  frustrated: 'Frustrado', fearful: 'Com medo', greedy: 'Ganancioso',
}

export function Trades() {
  const { trades, deleteTrade } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Trade | undefined>()
  const [search, setSearch] = useState('')
  const [filterResult, setFilterResult] = useState<string>('all')
  const [sortKey, setSortKey] = useState<keyof Trade>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const filtered = useMemo(() => {
    let list = [...trades]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((t) => t.asset.toLowerCase().includes(q) || t.setup?.toLowerCase().includes(q) || t.notes?.toLowerCase().includes(q))
    }
    if (filterResult !== 'all') list = list.filter((t) => t.result === filterResult)
    list.sort((a, b) => {
      const av = a[sortKey] as string | number
      const bv = b[sortKey] as string | number
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })
    return list
  }, [trades, search, filterResult, sortKey, sortDir])

  function sort(key: keyof Trade) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  function SortIcon({ k }: { k: keyof Trade }) {
    if (sortKey !== k) return <span style={{ color: '#3a3d5e' }}><ChevronUp size={12} /></span>
    return sortDir === 'asc' ? <ChevronUp size={12} color="#6c63ff" /> : <ChevronDown size={12} color="#6c63ff" />
  }

  const totalPnl = filtered.reduce((s, t) => s + t.pnl, 0)
  const wins = filtered.filter((t) => t.result === 'WIN').length
  const wr = filtered.length ? Math.round((wins / filtered.length) * 100) : 0

  return (
    <div className="p-6 space-y-5">
      {(showForm || editing) && (
        <TradeForm trade={editing} onClose={() => { setShowForm(false); setEditing(undefined) }} />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Operações</h1>
          <p className="text-sm mt-1" style={{ color: '#8892a4' }}>{trades.length} operações registradas</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#6c63ff,#a78bfa)' }}
        >
          <Plus size={16} /> Nova Operação
        </button>
      </div>

      {/* Summary bar */}
      {filtered.length > 0 && (
        <div className="flex gap-6 p-4 rounded-xl" style={{ background: '#1a1d2e', border: '1px solid #1e2235' }}>
          <div><p className="text-xs" style={{ color: '#8892a4' }}>Resultado Filtrado</p><p className="font-bold text-lg" style={{ color: totalPnl >= 0 ? '#00d084' : '#ff4d4d' }}>{formatCurrency(totalPnl)}</p></div>
          <div><p className="text-xs" style={{ color: '#8892a4' }}>Operações</p><p className="font-bold text-lg text-white">{filtered.length}</p></div>
          <div><p className="text-xs" style={{ color: '#8892a4' }}>Win Rate</p><p className="font-bold text-lg" style={{ color: '#6c63ff' }}>{wr}%</p></div>
          <div><p className="text-xs" style={{ color: '#8892a4' }}>Ganhos / Perdas</p><p className="font-bold text-lg text-white">{wins} / {filtered.filter((t) => t.result === 'LOSS').length}</p></div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 min-w-48" style={{ background: '#1a1d2e', border: '1px solid #1e2235' }}>
          <Search size={14} color="#8892a4" />
          <input
            className="bg-transparent text-sm text-white outline-none w-full"
            placeholder="Buscar por ativo, setup, notas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'WIN', 'LOSS', 'BREAKEVEN'].map((r) => (
            <button
              key={r}
              onClick={() => setFilterResult(r)}
              className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: filterResult === r ? 'rgba(108,99,255,0.2)' : '#1a1d2e',
                border: `1px solid ${filterResult === r ? '#6c63ff' : '#1e2235'}`,
                color: filterResult === r ? '#a78bfa' : '#8892a4',
              }}
            >
              {r === 'all' ? 'Todos' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: '#8892a4' }}>
          <p className="text-lg mb-2">Nenhuma operação encontrada</p>
          <p className="text-sm">Registre sua primeira operação clicando em "Nova Operação"</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1e2235' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#12141f', borderBottom: '1px solid #1e2235' }}>
                  {[
                    { key: 'date', label: 'Data' },
                    { key: 'asset', label: 'Ativo' },
                    { key: 'direction', label: 'Dir.' },
                    { key: 'entryPrice', label: 'Entrada' },
                    { key: 'exitPrice', label: 'Saída' },
                    { key: 'quantity', label: 'Qtd' },
                    { key: 'riskReward', label: 'R:R' },
                    { key: 'pnl', label: 'P&L' },
                    { key: 'result', label: 'Resultado' },
                    { key: 'setup', label: 'Setup' },
                    { key: 'emotionalState', label: 'Emoção' },
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      className="px-4 py-3 text-left cursor-pointer select-none"
                      style={{ color: '#8892a4', fontWeight: 500 }}
                      onClick={() => sort(key as keyof Trade)}
                    >
                      <span className="flex items-center gap-1">{label}<SortIcon k={key as keyof Trade} /></span>
                    </th>
                  ))}
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <tr
                    key={t.id}
                    className="transition-colors hover:bg-white/2"
                    style={{ background: i % 2 === 0 ? '#1a1d2e' : '#1c1f31', borderBottom: '1px solid #1e2235' }}
                  >
                    <td className="px-4 py-3 text-white">{formatDate(t.date)}</td>
                    <td className="px-4 py-3 font-bold text-white">{t.asset}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: t.direction === 'LONG' ? 'rgba(0,208,132,0.15)' : 'rgba(255,77,77,0.15)', color: t.direction === 'LONG' ? '#00d084' : '#ff4d4d' }}>
                        {t.direction}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: '#e8eaf0' }}>{t.entryPrice.toFixed(2)}</td>
                    <td className="px-4 py-3" style={{ color: '#e8eaf0' }}>{t.exitPrice.toFixed(2)}</td>
                    <td className="px-4 py-3" style={{ color: '#e8eaf0' }}>{t.quantity}</td>
                    <td className="px-4 py-3" style={{ color: t.riskReward >= 2 ? '#00d084' : t.riskReward >= 1 ? '#ffd700' : '#8892a4' }}>
                      {t.riskReward > 0 ? `1:${t.riskReward}` : '-'}
                    </td>
                    <td className="px-4 py-3 font-bold" style={{ color: t.pnl >= 0 ? '#00d084' : '#ff4d4d' }}>
                      {t.pnl >= 0 ? '+' : ''}{formatCurrency(t.pnl)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold"
                        style={{
                          background: t.result === 'WIN' ? 'rgba(0,208,132,0.15)' : t.result === 'LOSS' ? 'rgba(255,77,77,0.15)' : 'rgba(255,215,0,0.15)',
                          color: t.result === 'WIN' ? '#00d084' : t.result === 'LOSS' ? '#ff4d4d' : '#ffd700',
                        }}
                      >
                        {t.result === 'WIN' ? 'GANHO' : t.result === 'LOSS' ? 'PERDA' : 'EMPATE'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#8892a4' }}>{t.setup || '-'}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#8892a4' }}>{emotionLabel[t.emotionalState] || t.emotionalState}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setEditing(t)} className="p-1.5 rounded hover:bg-white/5 transition-colors"><Pencil size={14} color="#6c63ff" /></button>
                        <button onClick={() => { if (confirm('Excluir esta operação?')) deleteTrade(t.id) }} className="p-1.5 rounded hover:bg-white/5 transition-colors"><Trash2 size={14} color="#ff4d4d" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
