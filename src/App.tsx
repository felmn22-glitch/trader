import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { useStore } from './store'
import { Layout } from './components/Layout'
import { Dashboard } from './components/Dashboard'
import { Trades } from './components/Trades'
import { Tax } from './components/Tax'
import { Journal } from './components/Journal'
import { Rules } from './components/Rules'
import { Risk } from './components/Risk'
import { SettingsPage } from './components/SettingsPage'
import { Auth } from './components/Auth'
import { TrendingUp, Loader2 } from 'lucide-react'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#0f1117' }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6c63ff,#a78bfa)' }}>
        <TrendingUp size={24} color="#fff" />
      </div>
      <Loader2 size={24} color="#6c63ff" className="animate-spin" />
      <p className="text-sm" style={{ color: '#8892a4' }}>Carregando dados...</p>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [page, setPage] = useState('dashboard')
  const { loadData, loading } = useStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadData()
    })
    return () => subscription.unsubscribe()
  }, [loadData])

  // Still checking session
  if (session === undefined) return <LoadingScreen />

  // Not logged in
  if (!session) return <Auth />

  // Loading data from Supabase
  if (loading) return <LoadingScreen />

  const content = {
    dashboard: <Dashboard setPage={setPage} />,
    trades: <Trades />,
    tax: <Tax />,
    journal: <Journal />,
    rules: <Rules />,
    risk: <Risk />,
    settings: <SettingsPage session={session} />,
  }[page] ?? <Dashboard setPage={setPage} />

  return (
    <Layout page={page} setPage={setPage}>
      {content}
    </Layout>
  )
}
