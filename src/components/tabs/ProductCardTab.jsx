import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'

export default function ProductCardTab({ project, onUpdateProject }) {
  const [title, setTitle] = useState(project.product_title || project.name || '')
  const [desc, setDesc] = useState(project.product_description || '')
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(project.photo_url || null)
  const fileRef = useRef()

  async function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    // Resize before upload
    const resized = await resizeImage(file, 1200)
    const path = `${project.id}/${Date.now()}.jpg`

    const { error } = await supabase.storage.from('project-photos').upload(path, resized, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('project-photos').getPublicUrl(path)
      setPhotoUrl(publicUrl)
      onUpdateProject('photo_url', publicUrl)
    }
    setUploading(false)
  }

  async function removePhoto() {
    setPhotoUrl(null)
    onUpdateProject('photo_url', null)
  }

  function saveTitle(v) {
    setTitle(v)
    clearTimeout(window._titleTimer)
    window._titleTimer = setTimeout(() => onUpdateProject('product_title', v), 800)
  }

  function saveDesc(v) {
    setDesc(v)
    clearTimeout(window._descTimer)
    window._descTimer = setTimeout(() => onUpdateProject('product_description', v), 800)
  }

  function copyText() {
    const text = `${title}\n\n${desc}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-4">
      {/* Photo */}
      <div className="card">
        <h2 className="font-semibold mb-4">Фото товара</h2>

        {photoUrl ? (
          <div className="relative group">
            <img
              src={photoUrl}
              alt="Фото товара"
              className="w-full max-h-64 object-cover rounded-xl"
            />
            <button
              onClick={removePhoto}
              className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            {uploading ? (
              <span className="text-sm">Загрузка...</span>
            ) : (
              <>
                <svg className="w-10 h-10 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <span className="text-sm">Добавить фото</span>
                <span className="text-xs opacity-60">Нажмите или перетащите файл</span>
              </>
            )}
          </button>
        )}

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />

        {photoUrl && (
          <button
            onClick={() => fileRef.current?.click()}
            className="btn-secondary w-full mt-3 text-sm"
          >
            Заменить фото
          </button>
        )}
      </div>

      {/* Text card */}
      <div className="card space-y-4">
        <h2 className="font-semibold">Текст карточки</h2>

        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--color-text-muted)' }}>Название товара</label>
          <input
            className="input"
            value={title}
            onChange={e => saveTitle(e.target.value)}
            placeholder="Вязаная сумка ручной работы"
          />
        </div>

        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--color-text-muted)' }}>Описание</label>
          <textarea
            className="input resize-none"
            rows={8}
            value={desc}
            onChange={e => saveDesc(e.target.value)}
            placeholder="Расскажите о товаре: материалы, размер, особенности, уход..."
          />
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {desc.length} символов
          </p>
        </div>

        <button onClick={copyText} className="btn-primary w-full flex items-center justify-center gap-2">
          {copied ? (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Скопировано!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              Скопировать текст для публикации
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// Resize image via canvas
function resizeImage(file, maxWidth) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob(resolve, 'image/jpeg', 0.85)
    }
    img.src = url
  })
}
