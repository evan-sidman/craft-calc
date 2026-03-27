import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { formatDuration } from '../utils/format'
import ThemeSwitcher from './ThemeSwitcher'
import { supabase } from '../lib/supabase'

export default function AppShell({ children }) {
  const { activeTimer, theme } = useAppStore()
  const [elapsed, setElapsed] = useState(0)
  const [showTheme, setShowTheme] = useState(false)
  const navigate = useNavigate()

  // Live counter for active timer
  useEffect(() => {
    if (!activeTimer) { setElapsed(0); return }
    const calc = () => {
      const diff = Math.floor((Date.now() - new Date(activeTimer.startedAt).getTime()) / 1000)
      setElapsed(diff)
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [activeTimer])

  // Apply theme on mount and change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      {/* ─── Nav ─── */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-6 h-14 border-b"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        {/* Logo */}
        <Link to="/" className="text-base font-bold tracking-tight" style={{ color: 'var(--color-primary)' }}>
          Мастерская
        </Link>

        {/* Center: active timer pill */}
        {activeTimer && (
          <button
            onClick={() => navigate(`/project/${activeTimer.projectId}`)}
            className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors"
            style={{ background: 'var(--color-secondary)', color: 'var(--color-text-main)' }}
          >
            <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: 'var(--color-success)' }} />
            <span className="max-w-[120px] truncate">{activeTimer.projectName}</span>
            <span className="font-mono font-semibold">{formatDuration(elapsed)}</span>
          </button>
        )}

        {/* Right: nav links + theme */}
        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
            Проекты
          </Link>
          <div className="relative">
            <button
              onClick={() => setShowTheme(v => !v)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'var(--color-secondary)' }}
              title="Сменить тему"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            </button>
            {showTheme && <ThemeSwitcher onClose={() => setShowTheme(false)} />}
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'var(--color-secondary)' }}
            title="Выйти"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </header>

      {/* ─── Content ─── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      {/* ─── Footer ─── */}
      <footer className="text-center py-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        Мастерская CraftCalc
      </footer>
    </div>
  )
}
