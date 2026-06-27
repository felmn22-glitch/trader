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

  const inputCls = "w-full px-4 py-3 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-purple-500 pl-11"
  const inputStyle = { background: '#12141f', border: '1px solid #2a2d3e' }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0f1117 0%, #1a1d2e 100%)' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg,#6c63ff,#a78bfa)' }}
          >
            <TrendingUp size={28} color="#fff" />
          </div>
          <h1 className="text-2xl font-bold text-white">TraderPro</h1>
          <p className="text-sm mt-1" style={{ color: '#8892a4' }}>
            {mode === 'login' ? 'Acesse sua conta' : mode === 'signup' ? 'Crie sua conta' : 'Recuperar senha'}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ background: '#1a1d2e', border: '1px solid #2a2d3e' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <Mail size={16} color="#8892a4" className="absolute left-3.5 top-3.5" />
              <input
                type="email"
                className={inputCls}
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
              <div className="relative">
                <Lock size={16} color="#8892a4" className="absolute left-3.5 top-3.5" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className={`${inputCls} pr-11`}
                  style={inputStyle}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-3.5"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass
                    ? <EyeOff size={16} color="#8892a4" />
                    : <Eye size={16} color="#8892a4" />}
                </button>
              </div>
            )}

            {/* Forgot link */}
            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-xs"
                  style={{ color: '#6c63ff' }}
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            {/* Error / Message */}
            {error && (
              <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', color: '#ff4d4d' }}>
                {error}
              </div>
            )}
            {message && (
              <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(0,208,132,0.1)', border: '1px solid rgba(0,208,132,0.3)', color: '#00d084' }}>
                {message}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#6c63ff,#a78bfa)' }}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar Conta' : 'Enviar e-mail'}
            </button>
          </form>

          {/* Toggle mode */}
          <div className="mt-6 text-center text-sm" style={{ color: '#8892a4' }}>
            {mode === 'login' ? (
              <>Não tem conta?{' '}
                <button onClick={() => { setMode('signup'); setError(''); setMessage('') }} className="font-semibold" style={{ color: '#a78bfa' }}>Cadastrar</button>
              </>
            ) : (
              <button onClick={() => { setMode('login'); setError(''); setMessage('') }} style={{ color: '#a78bfa' }}>
                ← Voltar para o login
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#4a4d5e' }}>
          Dados armazenados com segurança no Supabase
        </p>
      </div>
    </div>
  )
}
