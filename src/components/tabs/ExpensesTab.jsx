import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { formatMoney } from '../../utils/format'

const PRESET_EXPENSES = [
  { key: 'packaging',   label: 'Упаковка',              type: 'fixed' },
  { key: 'shipping',    label: 'Доставка',               type: 'fixed' },
  { key: 'commission',  label: 'Комиссия площадки',      type: 'percent' },
  { key: 'promo',       label: 'Продвижение / реклама',  type: 'fixed' },
]

export default function ExpensesTab({ projectId, expenses, setExpenses, salePrice }) {
  const [items, setItems] = useState(expenses.items || [])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setItems(expenses.items || [])
  }, [expenses.id])

  async function save(updated) {
    setSaving(true)
    const payload = { ...updated, project_id: projectId, items: updated.items || items }

    if (expenses.id) {
      const { data } = await supabase.from('expenses').update(payload).eq('id', expenses.id).select().single()
      if (data) setExpenses(data)
    } else {
      const { data } = await supabase.from('expenses').insert(payload).select().single()
      if (data) setExpenses(data)
    }
    setSaving(false)
  }

  function updateField(key, value) {
    const updated = { ...expenses, [key]: value }
    setExpenses(updated)
    clearTimeout(window._expTimer)
    window._expTimer = setTimeout(() => save(updated), 800)
  }

  async function addItem() {
    const newItems = [...items, { id: crypto.randomUUID(), label: '', amount: 0 }]
    setItems(newItems)
    await save({ ...expenses, items: newItems })
  }

  async function updateItem(id, field, value) {
    const newItems = items.map(i => i.id === id ? { ...i, [field]: value } : i)
    setItems(newItems)
    clearTimeout(window._itemTimer)
    window._itemTimer = setTimeout(() => save({ ...expenses, items: newItems }), 800)
  }

  async function deleteItem(id) {
    const newItems = items.filter(i => i.id !== id)
    setItems(newItems)
    await save({ ...expenses, items: newItems })
  }

  // Totals
  const packagingTotal = expenses.packaging || 0
  const shippingTotal = expenses.shipping || 0
  const commissionTotal = salePrice * ((expenses.commission_percent || 0) / 100)
  const promoTotal = expenses.promo || 0
  const itemsTotal = items.reduce((s, i) => s + (i.amount || 0), 0)
  const grandTotal = packagingTotal + shippingTotal + commissionTotal + promoTotal + itemsTotal

  return (
    <div className="card space-y-4">
      <h2 className="font-semibold">Дополнительные расходы</h2>

      {/* Preset rows */}
      <div className="space-y-2">
        <PresetRow
          label="Упаковка"
          type="fixed"
          value={expenses.packaging || ''}
          onChange={v => updateField('packaging', v)}
          total={packagingTotal}
        />
        <PresetRow
          label="Доставка"
          type="fixed"
          value={expenses.shipping || ''}
          onChange={v => updateField('shipping', v)}
          total={shippingTotal}
        />
        <PresetRow
          label="Комиссия площадки"
          type="percent"
          value={expenses.commission_percent || ''}
          onChange={v => updateField('commission_percent', v)}
          total={commissionTotal}
          salePrice={salePrice}
        />
        <PresetRow
          label="Продвижение / реклама"
          type="fixed"
          value={expenses.promo || ''}
          onChange={v => updateField('promo', v)}
          total={promoTotal}
        />
      </div>

      {/* Custom items */}
      {items.length > 0 && (
        <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-2">
              <input
                className="input flex-1 text-sm"
                value={item.label}
                onChange={e => updateItem(item.id, 'label', e.target.value)}
                placeholder="Название расхода"
              />
              <span className="text-xs flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>Фикс сумма</span>
              <input
                type="number" min="0"
                className="input w-28 text-sm text-right"
                value={item.amount || ''}
                onChange={e => updateItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
              <span className="text-sm font-semibold w-20 text-right whitespace-nowrap">
                {formatMoney(item.amount || 0)}
              </span>
              <button
                onClick={() => deleteItem(item.id)}
                className="opacity-40 hover:opacity-100 transition-opacity"
                style={{ color: 'var(--color-danger)' }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <button onClick={addItem} className="btn-secondary text-sm flex items-center gap-2">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Добавить расход
      </button>

      {/* Total */}
      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-sm font-medium">Итого расходы</p>
        <p className="text-xl font-bold">{formatMoney(grandTotal)}</p>
      </div>

      {salePrice > 0 && commissionTotal > 0 && (
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          * Комиссия рассчитана от цены продажи {formatMoney(salePrice)}
        </p>
      )}
    </div>
  )
}

function PresetRow({ label, type, value, onChange, total, salePrice }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="flex-1 text-sm">{label}</span>
      <span className="text-xs flex-shrink-0 w-20 text-right" style={{ color: 'var(--color-text-muted)' }}>
        {type === 'percent' ? 'Процент' : 'Фикс сумма'}
      </span>
      <div className="relative w-28">
        <input
          type="number" min="0" step={type === 'percent' ? '0.1' : '1'}
          className="input text-sm text-right pr-6"
          value={value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          placeholder="0"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
          style={{ color: 'var(--color-text-muted)' }}>
          {type === 'percent' ? '%' : '₽'}
        </span>
      </div>
      <span className="text-sm font-semibold w-20 text-right whitespace-nowrap">
        {formatMoney(total)}
      </span>
    </div>
  )
}
