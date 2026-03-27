import { useState } from 'react'
import { formatMoney, formatHours } from '../../utils/format'
import { calcPricing, calcMaterialsTotal, calcTotalHours } from '../../utils/calculations'

export default function PricingTab({ project, materials, sessions, expenses, onUpdateProject }) {
  const [salePriceInput, setSalePriceInput] = useState(project.sale_price || '')
  const [taxInput, setTaxInput] = useState(project.tax_percent ?? 6)

  const hourlyRate = project.target_hourly_rate || 0
  const salePrice = project.sale_price || 0
  const taxPercent = project.tax_percent ?? 6

  const { costPrice, commission, tax, profit, actualHourlyRate } = calcPricing({
    materials,
    sessions,
    hourlyRate,
    expenses,
    salePrice,
    taxPercent,
  })

  const materialsTotal = calcMaterialsTotal(materials)
  const totalHours = calcTotalHours(sessions)
  const timeValue = totalHours * hourlyRate

  const profitPositive = profit >= 0

  return (
    <div className="space-y-4">
      {/* Inputs */}
      <div className="card">
        <h2 className="font-semibold mb-4">Рассчитать цену</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--color-text-muted)' }}>
              Цена продажи, ₽
            </label>
            <input
              type="number" min="0"
              className="input text-lg font-bold"
              value={salePriceInput}
              onChange={e => setSalePriceInput(e.target.value)}
              onBlur={() => onUpdateProject('sale_price', parseFloat(salePriceInput) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--color-text-muted)' }}>
              Налог, %
            </label>
            <input
              type="number" min="0" max="100" step="0.1"
              className="input"
              value={taxInput}
              onChange={e => setTaxInput(e.target.value)}
              onBlur={() => onUpdateProject('tax_percent', parseFloat(taxInput) || 0)}
              placeholder="6"
            />
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="card space-y-3">
        <h3 className="font-semibold text-sm">Себестоимость</h3>

        <BreakdownRow label="Материалы" value={materialsTotal} />
        {totalHours > 0 && (
          <BreakdownRow
            label={`Моё время (${formatHours(totalHours)} × ${formatMoney(hourlyRate, '₽/ч')})`}
            value={timeValue}
          />
        )}

        {/* Expenses breakdown */}
        {(expenses.packaging > 0) && <BreakdownRow label="Упаковка" value={expenses.packaging} />}
        {(expenses.shipping > 0) && <BreakdownRow label="Доставка" value={expenses.shipping} />}
        {(expenses.promo > 0) && <BreakdownRow label="Продвижение" value={expenses.promo} />}
        {(expenses.items || []).map(i => i.amount > 0 && (
          <BreakdownRow key={i.id} label={i.label || 'Расход'} value={i.amount} />
        ))}

        <div className="flex justify-between pt-2 border-t font-semibold" style={{ borderColor: 'var(--color-border)' }}>
          <span>Итого себестоимость</span>
          <span>{formatMoney(costPrice)}</span>
        </div>
      </div>

      {/* From sale price */}
      {salePrice > 0 && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-sm">От цены продажи</h3>

          <BreakdownRow label={`Налог ${taxPercent}%`} value={tax} />
          {commission > 0 && (
            <BreakdownRow label={`Комиссия площадки ${expenses.commission_percent}%`} value={commission} />
          )}

          <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <div
              className="flex justify-between items-center p-4 rounded-2xl"
              style={{ background: profitPositive ? '#D4EDDA' : '#F8D7DA' }}
            >
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: profitPositive ? '#155724' : '#721c24' }}>
                  Чистая прибыль
                </p>
                <p className="text-2xl font-bold" style={{ color: profitPositive ? '#155724' : '#721c24' }}>
                  {profitPositive ? '+' : ''}{formatMoney(profit)}
                </p>
              </div>
              {totalHours > 0 && (
                <div className="text-right">
                  <p className="text-xs" style={{ color: profitPositive ? '#155724' : '#721c24', opacity: 0.7 }}>
                    Фактически в час
                  </p>
                  <p className="text-lg font-semibold" style={{ color: profitPositive ? '#155724' : '#721c24' }}>
                    {formatMoney(actualHourlyRate)}/ч
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Minimum price hint */}
          {hourlyRate > 0 && (
            <p className="text-xs px-3 py-2 rounded-xl" style={{ background: 'var(--color-secondary)', color: 'var(--color-text-muted)' }}>
              💡 При ставке {formatMoney(hourlyRate)}/ч минимальная цена (без прибыли) ≈{' '}
              <strong>{formatMoney(costPrice / (1 - (taxPercent + (expenses.commission_percent || 0)) / 100))}</strong>
            </p>
          )}
        </div>
      )}

      {salePrice === 0 && (
        <div className="text-center py-6" style={{ color: 'var(--color-text-muted)' }}>
          <p className="text-sm">Введите цену продажи, чтобы рассчитать прибыль</p>
        </div>
      )}
    </div>
  )
}

function BreakdownRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span className="font-medium">{formatMoney(value)}</span>
    </div>
  )
}
