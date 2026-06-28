import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Search, ChevronUp, ChevronDown, Download, ShieldAlert, ShieldOff } from 'lucide-react'
import { useStore } from '../store'
import { TradeForm } from './TradeForm'
import { formatCurrency, formatDate } from '../utils'
import { useIsMobile } from '../hooks'
import type { Trade } from '../types'

const emotionLabel: Record<string, string> = {
  calm: 'Calmo', confident: 'Confiante', anxious: 'Ansioso',
  frustrated: 'Frustrado', fearful: 'Com medo', greedy: 'Ganancioso',
}

function resultBadge(result: string) {
  const map = {
    WIN: { label: 'GANHO', bg: 'rgba(0,208,132,0.15)', color: '#00d084' },
    LOSS: { label: 'PERDA', bg: 'rgba(255,77,77,0.15)', color: '#ff4d4d' },
    BREAKEVEN: { label: 'EMPATE', bg: 'rgba(255,215,0,0.15)', color: '#ffd700' },
  } as Record<string, { label: string; bg: string; color: string }>
  const r = map[result] ?? { label: result, bg: '#1e2235', color: '#8892a4' }
  return (
    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: r.bg, color: r.color, whiteSpace: 'nowrap' }}>
      {r.label}
    </span>
  )
}

function dirBadge(dir: string) {
  const isLong = dir === 'LONG'
  return (
    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: isLong ? 'rgba(0,208,132,0.15)' : 'rgba(255,77,77,0.15)', color: isLong ? '#00d084' : '#ff4d4d', whiteSpace: 'nowrap' }}>
      {isLong ? '▲ L' : '▼ S'}
    </span>
  )
}

function exportCSV(trades: Trade[]) {
  const headers = ['Data', 'Ativo', 'Direção', 'Entrada', 'Saída', 'Qtd', 'P&L', 'Resultado', 'Setup', 'Emoção', 'Notas']
  const rows = trades.map(t => [
    t.date.slice(0, 10), t.asset, t.direction,
    t.entryPrice.toFixed(2), t.exitPrice.toFixed(2), t.quantity,
    t.pnl.toFixed(2), t.result, t.setup || '',
    emotionLabel[t.emotionalState] || t.emotionalState,
    (t.notes || '').replace(/,/g, ';'),
  ])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `trades-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
  URL.revokeObjectURL(url)
}

function formatMonth(ym: string) {
  const [y, m] = ym.split('-')
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${months[parseInt(m) - 1]}/${y.slice(2)}`
}

