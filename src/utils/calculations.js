/**
 * Итого по материалам
 */
export function calcMaterialsTotal(materials = []) {
  return materials.reduce((sum, m) => sum + (m.qty || 0) * (m.price_per_unit || 0), 0)
}

/**
 * Итого фактических часов из сессий
 */
export function calcTotalHours(sessions = []) {
  return sessions.reduce((sum, s) => sum + (s.hours || 0), 0)
}

/**
 * Количество уникальных дней работы
 */
export function calcTotalDays(sessions = []) {
  const dates = new Set(sessions.map(s => s.date).filter(Boolean))
  return dates.size
}

/**
 * Стоимость времени = часы × ставка
 */
export function calcTimeValue(sessions, hourlyRate) {
  return calcTotalHours(sessions) * (hourlyRate || 0)
}

/**
 * Итого дополнительных расходов
 * expenses: { packaging, shipping, commission_percent, promo, items: [{label, amount}] }
 * salePrice нужна для расчёта процентной комиссии
 */
export function calcExpensesTotal(expenses = {}, salePrice = 0) {
  const fixed =
    (expenses.packaging || 0) +
    (expenses.shipping || 0) +
    (expenses.promo || 0) +
    (expenses.items || []).reduce((s, i) => s + (i.amount || 0), 0)

  const commission = salePrice * ((expenses.commission_percent || 0) / 100)
  return fixed + commission
}

/**
 * Себестоимость = материалы + время + расходы (без комиссии, комиссия уже от цены)
 */
export function calcCostPrice(materials, sessions, hourlyRate, expenses) {
  const fixedExpenses =
    (expenses?.packaging || 0) +
    (expenses?.shipping || 0) +
    (expenses?.promo || 0) +
    (expenses?.items || []).reduce((s, i) => s + (i.amount || 0), 0)

  return calcMaterialsTotal(materials) + calcTimeValue(sessions, hourlyRate) + fixedExpenses
}

/**
 * Полный расчёт цены
 */
export function calcPricing({ materials = [], sessions = [], hourlyRate = 0, expenses = {}, salePrice = 0, taxPercent = 0 }) {
  const costPrice = calcCostPrice(materials, sessions, hourlyRate, expenses)
  const commission = salePrice * ((expenses?.commission_percent || 0) / 100)
  const tax = salePrice * (taxPercent / 100)
  const profit = salePrice - costPrice - commission - tax
  const actualHourlyRate = calcTotalHours(sessions) > 0 ? profit / calcTotalHours(sessions) : 0

  return {
    costPrice: round(costPrice),
    commission: round(commission),
    tax: round(tax),
    profit: round(profit),
    actualHourlyRate: round(actualHourlyRate),
  }
}

function round(n) {
  return Math.round(n * 100) / 100
}
