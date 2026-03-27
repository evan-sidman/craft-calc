import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAppStore } from '../../store/useAppStore'
import { formatMoney, formatHours, formatDuration, formatDate } from '../../utils/format'
import { calcTotalHours, calcTotalDays } from '../../utils/calculations'

export default function TimeTab({ projectId, project, sessions, setSessions, onUpdateProject }) {
  const { activeTimer, startTimer, stopTimer } = useAppStore()
  const isThisTimer = activeTimer?.projectId === projectId
  const [elapsed, setElapsed] = useState(0)
  const [editingId, setEditingId] = useState(null)
  const [plannedInput, setPlannedInput] = useState(project.planned_hours || '')
  const [rateInput, setRateInput] = useState(project.target_hourly_rate || '')

  // Live counter
  useEffect(() => {
    if (!isThisTimer) { setElapsed(0); return }
    const calc = () => {
      const diff = Math.floor((Date.now() - new Date(activeTimer.startedAt).getTime()) / 1000)
      setElapsed(diff)
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [isThisTimer, activeTimer])

  // Warn if timer has been running > 8 hours
  const showLongWarning = isThisTimer && elapsed > 8 * 3600

  async function handleStart() {
    if (activeTimer && !isThisTimer) {
      if (!confirm(`Таймер уже запущен для "${activeTimer.projectName}". Остановить его и начать здесь?`)) return
      await handleStop(true)
    }
    startTimer(projectId, project.name)
  }

  async function handleStop(silent = false) {
    const timer = stopTimer()
    if (!timer) return

    const startedAt = new Date(timer.startedAt)
    const endedAt = new Date()
    const hours = Math.round(((endedAt - startedAt) / 3600000) * 100) / 100

    const today = startedAt.toISOString().split('T')[0]
    const startTime = startedAt.toTimeString().slice(0, 5)
    const endTime = endedAt.toTimeString().slice(0, 5)

    const { data } = await supabase
      .from('time_sessions')
      .insert({
        project_id: projectId,
        date: today,
        start_time: startTime,
        end_time: endTime,
        hours,
        note: '',
      })
      .select()
      .single()

    if (data) setSessions(prev => [data, ...prev])
  }

  async function saveSession(session) {
    const hours = calcHoursFromTimes(session.start_time, session.end_time, session.date)
    const updated = { ...session, hours }
    setSessions(prev => prev.map(s => s.id === session.id ? updated : s))
    await supabase.from('time_sessions').update(updated).eq('id', session.id)
    setEditingId(null)
  }

  async function deleteSession(id) {
    setSessions(prev => prev.filter(s => s.id !== id))
    await supabase.from('time_sessions').delete().eq('id', id)
  }

  async function addManual() {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('time_sessions')
      .insert({ project_id: projectId, date: today, start_time: '10:00', end_time: '12:00', hours: 2, note: '' })
      .select()
      .single()
    if (data) { setSessions(prev => [data, ...prev]); setEditingId(data.id) }
  }

  const totalHours = calcTotalHours(sessions)
  const totalDays = calcTotalDays(sessions)
  const plannedHours = project.planned_hours || 0
  const progress = plannedHours > 0 ? Math.min(totalHours / plannedHours, 1) : 0

  return (
    <div className="space-y-4">
      {/* Timer card */}
      <div className="card text-center py-8" style={{ background: 'var(--color-timer-bg)' }}>
        {isThisTimer ? (
          <>
            <p className="text-xs font-semibold mb-3 tracking-widest uppercase" style={{ color: 'var(--color-text-muted)' }}>
              Идёт запись времени
            </p>
            <div className="font-mono text-5xl font-bold mb-2 tracking-tight">
              {formatDuration(elapsed)}
            </div>
            <p className="text-xs mb-6" style={{ color: 'var(--color-text-muted)' }}>
              Начато в {new Date(activeTimer.startedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </p>
            {showLongWarning && (
              <p className="text-xs mb-4 px-4 py-2 rounded-xl" style={{ background: '#FFF3CD', color: '#856404' }}>
                ⚠️ Таймер работает больше 8 часов — вы точно всё ещё работаете?
              </p>
            )}
            <button
              onClick={() => handleStop()}
              className="btn-primary px-8 py-3 text-base"
            >
              ⏹ Стоп
            </button>
          </>
        ) : (
          <>
            <div className="font-mono text-5xl font-bold mb-6 tracking-tight" style={{ color: 'var(--color-border)' }}>
              00:00:00
            </div>
            <button
              onClick={handleStart}
              className="btn-primary px-8 py-3 text-base flex items-center gap-2 mx-auto"
            >
              ▶ Начать работу
            </button>
          </>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatChip label="Потрачено" value={formatHours(totalHours)} icon="⏱" />
        <StatChip label="Дней работы" value={totalDays} icon="📅" />
        <div className="card text-center">
          <div className="text-xl mb-1">🎯</div>
          <div className="font-bold text-lg">{formatHours(plannedHours || 0)}</div>
          <div className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>Запланировано</div>
          {plannedHours > 0 && (
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
              <div className="h-full rounded-full" style={{ width: `${progress * 100}%`, background: 'var(--color-primary)' }} />
            </div>
          )}
        </div>
      </div>

      {/* Settings row */}
      <div className="card">
        <h3 className="text-sm font-semibold mb-3">Настройки</h3>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Запланировано часов</label>
            <input
              type="number" min="0" step="0.5"
              className="input"
              value={plannedInput}
              onChange={e => setPlannedInput(e.target.value)}
              onBlur={() => onUpdateProject('planned_hours', parseFloat(plannedInput) || 0)}
              placeholder="10"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Моя ставка, ₽/час</label>
            <input
              type="number" min="0"
              className="input"
              value={rateInput}
              onChange={e => setRateInput(e.target.value)}
              onBlur={() => onUpdateProject('target_hourly_rate', parseFloat(rateInput) || 0)}
              placeholder="300"
            />
          </div>
        </div>
      </div>

      {/* Session log */}
      <div className="card">
        <h3 className="text-sm font-semibold mb-3">История сессий</h3>

        {sessions.length === 0 && (
          <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
            Пока нет сессий — нажмите «Начать работу» или добавьте вручную
          </p>
        )}

        <div className="space-y-2">
          {sessions.map(session => (
            editingId === session.id
              ? <SessionEditRow key={session.id} session={session} onSave={saveSession} onCancel={() => setEditingId(null)} onDelete={deleteSession} />
              : <SessionRow key={session.id} session={session} onEdit={() => setEditingId(session.id)} />
          ))}
        </div>

        <button onClick={addManual} className="btn-secondary w-full mt-4 flex items-center justify-center gap-2 text-sm">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Добавить сессию вручную
        </button>
      </div>
    </div>
  )
}

function StatChip({ label, value, icon }) {
  return (
    <div className="card text-center">
      <div className="text-xl mb-1">{icon}</div>
      <div className="font-bold text-lg">{value}</div>
      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
    </div>
  )
}

function SessionRow({ session, onEdit }) {
  return (
    <div
      className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-sm"
      style={{ background: 'var(--color-bg)' }}
    >
      <span className="w-16 font-medium flex-shrink-0">{formatDate(session.date)}</span>
      <span style={{ color: 'var(--color-text-muted)' }} className="flex-shrink-0">
        {session.start_time} – {session.end_time}
      </span>
      <span className="font-semibold flex-shrink-0">{formatHours(session.hours)}</span>
      {session.note && (
        <span className="flex-1 truncate text-xs" style={{ color: 'var(--color-text-muted)' }}>{session.note}</span>
      )}
      <button onClick={onEdit} className="ml-auto flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
    </div>
  )
}

function SessionEditRow({ session, onSave, onCancel, onDelete }) {
  const [data, setData] = useState({ ...session })

  const field = (key, val) => setData(prev => ({ ...prev, [key]: val }))

  return (
    <div className="rounded-xl p-3 space-y-2 border" style={{ borderColor: 'var(--color-primary)', background: 'var(--color-timer-bg)' }}>
      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Дата</label>
          <input type="date" className="input text-sm" value={data.date} onChange={e => field('date', e.target.value)} />
        </div>
        <div>
          <label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Начало</label>
          <input type="time" className="input text-sm" value={data.start_time} onChange={e => field('start_time', e.target.value)} />
        </div>
        <div>
          <label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Конец</label>
          <input type="time" className="input text-sm" value={data.end_time} onChange={e => field('end_time', e.target.value)} />
        </div>
        <div>
          <label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Заметка</label>
          <input className="input text-sm" value={data.note || ''} onChange={e => field('note', e.target.value)} placeholder="необязательно" />
        </div>
      </div>
      <div className="flex gap-2 justify-between">
        <button
          onClick={() => onDelete(session.id)}
          className="text-xs px-3 py-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--color-danger)', background: '#FEE2E2' }}
        >
          Удалить
        </button>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-secondary text-xs px-3 py-1.5">Отмена</button>
          <button onClick={() => onSave(data)} className="btn-primary text-xs px-3 py-1.5">Сохранить</button>
        </div>
      </div>
    </div>
  )
}

function calcHoursFromTimes(start, end, date) {
  if (!start || !end) return 0
  const s = new Date(`${date}T${start}`)
  const e = new Date(`${date}T${end}`)
  let diff = (e - s) / 3600000
  if (diff < 0) diff += 24 // next day
  return Math.round(diff * 100) / 100
}
