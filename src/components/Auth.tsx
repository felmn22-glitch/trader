import { useState } from 'react'
import { TrendingUp, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function Auth() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) setError(error.message)
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) setError(error.message)
        else setMessage('Conta criada! Verifique seu e-mail para confirmar.')
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email)
        if (error) setError(error.message)
        else setMessage('E-mail de recuperação enviado. Verifique sua caixa de entrada.')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 44px',
    borderRadius: 12,
    fontSize: 14,
    color: '#e8eaf0',
    background: '#0d0f1a',
    border: '1px solid #3a3d5e',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'linear-gradient(135deg, #07080f 0%, #0f1117 50%, #131627 100%)' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, background: 'linear-gradient(135deg,#6c63ff,#a78bfa)' }}>
            <TrendingUp size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>TraderPro</h1>
          <p style={{ fontSize: 14, color: '#8892a4', marginTop: 6 }}>
            {mode === 'login' ? 'Acesse sua conta' : mode === 'signup' ? 'Crie sua conta' : 'Recuperar senha'}
          </p>
        </div>

        {/* Card */}
        <div style={{ borderRadius: 20, padding: 32, background: '#1a1d2e', border: '1px solid #3a3d5e', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Email */}
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: 14, pointerEvents: 'none' }}>
                <Mail size={16} color="#6b7280" />
              </span>
              <input
                type="email"
                style={inputStyle}
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            {mode !== 'forgot' && (
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: 14, pointerEvents: 'none' }}>
                  <Lock size={16} color="#6b7280" />
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  style={{ ...inputStyle, paddingRight: 44 }}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  style={{ position: 'absolute', right: 14, top: 14, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff size={16} color="#6b7280" /> : <Eye size={16} color="#6b7280" />}
                </button>
              </div>
            )}

            {/* Forgot link */}
            {mode === 'login' && (
              <div style={{ textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#6c63ff' }}
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            {/* Error / Message */}
            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', color: '#ff4d4d' }}>
                {error}
              </div>
            )}
            {message && (
              <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, background: 'rgba(0,208,132,0.1)', border: '1px solid rgba(0,208,132,0.3)', color: '#00d084' }}>
                {message}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '13px 0', borderRadius: 12, fontWeight: 700, fontSize: 15, color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {loading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
              {mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar Conta' : 'Enviar e-mail'}
            </button>
          </form>

          {/* Toggle mode */}
          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: '#8892a4' }}>
            {mode === 'login' ? (
              <>Não tem conta?{' '}
                <button onClick={() => { setMode('signup'); setError(''); setMessage('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: '#a78bfa' }}>Cadastrar</button>
              </>
            ) : (
              <button onClick={() => { setMode('login'); setError(''); setMessage('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a78bfa' }}>
                ← Voltar para o login
              </button>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, marginTop: 24, color: '#4a4d5e' }}>
          Dados armazenados com segurança no Supabase
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
