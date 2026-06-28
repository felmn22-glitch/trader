import { useState } from 'react'
import { Plus, ChevronDown, ChevronUp, Star, BookOpen, Pencil } from 'lucide-react'
import { useIsMobile } from '../hooks'
import { useStore } from '../store'
import { today, formatDate } from '../utils'
import type { JournalEntry, EmotionalState } from '../types'

const emotionLabel: Record<EmotionalState, string> = {
  calm: 'Calmo', confident: 'Confiante', anxious: 'Ansioso',
  frustrated: 'Frustrado', fearful: 'Com medo', greedy: 'Ganancioso',
}
const emotionColor: Record<EmotionalState, string> = {
  calm: '#00d084', confident: '#6c63ff', anxious: '#ffd700',
  frustrated: '#ff4d4d', fearful: '#ff8c00', greedy: '#ff4d4d',
}

const inputCls = "w-full px-3 py-2 rounded-lg text-sm text-white outline-none focus:ring-1 focus:ring-purple-500"
const inputStyle = { background: '#12141f', border: '1px solid #2a2d3e' }

function StarRating({ value, onChange }: { value: number; onChange: (v: 1|2|3|4|5) => void }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n as 1|2|3|4|5)}>
          <Star size={20} fill={n <= value ? '#ffd700' : 'none'} color={n <= value ? '#ffd700' : '#3a3d5e'} />
        </button>
      ))}
    </div>
  )
}

