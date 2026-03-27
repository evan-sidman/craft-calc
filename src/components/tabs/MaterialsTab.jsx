import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatMoney } from '../../utils/format'
import { calcMaterialsTotal } from '../../utils/calculations'

const UNITS = ['г', 'кг', 'м', 'см', 'мл', 'л', 'шт', 'уп']

export default function MaterialsTab({ projectId, materials, setMaterials }) {
  async function addRow() {
    const { data } = await supabase
      .from('materials')
      .insert({ project_id: projectId, name: '', qty: 1, unit: 'шт', price_per_unit: 0 })
      .select()
      .single()
    if (data) setMaterials(prev => [...prev, data])
  }

  async function updateRow(id, field, value) {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m))
    await supabase.from('materials').update({ [field]: value }).eq('id', id)
  }

  async function deleteRow(id) {
    setMaterials(prev => prev.filter(m => m.id !== id))
    await supabase.from('materials').delete().eq('id', id)
  }

  const total = calcMaterialsTotal(materials)

  return (
    <div className="card">
      <h2 className="font-semibold mb-4">Материалы проекта</h2>

      {materials.length === 0 ? (
        <p className="text-sm py-4 text-center" style={{ color: 'var(--color-text-muted)' }}>
          Добавьте материалы — нитки, дерево, фурнитуру...
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <th className="text-left pb-2 font-medium">Название</th>
                <th className="text-right pb-2 font-medium w-20">Кол-во</th>
                <th className="text-left pb-2 font-medium w-16">Ед.</th>
                <th className="text-right pb-2 font-medium w-24">Цена/ед.</th>
                <th className="text-right pb-2 font-medium w-24">Итого</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {materials.map(m => (
                <MaterialRow
                  key={m.id}
                  material={m}
                  onUpdate={updateRow}
                  onDelete={deleteRow}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <button onClick={addRow} className="btn-secondary flex items-center gap-2 text-sm">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Добавить материал
        </button>
        {materials.length > 0 && (
          <div className="text-right">
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Итого материалы</p>
            <p className="text-lg font-bold">{formatMoney(total)}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function MaterialRow({ material: m, onUpdate, onDelete }) {
  const rowTotal = (m.qty || 0) * (m.price_per_unit || 0)

  return (
    <tr>
      <td className="py-2 pr-2">
        <input
          className="input text-sm"
          value={m.name}
          onChange={e => onUpdate(m.id, 'name', e.target.value)}
          onBlur={e => onUpdate(m.id, 'name', e.target.value)}
          placeholder="Название материала"
        />
      </td>
      <td className="py-2 px-1">
        <input
          type="number"
          min="0"
          step="0.1"
          className="input text-sm text-right"
          value={m.qty || ''}
          onChange={e => onUpdate(m.id, 'qty', parseFloat(e.target.value) || 0)}
        />
      </td>
      <td className="py-2 px-1">
        <select
          className="input text-sm"
          value={m.unit}
          onChange={e => onUpdate(m.id, 'unit', e.target.value)}
        >
          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </td>
      <td className="py-2 px-1">
        <input
          type="number"
          min="0"
          step="0.01"
          className="input text-sm text-right"
          value={m.price_per_unit || ''}
          onChange={e => onUpdate(m.id, 'price_per_unit', parseFloat(e.target.value) || 0)}
          placeholder="0"
        />
      </td>
      <td className="py-2 pl-1 text-right font-semibold whitespace-nowrap">
        {formatMoney(rowTotal)}
      </td>
      <td className="py-2 pl-2">
        <button
          onClick={() => onDelete(m.id)}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors opacity-40 hover:opacity-100"
          style={{ color: 'var(--color-danger)' }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </td>
    </tr>
  )
}
