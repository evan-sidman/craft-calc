import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { supabase } from '../lib/supabase'
import StatusBadge from '../components/StatusBadge'
import { formatMoney, formatHours } from '../utils/format'
import { calcMaterialsTotal, calcTotalHours } from '../utils/calculations'

export default function ProjectList() {
  const navigate = useNavigate()
  const { projects, setProjects } = useAppStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    setLoading(true)
    const { data, error } = await supabase
      .from('projects')
      .select(`*, materials(*), time_sessions(*), expenses(*)`)
      .order('created_at', { ascending: false })

    if (!error && data) setProjects(data)
    setLoading(false)
  }

  async function createProject() {
    const { data, error } = await supabase
      .from('projects')
      .insert({ name: 'Новый проект', status: 'in_progress' })
      .select()
      .single()

    if (!error && data) {
      navigate(`/project/${data.id}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48" style={{ color: 'var(--color-text-muted)' }}>
        Загрузка...
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Мои проекты</h1>
          {projects.length > 0 && (
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {projects.length} {pluralProjects(projects.length)}
            </p>
          )}
        </div>
        <button onClick={createProject} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Новый проект
        </button>
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
            style={{ background: 'var(--color-secondary)' }}>
            🧶
          </div>
          <p className="text-lg font-semibold">Ещё нет проектов</p>
          <p className="text-sm text-center max-w-xs" style={{ color: 'var(--color-text-muted)' }}>
            Создайте первый проект — добавьте материалы, отслеживайте время и рассчитайте цену
          </p>
          <button onClick={createProject} className="btn-primary mt-2">
            Создать первый проект
          </button>
        </div>
      )}

      {/* Grid */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => navigate(`/project/${project.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ProjectCard({ project, onClick }) {
  const { activeTimer } = useAppStore()
  const isTimerActive = activeTimer?.projectId === project.id

  const materials = project.materials || []
  const sessions = project.time_sessions || []
  const expenses = project.expenses?.[0] || {}

  const materialsTotal = calcMaterialsTotal(materials)
  const totalHours = calcTotalHours(sessions)
  const plannedHours = project.planned_hours || 0
  const progress = plannedHours > 0 ? Math.min(totalHours / plannedHours, 1) : 0

  const photo = project.photo_url

  return (
    <button
      onClick={onClick}
      className="card text-left hover:shadow-md transition-shadow cursor-pointer w-full p-0 overflow-hidden"
    >
      {/* Photo */}
      <div
        className="w-full h-36 flex items-center justify-center"
        style={{ background: 'var(--color-secondary)' }}
      >
        {photo ? (
          <img src={photo} alt={project.name} className="w-full h-full object-cover" />
        ) : (
          <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
            style={{ color: 'var(--color-text-muted)' }}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        )}
      </div>

      <div className="p-4">
        {/* Title + badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">{project.name}</h3>
          <div className="flex-shrink-0 flex items-center gap-1">
            {isTimerActive && (
              <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: 'var(--color-success)' }} />
            )}
            <StatusBadge status={project.status} />
          </div>
        </div>

        {/* Prices */}
        <div className="flex gap-3 mb-3">
          <div>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Себестоимость</p>
            <p className="text-sm font-semibold">{formatMoney(materialsTotal)}</p>
          </div>
          {project.sale_price > 0 && (
            <div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Цена продажи</p>
              <p className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                {formatMoney(project.sale_price)}
              </p>
            </div>
          )}
        </div>

        {/* Time progress */}
        {plannedHours > 0 && (
          <div>
            <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
              <span>{formatHours(totalHours)} потрачено</span>
              <span>из {formatHours(plannedHours)}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress * 100}%`, background: 'var(--color-primary)' }}
              />
            </div>
          </div>
        )}
      </div>
    </button>
  )
}

function pluralProjects(n) {
  if (n % 10 === 1 && n % 100 !== 11) return 'проект'
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'проекта'
  return 'проектов'
}
