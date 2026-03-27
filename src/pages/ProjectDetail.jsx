import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAppStore, STATUS_LABELS } from '../store/useAppStore'
import StatusBadge from '../components/StatusBadge'
import MaterialsTab from '../components/tabs/MaterialsTab'
import TimeTab from '../components/tabs/TimeTab'
import ExpensesTab from '../components/tabs/ExpensesTab'
import PricingTab from '../components/tabs/PricingTab'
import ProductCardTab from '../components/tabs/ProductCardTab'

const TABS = [
  { id: 'materials', label: 'Материалы' },
  { id: 'time',      label: 'Время' },
  { id: 'expenses',  label: 'Расходы' },
  { id: 'pricing',   label: 'Цена' },
  { id: 'card',      label: 'Карточка товара' },
]

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { upsertProject, removeProject } = useAppStore()

  const [project, setProject] = useState(null)
  const [materials, setMaterials] = useState([])
  const [sessions, setSessions] = useState([])
  const [expenses, setExpenses] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('materials')
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')

  useEffect(() => { loadProject() }, [id])

  async function loadProject() {
    setLoading(true)
    const [projRes, matRes, sessRes, expRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('materials').select('*').eq('project_id', id).order('created_at'),
      supabase.from('time_sessions').select('*').eq('project_id', id).order('date', { ascending: false }),
      supabase.from('expenses').select('*').eq('project_id', id).single(),
    ])

    if (projRes.data) {
      setProject(projRes.data)
      setNameValue(projRes.data.name)
      upsertProject(projRes.data)
    }
    if (matRes.data) setMaterials(matRes.data)
    if (sessRes.data) setSessions(sessRes.data)
    setExpenses(expRes.data || {})
    setLoading(false)
  }

  async function updateProjectField(field, value) {
    const { data } = await supabase
      .from('projects')
      .update({ [field]: value })
      .eq('id', id)
      .select()
      .single()
    if (data) { setProject(data); upsertProject(data) }
  }

  async function saveName() {
    setEditingName(false)
    if (nameValue.trim() && nameValue !== project.name) {
      await updateProjectField('name', nameValue.trim())
    }
  }

  async function deleteProject() {
    if (!confirm(`Удалить проект "${project.name}"?`)) return
    await supabase.from('projects').delete().eq('id', id)
    removeProject(id)
    navigate('/')
  }

  if (loading) return (
    <div className="flex items-center justify-center h-48" style={{ color: 'var(--color-text-muted)' }}>
      Загрузка...
    </div>
  )

  if (!project) return (
    <div className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
      Проект не найден
    </div>
  )

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1 text-sm mb-4 transition-colors"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Все проекты
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          {editingName ? (
            <input
              autoFocus
              value={nameValue}
              onChange={e => setNameValue(e.target.value)}
              onBlur={saveName}
              onKeyDown={e => e.key === 'Enter' && saveName()}
              className="input text-xl font-bold w-full max-w-sm"
            />
          ) : (
            <h1
              className="text-2xl font-bold cursor-pointer hover:opacity-70 transition-opacity"
              onClick={() => setEditingName(true)}
              title="Нажмите чтобы переименовать"
            >
              {project.name}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusSelect status={project.status} onChange={v => updateProjectField('status', v)} />
          <button
            onClick={deleteProject}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            title="Удалить проект"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-pill ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'materials' && (
          <MaterialsTab
            projectId={id}
            materials={materials}
            setMaterials={setMaterials}
          />
        )}
        {activeTab === 'time' && (
          <TimeTab
            projectId={id}
            project={project}
            sessions={sessions}
            setSessions={setSessions}
            onUpdateProject={updateProjectField}
          />
        )}
        {activeTab === 'expenses' && (
          <ExpensesTab
            projectId={id}
            expenses={expenses}
            setExpenses={setExpenses}
            salePrice={project.sale_price || 0}
          />
        )}
        {activeTab === 'pricing' && (
          <PricingTab
            project={project}
            materials={materials}
            sessions={sessions}
            expenses={expenses}
            onUpdateProject={updateProjectField}
          />
        )}
        {activeTab === 'card' && (
          <ProductCardTab
            project={project}
            onUpdateProject={updateProjectField}
          />
        )}
      </div>
    </div>
  )
}

function StatusSelect({ status, onChange }) {
  return (
    <div className="relative">
      <select
        value={status}
        onChange={e => onChange(e.target.value)}
        className="appearance-none pr-6 pl-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border-0 outline-none"
        style={{
          background: 'var(--color-secondary)',
          color: 'var(--color-text-main)',
        }}
      >
        {Object.entries(STATUS_LABELS).map(([val, label]) => (
          <option key={val} value={val}>{label}</option>
        ))}
      </select>
    </div>
  )
}
