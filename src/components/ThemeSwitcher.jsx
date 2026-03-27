import { useAppStore, THEMES } from '../store/useAppStore'

const THEME_META = {
  teplo:     { label: 'Тепло',      bg: '#F5F0E8', accent: '#C0392B' },
  lavanda:   { label: 'Лаванда',    bg: '#F4F1F8', accent: '#7C5CBF' },
  les:       { label: 'Лес',        bg: '#F0F4EF', accent: '#3A7D44' },
  hearthside:{ label: 'Hearthside', bg: '#F7F0EE', accent: '#9B2335' },
  amber:     { label: 'Amber Oak',  bg: '#1C1A14', accent: '#D4A017' },
}

export default function ThemeSwitcher({ onClose }) {
  const { theme, setTheme } = useAppStore()

  return (
    <div className="card absolute right-0 top-10 z-50 w-64 shadow-lg">
      <p className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-muted)' }}>
        Цветовая тема
      </p>
      <div className="flex gap-3 flex-wrap">
        {THEMES.map((t) => {
          const meta = THEME_META[t]
          const isActive = theme === t
          return (
            <button
              key={t}
              onClick={() => { setTheme(t); onClose?.() }}
              className="flex flex-col items-center gap-1 group"
              title={meta.label}
            >
              <div
                className="w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${meta.bg} 50%, ${meta.accent} 50%)`,
                  borderColor: isActive ? meta.accent : 'transparent',
                  boxShadow: isActive ? `0 0 0 2px ${meta.accent}40` : 'none',
                }}
              >
                {isActive && (
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill={meta.accent}>
                    <path d="M13.5 3.5L6 11 2.5 7.5l-1 1L6 13l8.5-8.5z" />
                  </svg>
                )}
              </div>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{meta.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
