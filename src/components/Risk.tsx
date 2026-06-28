import { useState } from 'react'
import { Shield, Calculator, TrendingDown, DollarSign, User, Building2 } from 'lucide-react'
import { useStore } from '../store'
import { calcPositionSize, formatCurrency } from '../utils'
import { useIsMobile } from '../hooks'

const inputCls = "w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none focus:ring-1 focus:ring-purple-500"
const inputStyle = { background: '#12141f', border: '1px solid #2a2d3e' }

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wider" style={{ color: '#8892a4' }}>{label}</label>
      {hint && <p className="text-xs mt-0.5 mb-1.5" style={{ color: '#4a4d5e' }}>{hint}</p>}
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

export function Risk() {
  const { riskSettings, updateRiskSettings } = useStore()
  const isMobile = useIsMobile()
  const [localSettings, setLocalSettings] = useState({
    accountSize: riskSettings.accountSize.toString(),
    maxPositions: riskSettings.maxPositions.toString(),
  })
  const [calc, setCalc] = useState({ entry: '', stop: '', riskPct: riskSettings.maxTradeRiskPercent.toString() })

  const posSize = calc.entry && calc.stop
    ? calcPositionSize(riskSettings.accountSize, parseFloat(calc.riskPct) || 1, parseFloat(calc.entry), parseFloat(calc.stop))
    : 0
  const riskAmount = posSize && calc.entry && calc.stop
    ? Math.abs(parseFloat(calc.entry) - parseFloat(calc.stop)) * posSize
    : 0

  const rules = [
    { label: 'Risco Máx por Trade', value: formatCurrency(riskSettings.maxTradeRisk), pct: `${riskSettings.maxTradeRiskPercent}%`, color: '#ff4d4d', icon: TrendingDown },
    { label: 'Perda Máxima Diária', value: formatCurrency(riskSettings.maxDailyLoss), pct: `${riskSettings.maxDailyLossPercent}%`, color: '#ff8c00', icon: Shield },
    { label: 'Meta Diária', value: formatCurrency(riskSettings.dailyTarget), pct: `${riskSettings.dailyTargetPercent}%`, color: '#00d084', icon: DollarSign },
  ]

  const pad = isMobile ? '14px 14px 80px' : '20px 28px 28px'

  return (
    <div style={{ padding: pad, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Account type */}
      <div style={{ background: '#12141f', borderRadius: 14, border: '1px solid #1a1d2e', padding: '16px 18px' }}>
        <p style={{ color: '#4a5170', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', margin: '0 0 12px', textTransform: 'uppercase' }}>Tipo de Conta</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {([
            { id: 'proprio', label: 'Capital Próprio', sub: '100% do resultado', Icon: User },
            { id: 'mesa', label: 'Mesa Proprietária', sub: 'Prop firm', Icon: Building2 },
          ] as const).map(({ id, label, sub, Icon }) => (
            <button
              key={id}
              onClick={() => updateRiskSettings({ accountType: id })}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 10, cursor: 'pointer', flex: 1, minWidth: 140,
                border: `2px solid ${riskSettings.accountType === id ? '#6c63ff' : '#1e2235'}`,
                background: riskSettings.accountType === id ? 'rgba(108,99,255,0.12)' : '#0e1018',
              }}
            >
              <Icon size={18} color={riskSettings.accountType === id ? '#a78bfa' : '#4a5170'} />
              <div style={{ textAlign: 'left' }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: riskSettings.accountType === id ? '#c4b5fd' : '#8892a4' }}>{label}</p>
                <p style={{ margin: 0, fontSize: 11, color: '#4a5170' }}>{sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick summary */}
      <div className="grid grid-cols-3 gap-4">
        {rules.map(({ label, value, pct, color, icon: Icon }) => (
          <div key={label} className="p-4 rounded-xl" style={{ background: '#1a1d2e', border: `1px solid ${color}30` }}>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} color={color} />
              <p className="text-xs font-medium" style={{ color: '#8892a4' }}>{label}</p>
            </div>
            <p className="text-xl font-bold" style={{ color }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: '#4a4d5e' }}>{pct} da conta</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings */}
        <div className="rounded-xl p-5 space-y-4" style={{ background: '#1a1d2e', border: '1px solid #1e2235' }}>
          <p className="text-sm font-bold text-white">Configurações da Conta</p>

          <Field label="Tamanho da Conta (R$)">
            <input
              type="text"
              inputMode="numeric"
              className={inputCls}
              style={inputStyle}
              value={localSettings.accountSize}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, '')
                setLocalSettings((s) => ({ ...s, accountSize: raw }))
                const n = parseFloat(raw)
                if (!isNaN(n) && raw !== '') updateRiskSettings({ accountSize: n })
              }}
            />
          </Field>
          <Field label="Risco Máximo por Trade (%)" hint="Recomendado: 0.5% a 2%">
            <div className="flex gap-2">
              <input type="number" step="0.1" className={inputCls} style={inputStyle} value={riskSettings.maxTradeRiskPercent} onChange={(e) => {
                const pct = parseFloat(e.target.value) || 0
                updateRiskSettings({ maxTradeRiskPercent: pct, maxTradeRisk: Math.round(riskSettings.accountSize * pct / 100) })
              }} />
              <div className="px-3 py-2.5 rounded-lg text-sm font-semibold shrink-0" style={{ background: 'rgba(255,77,77,0.1)', color: '#ff4d4d', border: '1px solid rgba(255,77,77,0.2)' }}>
                {formatCurrency(riskSettings.maxTradeRisk)}
              </div>
            </div>
          </Field>
          <Field label="Perda Máxima Diária (%)" hint="Recomendado: 2% a 5%">
            <div className="flex gap-2">
              <input type="number" step="0.1" className={inputCls} style={inputStyle} value={riskSettings.maxDailyLossPercent} onChange={(e) => {
                const pct = parseFloat(e.target.value) || 0
                updateRiskSettings({ maxDailyLossPercent: pct, maxDailyLoss: Math.round(riskSettings.accountSize * pct / 100) })
              }} />
              <div className="px-3 py-2.5 rounded-lg text-sm font-semibold shrink-0" style={{ background: 'rgba(255,140,0,0.1)', color: '#ff8c00', border: '1px solid rgba(255,140,0,0.2)' }}>
                {formatCurrency(riskSettings.maxDailyLoss)}
              </div>
            </div>
          </Field>
          <Field label="Meta Diária (%)" hint="Recomendado: 1% a 3%">
            <div className="flex gap-2">
              <input type="number" step="0.1" className={inputCls} style={inputStyle} value={riskSettings.dailyTargetPercent} onChange={(e) => {
                const pct = parseFloat(e.target.value) || 0
                updateRiskSettings({ dailyTargetPercent: pct, dailyTarget: Math.round(riskSettings.accountSize * pct / 100) })
              }} />
              <div className="px-3 py-2.5 rounded-lg text-sm font-semibold shrink-0" style={{ background: 'rgba(0,208,132,0.1)', color: '#00d084', border: '1px solid rgba(0,208,132,0.2)' }}>
                {formatCurrency(riskSettings.dailyTarget)}
              </div>
            </div>
          </Field>
          <Field label="Máximo de Posições Simultâneas">
            <input
              type="text"
              inputMode="numeric"
              className={inputCls}
              style={inputStyle}
              value={localSettings.maxPositions}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, '')
                setLocalSettings((s) => ({ ...s, maxPositions: raw }))
                const n = parseInt(raw, 10)
                if (!isNaN(n) && raw !== '') updateRiskSettings({ maxPositions: n })
              }}
            />
          </Field>
        </div>

        {/* Position Calculator */}
        <div className="rounded-xl p-5 space-y-4" style={{ background: '#1a1d2e', border: '1px solid #1e2235' }}>
          <div className="flex items-center gap-2">
            <Calculator size={18} color="#6c63ff" />
            <p className="text-sm font-bold text-white">Calculadora de Posição</p>
          </div>
          <p className="text-xs" style={{ color: '#8892a4' }}>Calcule o tamanho ideal da posição baseado no seu risco</p>

          <Field label="Preço de Entrada">
            <input type="number" step="0.01" className={inputCls} style={inputStyle} placeholder="0.00" value={calc.entry} onChange={(e) => setCalc((c) => ({ ...c, entry: e.target.value }))} />
          </Field>
          <Field label="Stop Loss">
            <input type="number" step="0.01" className={inputCls} style={inputStyle} placeholder="0.00" value={calc.stop} onChange={(e) => setCalc((c) => ({ ...c, stop: e.target.value }))} />
          </Field>
          <Field label="Risco (%)">
            <input type="number" step="0.1" className={inputCls} style={inputStyle} value={calc.riskPct} onChange={(e) => setCalc((c) => ({ ...c, riskPct: e.target.value }))} />
          </Field>

          {posSize > 0 && (
            <div className="p-4 rounded-xl space-y-3" style={{ background: '#12141f', border: '1px solid rgba(108,99,255,0.2)' }}>
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: '#8892a4' }}>Quantidade sugerida</span>
                <span className="text-xl font-bold" style={{ color: '#6c63ff' }}>{posSize} lotes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: '#8892a4' }}>Risco monetário</span>
                <span className="font-bold" style={{ color: '#ff4d4d' }}>{formatCurrency(riskAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: '#8892a4' }}>Exposição total</span>
                <span className="font-bold text-white">{formatCurrency(parseFloat(calc.entry) * posSize)}</span>
              </div>
              <div className="h-px" style={{ background: '#1e2235' }} />
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: '#8892a4' }}>% da conta em risco</span>
                <span className="font-bold" style={{ color: '#ffd700' }}>{((riskAmount / riskSettings.accountSize) * 100).toFixed(2)}%</span>
              </div>
            </div>
          )}

          {/* Risk tips */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8892a4' }}>Princípios de Gestão de Risco</p>
            {[
              'Nunca arrisque mais de 2% por trade',
              'Stop loss ANTES de entrar na posição',
              'R:R mínimo de 1:2 para cada trade',
              'Pare ao atingir o limite de perda diário',
              'Consistência > retornos extraordinários',
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-xs font-bold shrink-0" style={{ color: '#6c63ff' }}>•</span>
                <p className="text-xs" style={{ color: '#8892a4' }}>{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
