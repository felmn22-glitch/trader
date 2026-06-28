import { useState } from 'react'
import { Plus, Trash2, CheckCircle, Circle, Shield } from 'lucide-react'
import { useIsMobile } from '../hooks'
import { useStore } from '../store'
import type { Rule } from '../types'

const categories = ['entry', 'exit', 'risk', 'psychology', 'routine'] as const
const categoryLabel: Record<typeof categories[number], string> = {
  entry: 'Entrada', exit: 'Saída', risk: 'Risco', psychology: 'Psicologia', routine: 'Rotina',
}
const categoryColor: Record<typeof categories[number], string> = {
  entry: '#6c63ff', exit: '#a78bfa', risk: '#ff4d4d', psychology: '#ffd700', routine: '#00d084',
}

export function Rules() {
  const { rules, addRule, toggleRule, deleteRule } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const [form, setForm] = useState({ title: '', description: '', category: 'entry' as Rule['category'] })

  const filtered = filter === 'all' ? rules : rules.filter((r) => r.category === filter)
  const activeCount = rules.filter((r) => r.active).length

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title) return
    addRule({ ...form, active: true })
    setForm({ title: '', description: '', category: 'entry' })
    setShowForm(false)
  }

  const isMobile = useIsMobile()
  const pad = isMobile ? '12px 14px 80px' : '20px 28px 28px'

  return (
    <div style={{ padding: pad }} className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: '#5a6280' }}>{activeCount} de {rules.length} regras ativas</p>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', boxShadow: '0 4px 16px rgba(108,99,255,0.3)' }}>
          <Plus size={16} /> Nova Regra
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={submit} className="p-5 rounded-xl space-y-3" style={{ background: '#1a1d2e', border: '1px solid #2a2d3e' }}>
          <p className="text-sm font-bold text-white">Nova Regra</p>
          <input
            className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
            style={{ background: '#12141f', border: '1px solid #2a2d3e' }}
            placeholder="Título da regra"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <input
            className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
            style={{ background: '#12141f', border: '1px solid #2a2d3e' }}
            placeholder="Descrição / detalhes (opcional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <div className="flex gap-2 flex-wrap">
            {categories.map((c) => (
              <button key={c} type="button"
                onClick={() => setForm((f) => ({ ...f, category: c }))}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: form.category === c ? `${categoryColor[c]}25` : '#12141f',
                  border: `1px solid ${form.category === c ? categoryColor[c] : '#2a2d3e'}`,
                  color: form.category === c ? categoryColor[c] : '#8892a4',
                }}
              >{categoryLabel[c]}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg text-sm" style={{ border: '1px solid #2a2d3e', color: '#8892a4' }}>Cancelar</button>
            <button type="submit" className="flex-1 py-2 rounded-lg text-sm font-bold text-white" style={{ background: '#6c63ff' }}>Adicionar</button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', ...categories].map((c) => (
          <button key={c} onClick={() => setFilter(c)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: filter === c ? 'rgba(108,99,255,0.2)' : '#1a1d2e',
              border: `1px solid ${filter === c ? '#6c63ff' : '#1e2235'}`,
              color: filter === c ? '#a78bfa' : '#8892a4',
            }}
          >
            {c === 'all' ? 'Todas' : categoryLabel[c as typeof categories[number]]}
          </button>
        ))}
      </div>

      {/* Compliance banner */}
      <div className="p-4 rounded-xl flex items-center gap-4" style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)' }}>
        <Shield size={24} color="#6c63ff" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Conformidade com o Plano</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-2 rounded-full" style={{ background: '#12141f' }}>
              <div className="h-2 rounded-full" style={{ width: `${rules.length > 0 ? Math.round((activeCount / rules.length) * 100) : 0}%`, background: 'linear-gradient(90deg,#6c63ff,#a78bfa)' }} />
            </div>
            <span className="text-sm font-bold" style={{ color: '#a78bfa' }}>{Math.round((activeCount / (rules.length || 1)) * 100)}%</span>
          </div>
        </div>
        <p className="text-xs" style={{ color: '#8892a4' }}>Leia estas regras toda manhã antes de operar</p>
      </div>

      {/* Rules list */}
      <div className="space-y-2">
        {filtered.map((rule) => (
          <div key={rule.id}
            className="flex items-start gap-4 p-4 rounded-xl transition-all"
            style={{
              background: '#1a1d2e',
              border: `1px solid ${rule.active ? '#1e2235' : '#1e2235'}`,
              opacity: rule.active ? 1 : 0.5,
            }}
          >
            <button onClick={() => toggleRule(rule.id)} className="mt-0.5 shrink-0">
              {rule.active
                ? <CheckCircle size={20} color="#00d084" />
                : <Circle size={20} color="#3a3d5e" />
              }
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-white">{rule.title}</p>
                <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: `${categoryColor[rule.category as typeof categories[number]]}20`, color: categoryColor[rule.category as typeof categories[number]] }}>
                  {categoryLabel[rule.category as typeof categories[number]]}
                </span>
              </div>
              {rule.description && <p className="text-xs mt-1" style={{ color: '#8892a4' }}>{rule.description}</p>}
            </div>
            <button onClick={() => { if (confirm('Excluir esta regra?')) deleteRule(rule.id) }} className="p-1.5 rounded hover:bg-white/5">
              <Trash2 size={14} color="#ff4d4d" />
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center py-8 text-sm" style={{ color: '#8892a4' }}>Nenhuma regra nessa categoria</p>
        )}
      </div>
    </div>
  )
}
