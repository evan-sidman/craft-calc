import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useAppStore } from './store/useAppStore'
import AppShell from './components/AppShell'
import ProjectList from './pages/ProjectList'
import ProjectDetail from './pages/ProjectDetail'
import AuthPage from './pages/AuthPage'

export default function App() {
  const { user, setUser, theme } = useAppStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Apply saved theme
    document.documentElement.setAttribute('data-theme', theme)

    // Check session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>Мастерская</div>
      </div>
    )
  }

  if (!user) return <AuthPage />

  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<ProjectList />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
