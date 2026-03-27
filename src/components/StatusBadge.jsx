import { STATUS_LABELS } from '../store/useAppStore'

const STATUS_COLORS = {
  in_progress: { bg: '#FFF3CD', color: '#856404' },
  done:        { bg: '#D1ECF1', color: '#0C5460' },
  sold:        { bg: '#D4EDDA', color: '#155724' },
  personal:    { bg: '#E2E3E5', color: '#383D41' },
}

export default function StatusBadge({ status }) {
  const style = STATUS_COLORS[status] || STATUS_COLORS.personal
  return (
    <span
      className="status-badge"
      style={{ background: style.bg, color: style.color }}
    >
      {STATUS_LABELS[status] || status}
    </span>
  )
}
