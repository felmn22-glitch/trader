import { useState } from 'react'
import { X } from 'lucide-react'
import { useStore } from '../store'
import { calcPnl, calcRiskReward, getResult, calcPositionSize, today } from '../utils'
import type { Trade, Direction, EmotionalState, MarketSession } from '../types'

interface Props {
  trade?: Trade
  onClose: () => void
}

const emotions: EmotionalState[] = ['calm', 'confident', 'anxious', 'frustrated', 'fearful', 'greedy']
const emotionLabel: Record<EmotionalState, string> = {
  calm: 'Calmo', confident: 'Confiante', anxious: 'Ansioso',
  frustrated: 'Frustrado', fearful: 'Com medo', greedy: 'Ganancioso',
}
const sessions: MarketSession[] = ['pre-market', 'opening', 'mid-day', 'closing', 'after-hours']
const sessionLabel: Record<MarketSession, string> = {
  'pre-market': 'Pré-mercado', opening: 'Abertura', 'mid-day': 'Meio do dia',
  closing: 'Fechamento', 'after-hours': 'After hours',
}

const commonSetups = ['Price Action', 'Rompimento', 'Pullback', 'Gap', 'Reversão', 'Scalp', 'Tendência', 'Suporte/Resistência', 'Candle padrão']

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium uppercase tracking-wider" style={{ color: '#8892a4' }}>{label}</label>
      {children}
    </div>
  )
}

const inputCls = "w-full px-3 py-2 rounded-lg text-sm text-white outline-none focus:ring-1 focus:ring-purple-500"
const inputStyle = { background: '#12141f', border: '1px solid #2a2d3e' }

