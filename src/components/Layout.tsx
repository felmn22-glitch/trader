import { useState } from 'react'
import {
  LayoutDashboard, BookOpen, ClipboardList, Shield, Settings,
  TrendingUp, Menu, X, ChevronRight
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
  page: string
  setPage: (p: string) => void
}

const nav = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'trades', label: 'Operações', icon: TrendingUp },
  { id: 'journal', label: 'Diário', icon: BookOpen },
  { id: 'rules', label: 'Regras', icon: ClipboardList },
  { id: 'risk', label: 'Gestão de Risco', icon: Shield },
  { id: 'settings', label: 'Configurações', icon: Settings },
]

export function Layout({ children, page, setPage }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0f1117' }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col transition-all duration-300 shrink-0"
        style={{
          width: collapsed ? 64 : 220,
          background: '#12141f',
          borderRight: '1px solid #1e2235',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-4 py-5 cursor-pointer"
          style={{ borderBottom: '1px solid #1e2235' }}
          onClick={() => setCollapsed(!collapsed)}
        >
          <div
            className="shrink-0 flex items-center justify-center rounded-lg w-8 h-8"
            style={{ background: 'linear-gradient(135deg,#6c63ff,#a78bfa)' }}
          >
            <TrendingUp size={16} color="#fff" />
          </div>
          {!collapsed && (
            <span className="font-bold text-white text-sm tracking-wide">TraderPro</span>
          )}
          <span className="ml-auto">
            {collapsed
              ? <ChevronRight size={14} color="#8892a4" />
              : <X size={14} color="#8892a4" />}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-2 flex-1">
          {nav.map(({ id, label, icon: Icon }) => {
            const active = page === id
            return (
              <button
                key={id}
                onClick={() => setPage(id)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150"
                style={{
                  background: active ? 'rgba(108,99,255,0.15)' : 'transparent',
                  color: active ? '#a78bfa' : '#8892a4',
                  border: active ? '1px solid rgba(108,99,255,0.25)' : '1px solid transparent',
                }}
                title={collapsed ? label : undefined}
              >
                <Icon size={18} />
                {!collapsed && <span className="text-sm font-medium">{label}</span>}
              </button>
            )
          })}
        </nav>

        {!collapsed && (
          <div className="p-3 m-3 rounded-lg" style={{ background: '#1a1d2e', border: '1px solid #1e2235' }}>
            <p className="text-xs font-semibold" style={{ color: '#6c63ff' }}>Consistência = Lucro</p>
            <p className="text-xs mt-1" style={{ color: '#8892a4' }}>Siga o plano. Sempre.</p>
          </div>
        )}
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
