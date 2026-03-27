export function formatMoney(amount, currency = '₽') {
  if (amount == null || isNaN(amount)) return `0 ${currency}`
  return `${Number(amount).toLocaleString('ru-RU')} ${currency}`
}

export function formatHours(hours) {
  if (!hours) return '0ч'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h}ч`
  return `${h}ч ${m}мин`
}

export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}