export function TradeForm({ trade, onClose }: Props) {
  const { addTrade, updateTrade, riskSettings } = useStore()

  const [form, setForm] = useState({
    date: trade?.date?.slice(0, 10) ?? today(),
    asset: trade?.asset ?? '',
    direction: (trade?.direction ?? 'LONG') as Direction,
    entryPrice: trade?.entryPrice?.toString() ?? '',
    exitPrice: trade?.exitPrice?.toString() ?? '',
    quantity: trade?.quantity?.toString() ?? '',
    stopLoss: trade?.stopLoss?.toString() ?? '',
    target: trade?.target?.toString() ?? '',
    setup: trade?.setup ?? '',
    session: (trade?.session ?? 'opening') as MarketSession,
    emotionalState: (trade?.emotionalState ?? 'calm') as EmotionalState,
    followedPlan: trade?.followedPlan ?? true,
    notes: trade?.notes ?? '',
    duration: trade?.duration?.toString() ?? '',
    tags: trade?.tags?.join(', ') ?? '',
  })

  const entry = parseFloat(form.entryPrice) || 0
  const exit = parseFloat(form.exitPrice) || 0
  const qty = parseFloat(form.quantity) || 0
  const sl = parseFloat(form.stopLoss) || 0
  const target = parseFloat(form.target) || 0

  const suggestedQty = entry && sl
    ? calcPositionSize(riskSettings.accountSize, riskSettings.maxTradeRiskPercent, entry, sl)
    : 0

  const previewPnl = entry && exit && qty
    ? calcPnl({ direction: form.direction, entryPrice: entry, exitPrice: exit, quantity: qty, stopLoss: sl, target })
    : null

  const previewRR = entry && sl && target
    ? calcRiskReward({ entryPrice: entry, exitPrice: exit, stopLoss: sl, target, direction: form.direction })
    : null

  function set(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const assetClean = form.asset.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20)
    if (!assetClean || !entry || entry <= 0 || !exit || exit <= 0 || !qty || qty <= 0) return

    const pnl = calcPnl({ direction: form.direction, entryPrice: entry, exitPrice: exit, quantity: qty, stopLoss: sl, target })
    const result = getResult(pnl)
    const riskReward = calcRiskReward({ entryPrice: entry, exitPrice: exit, stopLoss: sl, target, direction: form.direction })

    const payload = {
      date: form.date,
      asset: assetClean,
      direction: form.direction,
      entryPrice: entry,
      exitPrice: exit,
      quantity: qty,
      stopLoss: sl,
      target,
      setup: form.setup,
      session: form.session,
      emotionalState: form.emotionalState,
      followedPlan: form.followedPlan,
      notes: form.notes,
      duration: parseInt(form.duration || '0', 10) || 0,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      pnl,
      pnlPercent: entry ? (pnl / (entry * qty)) * 100 : 0,
      result,
      riskReward,
    }

    if (trade) {
      updateTrade(trade.id, payload)
    } else {
      addTrade(payload)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl" style={{ background: '#1a1d2e', border: '1px solid #2a2d3e' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #1e2235' }}>
          <h2 className="text-lg font-bold text-white">{trade ? 'Editar Operação' : 'Nova Operação'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5"><X size={18} color="#8892a4" /></button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {/* Direction toggle */}
          <div className="flex gap-2">
            {(['LONG', 'SHORT'] as Direction[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => set('direction', d)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all"
                style={{
                  background: form.direction === d ? (d === 'LONG' ? 'rgba(0,208,132,0.2)' : 'rgba(255,77,77,0.2)') : '#12141f',
                  border: `1px solid ${form.direction === d ? (d === 'LONG' ? '#00d084' : '#ff4d4d') : '#2a2d3e'}`,
                  color: form.direction === d ? (d === 'LONG' ? '#00d084' : '#ff4d4d') : '#8892a4',
                }}
              >
                {d === 'LONG' ? '▲ COMPRA (LONG)' : '▼ VENDA (SHORT)'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Data">
              <input type="date" className={inputCls} style={inputStyle} value={form.date} onChange={(e) => set('date', e.target.value)} />
            </Field>
            <Field label="Ativo">
              <input className={inputCls} style={inputStyle} placeholder="Ex: PETR4, WIN, WDOFUT" value={form.asset} onChange={(e) => set('asset', e.target.value)} required />
            </Field>
            <Field label="Preço de Entrada">
              <input type="number" step="0.01" min="0.01" className={inputCls} style={inputStyle} placeholder="0.00" value={form.entryPrice} onChange={(e) => set('entryPrice', e.target.value)} required />
            </Field>
            <Field label="Preço de Saída">
              <input type="number" step="0.01" min="0.01" className={inputCls} style={inputStyle} placeholder="0.00" value={form.exitPrice} onChange={(e) => set('exitPrice', e.target.value)} required />
            </Field>
            <Field label={`Quantidade ${suggestedQty > 0 ? `(sugerido: ${suggestedQty})` : ''}`}>
              <input type="number" min="1" className={inputCls} style={inputStyle} placeholder="0" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} required />
            </Field>
            <Field label="Stop Loss">
              <input type="number" step="0.01" min="0" className={inputCls} style={inputStyle} placeholder="0.00" value={form.stopLoss} onChange={(e) => set('stopLoss', e.target.value)} />
            </Field>
            <Field label="Alvo (Target)">
              <input type="number" step="0.01" min="0" className={inputCls} style={inputStyle} placeholder="0.00" value={form.target} onChange={(e) => set('target', e.target.value)} />
            </Field>
            <Field label="Duração (minutos)">
              <input type="number" min="0" className={inputCls} style={inputStyle} placeholder="0" value={form.duration} onChange={(e) => set('duration', e.target.value)} />
            </Field>
          </div>

          {/* Preview */}
          {previewPnl !== null && (
            <div className="flex gap-4 p-3 rounded-xl" style={{ background: '#12141f', border: '1px solid #2a2d3e' }}>
              <div>
                <p className="text-xs" style={{ color: '#8892a4' }}>P&L Previsto</p>
                <p className="font-bold text-lg" style={{ color: previewPnl >= 0 ? '#00d084' : '#ff4d4d' }}>
                  {previewPnl >= 0 ? '+' : ''}{previewPnl.toFixed(2)}
                </p>
              </div>
              {previewRR !== null && (
                <div>
                  <p className="text-xs" style={{ color: '#8892a4' }}>R:R</p>
                  <p className="font-bold text-lg" style={{ color: previewRR >= 2 ? '#00d084' : previewRR >= 1 ? '#ffd700' : '#ff4d4d' }}>
                    1:{previewRR}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Setup">
              <select className={inputCls} style={inputStyle} value={form.setup} onChange={(e) => set('setup', e.target.value)}>
                <option value="">Selecionar...</option>
                {commonSetups.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Sessão">
              <select className={inputCls} style={inputStyle} value={form.session} onChange={(e) => set('session', e.target.value)}>
                {sessions.map((s) => <option key={s} value={s}>{sessionLabel[s]}</option>)}
              </select>
            </Field>
            <Field label="Estado Emocional">
              <select className={inputCls} style={inputStyle} value={form.emotionalState} onChange={(e) => set('emotionalState', e.target.value)}>
                {emotions.map((em) => <option key={em} value={em}>{emotionLabel[em]}</option>)}
              </select>
            </Field>
            <Field label="Tags (separadas por vírgula)">
              <input className={inputCls} style={inputStyle} placeholder="ex: tendencia, alta volatilidade" value={form.tags} onChange={(e) => set('tags', e.target.value)} />
            </Field>
          </div>

          <Field label="Notas">
            <textarea
              className={inputCls}
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              placeholder="O que aconteceu nessa operação? O que poderia ter feito melhor?"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </Field>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.followedPlan}
              onChange={(e) => set('followedPlan', e.target.checked)}
              className="w-4 h-4 rounded accent-purple-500"
            />
            <span className="text-sm" style={{ color: '#e8eaf0' }}>Segui o plano e as minhas regras nessa operação</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-white/5" style={{ border: '1px solid #2a2d3e', color: '#8892a4' }}>
              Cancelar
            </button>
            <button type="submit" className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg,#6c63ff,#a78bfa)' }}>
              {trade ? 'Salvar' : 'Registrar Operação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