export function Trades() {
  const { trades, deleteTrade, riskSettings } = useStore()
  const isMobile = useIsMobile()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Trade | undefined>()
  const [search, setSearch] = useState('')
  const [filterResult, setFilterResult] = useState('all')
  const [filterMonth, setFilterMonth] = useState('all')
  const [sortKey, setSortKey] = useState<keyof Trade>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [overrideProtection, setOverrideProtection] = useState(false)
  const [filterTag, setFilterTag] = useState('all')

  const todayStr = new Date().toISOString().slice(0, 10)
  const todayPnl = useMemo(() => trades.filter(t => t.date.startsWith(todayStr)).reduce((s, t) => s + t.pnl, 0), [trades, todayStr])
  const dailyLimitHit = riskSettings.maxDailyLoss > 0 && todayPnl <= -riskSettings.maxDailyLoss
  const targetHit = riskSettings.dailyTarget > 0 && todayPnl >= riskSettings.dailyTarget
  const isBlocked = (dailyLimitHit || targetHit) && !overrideProtection

  const months = useMemo(() =>
    [...new Set(trades.map(t => t.date.slice(0, 7)))].sort().reverse(), [trades])

  const allTags = useMemo(() => {
    const s = new Set<string>()
    for (const t of trades) for (const tag of (t.tags ?? [])) s.add(tag)
    return [...s].sort()
  }, [trades])

  const filtered = useMemo(() => {
    let list = [...trades]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(t => t.asset.toLowerCase().includes(q) || t.setup?.toLowerCase().includes(q) || t.notes?.toLowerCase().includes(q))
    }
    if (filterResult !== 'all') list = list.filter(t => t.result === filterResult)
    if (filterMonth !== 'all') list = list.filter(t => t.date.startsWith(filterMonth))
    if (filterTag !== 'all') list = list.filter(t => t.tags?.includes(filterTag))
    list.sort((a, b) => {
      const av = a[sortKey] as string | number
      const bv = b[sortKey] as string | number
      if (av === bv) return 0
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })
    return list
  }, [trades, search, filterResult, filterMonth, filterTag, sortKey, sortDir])

  function sort(key: keyof Trade) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const totalPnl = filtered.reduce((s, t) => s + t.pnl, 0)
  const wins = filtered.filter(t => t.result === 'WIN').length
  const losses = filtered.filter(t => t.result === 'LOSS').length
  const wr = filtered.length ? Math.round((wins / filtered.length) * 100) : 0

  const pad = isMobile ? '12px 14px 80px' : '20px 28px 28px'

  const btnStyle = {
    display: 'flex', alignItems: 'center', gap: 6, padding: isMobile ? '8px 14px' : '9px 18px',
    borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    color: '#fff', background: 'linear-gradient(135deg,#6c63ff,#a78bfa)',
    boxShadow: '0 4px 14px rgba(108,99,255,0.3)', whiteSpace: 'nowrap' as const,
  }

  return (
    <div style={{ padding: pad, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {(showForm || editing) && (
        <TradeForm trade={editing} onClose={() => { setShowForm(false); setEditing(undefined) }} />
      )}

      {/* Protection Mode Banner */}
      {(dailyLimitHit || targetHit) && (
        <div style={{ padding: '14px 18px', borderRadius: 14, background: overrideProtection ? 'rgba(74,81,112,0.2)' : (dailyLimitHit ? 'rgba(255,77,77,0.08)' : 'rgba(0,208,132,0.08)'), border: `1px solid ${overrideProtection ? '#2a2d3e' : (dailyLimitHit ? 'rgba(255,77,77,0.3)' : 'rgba(0,208,132,0.3)')}`, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <ShieldAlert size={22} color={overrideProtection ? '#4a5170' : (dailyLimitHit ? '#ff4d4d' : '#00d084')} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: overrideProtection ? '#4a5170' : (dailyLimitHit ? '#ff6b6b' : '#00d084') }}>
              {dailyLimitHit ? 'Limite de perda diária atingido' : 'Meta diária atingida'} — Modo Proteção {overrideProtection ? 'desativado' : 'ativo'}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#4a5170' }}>
              {dailyLimitHit ? `P&L hoje: ${formatCurrency(todayPnl)} · Limite: −${formatCurrency(riskSettings.maxDailyLoss)}` : `P&L hoje: +${formatCurrency(todayPnl)} · Meta: ${formatCurrency(riskSettings.dailyTarget)}`}
            </p>
          </div>
          <button
            onClick={() => setOverrideProtection(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: `1px solid ${overrideProtection ? '#2a2d3e' : '#4a5170'}`, background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: overrideProtection ? '#4a5170' : '#8892a4', whiteSpace: 'nowrap' }}
          >
            <ShieldOff size={13} /> {overrideProtection ? 'Reativar proteção' : 'Ignorar e operar'}
          </button>
        </div>
      )}

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <p style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 }}>{formatCurrency(totalPnl)}</p>
            <p style={{ color: '#4a5170', fontSize: 12, margin: 0 }}>{filtered.length} ops · {wr}% WR · {wins}W {losses}L</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!isMobile && (
            <button
              onClick={() => exportCSV(filtered)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '1px solid #2a2d3e', background: '#1a1d2e', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#8892a4' }}
            >
              <Download size={14} /> CSV
            </button>
          )}
          <button
            onClick={() => !isBlocked && setShowForm(true)}
            style={{ ...btnStyle, opacity: isBlocked ? 0.45 : 1, cursor: isBlocked ? 'not-allowed' : 'pointer', background: isBlocked ? '#1a1d2e' : 'linear-gradient(135deg,#6c63ff,#a78bfa)', border: isBlocked ? '1px solid #2a2d3e' : 'none', color: isBlocked ? '#4a5170' : '#fff', boxShadow: isBlocked ? 'none' : '0 4px 14px rgba(108,99,255,0.3)' }}
            title={isBlocked ? (dailyLimitHit ? 'Limite de perda diária atingido' : 'Meta diária atingida') : ''}
          >
            <Plus size={16} /> {isMobile ? 'Nova' : 'Nova Operação'}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 9, background: '#12141f', border: '1px solid #1e2235', flex: 1, minWidth: 140 }}>
          <Search size={14} color="#4a5170" />
          <input
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 13, width: '100%' }}
            placeholder="Buscar ativo, setup..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {months.length > 0 && (
          <select
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            style={{ padding: '8px 10px', borderRadius: 9, border: '1px solid #1e2235', background: '#12141f', color: '#c4b5fd', fontSize: 13, cursor: 'pointer' }}
          >
            <option value="all">Todos os meses</option>
            {months.map(m => <option key={m} value={m}>{formatMonth(m)}</option>)}
          </select>
        )}
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'WIN', 'LOSS', 'BREAKEVEN'] as const).map(r => (
            <button
              key={r}
              onClick={() => setFilterResult(r)}
              style={{
                padding: '7px 12px', borderRadius: 9, border: `1px solid ${filterResult === r ? '#6c63ff' : '#1e2235'}`,
                background: filterResult === r ? 'rgba(108,99,255,0.2)' : '#12141f',
                color: filterResult === r ? '#a78bfa' : '#4a5170',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const,
              }}
            >{r === 'all' ? 'Todos' : r}</button>
          ))}
        </div>
        {allTags.length > 0 && (
          <select
            value={filterTag}
            onChange={e => setFilterTag(e.target.value)}
            style={{ padding: '8px 10px', borderRadius: 9, border: `1px solid ${filterTag !== 'all' ? '#6c63ff' : '#1e2235'}`, background: filterTag !== 'all' ? 'rgba(108,99,255,0.15)' : '#12141f', color: filterTag !== 'all' ? '#a78bfa' : '#4a5170', fontSize: 13, cursor: 'pointer' }}
          >
            <option value="all">Todas as tags</option>
            {allTags.map(tag => <option key={tag} value={tag}>#{tag}</option>)}
          </select>
        )}
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#4a5170' }}>
          <p style={{ fontSize: 16, color: '#8892a4', marginBottom: 8 }}>Nenhuma operação encontrada</p>
          <p style={{ fontSize: 13 }}>Registre sua primeira operação clicando em "Nova Operação"</p>
        </div>
      ) : isMobile ? (
        <MobileCards trades={filtered} onEdit={t => setEditing(t)} onDelete={id => void deleteTrade(id)} />
      ) : (
        <DesktopTable trades={filtered} onEdit={t => setEditing(t)} onDelete={id => void deleteTrade(id)} sort={sort} sortKey={sortKey} sortDir={sortDir} totalPnl={totalPnl} />
      )}
    </div>
  )
}

