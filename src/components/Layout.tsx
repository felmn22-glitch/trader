import { useState } from 'react'
import {
  LayoutDashboard, TrendingUp, FileText, BookOpen,
  ClipboardList, Shield, Settings, ChevronLeft, ChevronRight,
  X, Menu,
} from 'lucide-react'
import { useIsMobile } from '../hooks'

interface LayoutProps {
  children: React.ReactNode
  page: string
  setPage: (p: string) => void
}

const allNav = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'trades', label: 'Operações', icon: TrendingUp },
  { id: 'tax', label: 'Impostos', icon: FileText },
  { id: 'journal', label: 'Diário', icon: BookOpen },
  { id: 'rules', label: 'Regras', icon: ClipboardList },
  { id: 'risk', label: 'Risco', icon: Shield },
  { id: 'settings', label: 'Configurações', icon: Settings },
]

const mobileMain = ['dashboard', 'trades', 'tax', 'risk']
const mobileMore = ['journal', 'rules', 'settings']

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Visão geral do desempenho' },
  trades: { title: 'Operações', subtitle: 'Planilha de trades' },
  tax: { title: 'Impostos', subtitle: 'Apuração IR · Day Trade' },
  journal: { title: 'Diário', subtitle: 'Reflexões diárias' },
  rules: { title: 'Regras', subtitle: 'Disciplina de trading' },
  risk: { title: 'Gestão de Risco', subtitle: 'Parâmetros de capital' },
  settings: { title: 'Configurações', subtitle: 'Conta e preferências' },
}

