import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const THEMES = ['teplo', 'lavanda', 'les', 'hearthside', 'amber']

const STATUS_LABELS = {
  in_progress: 'В работе',
  done: 'Готово',
  sold: 'Продано',
  personal: 'Для себя',
}

export const useAppStore = create(
  persist(
    (set, get) => ({
      // ─── Theme ───
      theme: 'teplo',
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme)
        set({ theme })
      },

      // ─── Auth ───
      user: null,
      setUser: (user) => set({ user }),

      // ─── Active timer ───
      activeTimer: null, // { projectId, projectName, startedAt: ISO string }
      startTimer: (projectId, projectName) => {
        set({ activeTimer: { projectId, projectName, startedAt: new Date().toISOString() } })
      },
      stopTimer: () => {
        const timer = get().activeTimer
        if (!timer) return null
        set({ activeTimer: null })
        return timer
      },

      // ─── Projects (local cache, synced with Supabase) ───
      projects: [],
      setProjects: (projects) => set({ projects }),
      upsertProject: (project) => set((state) => {
        const exists = state.projects.find(p => p.id === project.id)
        if (exists) {
          return { projects: state.projects.map(p => p.id === project.id ? project : p) }
        }
        return { projects: [project, ...state.projects] }
      }),
      removeProject: (id) => set((state) => ({
        projects: state.projects.filter(p => p.id !== id)
      })),
    }),
    {
      name: 'masterskaya-app',
      partialState: (state) => ({ theme: state.theme, activeTimer: state.activeTimer }),
    }
  )
)

export { THEMES, STATUS_LABELS }
