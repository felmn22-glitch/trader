import { useState } from 'react'
import { Download, Upload, AlertTriangle, LogOut, User } from 'lucide-react'
import { useIsMobile } from '../hooks'
import type { Session } from '@supabase/supabase-js'
import { useStore } from '../store'
import { supabase } from '../lib/supabase'

interface Props {
  session: Session
}

export function SettingsPage({ session }: Props) {
  const { trades, journalEntries, rules, riskSettings } = useStore()
  const isMobile = useIsMobile()
  const [imported, setImported] = useState(false)

  function exportData() {
    const data = JSON.stringify({ trades, journalEntries, rules, riskSettings }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `traderpro-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importData(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        JSON.parse(ev.target?.result as string)
        setImported(true)
        alert('Importação via JSON disponível — os dados foram exportados. Para importar ao Supabase, use a função de restauração.')
      } catch {
        alert('Arquivo inválido')
      }
    }
    reader.onerror = () => alert('Erro ao ler o arquivo. Tente novamente.')
    reader.readAsText(file)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  const pad = isMobile ? '12px 14px 80px' : '20px 28px 28px'

  return (
    <div style={{ padding: pad }} className="space-y-5">
      {/* User info */}
      <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: '#1a1d2e', border: '1px solid #1e2235' }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(108,99,255,0.2)' }}>
          <User size={20} color="#6c63ff" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{session.user.email}</p>
          <p className="text-xs mt-0.5" style={{ color: '#8892a4' }}>Conta ativa · Dados no Supabase</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all hover:bg-white/5"
          style={{ border: '1px solid #2a2d3e', color: '#8892a4' }}
        >
          <LogOut size={14} /> Sair
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Operações', value: trades.length },
          { label: 'Entradas no Diário', value: journalEntries.length },
          { label: 'Regras', value: rules.length },
        ].map(({ label, value }) => (
          <div key={label} className="p-4 rounded-xl" style={{ background: '#1a1d2e', border: '1px solid #1e2235' }}>
            <p className="text-3xl font-bold text-white">{value}</p>
            <p className="text-xs mt-1" style={{ color: '#8892a4' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Backup */}
      <div className="rounded-xl p-5 space-y-4" style={{ background: '#1a1d2e', border: '1px solid #1e2235' }}>
        <p className="text-sm font-bold text-white">Backup de Dados</p>
        <p className="text-xs" style={{ color: '#8892a4' }}>Exporte seus dados como JSON para ter uma cópia local segura.</p>
        <div className="flex gap-3">
          <button onClick={exportData} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#1e2235', border: '1px solid #2a2d3e', color: '#e8eaf0' }}>
            <Download size={16} /> Exportar JSON
          </button>
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: '#1e2235', border: '1px solid #2a2d3e', color: '#e8eaf0' }}>
            <Upload size={16} /> Importar JSON
            <input type="file" accept=".json" className="hidden" onChange={importData} />
          </label>
        </div>
        {imported && <p className="text-sm" style={{ color: '#ffd700' }}>Arquivo lido. Contate suporte para restauração completa.</p>}
      </div>

      {/* Danger */}
      <div className="rounded-xl p-5 space-y-4" style={{ background: 'rgba(255,77,77,0.05)', border: '1px solid rgba(255,77,77,0.2)' }}>
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} color="#ff4d4d" />
          <p className="text-sm font-bold" style={{ color: '#ff4d4d' }}>Zona de Perigo</p>
        </div>
        <p className="text-xs" style={{ color: '#8892a4' }}>Estas ações são irreversíveis. Faça backup antes de prosseguir.</p>
        <button
          onClick={() => { if (confirm('Isso vai desconectar sua conta. Seus dados permanecem no Supabase.')) void handleLogout() }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', color: '#ff4d4d' }}
        >
          <LogOut size={16} /> Desconectar Conta
        </button>
      </div>

      {/* About */}
      <div className="rounded-xl p-5" style={{ background: '#1a1d2e', border: '1px solid #1e2235' }}>
        <p className="text-sm font-bold text-white mb-2">TraderPro</p>
        <p className="text-xs" style={{ color: '#8892a4' }}>Dados armazenados com segurança no Supabase. Acesse de qualquer dispositivo.</p>
      </div>
    </div>
  )
}
