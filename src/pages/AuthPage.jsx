import { useState } from 'react'
import { supabase } from '../lib/supabase'

function IconGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}


export default function AuthPage() {
  const [mode, setMode] = useState('login') // login | register
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState('')
  const [oauthLoading, setOauthLoading] = useState('')
  const [done, setDone] = useState(false)

  async function signInWithOAuth(provider) {
    setOauthLoading(provider)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin }
    })
    if (error) { setError(error.message); setOauthLoading('') }
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setDone(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-bg)' }}>
      <div className="card w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>Мастерская</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Учёт проектов для мастеров
          </p>
        </div>

        {done ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">✉️</div>
            <p className="font-semibold mb-2">Проверьте почту</p>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Мы отправили письмо на {email} для подтверждения
            </p>
            <button onClick={() => setDone(false)} className="btn-secondary mt-4 w-full">
              Войти
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--color-text-muted)' }}>Email</label>
              <input
                type="email" required
                className="input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--color-text-muted)' }}>Пароль</label>
              <input
                type="password" required minLength={6}
                className="input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm px-3 py-2 rounded-xl" style={{ background: '#FEE2E2', color: '#991B1B' }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
            </button>

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>или</span>
              <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
            </div>

            <button
              type="button"
              onClick={() => signInWithOAuth('google')}
              disabled={!!oauthLoading}
              className="btn-secondary w-full py-3 flex items-center justify-center gap-2"
            >
              <IconGoogle />
              {oauthLoading === 'google' ? 'Перенаправление...' : 'Войти через Google'}
            </button>

            <p className="text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {mode === 'login' ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
              <button
                type="button"
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
                className="font-semibold"
                style={{ color: 'var(--color-primary)' }}
              >
                {mode === 'login' ? 'Зарегистрироваться' : 'Войти'}
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