function SortIcon({ k, sortKey, sortDir }: { k: keyof Trade; sortKey: keyof Trade; sortDir: string }) {
  if (sortKey !== k) return <ChevronUp size={11} color="#2a2d3e" />
  return sortDir === 'asc' ? <ChevronUp size={11} color="#a78bfa" /> : <ChevronDown size={11} color="#a78bfa" />
}

function DesktopTable({ trades, onEdit, onDelete, sort, sortKey, sortDir, totalPnl }: {
  trades: Trade[]; onEdit: (t: Trade) => void; onDelete: (id: string) => void
  sort: (k: keyof Trade) => void; sortKey: keyof Trade; sortDir: string; totalPnl: number
}) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const cols = [
    { key: 'date', label: 'Data', w: 90 },
    { key: 'asset', label: 'Ativo', w: 80 },
    { key: 'direction', label: 'Dir', w: 56 },
    { key: 'entryPrice', label: 'Entrada', w: 80 },
    { key: 'exitPrice', label: 'Saída', w: 80 },
    { key: 'quantity', label: 'Qtd', w: 60 },
    { key: 'riskReward', label: 'R:R', w: 56 },
    { key: 'pnl', label: 'P&L', w: 100 },
    { key: 'result', label: 'Resultado', w: 90 },
    { key: 'setup', label: 'Setup', w: 100 },
    { key: 'emotionalState', label: 'Emoção', w: 90 },
  ] as const

  return (
    <div style={{ borderRadius: 12, border: '1px solid #1a1d2e', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#10121e', borderBottom: '1px solid #1a1d2e' }}>
              {cols.map(({ key, label, w }) => (
                <th
                  key={key}
                  onClick={() => sort(key as keyof Trade)}
                  style={{
                    padding: '10px 12px', textAlign: 'left', cursor: 'pointer',
                    color: '#4a5170', fontWeight: 600, fontSize: 11, letterSpacing: '0.04em',
                    whiteSpace: 'nowrap', minWidth: w, userSelect: 'none',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {label} <SortIcon k={key as keyof Trade} sortKey={sortKey} sortDir={sortDir} />
                  </span>
                </th>
              ))}
              <th style={{ padding: '10px 8px', width: 64 }} />
            </tr>
          </thead>
          <tbody>
            {trades.map((t, i) => (
              <tr
                key={t.id}
                style={{ background: i % 2 === 0 ? '#12141f' : '#0e1018', borderBottom: '1px solid #1a1d2e', transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1a1d2e')}
                onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#12141f' : '#0e1018')}
              >
                <td style={{ padding: '9px 12px', color: '#8892a4', whiteSpace: 'nowrap' }}>{t.date.slice(0, 10)}</td>
                <td style={{ padding: '9px 12px', color: '#fff', fontWeight: 700 }}>{t.asset}</td>
                <td style={{ padding: '9px 12px' }}>{dirBadge(t.direction)}</td>
                <td style={{ padding: '9px 12px', color: '#c8d0e0', fontFamily: 'monospace' }}>{t.entryPrice.toFixed(2)}</td>
                <td style={{ padding: '9px 12px', color: '#c8d0e0', fontFamily: 'monospace' }}>{t.exitPrice.toFixed(2)}</td>
                <td style={{ padding: '9px 12px', color: '#8892a4' }}>{t.quantity}</td>
                <td style={{ padding: '9px 12px', color: t.riskReward >= 2 ? '#00d084' : t.riskReward >= 1 ? '#ffd700' : '#8892a4' }}>
                  {t.riskReward > 0 ? `1:${t.riskReward}` : '—'}
                </td>
                <td style={{ padding: '9px 12px' }}>
                  <p style={{ fontWeight: 700, fontFamily: 'monospace', color: t.pnl >= 0 ? '#00d084' : '#ff4d4d', margin: 0 }}>{t.pnl >= 0 ? '+' : ''}{formatCurrency(t.pnl)}</p>
                  {t.pnlPercent != null && t.pnlPercent !== 0 && <p style={{ fontSize: 10, color: '#4a5170', margin: 0, fontFamily: 'monospace' }}>{t.pnlPercent >= 0 ? '+' : ''}{t.pnlPercent.toFixed(2)}%</p>}
                </td>
                <td style={{ padding: '9px 12px' }}>{resultBadge(t.result)}</td>
                <td style={{ padding: '9px 12px', color: '#6a7090', fontSize: 12 }}>{t.setup || '—'}</td>
                <td style={{ padding: '9px 12px', color: '#6a7090', fontSize: 12 }}>{emotionLabel[t.emotionalState] || t.emotionalState}</td>
                <td style={{ padding: '9px 8px' }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <button onClick={() => onEdit(t)} style={{ padding: 5, borderRadius: 6, border: 'none', background: 'rgba(108,99,255,0.1)', cursor: 'pointer' }}>
                      <Pencil size={13} color="#a78bfa" />
                    </button>
                    {deleteConfirm === t.id ? (
                      <>
                        <button onClick={() => setDeleteConfirm(null)} style={{ padding: '3px 7px', borderRadius: 6, border: '1px solid #2a2d3e', background: 'transparent', cursor: 'pointer', fontSize: 11, color: '#8892a4' }}>Não</button>
                        <button onClick={() => { onDelete(t.id); setDeleteConfirm(null) }} style={{ padding: '3px 7px', borderRadius: 6, border: '1px solid rgba(255,77,77,0.4)', background: 'rgba(255,77,77,0.15)', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#ff4d4d' }}>Sim</button>
                      </>
                    ) : (
                      <button onClick={() => setDeleteConfirm(t.id)} style={{ padding: 5, borderRadius: 6, border: 'none', background: 'rgba(255,77,77,0.1)', cursor: 'pointer' }}>
                        <Trash2 size={13} color="#ff4d4d" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          {/* Totals row */}
          <tfoot>
            <tr style={{ background: '#10121e', borderTop: '2px solid #2a2d3e' }}>
              <td colSpan={7} style={{ padding: '10px 12px', color: '#4a5170', fontSize: 12, fontWeight: 600 }}>
                TOTAL ({trades.length} operações)
              </td>
              <td style={{ padding: '10px 12px', fontWeight: 700, fontFamily: 'monospace', color: totalPnl >= 0 ? '#00d084' : '#ff4d4d', fontSize: 14 }}>
                {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)}
              </td>
              <td colSpan={4} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function MobileCards({ trades, onEdit, onDelete }: {
  trades: Trade[]; onEdit: (t: Trade) => void; onDelete: (id: string) => void
}) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {trades.map(t => (
        <div
          key={t.id}
          style={{ background: '#12141f', borderRadius: 12, border: '1px solid #1a1d2e', padding: '14px 16px' }}
        >
          {/* Row 1: date, asset, result */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: '#4a5170' }}>{formatDate(t.date)}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{t.asset}</span>
              {dirBadge(t.direction)}
            </div>
            {resultBadge(t.result)}
          </div>

          {/* Row 2: prices + qty */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
            <div>
              <p style={{ fontSize: 10, color: '#4a5170', margin: 0 }}>Entrada</p>
              <p style={{ fontSize: 13, color: '#c8d0e0', fontFamily: 'monospace', margin: 0 }}>{t.entryPrice.toFixed(2)}</p>
            </div>
            <div>
              <p style={{ fontSize: 10, color: '#4a5170', margin: 0 }}>Saída</p>
              <p style={{ fontSize: 13, color: '#c8d0e0', fontFamily: 'monospace', margin: 0 }}>{t.exitPrice.toFixed(2)}</p>
            </div>
            <div>
              <p style={{ fontSize: 10, color: '#4a5170', margin: 0 }}>Qtd</p>
              <p style={{ fontSize: 13, color: '#8892a4', margin: 0 }}>{t.quantity}</p>
            </div>
            {t.setup && (
              <div>
                <p style={{ fontSize: 10, color: '#4a5170', margin: 0 }}>Setup</p>
                <p style={{ fontSize: 12, color: '#6a7090', margin: 0 }}>{t.setup}</p>
              </div>
            )}
          </div>

          {/* Row 2.5: R:R, emoção, tags */}
          {(t.riskReward > 0 || t.emotionalState || (t.tags?.length ?? 0) > 0) && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {t.riskReward > 0 && (
                <span style={{ fontSize: 11, color: t.riskReward >= 2 ? '#00d084' : t.riskReward >= 1 ? '#ffd700' : '#4a5170' }}>R:R 1:{t.riskReward}</span>
              )}
              {t.emotionalState && (
                <span style={{ fontSize: 11, color: '#4a5170' }}>{emotionLabel[t.emotionalState] || t.emotionalState}</span>
              )}
              {(t.tags ?? []).map(tag => (
                <span key={tag} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(108,99,255,0.15)', color: '#a78bfa' }}>#{tag}</span>
              ))}
            </div>
          )}

          {/* Row 3: PnL + actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'monospace', color: t.pnl >= 0 ? '#00d084' : '#ff4d4d' }}>
                {t.pnl >= 0 ? '+' : ''}{formatCurrency(t.pnl)}
              </span>
              {t.pnlPercent != null && t.pnlPercent !== 0 && (
                <span style={{ fontSize: 11, color: '#4a5170', marginLeft: 6, fontFamily: 'monospace' }}>{t.pnlPercent >= 0 ? '+' : ''}{t.pnlPercent.toFixed(2)}%</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => onEdit(t)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, border: 'none', background: 'rgba(108,99,255,0.15)', cursor: 'pointer', color: '#a78bfa', fontSize: 13, fontWeight: 600 }}>
                <Pencil size={13} /> Editar
              </button>
              {deleteConfirm === t.id ? (
                <>
                  <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '1px solid #2a2d3e', background: 'transparent', cursor: 'pointer', color: '#8892a4', fontSize: 12 }}>Cancelar</button>
                  <button onClick={() => { onDelete(t.id); setDeleteConfirm(null) }} style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,77,77,0.4)', background: 'rgba(255,77,77,0.15)', cursor: 'pointer', color: '#ff4d4d', fontSize: 12, fontWeight: 700 }}>Confirmar exclusão</button>
                </>
              ) : (
                <button onClick={() => setDeleteConfirm(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, border: 'none', background: 'rgba(255,77,77,0.1)', cursor: 'pointer', color: '#ff4d4d', fontSize: 13, fontWeight: 600 }}>
                  <Trash2 size={13} /> Excluir
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