export function Layout({ children, page, setPage }: LayoutProps) {
  const isMobile = useIsMobile()
  const [collapsed, setCollapsed] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const info = pageTitles[page] ?? { title: page, subtitle: '' }

  function nav(id: string) {
    setPage(id)
    setMoreOpen(false)
  }

  if (isMobile) {
    const mobileNavItems = allNav.filter(n => mobileMain.includes(n.id))
    const mobileMoreItems = allNav.filter(n => mobileMore.includes(n.id))

    return (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#07080f', overflow: 'hidden' }}>
          {/* Mobile header */}
          <header style={{
            height: 54, minHeight: 54, display: 'flex', alignItems: 'center',
            padding: '0 16px', gap: 12, background: '#0c0e1a',
            borderBottom: '1px solid #181b2e', flexShrink: 0,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              background: 'linear-gradient(135deg,#6c63ff,#a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TrendingUp size={16} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 15, color: '#fff', margin: 0, lineHeight: 1 }}>{info.title}</p>
              <p style={{ fontSize: 11, color: '#4a5170', margin: 0, marginTop: 2 }}>{info.subtitle}</p>
            </div>
            <button
              onClick={() => nav('settings')}
              style={{
                width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg,#6c63ff,#a78bfa)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
              }}
            >T</button>
          </header>

          {/* Content */}
          <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            {children}
          </main>

          {/* Bottom nav */}
          <nav style={{
            height: 64, minHeight: 64, display: 'flex', alignItems: 'center',
            background: '#0c0e1a', borderTop: '1px solid #181b2e', flexShrink: 0,
          }}>
            {mobileNavItems.map(({ id, label, icon: Icon }) => {
              const active = page === id
              return (
                <button
                  key={id}
                  onClick={() => nav(id)}
                  style={{
                    flex: 1, height: '100%', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 4,
                    border: 'none', background: 'none', cursor: 'pointer',
                    color: active ? '#a78bfa' : '#3a4060',
                  }}
                >
                  <Icon size={22} />
                  <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{label}</span>
                </button>
              )
            })}
            <button
              onClick={() => setMoreOpen(true)}
              style={{
                flex: 1, height: '100%', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 4,
                border: 'none', background: 'none', cursor: 'pointer',
                color: mobileMore.includes(page) ? '#a78bfa' : '#3a4060',
              }}
            >
              <Menu size={22} />
              <span style={{ fontSize: 10, fontWeight: 500 }}>Mais</span>
            </button>
          </nav>
        </div>

        {/* More drawer */}
        {moreOpen && (
          <div
            onClick={() => setMoreOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: '#0c0e1a', borderTop: '1px solid #181b2e',
                borderRadius: '20px 20px 0 0', padding: '12px 8px 24px',
              }}
            >
              <div style={{ width: 40, height: 4, borderRadius: 2, background: '#2a2d3e', margin: '0 auto 16px' }} />
              {mobileMoreItems.map(({ id, label, icon: Icon }) => {
                const active = page === id
                return (
                  <button
                    key={id}
                    onClick={() => nav(id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 20px', border: 'none', background: active ? 'rgba(108,99,255,0.15)' : 'none',
                      borderRadius: 12, cursor: 'pointer', color: active ? '#c4b5fd' : '#8892a4',
                      fontSize: 15, fontWeight: active ? 600 : 500, marginBottom: 4,
                    }}
                  >
                    <Icon size={20} />
                    {label}
                  </button>
                )
              })}
              <button
                onClick={() => setMoreOpen(false)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px', border: '1px solid #1e2235', background: 'none',
                  borderRadius: 12, cursor: 'pointer', color: '#5a6280', fontSize: 14, marginTop: 8,
                }}
              >
                <X size={16} /> Fechar
              </button>
            </div>
          </div>
        )}
      </>
    )
  }

  // Desktop
  const sidebarW = collapsed ? 64 : 220
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#07080f', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarW, minWidth: sidebarW, background: '#0c0e1a',
        borderRight: '1px solid #181b2e', display: 'flex', flexDirection: 'column',
        transition: 'width 0.2s cubic-bezier(.4,0,.2,1)', overflow: 'hidden', flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{
          height: 60, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10,
          borderBottom: '1px solid #181b2e', flexShrink: 0,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg,#6c63ff,#a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(108,99,255,0.3)',
          }}>
            <TrendingUp size={17} color="#fff" />
          </div>
          {!collapsed && (
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#fff', lineHeight: 1, margin: 0 }}>TraderPro</p>
              <p style={{ fontSize: 10, color: '#3a4060', marginTop: 2, margin: 0 }}>Consistência = Lucro</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {allNav.map(({ id, label, icon: Icon }) => {
            const active = page === id
            return (
              <button
                key={id}
                onClick={() => setPage(id)}
                title={collapsed ? label : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 11,
                  width: '100%', padding: collapsed ? '12px 0' : '10px 12px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderRadius: 9, border: 'none', cursor: 'pointer',
                  background: active ? 'rgba(108,99,255,0.16)' : 'transparent',
                  color: active ? '#c4b5fd' : '#4a5170',
                  fontWeight: active ? 600 : 500, fontSize: 13,
                  outline: active ? '1px solid rgba(108,99,255,0.25)' : '1px solid transparent',
                  transition: 'all 0.12s',
                }}
              >
                <Icon size={18} style={{ flexShrink: 0, opacity: active ? 1 : 0.65 }} />
                {!collapsed && label}
              </button>
            )
          })}
        </nav>

        {/* Collapse button */}
        <div style={{ padding: 6, borderTop: '1px solid #181b2e', flexShrink: 0 }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 8, padding: collapsed ? '10px 0' : '10px 12px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#2a3050', fontSize: 12, borderRadius: 8,
            }}
          >
            {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Recolher</span></>}
          </button>
        </div>
      </aside>

      {/* Right side */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Header */}
        <header style={{
          height: 60, minHeight: 60, display: 'flex', alignItems: 'center',
          padding: '0 28px', background: '#0c0e1a', borderBottom: '1px solid #181b2e',
          gap: 16, flexShrink: 0,
        }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: '#eef0f8', margin: 0, lineHeight: 1 }}>{info.title}</h1>
            {info.subtitle && <p style={{ fontSize: 11, color: '#3a4060', marginTop: 3, margin: 0 }}>{info.subtitle}</p>}
          </div>
          <button
            onClick={() => setPage('settings')}
            title="Configurações"
            style={{
              width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#6c63ff,#a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
              boxShadow: '0 2px 8px rgba(108,99,255,0.4)',
            }}
          >T</button>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