function EntryCard({ entry, onEdit }: { entry: JournalEntry; onEdit: (e: JournalEntry) => void }) {
  const [open, setOpen] = useState(false)
  const { preMarket, postMarket } = entry

  const biasColor = preMarket.marketBias === 'bullish' ? '#00d084' : preMarket.marketBias === 'bearish' ? '#ff4d4d' : '#ffd700'
  const biasLabel = preMarket.marketBias === 'bullish' ? 'Alta' : preMarket.marketBias === 'bearish' ? 'Baixa' : 'Neutro'

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#1a1d2e', border: '1px solid #1e2235' }}>
      <button
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/2 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(108,99,255,0.15)' }}>
            <BookOpen size={18} color="#6c63ff" />
          </div>
          <div>
            <p className="font-semibold text-white">{formatDate(entry.date)}</p>
            <p className="text-xs mt-0.5" style={{ color: '#8892a4' }}>
              Viés: <span style={{ color: biasColor }}>{biasLabel}</span>
              {' · '}Estado: <span style={{ color: emotionColor[preMarket.mentalState] }}>{emotionLabel[preMarket.mentalState]}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {postMarket.overallRating > 0 && (
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map((n) => <Star key={n} size={14} fill={n <= postMarket.overallRating ? '#ffd700' : 'none'} color={n <= postMarket.overallRating ? '#ffd700' : '#3a3d5e'} />)}
            </div>
          )}
          <button
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            style={{ border: '1px solid #2a2d3e' }}
            onClick={(ev) => { ev.stopPropagation(); onEdit(entry) }}
            title="Editar entrada"
          >
            <Pencil size={13} color="#a78bfa" />
          </button>
          {open ? <ChevronUp size={16} color="#8892a4" /> : <ChevronDown size={16} color="#8892a4" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4" style={{ borderTop: '1px solid #1e2235' }}>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6c63ff' }}>PRÉ-MERCADO</p>
              <div className="space-y-2">
                {preMarket.keyLevels && <div><p className="text-xs" style={{ color: '#8892a4' }}>Níveis chave</p><p className="text-sm text-white">{preMarket.keyLevels}</p></div>}
                {preMarket.plan && <div><p className="text-xs" style={{ color: '#8892a4' }}>Plano do dia</p><p className="text-sm text-white">{preMarket.plan}</p></div>}
                <div className="flex gap-4">
                  <div><p className="text-xs" style={{ color: '#8892a4' }}>Sono</p><div className="flex gap-0.5 mt-1">{[1,2,3,4,5].map((n) => <Star key={n} size={12} fill={n <= preMarket.sleepQuality ? '#6c63ff' : 'none'} color={n <= preMarket.sleepQuality ? '#6c63ff' : '#3a3d5e'} />)}</div></div>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#00d084' }}>PÓS-MERCADO</p>
              <div className="space-y-2">
                {postMarket.summary && <div><p className="text-xs" style={{ color: '#8892a4' }}>Resumo</p><p className="text-sm text-white">{postMarket.summary}</p></div>}
                {postMarket.lessons && <div><p className="text-xs" style={{ color: '#8892a4' }}>Lições</p><p className="text-sm text-white">{postMarket.lessons}</p></div>}
                {postMarket.improvements && <div><p className="text-xs" style={{ color: '#8892a4' }}>Melhorias</p><p className="text-sm text-white">{postMarket.improvements}</p></div>}
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: '#8892a4' }}>Seguiu as regras:</span>
                  <span className="text-xs font-bold" style={{ color: postMarket.followedRules ? '#00d084' : '#ff4d4d' }}>
                    {postMarket.followedRules ? 'Sim' : 'Não'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function JournalForm({ onClose, entry }: { onClose: () => void; entry?: JournalEntry }) {
  const { addJournalEntry, updateJournalEntry } = useStore()
  const isEditing = !!entry
  const [form, setForm] = useState<Omit<JournalEntry, 'id'>>(
    entry
      ? { date: entry.date, preMarket: { ...entry.preMarket }, postMarket: { ...entry.postMarket } }
      : {
          date: today(),
          preMarket: { marketBias: 'neutral', keyLevels: '', plan: '', mentalState: 'calm', sleepQuality: 3 },
          postMarket: { summary: '', lessons: '', improvements: '', followedRules: true, overallRating: 3 },
        }
  )

  function set(section: 'preMarket' | 'postMarket', field: string, value: unknown) {
    setForm((f) => ({ ...f, [section]: { ...f[section], [field]: value } }))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (isEditing && entry) {
      void updateJournalEntry(entry.id, form)
    } else {
      void addJournalEntry(form)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl" style={{ background: '#1a1d2e', border: '1px solid #2a2d3e' }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #1e2235' }}>
          <h2 className="text-lg font-bold text-white">{isEditing ? 'Editar Entrada' : 'Nova Entrada no Diário'}</h2>
          <button onClick={onClose} className="text-sm" style={{ color: '#8892a4' }}>Fechar</button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-6">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider" style={{ color: '#8892a4' }}>Data</label>
            <input type="date" className={`${inputCls} mt-1.5`} style={inputStyle} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          </div>

          {/* Pre-market */}
          <div>
            <p className="text-sm font-bold mb-3" style={{ color: '#6c63ff' }}>PRÉ-MERCADO</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs" style={{ color: '#8892a4' }}>Viés do Mercado</label>
                <div className="flex gap-2 mt-1.5">
                  {(['bullish','bearish','neutral'] as const).map((b) => (
                    <button key={b} type="button" onClick={() => set('preMarket','marketBias',b)}
                      className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: form.preMarket.marketBias === b ? (b === 'bullish' ? 'rgba(0,208,132,0.2)' : b === 'bearish' ? 'rgba(255,77,77,0.2)' : 'rgba(255,215,0,0.2)') : '#12141f',
                        border: `1px solid ${form.preMarket.marketBias === b ? (b === 'bullish' ? '#00d084' : b === 'bearish' ? '#ff4d4d' : '#ffd700') : '#2a2d3e'}`,
                        color: form.preMarket.marketBias === b ? (b === 'bullish' ? '#00d084' : b === 'bearish' ? '#ff4d4d' : '#ffd700') : '#8892a4',
                      }}>{b === 'bullish' ? 'Alta' : b === 'bearish' ? 'Baixa' : 'Neutro'}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs" style={{ color: '#8892a4' }}>Estado Mental</label>
                <select className={`${inputCls} mt-1.5`} style={inputStyle} value={form.preMarket.mentalState} onChange={(e) => set('preMarket','mentalState',e.target.value)}>
                  {Object.entries(emotionLabel).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs" style={{ color: '#8892a4' }}>Qualidade do Sono</label>
                <div className="mt-1.5"><StarRating value={form.preMarket.sleepQuality} onChange={(v) => set('preMarket','sleepQuality',v)} /></div>
              </div>
              <div>
                <label className="text-xs" style={{ color: '#8892a4' }}>Níveis Chave</label>
                <input className={`${inputCls} mt-1.5`} style={inputStyle} placeholder="Suporte em X, Resistência em Y..." value={form.preMarket.keyLevels} onChange={(e) => set('preMarket','keyLevels',e.target.value)} />
              </div>
              <div>
                <label className="text-xs" style={{ color: '#8892a4' }}>Plano do Dia</label>
                <textarea className={`${inputCls} mt-1.5`} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="O que você vai buscar hoje? Quais setups?" value={form.preMarket.plan} onChange={(e) => set('preMarket','plan',e.target.value)} />
              </div>
            </div>
          </div>

          {/* Post-market */}
          <div>
            <p className="text-sm font-bold mb-3" style={{ color: '#00d084' }}>PÓS-MERCADO</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs" style={{ color: '#8892a4' }}>Resumo do Dia</label>
                <textarea className={`${inputCls} mt-1.5`} style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} placeholder="Como foi o dia?" value={form.postMarket.summary} onChange={(e) => set('postMarket','summary',e.target.value)} />
              </div>
              <div>
                <label className="text-xs" style={{ color: '#8892a4' }}>Lições Aprendidas</label>
                <textarea className={`${inputCls} mt-1.5`} style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} placeholder="O que esse dia te ensinou?" value={form.postMarket.lessons} onChange={(e) => set('postMarket','lessons',e.target.value)} />
              </div>
              <div>
                <label className="text-xs" style={{ color: '#8892a4' }}>O que melhorar amanhã?</label>
                <textarea className={`${inputCls} mt-1.5`} style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} placeholder="Foco para o próximo dia..." value={form.postMarket.improvements} onChange={(e) => set('postMarket','improvements',e.target.value)} />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="accent-purple-500" checked={form.postMarket.followedRules} onChange={(e) => set('postMarket','followedRules',e.target.checked)} />
                <span className="text-sm text-white">Segui minhas regras hoje</span>
              </label>
              <div>
                <label className="text-xs" style={{ color: '#8892a4' }}>Avaliação Geral do Dia</label>
                <div className="mt-1.5"><StarRating value={form.postMarket.overallRating} onChange={(v) => set('postMarket','overallRating',v)} /></div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ border: '1px solid #2a2d3e', color: '#8892a4' }}>Cancelar</button>
            <button type="submit" className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#6c63ff,#a78bfa)' }}>
              {isEditing ? 'Salvar Alterações' : 'Salvar Entrada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function Journal() {
  const { journalEntries } = useStore()
  const isMobile = useIsMobile()
  const [showForm, setShowForm] = useState(false)
  const [editEntry, setEditEntry] = useState<JournalEntry | undefined>()
  const pad = isMobile ? '12px 14px 80px' : '20px 28px 28px'

  function handleEdit(entry: JournalEntry) {
    setEditEntry(entry)
    setShowForm(true)
  }

  function handleClose() {
    setShowForm(false)
    setEditEntry(undefined)
  }

  return (
    <div style={{ padding: pad }} className="space-y-4">
      {showForm && <JournalForm onClose={handleClose} entry={editEntry} />}

      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: '#5a6280' }}>Registro diário da sua evolução</p>
        <button onClick={() => { setEditEntry(undefined); setShowForm(true) }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', boxShadow: '0 4px 16px rgba(108,99,255,0.3)' }}>
          <Plus size={16} /> Nova Entrada
        </button>
      </div>

      {journalEntries.length === 0 ? (
        <div className="text-center py-16" style={{ color: '#8892a4' }}>
          <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg mb-2">Nenhuma entrada no diário</p>
          <p className="text-sm">O diário é fundamental para evoluir como trader. Comece agora!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {journalEntries.map((e) => <EntryCard key={e.id} entry={e} onEdit={handleEdit} />)}
        </div>
      )}
    </div>
  )
}
