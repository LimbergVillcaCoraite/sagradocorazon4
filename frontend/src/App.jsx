import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { LoadingButton, useToast } from './ui.jsx'
import './styles.css'

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

// Role display mapping: map internal role names (and Spanish labels) to a friendly Spanish label
const ROLE_DISPLAY_MAP = {
  STUDENT: 'Estudiante',
  EDITOR: 'Editor',
  PROFESSOR: 'Profesor',
  ADMIN: 'Administrador',
  PARENT: 'Padre',
  GUEST: 'Invitado',
  ESTUDIANTE: 'Estudiante',
  PADRE: 'Padre',
  INVITADO: 'Invitado',
}

function displayRole(role) {
  if (!role) return ''
  const key = String(role).trim().toUpperCase()
  return ROLE_DISPLAY_MAP[key] || role
}

const navItems = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'avisos', label: 'Avisos' },
  { id: 'noticias', label: 'Noticias' },
  { id: 'actividades', label: 'Actividades' },
  { id: 'galeria', label: 'Galería' },
  { id: 'historia', label: 'Historia' },
  { id: 'contacto', label: 'Contacto' },
]

function NavIcon({ sectionId }) {
  const paths = {
    inicio: <path d="M3 10.5 12 3l9 7.5v8.5a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
    avisos: <path d="M4 11v2l2 2v4h3v-3h6l5 3V5l-5 3H9V5H6v4z" />,
    noticias: <><path d="M5 4h14a1 1 0 0 1 1 1v14H4V5a1 1 0 0 1 1-1z" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    actividades: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></>,
    galeria: <><rect x="4" y="5" width="16" height="14" rx="2" /><path d="m8 14 3-3 2 2 3-3 4 4" /></>,
    historia: <><path d="M5 5h6a3 3 0 0 1 3 3v11H8a3 3 0 0 0-3 3z" /><path d="M19 5h-6a3 3 0 0 0-3 3v11h6a3 3 0 0 1 3 3z" /></>,
    acceso: <><path d="M11 21h-5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" /><path d="M15 8l5 4-5 4" /><path d="M20 12H9" /></>,
    admin: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1z" /></>,
  }
  const icon = paths[sectionId] || paths.inicio
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icon}
    </svg>
  )
}

function SocialIcon({ network }) {
  if (network === 'facebook') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 8.8h2.5l.5-2.8H14V4.6c0-.8.3-1.4 1.5-1.4H17V0h-2.1C12 0 11 1.4 11 3.7V6h-3v2.8h3V17h3V8.8z" fill="currentColor" />
      </svg>
    )
  }
  if (network === 'instagram') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.2A4.8 4.8 0 1 1 7.2 12 4.8 4.8 0 0 1 12 7.2zm0 2A2.8 2.8 0 1 0 14.8 12 2.8 2.8 0 0 0 12 9.2zM17.4 6.4a1 1 0 1 1-1 1 1 1 0 0 1 1-1z" fill="currentColor" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21.7 8.2a3 3 0 0 0-2.1-2.1C17.7 5.7 12 5.7 12 5.7s-5.7 0-7.6.4A3 3 0 0 0 2.3 8.2 31 31 0 0 0 2 12a31 31 0 0 0 .3 3.8 3 3 0 0 0 2.1 2.1C6.3 18.3 12 18.3 12 18.3s5.7 0 7.6-.4a3 3 0 0 0 2.1-2.1A31 31 0 0 0 22 12a31 31 0 0 0-.3-3.8zM10 15.1V8.9L15.2 12 10 15.1z" fill="currentColor" />
    </svg>
  )
}

function SchoolEmblem({ label = 'U.E. SAGRADO CORAZÓN 4' }) {
  return (
    <img
      src="/escudo.jpg"
      alt={label}
      className="brand__emblem-svg"
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
    />
  )
}

const defaultProfile = {
  school_name: '',
  tagline: '',
  hero_title: '',
  hero_subtitle: '',
  hero_cta: '',
  hero_image_url: '',
  address: '',
  phone: '',
  email: '',
  facebook_url: '',
  instagram_url: '',
  youtube_url: '',
  search_placeholder: 'Buscar noticias...',
}

const defaultContentForm = {
  newsTitle: '',
  newsExcerpt: '',
  newsContent: '',
  noticeTitle: '',
  noticeContent: '',
  noticeExpiry: '',
  noticeAudience: 'all',
  activityTitle: '',
  activityDescription: '',
  activityType: 'cultural',
  activityLocation: '',
  activityDate: '',
  activityPublishAt: '',
  galleryTitle: '',
  galleryDescription: '',
  historyContent: '',
  notificationTitle: '',
  notificationBody: '',
  googleSummary: '',
  googleDescription: '',
  googleLocation: '',
  googleStart: '',
  googleEnd: '',
}

const defaultLoginForm = {
  name: '',
  email: '',
  password: '',
}

function hashString(value = '') {
  let hash = 0
  const input = String(value)
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function buildAvatarDataUrl(seed = 'usuario') {
  const hash = hashString(seed || 'usuario')
  const hue = hash % 360
  const bg = `hsl(${hue}, 70%, 42%)`
  const accent = `hsl(${(hue + 32) % 360}, 80%, 60%)`
  const light = `hsl(${(hue + 180) % 360}, 35%, 96%)`
  const pattern = []
  let state = hash || 1
  for (let i = 0; i < 15; i += 1) {
    state = (state * 1664525 + 1013904223) >>> 0
    pattern.push(state % 2 === 0)
  }
  const size = 64
  const cell = size / 5
  const rects = []
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const active = pattern[row * 3 + col]
      if (!active) continue
      const x = col * cell
      const y = row * cell
      const mirrorX = (4 - col) * cell
      rects.push(`<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="6" fill="${col === 1 ? accent : light}" />`)
      if (col !== 2) {
        rects.push(`<rect x="${mirrorX}" y="${y}" width="${cell}" height="${cell}" rx="6" fill="${col === 1 ? accent : light}" />`)
      }
    }
  }
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Avatar">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${bg}" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="16" fill="url(#g)" />
      ${rects.join('')}
    </svg>
  `
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const adminSections = [
  { id: 'overview', label: 'Resumen', description: 'Estado general, acciones rápidas y sesión.' },
  { id: 'perfil', label: 'Perfil', description: 'Cabecera, hero y datos de contacto.' },
  { id: 'noticias', label: 'Noticias', description: 'Crear borradores, previsualizar y gestionar adjuntos.' },
  { id: 'avisos', label: 'Avisos', description: 'Publicar comunicados y fechas de caducidad.' },
  { id: 'actividades', label: 'Actividades', description: 'Registrar actividades y subir portadas.' },
  { id: 'galeria', label: 'Galería', description: 'Crear álbumes y añadir imágenes.' },
  { id: 'historia', label: 'Historia', description: 'Editar la historia institucional.' },
  { id: 'notificaciones', label: 'Notificaciones', description: 'Enviar avisos a la comunidad.' },
  { id: 'google', label: 'Google Calendar', description: 'Sincronizar eventos con Google Calendar.' },
  { id: 'media', label: 'Subir imagen', description: 'Subida simple de imágenes y miniaturas.' },
  { id: 'usuarios', label: 'Usuarios', description: 'Crear cuentas y asignar roles.' },
]

function formatDate(value) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Sin fecha' : date.toLocaleDateString()
}
function formatDateTime(value) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-BO', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}
function timeAgo(value) {
  if (!value) return ''
  const then = new Date(value).getTime()
  if (Number.isNaN(then)) return ''
  const now = Date.now()
  const diff = Math.floor((now - then) / 1000) // seconds
  if (diff < 60) return `hace ${diff}s`
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`
  return `hace ${Math.floor(diff / 86400)}d`
}
function splitNewsMedia(item) {
  const attachments = Array.isArray(item?.attachments) ? item.attachments : []
  const uniqueByUrl = new Map()
  const pushAttachment = (attachment) => {
    if (!attachment?.url || uniqueByUrl.has(attachment.url)) return
    uniqueByUrl.set(attachment.url, attachment)
  }
  if (item?.cover_image) {
    const coverAttachment = attachments.find((attachment) => attachment?.url === item.cover_image)
    pushAttachment(
      coverAttachment || {
        id: `cover-${item.id}`,
        url: item.cover_image,
        filename: 'Portada',
        content_type: 'image/*',
        kind: 'image',
        caption: 'Imagen principal',
        created_at: item.created_at,
      },
    )
  }
  attachments.forEach((attachment) => {
    const ct = attachment.content_type || ''
    const inferredKind = attachment.kind || (ct.startsWith('image/') ? 'image' : ct.startsWith('video/') ? 'video' : ct.startsWith('audio/') ? 'audio' : 'document')
    pushAttachment({ ...attachment, kind: inferredKind })
  })

  const unique = Array.from(uniqueByUrl.values())
  return {
    all: unique,
    images: unique.filter((attachment) => attachment.kind === 'image'),
    videos: unique.filter((attachment) => attachment.kind === 'video'),
    audios: unique.filter((attachment) => attachment.kind === 'audio'),
    documents: unique.filter((attachment) => attachment.kind === 'document'),
  }
}
function NewsImageCarousel({ images, title, compact = false }) {
  const [activeIndex, setActiveIndex] = useState(0)
  useEffect(() => {
    setActiveIndex(0)
  }, [images.length, images[0]?.url, images[images.length - 1]?.url])
  if (!images.length) return null
  const current = images[Math.min(activeIndex, images.length - 1)]
  return (
    <div className={`news-carousel ${compact ? 'news-carousel--compact' : ''}`}>
      <div className="news-carousel__stage">
        <img src={current.url} alt={current.caption || current.filename || title || 'Imagen de noticia'} />
        {images.length > 1 ? (
          <>
            <button type="button" className="news-carousel__nav news-carousel__nav--prev" onClick={() => setActiveIndex((prev) => (prev - 1 + images.length) % images.length)} aria-label="Imagen anterior">‹</button>
            <button type="button" className="news-carousel__nav news-carousel__nav--next" onClick={() => setActiveIndex((prev) => (prev + 1) % images.length)} aria-label="Imagen siguiente">›</button>
          </>
        ) : null}
      </div>
      {images.length > 1 ? (
        <div className="news-carousel__dots" aria-label="Selector de imágenes">
          {images.map((attachment, index) => (
            <button
              key={attachment.id || `${attachment.url}-${index}`}
              type="button"
              className={`news-carousel__dot ${index === activeIndex ? 'active' : ''}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Ver imagen ${index + 1}`}
            />
          ))}
        </div>
      ) : null}
      {current.caption ? <p className="news-carousel__caption">{current.caption}</p> : null}
    </div>
  )
}

function MixedMediaCarousel({ items, title, compact = false }) {
  const [activeIndex, setActiveIndex] = useState(0)
  useEffect(() => {
    setActiveIndex(0)
  }, [items.length, items[0]?.url, items[items.length - 1]?.url])
  if (!items || !items.length) return null
  const current = items[Math.min(activeIndex, items.length - 1)]
  return (
    <div className={`news-carousel ${compact ? 'news-carousel--compact' : ''}`}>
      <div className="news-carousel__stage">
        {current.kind === 'video' ? (
          <video controls preload="metadata" src={current.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : current.kind === 'image' ? (
          <img src={current.url} alt={current.caption || current.filename || title || 'Medio'} />
        ) : current.kind === 'audio' ? (
          <audio controls preload="metadata" src={current.url} style={{ width: '100%' }} />
        ) : (
          // fallback: show link preview for documents
          <div style={{ padding: 18 }}>
            <a href={current.url} target="_blank" rel="noreferrer">{current.filename || 'Abrir archivo'}</a>
          </div>
        )}
        {items.length > 1 ? (
          <>
            <button type="button" className="news-carousel__nav news-carousel__nav--prev" onClick={() => setActiveIndex((prev) => (prev - 1 + items.length) % items.length)} aria-label="Anterior">‹</button>
            <button type="button" className="news-carousel__nav news-carousel__nav--next" onClick={() => setActiveIndex((prev) => (prev + 1) % items.length)} aria-label="Siguiente">›</button>
          </>
        ) : null}
      </div>
      {items.length > 1 ? (
        <div className="news-carousel__dots" aria-label="Selector de medios">
          {items.map((attachment, index) => (
            <button
              key={attachment.id || `${attachment.url}-${index}`}
              type="button"
              className={`news-carousel__dot ${index === activeIndex ? 'active' : ''}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Ver medio ${index + 1}`}
            />
          ))}
        </div>
      ) : null}
      {current.caption ? <p className="news-carousel__caption">{current.caption}</p> : null}
    </div>
  )
}
function NewsPostCard({ item, compact = false, onOpen, canEdit = false, onEdit }) {
  const { all, documents } = useMemo(() => splitNewsMedia(item), [item])
  const text = item.excerpt || item.content || ''
  const initial = (item.author_name || item.title || 'N').trim().charAt(0).toUpperCase()
  const interactive = typeof onOpen === 'function'
  return (
    <article
      className={`news-post ${compact ? 'news-post--compact' : ''} ${interactive ? 'news-post--clickable' : ''}`}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? () => onOpen(item) : undefined}
      onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(item) } } : undefined}
    >
      <header className="news-post__header">
        <div className="news-post__avatar">{initial || 'N'}</div>
        <div className="news-post__header-copy">
          <strong>{item.title}</strong>
          <div>
            <span className="news-post__meta">{item.author_name || 'Redacción'}</span>
            <small className="news-post__time">{compact ? timeAgo(item.created_at) : formatDateTime(item.created_at)}</small>
          </div>
          {item.audience ? <small>{item.audience}</small> : null}
          {canEdit && (
            <div className="admin-actions" style={{ marginTop: '8px', gap: '6px' }}>
              <button className="btn btn--small" type="button" onClick={(e) => { e.stopPropagation(); onEdit?.(item) }}>Editar</button>
            </div>
          )}
        </div>
      </header>
      {text ? <p className="news-post__content">{text}</p> : null}
      {all && all.length ? (
        all.length === 1 ? (
          all[0].kind === 'image' ? (
            <div className="news-post__cover">
              <img src={all[0].url} alt={all[0].caption || all[0].filename || item.title || 'Imagen de noticia'} />
            </div>
          ) : all[0].kind === 'video' ? (
            <div className="news-post__cover">
              <video controls preload="metadata" src={all[0].url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : (
            <div className="news-post__cover">
              <a href={all[0].url} target="_blank" rel="noreferrer">{all[0].filename || 'Abrir archivo'}</a>
            </div>
          )
        ) : (
          <MixedMediaCarousel items={all} title={item.title} compact={compact} />
        )
      ) : null}
      {compact && text.length > 180 ? <small className="news-post__read-more">Haz clic para leer la noticia completa</small> : null}
      {documents.length ? (
        <div className="news-post__attachments">
          {documents.map((attachment) => (
            <a
              key={attachment.id || attachment.url}
              className="news-file-chip"
              href={attachment.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="news-file-chip__icon">{(attachment.filename || 'DOC').slice(0, 1).toUpperCase()}</span>
              <span className="news-file-chip__meta">
                <strong>{attachment.filename}</strong>
                <small>{attachment.kind === 'image' ? 'Imagen' : 'Documento'}</small>
              </span>
            </a>
          ))}
        </div>
      ) : null}
    </article>
  )
}
function NewsFilePreviewList({ files, onRemove }) {
  if (!files.length) return null
  return (
    <div className="news-preview-grid">
      {files.map((item) => (
        <div key={item.id} className="news-preview-card">
          {item.kind === 'image' ? (
            <div className="news-preview-card__media">
              <img src={item.previewUrl} alt={item.file.name} />
            </div>
          ) : item.kind === 'video' && item.previewUrl ? (
            <div className="news-preview-card__media">
              <video controls preload="metadata" src={item.previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : item.kind === 'audio' && item.previewUrl ? (
            <div className="news-preview-card__media news-preview-card__media--doc">
              <audio controls preload="metadata" src={item.previewUrl} style={{ width: '100%' }} />
            </div>
          ) : (
            <div className="news-preview-card__media news-preview-card__media--doc">
              <strong>{item.kind.toUpperCase()}</strong>
              <span>{item.file.name.split('.').pop()?.toUpperCase() || 'FILE'}</span>
            </div>
          )}
          <div className="news-preview-card__body">
            <strong>{item.file.name}</strong>
            <small>{item.kind === 'image' ? 'Se mostrará como imagen' : item.kind === 'video' ? 'Se mostrará como video' : item.kind === 'audio' ? 'Se mostrará como audio' : `Adjunto tipo ${item.kind}`}</small>
          </div>
          <button className="btn btn--ghost btn--small" type="button" onClick={() => onRemove(item.id)}>
            Quitar
          </button>
        </div>
      ))}
    </div>
  )
}

function NewsReadModal({ item, onClose, canEdit = false, onEdit }) {
  const { all, documents } = useMemo(() => splitNewsMedia(item), [item])
  if (!item) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <article className="card news-read-modal" onClick={(e) => e.stopPropagation()}>
        <div className="card__header">
          <h3>{item.title}</h3>
          <div className="admin-actions">
            {canEdit && <button className="btn btn--small" type="button" onClick={() => { onEdit?.(); onClose() }}>Editar</button>}
            <button className="btn btn--ghost btn--small" type="button" onClick={onClose}>Cerrar</button>
          </div>
        </div>
        <div className="card__body news-read-modal__body">
          <div className="news-post__header news-read-modal__meta">
            <div className="news-post__avatar">{(item.author_name || item.title || 'N').trim().charAt(0).toUpperCase()}</div>
            <div className="news-post__header-copy">
              <strong>{item.author_name || 'Redacción'}</strong>
              <span>{formatDateTime(item.created_at)} • {item.audience || 'all'}</span>
              {item.created_by_name ? <small>Creador: {item.created_by_name}</small> : null}
            </div>
          </div>
                          {all && all.length ? (
                            all.length === 1 ? (
                              all[0].kind === 'image' ? (
                                <NewsImageCarousel images={[all[0]]} title={item.title} />
                              ) : all[0].kind === 'video' ? (
                                <div className="news-post__cover">
                                  <video controls preload="metadata" src={all[0].url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                              ) : null
                            ) : (
                              <MixedMediaCarousel items={all} title={item.title} />
                            )
                          ) : null}
          <div className="news-read-modal__content">{item.content ? <p>{item.content}</p> : null}</div>
          {documents.length ? (
            <div className="news-post__attachments">
              {documents.map((attachment) => (
                <a
                  key={attachment.id || attachment.url}
                  className="news-file-chip"
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="news-file-chip__icon">{(attachment.filename || 'DOC').slice(0, 1).toUpperCase()}</span>
                  <span className="news-file-chip__meta">
                    <strong>{attachment.filename}</strong>
                    <small>{attachment.kind === 'image' ? 'Imagen' : 'Documento'}</small>
                  </span>
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </article>
    </div>
  )
}
function NewsAttachmentManager({ news, onDeleteAttachment, onPublish, canPublish = false }) {
  // canPublish will be passed by the AdminPanel based on the current user's role
  const attachments = Array.isArray(news?.attachments) ? news.attachments : []
  const media = splitNewsMedia(news)
  return (
    <div className="news-draft-manager">
      <div className="news-draft-manager__header">
        <div>
          <strong>{news.title}</strong>
          <p>Estado: <span>{news.status || 'draft'}</span></p>
        </div>
        <button className="btn" type="button" onClick={() => onPublish(news.id)} disabled={news.status === 'published' || !canPublish}>
          {news.status === 'published' ? 'Ya publicada' : !canPublish ? 'Solo admin puede publicar' : 'Publicar noticia'}
        </button>
      </div>
      <div className="news-draft-manager__summary">
        <span>{media.images.length} imagen(es)</span>
        <span>{media.documents.length} documento(s)</span>
      </div>
      {attachments.length === 0 ? (
        <p className="state-empty">Aún no hay adjuntos subidos para esta noticia.</p>
      ) : (
        <div className="news-draft-manager__list">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="news-draft-item">
              {attachment.kind === 'image' ? (
                <div className="news-draft-item__thumb">
                  <img src={attachment.url} alt={attachment.caption || attachment.filename} />
                </div>
              ) : (
                <div className="news-draft-item__thumb news-draft-item__thumb--doc">
                  <strong>{(attachment.filename || 'DOC').split('.').pop()?.toUpperCase()}</strong>
                </div>
              )}
              <div className="news-draft-item__body">
                <strong>{attachment.filename}</strong>
                <small>{attachment.caption || attachment.content_type || 'Adjunto'}</small>
              </div>
              <a className="btn btn--ghost btn--small" href={attachment.url} target="_blank" rel="noreferrer">
                Abrir
              </a>
              <button className="btn btn--ghost btn--small" type="button" onClick={() => onDeleteAttachment(news.id, attachment.id)}>
                Borrar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function splitActivityMedia(item) {
  const attachments = Array.isArray(item?.attachments) ? item.attachments : []
  const uniqueByUrl = new Map()
  const add = (attachment) => {
    if (!attachment?.url || uniqueByUrl.has(attachment.url)) return
    uniqueByUrl.set(attachment.url, attachment)
  }
  if (item?.cover_image) {
    add({
      id: `cover-${item.id}`,
      url: item.cover_image,
      filename: 'Portada',
      content_type: 'image/*',
      kind: 'image',
      created_at: item.created_at,
    })
  }
  attachments.forEach((attachment) => {
    const contentType = attachment.content_type || ''
    const kind = attachment.kind || (
      contentType.startsWith('image/') ? 'image' :
      contentType.startsWith('video/') ? 'video' :
      contentType.startsWith('audio/') ? 'audio' :
      'document'
    )
    add({ ...attachment, kind })
  })
  const media = Array.from(uniqueByUrl.values())
  return {
    images: media.filter((item) => item.kind === 'image'),
    videos: media.filter((item) => item.kind === 'video'),
    audios: media.filter((item) => item.kind === 'audio'),
    documents: media.filter((item) => item.kind === 'document'),
  }
}

function getAlbumCoverUrl(album) {
  const raw = album?.cover_image
  if (!raw || typeof raw !== 'string') return ''
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed) && typeof parsed[0] === 'string') return parsed[0]
    } catch {
      // Fallback to raw value when it is not valid JSON.
    }
  }
  return trimmed
}

function AlbumFeaturedCarousel({ albums, onOpen }) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (!albums.length) return undefined
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % albums.length)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [albums.length])

  useEffect(() => {
    setActiveIndex(0)
  }, [albums.length, albums[0]?.id])

  if (!albums.length) return <p className="state-empty">No hay galerías registradas.</p>

  const current = albums[Math.min(activeIndex, albums.length - 1)]
  const cover = getAlbumCoverUrl(current)

  return (
    <div className="album-carousel">
      <div
        className="album-carousel__stage"
        role="button"
        tabIndex={0}
        onClick={() => onOpen?.(current)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onOpen?.(current)
          }
        }}
      >
        <div className="gallery-thumb album-carousel__thumb">
          {cover ? <img src={cover} alt={`Portada de ${current.title}`} /> : <span className="gallery-thumb__placeholder">Sin portada</span>}
        </div>
        <div className="album-carousel__overlay">
          <span className="album-carousel__badge">#{String(activeIndex + 1).padStart(2, '0')} / {String(albums.length).padStart(2, '0')}</span>
          <strong>{current.title}</strong>
          <small>{formatDateTime(current.created_at)} • {current.images_count || 0} imágenes</small>
        </div>
      </div>
      <div className="album-carousel__controls" aria-hidden="true">
        <span className="album-carousel__dots">
          {albums.map((album, index) => (
            <span key={album.id} className={`album-carousel__dot ${index === activeIndex ? 'active' : ''}`} />
          ))}
        </span>
      </div>
    </div>
  )
}

function AlbumViewerModal({ album, onClose }) {
  const [detail, setDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [brokenImages, setBrokenImages] = useState({})

  useEffect(() => {
    if (!album) return undefined
    let alive = true
    setLoadingDetail(true)
    setDetail(null)
    setActiveIndex(0)
    setBrokenImages({})
    api(`/albums/${album.id}`)
      .then((data) => {
        if (!alive) return
        setDetail(data)
      })
      .catch(() => {
        if (!alive) return
        setDetail(album)
      })
      .finally(() => {
        if (alive) setLoadingDetail(false)
      })
    return () => {
      alive = false
    }
  }, [album])

  if (!album) return null

  const images = Array.isArray(detail?.images) ? detail.images : Array.isArray(album.images) ? album.images : []
  const visibleImages = images.filter((img, idx) => !brokenImages[img?.id || idx])
  const safeIndex = Math.min(activeIndex, Math.max(visibleImages.length - 1, 0))
  const current = visibleImages[safeIndex]
  const currentSrc = current?.thumbnail_url || current?.url || ''
  const handleImageError = (image, idx) => {
    setBrokenImages((prev) => ({ ...prev, [image?.id || idx]: true }))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <article className="card album-modal" onClick={(e) => e.stopPropagation()}>
        <div className="card__header">
          <div>
            <h3>{detail?.title || album.title}</h3>
            <span>{formatDateTime(detail?.created_at || album.created_at)} • {images.length} fotos</span>
          </div>
          <div className="admin-actions">
            <button type="button" className="btn btn--ghost btn--small" onClick={onClose}>Cerrar</button>
          </div>
        </div>
        <div className="card__body album-modal__body">
          {loadingDetail ? (
            <LoadingState message="Cargando fotos del álbum..." />
          ) : images.length ? (
            <>
              <div className="album-viewer__main">
                {currentSrc ? (
                  <img
                    src={currentSrc}
                    alt={current?.alt_text || detail?.title || album.title}
                    className="album-viewer__image"
                    onError={() => handleImageError(current, safeIndex)}
                  />
                ) : (
                  <div className="album-viewer__empty">
                    <span className="gallery-thumb__placeholder">Imagen no disponible</span>
                  </div>
                )}
                <div className="album-carousel__overlay album-carousel__overlay--modal">
                  <span className="album-carousel__badge">#{String(activeIndex + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}</span>
                  <strong>{current?.alt_text || current?.title || detail?.title || album.title}</strong>
                  <small>{formatDateTime(current?.created_at || detail?.created_at || album.created_at)} • {images.length} imágenes</small>
                </div>
              </div>

              <div className="album-viewer__thumbs" aria-label="Miniaturas del álbum">
                {images.map((image, index) => {
                  const thumbSrc = image.thumbnail_url || image.url
                  return (
                    <button
                      key={image.id || index}
                      type="button"
                      className={`album-viewer__thumb ${index === activeIndex ? 'active' : ''}`}
                      onClick={() => setActiveIndex(index)}
                      aria-label={`Ver imagen ${index + 1}`}
                    >
                      {thumbSrc ? (
                        <img
                          src={thumbSrc}
                          alt={image.alt_text || `Miniatura ${index + 1}`}
                          onError={() => handleImageError(image, index)}
                        />
                      ) : (
                        <span className="gallery-thumb__placeholder">Sin imagen</span>
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="album-viewer__all" aria-label="Todas las fotos del álbum">
                {images.map((image, index) => {
                  const fullSrc = image.url || image.thumbnail_url
                  return (
                    <button
                      key={`all-${image.id || index}`}
                      type="button"
                      className={`album-viewer__all-item ${index === activeIndex ? 'active' : ''}`}
                      onClick={() => setActiveIndex(index)}
                      aria-label={`Abrir imagen ${index + 1}`}
                    >
                      {fullSrc ? <img src={fullSrc} alt={image.alt_text || `Foto ${index + 1}`} onError={() => handleImageError(image, index)} /> : <span className="gallery-thumb__placeholder">Sin imagen</span>}
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="album-collage album-collage--loading">
              <span className="gallery-thumb__placeholder">Sin fotos en este álbum</span>
            </div>
          )}
        </div>

        {images.length > 1 ? (
          <div className="album-carousel__controls album-carousel__controls--modal">
            <button type="button" className="btn btn--ghost btn--small" onClick={() => setActiveIndex((prev) => (prev - 1 + images.length) % images.length)}>Anterior</button>
            <div className="album-carousel__dots">
              {images.map((image, index) => (
                <button key={image.id || index} type="button" className={`album-carousel__dot ${index === activeIndex ? 'active' : ''}`} onClick={() => setActiveIndex(index)} aria-label={`Ver imagen ${index + 1}`} />
              ))}
            </div>
            <button type="button" className="btn btn--ghost btn--small" onClick={() => setActiveIndex((prev) => (prev + 1) % images.length)}>Siguiente</button>
          </div>
        ) : null}
      </article>
    </div>
  )
}

function GalleryCard({ item, onOpen }) {
  const [images, setImages] = useState([])
  const [isHoverLoading, setIsHoverLoading] = useState(false)
  const cover = getAlbumCoverUrl(item)
  const openAlbum = onOpen || item?.onOpen
  const isClickable = typeof openAlbum === 'function'

  // Lazy-load album images when the user hovers (or focuses) the album card.
  // This avoids loading many album thumbnails up front and only fetches
  // images if the album has no explicit cover and there are images.
  const [loadedOnHover, setLoadedOnHover] = useState(false)

  const handleMouseEnter = () => {
    if (cover || loadedOnHover || !(item.images_count > 0)) return
    setLoadedOnHover(true)
    setIsHoverLoading(true)
    api(`/albums/${item.id}`).then((data) => {
      const imgs = Array.isArray(data.images) ? data.images : []
      setImages(imgs)
      // Preload the first few images to make the collage appear smoothly
      imgs.slice(0, 6).forEach((img) => {
        try {
          const im = new Image()
          im.src = img.url || img
        } catch (e) {
          // ignore preload errors
        }
      })
    }).catch(() => {}).finally(() => {
      setIsHoverLoading(false)
    })
  }

  return (
    <Card
      className={`album-card ${isClickable ? 'album-card--clickable' : ''}`}
      title={item.title}
      subtitle={`${item.images_count || 0} imágenes`}
      onMouseEnter={handleMouseEnter}
      onFocus={handleMouseEnter}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? () => openAlbum(item) : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openAlbum(item)
        }
      } : undefined}
    >
      <div className="gallery-thumb">
        {cover ? (
          <img src={cover} alt={`Portada de ${item.title}`} />
        ) : images.length ? (
          <div className="album-collage" aria-hidden>
            {images.slice(0, 4).map((img, idx) => (
              <img key={idx} src={img.url || img} alt="" className={`album-collage__img album-collage__img--${idx}`} />
            ))}
          </div>
        ) : isHoverLoading ? (
          <div className="album-collage album-collage--loading" aria-hidden>
            <span className="gallery-thumb__placeholder">Cargando fotos...</span>
          </div>
        ) : (
          <div className="gallery-thumb__empty">
            <span className="gallery-thumb__placeholder">Sin portada</span>
          </div>
        )}
      </div>
      <div className="card__meta">
        <p className="muted small">{item.description || 'Álbum institucional actualizado desde la base de datos.'}</p>
        <div style={{ marginTop: 8 }}>
          {item.created_by_name ? <small className="muted">Creador: {item.created_by_name}</small> : null}
          <small className="muted" style={{ display: 'block' }}>Creado: {formatDateTime(item.created_at)}</small>
        </div>
        {openAlbum ? (
          <button type="button" className="btn btn--ghost btn--small album-card__open" onClick={(e) => { e.stopPropagation(); openAlbum(item) }}>
            Ver fotos
          </button>
        ) : null}
      </div>
    </Card>
  )
}

function ActivityFilePreviewList({ files, onRemove }) {
  if (!files.length) return null
  return (
    <div className="news-preview-grid">
      {files.map((item) => (
        <div key={item.id} className="news-preview-card">
          {item.kind === 'image' ? (
            <div className="news-preview-card__media">
              <img src={item.previewUrl} alt={item.file.name} />
            </div>
          ) : item.kind === 'video' && item.previewUrl ? (
            <div className="news-preview-card__media">
              <video controls preload="metadata" src={item.previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : item.kind === 'audio' && item.previewUrl ? (
            <div className="news-preview-card__media news-preview-card__media--doc">
              <audio controls preload="metadata" src={item.previewUrl} style={{ width: '100%' }} />
            </div>
          ) : (
            <div className="news-preview-card__media news-preview-card__media--doc">
              <strong>{item.kind.toUpperCase()}</strong>
              <span>{item.file.name.split('.').pop()?.toUpperCase() || 'FILE'}</span>
            </div>
          )}
          <div className="news-preview-card__body">
            <strong>{item.file.name}</strong>
            <small>{item.kind === 'image' ? 'Se mostrará como imagen' : item.kind === 'video' ? 'Se mostrará como video' : item.kind === 'audio' ? 'Se mostrará como audio' : `Adjunto tipo ${item.kind}`}</small>
          </div>
          <button className="btn btn--ghost btn--small" type="button" onClick={() => onRemove(item.id)}>
            Quitar
          </button>
        </div>
      ))}
    </div>
  )
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) }
  const body = options.body
  if (body && !(body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let detail = 'Request failed'
    try {
      const json = await response.json()
      detail = json.detail || JSON.stringify(json)
    } catch {
      // ignore malformed error bodies
    }
    throw new Error(detail)
  }

  if (response.status === 204) return null
  return response.json()
}

function Card({ title, subtitle, children, className = '', ...props }) {
  return (
    <article className={`card ${className}`} {...props}>
      <div className="card__header">
        <h3>{title}</h3>
        {subtitle ? <span>{subtitle}</span> : null}
      </div>
      <div className="card__body">{children}</div>
    </article>
  )
}

function LoadingState({ message = 'Cargando...' }) {
  return (
    <div className="state-loading" role="status" aria-live="polite">
      <span className="loading-inline">
        <span className="spinner" aria-hidden="true" />
        <span>{message}</span>
      </span>
    </div>
  )
}

function EmptyState({ message = 'Sin contenido por ahora' }) {
  return (
    <div className="state-empty">
      <span>{message}</span>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-header">
        <div className="skeleton-avatar skeleton-loader" />
        <div className="skeleton-body">
          <div className="skeleton-line-1" />
          <div className="skeleton-line-2" />
        </div>
      </div>
      <div className="skeleton-loader" style={{ height: '12px', width: '70%' }} />
      <div className="skeleton-loader" style={{ height: '12px', width: '50%' }} />
    </div>
  )
}

function SectionTitle({ kicker, title, description }) {
  return (
    <div className="section-title">
      {kicker ? <p>{kicker}</p> : null}
      <h2>{title}</h2>
      {description ? <span>{description}</span> : null}
    </div>
  )
}

function SectionButton({ children, active, onClick, iconId }) {
  return (
    <button className={`nav-pill ${active ? 'active' : ''}`} onClick={onClick} type="button">
      <NavIcon sectionId={iconId} />
      {children}
    </button>
  )
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Error desconocido al renderizar la interfaz.' }
  }

  render() {
    if (this.state.hasError) {
      const title = this.props.title || 'No se pudo cargar la aplicación'
      const subtitle = this.props.subtitle || 'Se produjo un error al renderizar la vista.'
      return (
        <Card title={title} subtitle={subtitle}>
          <p className="error">{this.state.message}</p>
          <p className="state-empty">Recarga la página con Ctrl + F5. Si el problema persiste, revisa la consola del navegador.</p>
        </Card>
      )
    }

    return this.props.children
  }
}

function usePublicData() {
  const [state, setState] = useState({
    profile: null,
    news: [],
    notices: [],
    activities: [],
    albums: [],
    galleries: [],
    history: { content: '' },
    loading: true,
    warning: null,
  })

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, warning: null }))
    const [profileRes, newsRes, noticesRes, activitiesRes, albumsRes, galleriesRes, historyRes] = await Promise.allSettled([
      api('/site/profile'),
      api('/news?limit=100'),
      api('/notices?limit=100'),
      api('/activities?limit=100'),
      api('/albums?limit=100'),
      api('/galleries?limit=100'),
      api('/history'),
    ])

    const failedSections = [
      ['perfil', profileRes],
      ['noticias', newsRes],
      ['avisos', noticesRes],
      ['actividades', activitiesRes],
      ['álbumes', albumsRes],
      ['galerías', galleriesRes],
      ['historia', historyRes],
    ].filter(([, result]) => result.status === 'rejected').map(([name]) => name)
    const successCount = 7 - failedSections.length

    setState({
      profile: profileRes.status === 'fulfilled' ? profileRes.value : null,
      news: newsRes.status === 'fulfilled' && Array.isArray(newsRes.value) ? newsRes.value : [],
      notices: noticesRes.status === 'fulfilled' && Array.isArray(noticesRes.value) ? noticesRes.value : [],
      activities: activitiesRes.status === 'fulfilled' && Array.isArray(activitiesRes.value) ? activitiesRes.value : [],
      albums: albumsRes.status === 'fulfilled' && Array.isArray(albumsRes.value)
        ? [...albumsRes.value].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        : [],
      galleries: galleriesRes.status === 'fulfilled' && Array.isArray(galleriesRes.value) ? galleriesRes.value : [],
      history: historyRes.status === 'fulfilled' && historyRes.value ? historyRes.value : { content: '' },
      loading: false,
      warning: successCount === 0 && failedSections.length ? `No se pudo cargar la información: ${failedSections.join(', ')}` : null,
    })
  }, [])

  useEffect(() => {
    let alive = true
    load().catch((err) => {
      if (!alive) return
      setState({
        profile: null,
        news: [],
        notices: [],
        activities: [],
        albums: [],
        galleries: [],
        history: { content: '' },
        loading: false,
        warning: err.message,
      })
    })
    return () => {
      alive = false
    }
  }, [load])

  return { ...state, reload: load }
}

function AuthPanel({ token, userLabel, roleLabel, avatarUrl, onLogin, onLogout, onOpenAdmin, onAvatarUpdated, compact = false }) {
  const [form, setForm] = useState(defaultLoginForm)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarStatus, setAvatarStatus] = useState('')
  const [avatarError, setAvatarError] = useState('')
  const [avatarLoading, setAvatarLoading] = useState(false)

  const headerAvatar = useMemo(
    () => avatarUrl || buildAvatarDataUrl(userLabel || roleLabel || 'usuario'),
    [avatarUrl, userLabel, roleLabel],
  )

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setStatus('')
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: form.email, password: form.password }),
      })
      await onLogin(data.access_token)
      setStatus('Sesión iniciada')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAvatarSubmit(e) {
    e.preventDefault()
    setAvatarError('')
    setAvatarStatus('')
    if (!token) {
      setAvatarError('Debes iniciar sesión para cambiar la foto.')
      return
    }
    if (!avatarFile) {
      setAvatarError('Selecciona una imagen primero.')
      return
    }
    setAvatarLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', avatarFile)
      const response = await fetch(`${API_BASE}/auth/me/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      if (!response.ok) {
        let detail = 'No se pudo subir la foto'
        try {
          const json = await response.json()
          detail = json.detail || detail
        } catch {
          // ignore malformed error bodies
        }
        throw new Error(detail)
      }
      const updated = await response.json()
      const nextAvatar = updated?.avatar_url || ''
      onAvatarUpdated?.(nextAvatar)
      setAvatarFile(null)
      setAvatarStatus('Foto de perfil actualizada')
    } catch (err) {
      setAvatarError(err.message)
    } finally {
      setAvatarLoading(false)
    }
  }

  const sessionIsAdmin = (roleLabel || '').toUpperCase() === 'ADMIN'

  const body = token ? (
    <div className="auth-panel__session">
      <div className="auth-panel__profile">
        <img className="auth-avatar" src={headerAvatar} alt={userLabel || 'Avatar de usuario'} />
        <div>
          <strong>{userLabel || 'Usuario'}</strong>
          <span>{displayRole(roleLabel) || 'Sin rol'}</span>
        </div>
      </div>
      <form className="auth-panel__avatar-form stack gap-sm" onSubmit={handleAvatarSubmit}>
        <label className="field">
          <span>Cambiar foto de perfil</span>
          <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
        </label>
        {avatarError ? <p className="error">{avatarError}</p> : null}
        {avatarStatus ? <p className="success">{avatarStatus}</p> : null}
        <LoadingButton className="btn btn--ghost btn--small" loading={avatarLoading} disabled={avatarLoading || !avatarFile} type="submit">
          {avatarLoading ? 'Actualizando...' : 'Guardar foto'}
        </LoadingButton>
      </form>
      <div className="auth-panel__actions">
        {sessionIsAdmin && onOpenAdmin ? (
          <button className="btn btn--ghost btn--small" type="button" onClick={onOpenAdmin}>Administración</button>
        ) : null}
        <button className="btn btn--ghost btn--small" type="button" onClick={onLogout}>Cerrar sesión</button>
      </div>
    </div>
  ) : (
    <form className="auth-panel__form stack gap-sm" onSubmit={handleSubmit}>
      <label className="field">
        <span>Email</span>
        <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} type="email" placeholder="correo@ejemplo.com" />
      </label>
      <label className="field">
        <span>Contraseña</span>
        <input value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} type="password" placeholder="Tu contraseña" />
      </label>
      {error ? <p className="error">{error}</p> : null}
      {status ? <p className="success">{status}</p> : null}
      <LoadingButton className="btn auth-panel__submit" disabled={loading} loading={loading} type="submit">
        {loading ? 'Ingresando...' : 'Entrar'}
      </LoadingButton>
      <p className="auth-panel__hint">El acceso se gestiona desde el encabezado. Si no tienes cuenta, solicita al administrador que te cree una.</p>
    </form>
  )

  if (compact) {
    return <div className="auth-panel auth-panel--compact">{body}</div>
  }

  return (
    <section className="student-access">
      <Card title="Acceso" subtitle="Inicia sesión desde el encabezado">
        {body}
      </Card>
    </section>
  )
}

function AdminPanel({ token, roleLabel, profile, history, refreshPublic, onTokenMissing }) {
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const { addToast } = useToast()
  // granular loading states for admin actions
  const [savingProfile, setSavingProfile] = useState(false)
  const [creatingNews, setCreatingNews] = useState(false)
  const [uploadingNewsAttachmentLoading, setUploadingNewsAttachmentLoading] = useState(false)
  const [creatingNotice, setCreatingNotice] = useState(false)
  const [creatingActivityLoading, setCreatingActivityLoading] = useState(false)
  const [uploadingActivityAttachmentLoading, setUploadingActivityAttachmentLoading] = useState(false)
  const [creatingGalleryLoading, setCreatingGalleryLoading] = useState(false)
  const [uploadingGalleryLoading, setUploadingGalleryLoading] = useState(false)
  const [savingHistoryLoading, setSavingHistoryLoading] = useState(false)
  const [sendingNotificationLoading, setSendingNotificationLoading] = useState(false)
  const [syncingGoogleLoading, setSyncingGoogleLoading] = useState(false)
  const [handlingBulkUpload, setHandlingBulkUpload] = useState(false)
  const [activeAdminSection, setActiveAdminSection] = useState(() => localStorage.getItem('school-admin-section') || 'overview')
  const [profileForm, setProfileForm] = useState(defaultProfile)
  const [historyContent, setHistoryContent] = useState('')
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role_name: 'ESTUDIANTE', avatar_url: '' })
  const [userAvatarFile, setUserAvatarFile] = useState(null)
  const [creatingUserLoading, setCreatingUserLoading] = useState(false)
  // search state for admin drawer (filter sections)
  const [adminSearch, setAdminSearch] = useState('')
  const isAdmin = (roleLabel || '').toUpperCase() === 'ADMIN'
  const filteredAdminSections = useMemo(() => {
    const term = (adminSearch || '').trim().toLowerCase()
    const sections = adminSections.filter((section) => isAdmin || section.id !== 'usuarios')
    if (!term) return sections
    return sections.filter((s) => (s.label || s.id || '').toLowerCase().includes(term))
  }, [adminSearch, isAdmin])
  const visibleAdminSections = filteredAdminSections.length ? filteredAdminSections : adminSections.filter((section) => isAdmin || section.id !== 'usuarios')
  const [form, setForm] = useState(defaultContentForm)
  const [createdNews, setCreatedNews] = useState(null)
  const [newsDraftFiles, setNewsDraftFiles] = useState([])
  const [newsAttachmentFiles, setNewsAttachmentFiles] = useState([])
  const [activityDraftFiles, setActivityDraftFiles] = useState([])
  const [activityAttachmentFiles, setActivityAttachmentFiles] = useState([])
  const [createdActivity, setCreatedActivity] = useState(null)
  const [createdGalleryId, setCreatedGalleryId] = useState('')
  const [albums, setAlbums] = useState([])
  const [albumsLoading, setAlbumsLoading] = useState(false)
  const [editingAlbumId, setEditingAlbumId] = useState('')
  const [editingAlbumForm, setEditingAlbumForm] = useState({ title: '', description: '' })
  const [editingAlbumFiles, setEditingAlbumFiles] = useState([])
  const [editingAlbumDetail, setEditingAlbumDetail] = useState(null)
  const [albumCoverFile, setAlbumCoverFile] = useState(null)
  const [editingAlbumLoading, setEditingAlbumLoading] = useState(false)
  // user management (admin)
  const [usersList, setUsersList] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editUserForm, setEditUserForm] = useState({ name: '', email: '', password: '', role_name: 'ESTUDIANTE', avatar_url: '' })
  const [editAvatarFile, setEditAvatarFile] = useState(null)
  const [updatingUserLoading, setUpdatingUserLoading] = useState(false)
  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token])
  const activeSection = visibleAdminSections.find((section) => section.id === activeAdminSection)
    || adminSections.find((section) => section.id === activeAdminSection)
    || visibleAdminSections[0]

  useEffect(() => {
    const allowedSections = adminSections.filter((section) => isAdmin || section.id !== 'usuarios')
    if (!allowedSections.some((section) => section.id === activeAdminSection)) {
      setActiveAdminSection('overview')
      return
    }
    localStorage.setItem('school-admin-section', activeAdminSection)
  }, [activeAdminSection, isAdmin])

  useEffect(() => {
    return () => {
      newsDraftFiles.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
      })
    }
  }, [newsDraftFiles])

  useEffect(() => {
    return () => {
      newsAttachmentFiles.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
      })
    }
  }, [newsAttachmentFiles])

  useEffect(() => {
    return () => {
      activityDraftFiles.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
      })
    }
  }, [activityDraftFiles])

  useEffect(() => {
    return () => {
      activityAttachmentFiles.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
      })
    }
  }, [activityAttachmentFiles])


  function navigateAdminSection(sectionId) {
    setActiveAdminSection(sectionId)
  }

  async function createUser(e) {
    e.preventDefault()
    if (!token) {
      setError('Debes iniciar sesión como administrador')
      return
    }
    if (!isAdmin) {
      setError('Solo el administrador puede crear usuarios')
      return
    }
    if (!userForm.name.trim() || !userForm.email.trim() || !userForm.password.trim()) {
      setError('Completa nombre, email y contraseña')
      return
    }
    setCreatingUserLoading(true)
    setError('')
    setStatus('')
    try {
      const created = await api('/auth/register', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: userForm.name.trim(),
          email: userForm.email.trim(),
          password: userForm.password,
          role_name: userForm.role_name,
          avatar_url: userForm.avatar_url.trim() || null,
        }),
      })

      // If an avatar file was selected, upload it using the admin endpoint for that user
      if (userAvatarFile && created?.id) {
        try {
          const fd = new FormData()
          fd.append('file', userAvatarFile)
          await fetch(`/api/v1/auth/users/${created.id}/avatar`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          })
        } catch (avatarErr) {
          console.warn('Failed to upload avatar for created user:', avatarErr)
          addToast('Usuario creado pero fallo al subir la imagen', { type: 'warning' })
        }
      }

      setStatus(`Usuario ${created.name} creado correctamente`)
      // Refresh users list in admin view
      try {
        await loadUsers()
      } catch (e) {
        // ignore load errors here
      }
      setUserForm({ name: '', email: '', password: '', role_name: 'ESTUDIANTE', avatar_url: '' })
      setUserAvatarFile(null)
      addToast('Usuario creado', { type: 'success' })
    } catch (err) {
      setError(err.message)
      addToast('No se pudo crear el usuario: ' + err.message, { type: 'error' })
    } finally {
      setCreatingUserLoading(false)
    }
  }

  useEffect(() => {
    if (profile) {
      setProfileForm({
        school_name: profile.school_name || '',
        tagline: profile.tagline || '',
        hero_title: profile.hero_title || '',
        hero_subtitle: profile.hero_subtitle || '',
        hero_cta: profile.hero_cta || '',
          hero_image_url: profile.hero_image_url || '',
        address: profile.address || '',
        phone: profile.phone || '',
        email: profile.email || '',
        facebook_url: profile.facebook_url || '',
        instagram_url: profile.instagram_url || '',
        youtube_url: profile.youtube_url || '',
        search_placeholder: profile.search_placeholder || 'Buscar noticias...',
      })
    }
  }, [profile])

  useEffect(() => {
    setHistoryContent(history?.content || '')
  }, [history])

  useEffect(() => {
    if (activeAdminSection !== 'galeria') return
    let alive = true
    setAlbumsLoading(true)
    ;(async () => {
      try {
        const data = await api('/albums?limit=100')
        if (!alive) return
        setAlbums(Array.isArray(data) ? data : [])
      } catch (err) {
        if (alive) setError(err.message)
      } finally {
        if (alive) setAlbumsLoading(false)
      }
    })()
    return () => { alive = false }
  }, [activeAdminSection])

  function guard() {
    if (!token) {
      onTokenMissing?.()
      throw new Error('Debes iniciar sesión como administrador')
    }
  }

  function openEditAlbum(album) {
    setEditingAlbumId(album.id)
    setEditingAlbumForm({
      title: album.title || '',
      description: album.description || '',
    })
    setEditingAlbumFiles([])
    setAlbumCoverFile(null)
    setEditingAlbumDetail(null)
    void loadAlbumDetail(album.id)
  }

  function closeEditAlbum() {
    setEditingAlbumId('')
    setEditingAlbumForm({ title: '', description: '' })
    setEditingAlbumFiles([])
    setAlbumCoverFile(null)
    setEditingAlbumDetail(null)
  }

  // User management helpers (admin)
  function openEditUser(user) {
    setEditingUser(user)
    setEditUserForm({
      name: user?.name || '',
      email: user?.email || '',
      password: '',
      role_name: user?.role_name || 'ESTUDIANTE',
      avatar_url: user?.avatar_url || '',
    })
    setEditAvatarFile(null)
  }

  function closeEditUser() {
    setEditingUser(null)
    setEditUserForm({ name: '', email: '', password: '', role_name: 'ESTUDIANTE', avatar_url: '' })
    setEditAvatarFile(null)
    setUpdatingUserLoading(false)
  }

  async function loadUsers() {
    if (!isAdmin) return
    setLoadingUsers(true)
    setError('')
    try {
      const data = await api('/auth/users', { headers: authHeaders })
      setUsersList(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    if (activeAdminSection !== 'usuarios') return
    let alive = true
    setLoadingUsers(true)
    ;(async () => {
      try {
        const data = await api('/auth/users', { headers: authHeaders })
        if (!alive) return
        setUsersList(Array.isArray(data) ? data : [])
      } catch (err) {
        if (alive) setError(err.message)
      } finally {
        if (alive) setLoadingUsers(false)
      }
    })()
    return () => { alive = false }
  }, [activeAdminSection])

  async function updateUser(e) {
    e.preventDefault()
    try {
      guard()
    } catch (err) {
      setError(err.message)
      return
    }
    if (!editingUser) return
    setUpdatingUserLoading(true)
    setError('')
    setStatus('')
    try {
      const payload = {
        name: editUserForm.name,
        email: editUserForm.email,
        role_name: editUserForm.role_name,
        avatar_url: editUserForm.avatar_url || null,
      }
      if (editUserForm.password) payload.password = editUserForm.password

      const updated = await api(`/auth/users/${editingUser.id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(payload),
      })

      // If an avatar file was selected, upload it after updating the user
      if (editAvatarFile) {
        try {
          const fd = new FormData()
          fd.append('file', editAvatarFile)
          await fetch(`${API_BASE}/auth/users/${editingUser.id}/avatar`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          })
        } catch (avatarErr) {
          console.warn('Failed to upload avatar for user:', avatarErr)
          addToast('Usuario actualizado pero fallo al subir la imagen', { type: 'warning' })
        }
      }

      setUsersList((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      setStatus('Usuario actualizado correctamente')
      addToast('Usuario actualizado', { type: 'success' })
      refreshPublic?.()
      closeEditUser()
    } catch (err) {
      setError(err.message)
      addToast('Error al actualizar usuario: ' + err.message, { type: 'error' })
    } finally {
      setUpdatingUserLoading(false)
    }
  }

  function handleAlbumFilesChange(e) {
    setEditingAlbumFiles(Array.from(e.target.files || []))
  }

  function handleAlbumCoverFileChange(e) {
    setAlbumCoverFile(e.target.files?.[0] || null)
  }

  async function loadAlbumDetail(albumId = editingAlbumId) {
    if (!albumId) return
    try {
      const data = await api(`/albums/${albumId}`)
      setEditingAlbumDetail(data)
    } catch (err) {
      setError(err.message)
    }
  }

  async function refreshAlbums() {
    const data = await api('/albums?limit=100')
    setAlbums(Array.isArray(data) ? data : [])
    return data
  }

  async function setAlbumCoverFromImage(imageUrl) {
    guard()
    if (!editingAlbumId || !imageUrl) return
    setEditingAlbumLoading(true)
    try {
      await api(`/albums/${editingAlbumId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ cover_image: imageUrl }),
      })
      await Promise.all([refreshAlbums(), loadAlbumDetail(editingAlbumId)])
      addToast('Portada actualizada', { type: 'success' })
    } catch (err) {
      setError(err.message)
      addToast('Error al actualizar portada: ' + err.message, { type: 'error' })
    } finally {
      setEditingAlbumLoading(false)
    }
  }

  async function uploadAlbumCover(e) {
    e.preventDefault()
    guard()
    if (!editingAlbumId || !albumCoverFile) {
      setError('Selecciona una imagen para portada')
      return
    }
    setEditingAlbumLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', albumCoverFile)
      await api(`/albums/${editingAlbumId}/upload-cover`, {
        method: 'POST',
        headers: authHeaders,
        body: fd,
      })
      await Promise.all([refreshAlbums(), loadAlbumDetail(editingAlbumId)])
      setAlbumCoverFile(null)
      addToast('Portada subida correctamente', { type: 'success' })
    } catch (err) {
      setError(err.message)
      addToast('Error al subir portada: ' + err.message, { type: 'error' })
    } finally {
      setEditingAlbumLoading(false)
    }
  }

  async function updateAlbum(e) {
    e.preventDefault()
    guard()
    if (!editingAlbumId) return
    setEditingAlbumLoading(true)
    try {
      const updated = await api(`/albums/${editingAlbumId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(editingAlbumForm),
      })
      setAlbums((prev) => prev.map((album) => (album.id === editingAlbumId ? updated : album)))
      setStatus('Álbum actualizado correctamente')
      addToast('Álbum actualizado', { type: 'success' })
      await refreshAlbums()
      closeEditAlbum()
    } catch (err) {
      setError(err.message)
      addToast('Error al actualizar álbum: ' + err.message, { type: 'error' })
    } finally {
      setEditingAlbumLoading(false)
    }
  }

  async function uploadAlbumImages(e) {
    e.preventDefault()
    guard()
    if (!editingAlbumId) return
    const files = Array.from(editingAlbumFiles || [])
    const altText = e.target.albumAltText?.value || ''
    if (!files.length) {
      setError('Selecciona una o más imágenes')
      return
    }
    setEditingAlbumLoading(true)
    try {
      const failed = []
      for (const file of files) {
        const fd = new FormData()
        fd.append('file', file)
        if (altText.trim()) fd.append('alt_text', altText.trim())
        const response = await fetch(`${API_BASE}/albums/${editingAlbumId}/upload-image`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        })
        if (!response.ok) {
          let detail = 'No se pudo subir la imagen'
          try {
            const json = await response.json()
            detail = json.detail || detail
          } catch {
            // ignore malformed bodies
          }
          failed.push(`${file.name}: ${detail}`)
        }
      }
      if (failed.length) {
        setError(`Algunas imágenes fallaron: ${failed.join(' | ')}`)
        addToast('Subida parcial completada', { type: 'warning' })
      } else {
        addToast('Imágenes subidas al álbum', { type: 'success' })
      }
      e.target.reset()
      setEditingAlbumFiles([])
      await Promise.all([refreshAlbums(), loadAlbumDetail(editingAlbumId)])
    } catch (err) {
      setError(err.message)
      addToast('Error al subir imágenes: ' + err.message, { type: 'error' })
    } finally {
      setEditingAlbumLoading(false)
    }
  }

  function handleNewsDraftFilesChange(e) {
    const selectedFiles = Array.from(e.target.files || [])
    setNewsDraftFiles((prev) => {
      prev.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
      })
      return selectedFiles.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        kind: file.type.startsWith('image/') ? 'image' : 'document',
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      }))
    })
  }

  function removeNewsDraftFile(fileId) {
    setNewsDraftFiles((prev) => {
      const target = prev.find((item) => item.id === fileId)
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((item) => item.id !== fileId)
    })
  }

  function handleNewsAttachmentFilesChange(e) {
    const selectedFiles = Array.from(e.target.files || [])
    setNewsAttachmentFiles((prev) => {
      prev.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
      })
      return selectedFiles.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        kind: file.type.startsWith('image/') ? 'image' : 'document',
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      }))
    })
  }

  function removeNewsAttachmentFile(fileId) {
    setNewsAttachmentFiles((prev) => {
      const target = prev.find((item) => item.id === fileId)
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((item) => item.id !== fileId)
    })
  }

  function handleActivityDraftFilesChange(e) {
    const selectedFiles = Array.from(e.target.files || [])
    setActivityDraftFiles((prev) => {
      prev.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
      })
      return selectedFiles.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        kind: file.type.startsWith('image/')
          ? 'image'
          : file.type.startsWith('video/')
            ? 'video'
            : file.type.startsWith('audio/')
              ? 'audio'
              : 'document',
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      }))
    })
  }

  function removeActivityDraftFile(fileId) {
    setActivityDraftFiles((prev) => {
      const target = prev.find((item) => item.id === fileId)
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((item) => item.id !== fileId)
    })
  }

  function handleActivityAttachmentFilesChange(e) {
    const selectedFiles = Array.from(e.target.files || [])
    setActivityAttachmentFiles((prev) => {
      prev.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
      })
      return selectedFiles.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        kind: file.type.startsWith('image/')
          ? 'image'
          : file.type.startsWith('video/')
            ? 'video'
            : file.type.startsWith('audio/')
              ? 'audio'
              : 'document',
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      }))
    })
  }

  function removeActivityAttachmentFile(fileId) {
    setActivityAttachmentFiles((prev) => {
      const target = prev.find((item) => item.id === fileId)
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((item) => item.id !== fileId)
    })
  }

  async function uploadActivityAttachment(activityId, files, caption = '') {
    const fd = new FormData()
    for (const f of files) fd.append('file', f)
    if (caption) fd.append('caption', caption)
    const response = await fetch(`${API_BASE}/activities/${activityId}/attachments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    })
    if (!response.ok) {
      let detail = 'No se pudo subir el adjunto de actividad'
      try {
        const json = await response.json()
        detail = json.detail || detail
      } catch {
        // ignore malformed bodies
      }
      throw new Error(detail)
    }
    return response.json()
  }

  async function deleteActivityAttachment(activityId, attachmentId) {
    guard()
    setError('')
    setStatus('')
    try {
      const updated = await api(`/activities/${activityId}/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      setCreatedActivity(updated)
      setStatus('Adjunto de actividad eliminado correctamente')
      refreshPublic?.()
    } catch (err) {
      setError(err.message)
    }
  }

  async function uploadNewsAttachment(newsId, files, caption = '') {
    if (!Array.isArray(files)) files = [files]
    const fd = new FormData()
    for (const f of files) fd.append('file', f)
    if (caption) fd.append('caption', caption)
    const response = await fetch(`${API_BASE}/news/${newsId}/attachments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    })
    if (!response.ok) {
      let detail = 'No se pudo subir el adjunto'
      try {
        const json = await response.json()
        detail = json.detail || detail
      } catch {
        // ignore malformed bodies
      }
      throw new Error(detail)
    }
    return response.json()
  }

  async function deleteNewsAttachment(newsId, attachmentId) {
    guard()
    setError('')
    setStatus('')
    try {
      const updated = await api(`/news/${newsId}/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      setCreatedNews(updated)
      setStatus('Adjunto eliminado correctamente')
      refreshPublic?.()
    } catch (err) {
      setError(err.message)
    }
  }

  async function publishNews(newsId) {
    guard()
    setError('')
    setStatus('')
    try {
      await api(`/news/${newsId}/publish`, {
        method: 'POST',
        headers: authHeaders,
      })
      setCreatedNews((prev) => (prev ? { ...prev, status: 'published' } : prev))
      setStatus('Noticia publicada en el feed público')
      refreshPublic?.()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleNewsAttachmentUpload(e) {
    e.preventDefault()
    guard()
    if (!createdNews?.id) {
      setError('Primero crea la noticia')
      return
    }
    const files = Array.from(newsAttachmentFiles)
    const caption = e.target.newsAttachmentCaption?.value || ''
    if (!files.length) {
      setError('Selecciona uno o más archivos para adjuntar')
      return
    }
    setUploadingNewsAttachmentLoading(true)
    setError('')
    setStatus('')
    try {
      let updated = createdNews
      try {
        // upload all selected files in a single request
        const fileList = files.map((item) => item.file)
        updated = await uploadNewsAttachment(createdNews.id, fileList, caption || '')
        setCreatedNews(updated)
        setNewsAttachmentFiles([])
        setStatus(files.length > 1 ? 'Adjuntos agregados a la noticia' : 'Adjunto agregado a la noticia')
        addToast('Adjuntos agregados a la noticia', { type: 'success' })
      } catch (uploadError) {
        // single-request failure: report the error
        setError(uploadError.message)
        addToast('Error al subir adjuntos: ' + uploadError.message, { type: 'error' })
      }

      e.target.reset()
      refreshPublic?.()
    } catch (err) {
      setError(err.message)
      addToast('Error al subir adjuntos: ' + err.message, { type: 'error' })
    } finally {
      setUploadingNewsAttachmentLoading(false)
    }
  }

   async function uploadImage(file, altText) {
     guard()
     const fd = new FormData()
     fd.append('file', file)
     fd.append('alt_text', altText || '')
     const response = await fetch(`${API_BASE}/upload`, {
       method: 'POST',
       headers: { Authorization: `Bearer ${token}` },
       body: fd,
     })
     if (!response.ok) {
       throw new Error('No se pudo subir la imagen')
     }
     return response.json()
   }

   async function uploadActivityAttachments(e) {
      e.preventDefault()
      guard()
      if (!createdActivity?.id) {
        setError('Primero crea la actividad')
        return
      }
      const files = Array.from(activityAttachmentFiles)
      const caption = e.target.activityAttachmentCaption?.value || ''
      if (!files.length) {
        setError('Selecciona uno o mas archivos multimedia para adjuntar')
        return
      }
      setUploadingActivityAttachmentLoading(true)
      setError('')
      setStatus('')
      try {
        const fileList = files.map((item) => item.file)
        const updated = await uploadActivityAttachment(createdActivity.id, fileList, caption)
        setCreatedActivity(updated)
        setActivityAttachmentFiles([])
        setStatus(files.length > 1 ? 'Adjuntos agregados a la actividad' : 'Adjunto agregado a la actividad')
        addToast('Adjuntos agregados a la actividad', { type: 'success' })
        e.target.reset()
        refreshPublic?.()
      } catch (err) {
        setError(err.message)
        addToast('Error al subir adjuntos de actividad: ' + err.message, { type: 'error' })
      } finally {
        setUploadingActivityAttachmentLoading(false)
      }
   }

   async function uploadImageToGallery(e) {
      e.preventDefault()
      guard()
      setUploadingGalleryLoading(true)
       const files = Array.from(e.target.galleryImage?.files || [])
       const altText = e.target.galleryAltText?.value || ''
       if (!files.length) {
         setError('Selecciona una o más imágenes para la galería')
         setUploadingGalleryLoading(false)
         return
       }
       setError('')
       setStatus('')
       try {
         const failed = []
         for (const file of files) {
           try {
             const fd = new FormData()
             fd.append('file', file)
             fd.append('alt_text', altText)
             await fetch(`${API_BASE}/galleries/${createdGalleryId}/upload-image`, {
               method: 'POST',
               headers: { Authorization: `Bearer ${token}` },
               body: fd,
             })
           } catch (err) {
             failed.push(`${file.name}: ${err.message}`)
           }
         }
         if (failed.length) {
           setError(`Algunas imágenes fallaron: ${failed.join(' | ')}`)
           setStatus('Subida parcial completada')
           addToast('Subida parcial completada', { type: 'warning' })
         } else {
           setStatus(files.length > 1 ? 'Imágenes añadidas a la galería correctamente' : 'Imagen añadida a la galería correctamente')
           addToast('Imágenes añadidas a la galería', { type: 'success' })
         }
         e.target.reset()
         refreshPublic?.()
       } catch (err) {
         setError(err.message)
         addToast('Error al subir imágenes de galería: ' + err.message, { type: 'error' })
       } finally {
         setUploadingGalleryLoading(false)
       }
   }

  async function saveSiteProfile(e) {
    e.preventDefault()
    guard()
    setError('')
    setStatus('')
    setSavingProfile(true)
    try {
      await api('/site/profile', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(profileForm),
      })
      setStatus('Perfil institucional actualizado')
      addToast('Perfil actualizado', { type: 'success' })
      refreshPublic?.()
    } catch (err) {
      setError(err.message)
      addToast('Error al actualizar perfil: ' + err.message, { type: 'error' })
    } finally {
      setSavingProfile(false)
    }
  }

  async function createNews(e) {
    e.preventDefault()
    guard()
    setError('')
    setStatus('')
    setCreatingNews(true)
    const draftFiles = [...newsDraftFiles]
    try {
      const newsData = await api('/news', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          title: form.newsTitle,
          excerpt: form.newsExcerpt,
          content: form.newsContent,
          status: 'draft',
        }),
      })

      let currentNews = newsData
      const failedFiles = []
      for (const draftFile of draftFiles) {
        try {
          currentNews = await uploadNewsAttachment(newsData.id, draftFile.file, draftFile.file.name)
        } catch (uploadError) {
          failedFiles.push(`${draftFile.file.name}: ${uploadError.message}`)
        }
      }

      setCreatedNews(currentNews)
      setForm((prev) => ({ ...prev, newsTitle: '', newsExcerpt: '', newsContent: '' }))
      setNewsDraftFiles([])

      if (failedFiles.length) {
        setError(`La noticia se creó, pero algunos adjuntos fallaron: ${failedFiles.join(' | ')}`)
        setStatus('Borrador creado con adjuntos parciales. Revisa la vista previa antes de publicar.')
      } else if (draftFiles.length) {
        setStatus('Borrador creado con adjuntos. Revisa la vista previa y publícalo cuando quieras.')
      } else {
        setStatus('Borrador creado. Ya puedes añadir adjuntos o publicarlo.')
      }
      refreshPublic?.()
      addToast('Borrador creado', { type: 'success' })
    } catch (err) {
      setError(err.message)
      addToast('Error al crear borrador: ' + err.message, { type: 'error' })
    } finally {
      setCreatingNews(false)
    }
  }

   async function createNotice(e) {
     e.preventDefault()
     guard()
     setError('')
     setStatus('')
     setCreatingNotice(true)
     try {
        const payload = {
         title: form.noticeTitle,
         content: form.noticeContent,
         audience: form.noticeAudience || 'all',
         pinned: true,
       }
        if (form.noticeExpiry) {
          payload.end_at = new Date(form.noticeExpiry).toISOString()
        }
        // Diagnostics: log payload and headers so browser console shows details when a network error occurs
        try {
          console.debug('[createNotice] sending payload', payload)
          console.debug('[createNotice] authHeaders', authHeaders)
          console.debug('[createNotice] origin', window.location.origin)
        } catch (consoleErr) {
          // ignore if console access fails in some environments
        }

        await api('/notices', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(payload),
        })
       setStatus('Aviso creado')
       addToast('Aviso creado', { type: 'success' })
       setForm((prev) => ({ ...prev, noticeTitle: '', noticeContent: '', noticeExpiry: '', noticeAudience: 'all' }))
       refreshPublic?.()
      } catch (err) {
        // Improve error logging to capture network errors (Failed to fetch) in the browser console
        try {
          console.error('[createNotice] request failed', err)
        } catch (consoleErr) {}
        setError(err.message)
        addToast('Error al crear aviso: ' + err.message, { type: 'error' })
     } finally {
       setCreatingNotice(false)
     }
   }

   async function createActivity(e) {
      e.preventDefault()
      guard()
      setError('')
      setStatus('')
      setCreatingActivityLoading(true)
      const draftFiles = [...activityDraftFiles]
      try {
        const activityData = await api('/activities', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            title: form.activityTitle,
            description: form.activityDescription,
            activity_type: form.activityType || 'cultural',
            location: form.activityLocation || null,
            date: form.activityDate ? new Date(form.activityDate).toISOString() : null,
            publish_at: form.activityPublishAt ? new Date(form.activityPublishAt).toISOString() : null,
          }),
        })
        let currentActivity = activityData
        const failedFiles = []
        for (const draftFile of draftFiles) {
          try {
            currentActivity = await uploadActivityAttachment(activityData.id, [draftFile.file], draftFile.file.name)
          } catch (uploadError) {
            failedFiles.push(`${draftFile.file.name}: ${uploadError.message}`)
          }
        }

        setCreatedActivity(currentActivity)
        if (failedFiles.length) {
          setError(`La actividad se creo, pero algunos adjuntos fallaron: ${failedFiles.join(' | ')}`)
          setStatus('Actividad creada con adjuntos parciales.')
        } else if (draftFiles.length) {
          setStatus('Actividad creada con adjuntos multimedia.')
        } else {
          setStatus('Actividad creada. Ya puedes agregar mas adjuntos.')
        }
        addToast('Actividad creada', { type: 'success' })
        setForm((prev) => ({
          ...prev,
          activityTitle: '',
          activityDescription: '',
          activityType: 'cultural',
          activityLocation: '',
          activityDate: '',
          activityPublishAt: '',
        }))
        setActivityDraftFiles([])
        refreshPublic?.()
      } catch (err) {
        setError(err.message)
        addToast('Error al crear actividad: ' + err.message, { type: 'error' })
      } finally {
        setCreatingActivityLoading(false)
      }
    }

   async function createGallery(e) {
      e.preventDefault()
      guard()
      setError('')
      setStatus('')
      setCreatingGalleryLoading(true)
      try {
        const galleryData = await api('/galleries', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            title: form.galleryTitle,
            description: form.galleryDescription,
          }),
        })
        setCreatedGalleryId(galleryData.id)
        setStatus('Galería creada. Ahora puedes subir imágenes a ella.')
        addToast('Galería creada', { type: 'success' })
        setForm((prev) => ({ ...prev, galleryTitle: '', galleryDescription: '' }))
        try {
          await api('/albums', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
              gallery_id: galleryData.id,
              title: galleryData.title || form.galleryTitle || 'Álbum principal',
              description: galleryData.description || form.galleryDescription || null,
            }),
          })
        } catch (albumErr) {
          addToast('La galería se creó, pero no se pudo generar su álbum inicial: ' + albumErr.message, { type: 'warning' })
        }
        refreshPublic?.()
        await refreshAlbums().catch(() => null)
      } catch (err) {
        setError(err.message)
        addToast('Error al crear galería: ' + err.message, { type: 'error' })
      } finally {
        setCreatingGalleryLoading(false)
      }
    }

  async function saveHistory(e) {
    e.preventDefault()
    guard()
    setError('')
    setStatus('')
    setSavingHistoryLoading(true)
    try {
      await api('/history', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ content: historyContent }),
      })
      setStatus('Historia actualizada')
      addToast('Historia actualizada', { type: 'success' })
      refreshPublic?.()
    } catch (err) {
      setError(err.message)
      addToast('Error al guardar historia: ' + err.message, { type: 'error' })
    } finally {
      setSavingHistoryLoading(false)
    }
  }

  async function sendNotification(e) {
    e.preventDefault()
    guard()
    setError('')
    setStatus('')
    setSendingNotificationLoading(true)
    try {
      await api('/notifications/send', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          title: form.notificationTitle,
          body: form.notificationBody,
          audience: 'all',
          send_email: true,
          send_push: true,
        }),
      })
      setStatus('Notificación enviada')
      addToast('Notificación enviada', { type: 'success' })
      setForm((prev) => ({ ...prev, notificationTitle: '', notificationBody: '' }))
    } catch (err) {
      setError(err.message)
      addToast('Error al enviar notificación: ' + err.message, { type: 'error' })
    } finally {
      setSendingNotificationLoading(false)
    }
  }

  async function connectGoogle() {
    guard()
    setError('')
    setStatus('')
    setSyncingGoogleLoading(true)
    try {
      const data = await api('/google/auth_url', { headers: authHeaders })
      window.open(data.url, '_blank', 'noopener,noreferrer')
      setStatus('Abriendo ventana de autorización de Google Calendar')
      addToast('Abriendo Google Auth', { type: 'info' })
    } catch (err) {
      setError(err.message)
      addToast('Error al conectar Google: ' + err.message, { type: 'error' })
    } finally {
      setSyncingGoogleLoading(false)
    }
  }

  async function syncGoogleEvent(e) {
    e.preventDefault()
    guard()
    setError('')
    setStatus('')
    setSyncingGoogleLoading(true)
    try {
      await api('/google/sync_event', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          summary: form.googleSummary,
          description: form.googleDescription,
          location: form.googleLocation,
          start: form.googleStart,
          end: form.googleEnd,
          timezone: 'America/La_Paz',
          send_updates: 'all',
        }),
      })
      setStatus('Evento sincronizado con Google Calendar')
      addToast('Evento sincronizado con Google Calendar', { type: 'success' })
      setForm((prev) => ({
        ...prev,
        googleSummary: '',
        googleDescription: '',
        googleLocation: '',
        googleStart: '',
        googleEnd: '',
      }))
    } catch (err) {
      setError(err.message)
      addToast('Error al sincronizar evento: ' + err.message, { type: 'error' })
    } finally {
      setSyncingGoogleLoading(false)
    }
  }

  async function handleUpload(e) {
    e.preventDefault()
    guard()
    setHandlingBulkUpload(true)
    const files = Array.from(e.target.image?.files || [])
    const altText = e.target.altText.value
    if (!files.length) {
      setError('Selecciona una o más imágenes')
      setHandlingBulkUpload(false)
      return
    }
    setError('')
    setStatus('')
    try {
      const failed = []
      for (const file of files) {
        try {
          await uploadImage(file, altText)
        } catch (err) {
          failed.push(`${file.name}: ${err.message}`)
        }
      }
      if (failed.length) {
        setError(`Algunas imágenes fallaron: ${failed.join(' | ')}`)
        setStatus('Subida parcial completada')
        addToast('Subida parcial completada', { type: 'warning' })
      } else {
        setStatus(files.length > 1 ? 'Imágenes subidas y miniaturas generadas' : 'Imagen subida y miniatura generada')
        addToast('Imágenes subidas', { type: 'success' })
      }
      e.target.reset()
      refreshPublic?.()
    } catch (err) {
      setError(err.message)
      addToast('Error al subir imágenes: ' + err.message, { type: 'error' })
    } finally {
      setHandlingBulkUpload(false)
    }
  }


  return (
    <section className="admin-grid admin-layout">
      <aside className="admin-drawer">
        <Card title="Panel admin" subtitle={activeSection.description}>
          <div className="admin-note">
            <p><strong>Flujo:</strong> inicia sesión como ADMIN y usa la barra lateral para ir a cada bloque.</p>
            <p>Los cambios refrescan el contenido público al instante.</p>
          </div>
          {error ? <p className="error">{error}</p> : null}
          {status ? <p className="success">{status}</p> : null}

          <label className="field admin-search">
            <span>Buscar sección</span>
            <input placeholder="Filtrar secciones..." value={adminSearch} onChange={(e) => setAdminSearch(e.target.value)} />
          </label>

          <div className="admin-quick-actions">
            <button className="btn btn--ghost" type="button" onClick={() => navigateAdminSection('noticias')}>Nueva noticia</button>
            <button className="btn btn--ghost" type="button" onClick={() => navigateAdminSection('avisos')}>Crear aviso</button>
            <button className="btn btn--ghost" type="button" onClick={() => navigateAdminSection('actividades')}>Nueva actividad</button>
            <button className="btn btn--ghost" type="button" onClick={() => navigateAdminSection('galeria')}>Nueva galería</button>
            {isAdmin ? <button className="btn btn--ghost" type="button" onClick={() => navigateAdminSection('usuarios')}>Nuevo usuario</button> : null}
          </div>

          <div className="admin-actions" style={{ marginTop: 8 }}>
            <LoadingButton className="btn btn--ghost" loading={syncingGoogleLoading} onClick={connectGoogle} type="button">Conectar Google Calendar</LoadingButton>
            <button className="btn btn--ghost" onClick={() => refreshPublic?.()} type="button">Refrescar contenido</button>
          </div>
        </Card>

        <Card title="Navegación" subtitle="Sección de trabajo">
          <div className="admin-nav-mobile">
            <label className="field">
              <span>Ir a sección</span>
              <select value={activeAdminSection} onChange={(e) => navigateAdminSection(e.target.value)}>
                {visibleAdminSections.map((section) => (
                  <option key={section.id} value={section.id}>{section.label}</option>
                ))}
              </select>
            </label>
          </div>
          <nav className="admin-tabs admin-nav-desktop" aria-label="Secciones de administración">
            {visibleAdminSections.map((section) => (
              <button
                key={section.id}
                type="button"
                className={`admin-tab-btn ${activeAdminSection === section.id ? 'active' : ''}`}
                onClick={() => navigateAdminSection(section.id)}
              >
                {section.label}
              </button>
            ))}
          </nav>
          <p className="state-empty">{activeSection.description}</p>
        </Card>
      </aside>

      <div className="admin-workspace">
        {activeAdminSection === 'overview' && (
          <div className="grid gap-sm">
            <Card title="Sesión activa" subtitle="Usuario autenticado">
              {token ? (
                <div className="stack gap-sm">
                  <p><strong>Estado:</strong> Autenticado</p>
                  <p>Usa las secciones de la barra lateral para editar contenido sin llenar una lista larga de formularios.</p>
                </div>
              ) : (
                <p className="state-empty">No hay sesión activa.</p>
              )}
            </Card>

            <Card title="Subir imagen" subtitle="MinIO + thumbnail">
              <form className="stack gap-sm" onSubmit={handleUpload}>
                <label className="field">
                  <span>Imagen(es)</span>
                  <input name="image" type="file" accept="image/*" multiple />
                </label>
                <label className="field">
                  <span>Alt text</span>
                  <input name="altText" type="text" placeholder="Descripción accesible" />
                </label>
                <LoadingButton className="btn" loading={handlingBulkUpload} type="submit">Subir</LoadingButton>
              </form>
            </Card>
          </div>
        )}

        {activeAdminSection === 'perfil' && (
          <>
          <Card title="Perfil institucional" subtitle="Cabecera, hero y pie de página">
            <form className="stack gap-sm" onSubmit={saveSiteProfile}>
              <div className="grid grid--2 profile-grid">
                <label className="field"><span>Nombre de la escuela</span><input value={profileForm.school_name} onChange={(e) => setProfileForm((p) => ({ ...p, school_name: e.target.value }))} /></label>
                <label className="field"><span>Eslogan</span><input value={profileForm.tagline} onChange={(e) => setProfileForm((p) => ({ ...p, tagline: e.target.value }))} /></label>
                <label className="field"><span>Título del hero</span><input value={profileForm.hero_title} onChange={(e) => setProfileForm((p) => ({ ...p, hero_title: e.target.value }))} /></label>
                <label className="field"><span>Subtítulo del hero</span><input value={profileForm.hero_subtitle} onChange={(e) => setProfileForm((p) => ({ ...p, hero_subtitle: e.target.value }))} /></label>
                <label className="field"><span>Texto CTA</span><input value={profileForm.hero_cta} onChange={(e) => setProfileForm((p) => ({ ...p, hero_cta: e.target.value }))} /></label>
                <label className="field"><span>Imagen del hero</span><input value={profileForm.hero_image_url} onChange={(e) => setProfileForm((p) => ({ ...p, hero_image_url: e.target.value }))} placeholder="https://..." /></label>
                <label className="field"><span>Texto de búsqueda</span><input value={profileForm.search_placeholder} onChange={(e) => setProfileForm((p) => ({ ...p, search_placeholder: e.target.value }))} /></label>
                <label className="field"><span>Dirección</span><input value={profileForm.address} onChange={(e) => setProfileForm((p) => ({ ...p, address: e.target.value }))} /></label>
                <label className="field"><span>Teléfono</span><input value={profileForm.phone} onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))} /></label>
                <label className="field"><span>Correo</span><input value={profileForm.email} onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))} /></label>
                <label className="field"><span>Facebook</span><input value={profileForm.facebook_url} onChange={(e) => setProfileForm((p) => ({ ...p, facebook_url: e.target.value }))} /></label>
                <label className="field"><span>Instagram</span><input value={profileForm.instagram_url} onChange={(e) => setProfileForm((p) => ({ ...p, instagram_url: e.target.value }))} /></label>
                <label className="field"><span>YouTube</span><input value={profileForm.youtube_url} onChange={(e) => setProfileForm((p) => ({ ...p, youtube_url: e.target.value }))} /></label>
              </div>
              <LoadingButton className="btn" loading={savingProfile} type="submit">Guardar perfil</LoadingButton>
            </form>
          </Card>

          <Card title="Usuarios registrados" subtitle="Lista y edición rápida">
            {loadingUsers ? (
              <LoadingState message="Cargando usuarios..." />
            ) : usersList.length === 0 ? (
              <p className="state-empty">No hay usuarios registrados aún.</p>
            ) : (
              <div className="stack gap-sm">
                {usersList.map((u) => (
                  <div key={u.id} className="user-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{u.name}</strong>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>{u.email} • {displayRole(u.role_name) || ''}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn--small" type="button" onClick={() => openEditUser(u)}>Editar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
          {editingUser ? (
            <div className="modal-overlay" onClick={closeEditUser}>
              <div onClick={(e) => e.stopPropagation()}>
                <Card title={`Editar usuario: ${editingUser.name}`} subtitle={editingUser.email}>
                  <form className="stack gap-sm" onSubmit={updateUser}>
                    <label className="field"><span>Nombre</span><input value={editUserForm.name} onChange={(e) => setEditUserForm((p) => ({ ...p, name: e.target.value }))} /></label>
                    <label className="field"><span>Email</span><input value={editUserForm.email} onChange={(e) => setEditUserForm((p) => ({ ...p, email: e.target.value }))} type="email" /></label>
                    <label className="field"><span>Nueva contraseña (opcional)</span><input value={editUserForm.password} onChange={(e) => setEditUserForm((p) => ({ ...p, password: e.target.value }))} type="password" /></label>
                    <label className="field"><span>Rol</span>
                      <select value={editUserForm.role_name} onChange={(e) => setEditUserForm((p) => ({ ...p, role_name: e.target.value }))}>
                        <option value="ESTUDIANTE">Estudiante</option>
                        <option value="EDITOR">Editor</option>
                        <option value="PROFESOR">Profesor</option>
                        <option value="ADMIN">Administrador</option>
                        <option value="PADRE">Padre</option>
                        <option value="INVITADO">Invitado</option>
                      </select>
                    </label>
                    <label className="field"><span>Avatar URL (opcional)</span><input value={editUserForm.avatar_url} onChange={(e) => setEditUserForm((p) => ({ ...p, avatar_url: e.target.value }))} /></label>
                    <label className="field"><span>Avatar (archivo) (opcional)</span><input type="file" accept="image/*" onChange={(e) => setEditAvatarFile(e.target.files?.[0] || null)} /></label>
                    <div className="admin-actions">
                      <LoadingButton className="btn" loading={updatingUserLoading} type="submit">Guardar cambios</LoadingButton>
                      <button className="btn btn--ghost" type="button" onClick={closeEditUser}>Cancelar</button>
                    </div>
                  </form>
                </Card>
              </div>
            </div>
          ) : null}
          </>
        )}

        {activeAdminSection === 'usuarios' && isAdmin && (
          <Card title="Crear usuario" subtitle="Administración de accesos">
            <form className="stack gap-sm" onSubmit={createUser}>
              <div className="grid grid--2 profile-grid">
                <label className="field"><span>Nombre completo</span><input value={userForm.name} onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nombre del usuario" /></label>
                <label className="field"><span>Email</span><input value={userForm.email} onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))} type="email" placeholder="correo@ejemplo.com" /></label>
                <label className="field"><span>Contraseña</span><input value={userForm.password} onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))} type="password" placeholder="Contraseña temporal o definitiva" /></label>
                <label className="field"><span>Rol</span>
                  <select value={userForm.role_name} onChange={(e) => setUserForm((p) => ({ ...p, role_name: e.target.value }))}>
                    <option value="ESTUDIANTE">Estudiante</option>
                    <option value="EDITOR">Editor</option>
                    <option value="PROFESOR">Profesor</option>
                    <option value="ADMIN">Administrador</option>
                    <option value="PADRE">Padre</option>
                    <option value="INVITADO">Invitado</option>
                  </select>
                </label>
                <label className="field"><span>Avatar URL (opcional)</span>
                  <input value={userForm.avatar_url} onChange={(e) => setUserForm((p) => ({ ...p, avatar_url: e.target.value }))} placeholder="https://..." />
                </label>
                <label className="field"><span>Avatar (archivo) (opcional)</span>
                  <input type="file" accept="image/*" onChange={(e) => setUserAvatarFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              <p className="state-empty">Si no se define avatar, el encabezado mostrará un identicon tipo GitHub.</p>
              <LoadingButton className="btn" loading={creatingUserLoading} type="submit">Crear usuario</LoadingButton>
            </form>
          </Card>
        )}

        {activeAdminSection === 'noticias' && (
          <div className="grid gap-sm">
            <Card title="Crear noticia" subtitle="News">
              <form className="stack gap-sm" onSubmit={createNews}>
                <label className="field"><span>Título</span><input value={form.newsTitle} onChange={(e) => setForm((p) => ({ ...p, newsTitle: e.target.value }))} /></label>
                <label className="field"><span>Resumen</span><input value={form.newsExcerpt} onChange={(e) => setForm((p) => ({ ...p, newsExcerpt: e.target.value }))} /></label>
                <label className="field"><span>Contenido</span><textarea rows="4" value={form.newsContent} onChange={(e) => setForm((p) => ({ ...p, newsContent: e.target.value }))} /></label>
                <label className="field">
                  <span>Adjuntos para la noticia</span>
                  <input
                    name="newsAttachments"
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
                    onChange={handleNewsDraftFilesChange}
                  />
                </label>
                <NewsFilePreviewList files={newsDraftFiles} onRemove={removeNewsDraftFile} />
                <LoadingButton className="btn" loading={creatingNews} type="submit">Guardar borrador</LoadingButton>
              </form>
            </Card>

            {createdNews && (
              <Card title="Adjuntos de la noticia" subtitle={`Borrador ${createdNews.id.substring(0, 8)}`}>
                <form className="stack gap-sm" onSubmit={handleNewsAttachmentUpload}>
                  <label className="field">
                    <span>Nuevo archivo(s)</span>
                    <input
                      name="newsAttachment"
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
                      onChange={handleNewsAttachmentFilesChange}
                    />
                  </label>
                  <label className="field">
                    <span>Descripción opcional</span>
                    <input name="newsAttachmentCaption" type="text" placeholder="Se aplicará a todos los archivos seleccionados" />
                  </label>
                  <NewsFilePreviewList files={newsAttachmentFiles} onRemove={removeNewsAttachmentFile} />
                  <div className="admin-actions">
                    <LoadingButton className="btn" loading={uploadingNewsAttachmentLoading} type="submit">Agregar adjuntos</LoadingButton>
                  </div>
                </form>
                <NewsAttachmentManager news={createdNews} onDeleteAttachment={deleteNewsAttachment} onPublish={publishNews} canPublish={roleLabel === 'ADMIN'} />
              </Card>
            )}
          </div>
        )}

        {activeAdminSection === 'avisos' && (
          <Card title="Crear aviso" subtitle="Notices">
            <form className="stack gap-sm" onSubmit={createNotice}>
              <label className="field"><span>Título</span><input value={form.noticeTitle} onChange={(e) => setForm((p) => ({ ...p, noticeTitle: e.target.value }))} /></label>
              <label className="field"><span>Contenido</span><textarea rows="4" value={form.noticeContent} onChange={(e) => setForm((p) => ({ ...p, noticeContent: e.target.value }))} /></label>
              <label className="field">
                <span>Audiencia</span>
                <select value={form.noticeAudience} onChange={(e) => setForm((p) => ({ ...p, noticeAudience: e.target.value }))}>
                  <option value="all">Todos</option>
                  <option value="students">Estudiantes</option>
                  <option value="parents">Padres</option>
                  <option value="teachers">Profesores</option>
                </select>
              </label>
              <label className="field">
                <span>Fecha límite (opcional)</span>
                <input type="datetime-local" value={form.noticeExpiry} onChange={(e) => setForm((p) => ({ ...p, noticeExpiry: e.target.value }))} />
              </label>
              <LoadingButton className="btn" loading={creatingNotice} type="submit">Enviar aviso</LoadingButton>
            </form>
          </Card>
        )}

        {activeAdminSection === 'actividades' && (
          <div className="grid gap-sm">
            <Card title="Crear actividad" subtitle="Activities">
              <form className="stack gap-sm" onSubmit={createActivity}>
                <label className="field"><span>Titulo</span><input value={form.activityTitle} onChange={(e) => setForm((p) => ({ ...p, activityTitle: e.target.value }))} /></label>
                <label className="field"><span>Descripción</span><textarea rows="4" value={form.activityDescription} onChange={(e) => setForm((p) => ({ ...p, activityDescription: e.target.value }))} /></label>
                <label className="field">
                  <span>Tipo de actividad</span>
                  <select value={form.activityType} onChange={(e) => setForm((p) => ({ ...p, activityType: e.target.value }))}>
                    <option value="cultural">Cultural</option>
                    <option value="deportiva">Deportiva</option>
                    <option value="academica">Academica</option>
                  </select>
                </label>
                <label className="field"><span>Lugar</span><input value={form.activityLocation} onChange={(e) => setForm((p) => ({ ...p, activityLocation: e.target.value }))} placeholder="Patio central, coliseo, etc." /></label>
                <label className="field"><span>Fecha de actividad</span><input type="datetime-local" value={form.activityDate} onChange={(e) => setForm((p) => ({ ...p, activityDate: e.target.value }))} /></label>
                <label className="field"><span>Fecha de publicacion</span><input type="datetime-local" value={form.activityPublishAt} onChange={(e) => setForm((p) => ({ ...p, activityPublishAt: e.target.value }))} /></label>
                <label className="field">
                  <span>Adjuntos multimedia (imagenes, videos, audios)</span>
                  <input
                    name="activityAttachments"
                    type="file"
                    multiple
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                    onChange={handleActivityDraftFilesChange}
                  />
                </label>
                <ActivityFilePreviewList files={activityDraftFiles} onRemove={removeActivityDraftFile} />
                <LoadingButton className="btn" loading={creatingActivityLoading} type="submit">Guardar actividad</LoadingButton>
              </form>
            </Card>

            {createdActivity && (
              <Card title="Adjuntos de la actividad" subtitle={`Actividad ${createdActivity.id.substring(0, 8)}`}>
                <form className="stack gap-sm" onSubmit={uploadActivityAttachments}>
                  <label className="field">
                    <span>Nuevos archivos multimedia</span>
                    <input
                      name="activityAttachment"
                      type="file"
                      multiple
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                      onChange={handleActivityAttachmentFilesChange}
                    />
                  </label>
                  <label className="field">
                    <span>Descripción opcional</span>
                    <input name="activityAttachmentCaption" type="text" placeholder="Se aplicara a todos los archivos seleccionados" />
                  </label>
                  <ActivityFilePreviewList files={activityAttachmentFiles} onRemove={removeActivityAttachmentFile} />
                  <div className="admin-actions">
                    <LoadingButton className="btn" loading={uploadingActivityAttachmentLoading} type="submit">Agregar adjuntos</LoadingButton>
                    <button className="btn btn--ghost" type="button" onClick={() => setCreatedActivity(null)}>Finalizar</button>
                  </div>
                </form>
                {(() => {
                  const media = splitActivityMedia(createdActivity)
                  const allAttachments = [...media.images, ...media.videos, ...media.audios, ...media.documents]
                  if (!allAttachments.length) return <p className="state-empty">Aun no hay adjuntos en esta actividad.</p>
                  return (
                    <div className="news-draft-manager__list">
                      {allAttachments.map((attachment) => (
                        <div key={attachment.id || attachment.url} className="news-draft-item">
                          {attachment.kind === 'image' ? (
                            <div className="news-draft-item__thumb"><img src={attachment.url} alt={attachment.caption || attachment.filename} /></div>
                          ) : (
                            <div className="news-draft-item__thumb news-draft-item__thumb--doc"><strong>{attachment.kind.toUpperCase()}</strong></div>
                          )}
                          <div className="news-draft-item__body">
                            <strong>{attachment.filename}</strong>
                            <small>{attachment.caption || attachment.content_type || attachment.kind}</small>
                          </div>
                          <a className="btn btn--ghost btn--small" href={attachment.url} target="_blank" rel="noreferrer">Abrir</a>
                          <button className="btn btn--ghost btn--small" type="button" onClick={() => deleteActivityAttachmentForEdit(attachment.id)}>Borrar</button>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </Card>
            )}
          </div>
        )}

        {activeAdminSection === 'galeria' && (() => {
          const albumsData = albums || [];
          return (
            <div className="grid gap-sm">
              <Card title="Crear galería" subtitle="Galería institucional">
                <form className="stack gap-sm" onSubmit={createGallery}>
                  <label className="field"><span>Título</span><input value={form.galleryTitle} onChange={(e) => setForm((p) => ({ ...p, galleryTitle: e.target.value }))} /></label>
                  <label className="field"><span>Descripción</span><textarea rows="4" value={form.galleryDescription} onChange={(e) => setForm((p) => ({ ...p, galleryDescription: e.target.value }))} /></label>
                   <LoadingButton className="btn" loading={creatingGalleryLoading} type="submit">Guardar galería</LoadingButton>
                </form>
              </Card>

              <Card title="Álbumes existentes" subtitle="Se cargan directamente desde la base de datos">
                <div className="admin-actions" style={{ justifyContent: 'flex-end', marginBottom: '8px' }}>
                  <button className="btn btn--ghost btn--small" type="button" onClick={refreshAlbums}>Recargar desde BD</button>
                </div>
                {albumsLoading ? (
                  <LoadingState message="Cargando álbumes..." />
                ) : albumsData.length === 0 ? (
                  <p className="state-empty">No hay álbumes registrados.</p>
                ) : (
                  <div className="stack gap-sm">
                    {albumsData.map((album) => (
                      <div key={album.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <div style={{ minWidth: 0 }}>
                          <strong>{album.title}</strong>
                          <small style={{ display: 'block', color: '#666' }}>{album.images_count || 0} imagen(es)</small>
                        </div>
                        <button className="btn btn--small" type="button" onClick={() => openEditAlbum(album)}>Editar</button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {editingAlbumId && (
                <div className="modal-overlay" onClick={closeEditAlbum}>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Card title="Editar álbum" subtitle={`Álbum ${editingAlbumId.substring(0, 8)}`}>
                      <div className="admin-actions" style={{ justifyContent: 'space-between' }}>
                        <small>Modifica datos y sube imágenes solo para este álbum.</small>
                        <button className="btn btn--ghost btn--small" type="button" onClick={closeEditAlbum}>Cerrar</button>
                      </div>

                      <form className="stack gap-sm" onSubmit={updateAlbum}>
                        <label className="field"><span>Título</span><input value={editingAlbumForm.title} onChange={(e) => setEditingAlbumForm((p) => ({ ...p, title: e.target.value }))} /></label>
                        <label className="field"><span>Descripción</span><textarea rows="3" value={editingAlbumForm.description} onChange={(e) => setEditingAlbumForm((p) => ({ ...p, description: e.target.value }))} /></label>
                        <LoadingButton className="btn" loading={editingAlbumLoading} type="submit">Guardar cambios</LoadingButton>
                      </form>

                      <form className="stack gap-sm" style={{ marginTop: '20px' }} onSubmit={uploadAlbumImages}>
                        <label className="field">
                          <span>Subir imágenes a este álbum</span>
                          <input name="albumImages" type="file" accept="image/*" multiple onChange={handleAlbumFilesChange} />
                        </label>
                        <label className="field">
                          <span>Descripción común (opcional)</span>
                          <input name="albumAltText" type="text" placeholder="Se aplicará a todas las imágenes" />
                        </label>
                        {editingAlbumFiles.length > 0 ? <small>{editingAlbumFiles.length} archivo(s) seleccionado(s)</small> : null}
                        <LoadingButton className="btn btn--ghost" loading={editingAlbumLoading} type="submit">Subir imágenes</LoadingButton>
                      </form>

                      <form className="stack gap-sm" style={{ marginTop: '20px' }} onSubmit={uploadAlbumCover}>
                        <label className="field">
                          <span>Subir portada del álbum</span>
                          <input name="albumCoverImage" type="file" accept="image/*" onChange={handleAlbumCoverFileChange} />
                        </label>
                        {albumCoverFile ? <small>{albumCoverFile.name}</small> : null}
                        <LoadingButton className="btn btn--ghost" loading={editingAlbumLoading} type="submit">Subir portada</LoadingButton>
                      </form>

                      <div className="stack gap-sm" style={{ marginTop: '20px' }}>
                        <div className="admin-actions" style={{ justifyContent: 'space-between' }}>
                          <small>Selecciona una imagen existente como portada.</small>
                          <button className="btn btn--ghost btn--small" type="button" onClick={() => loadAlbumDetail(editingAlbumId)}>Recargar imágenes</button>
                        </div>
                        {!editingAlbumDetail ? (
                          <p className="state-empty">Cargando imágenes del álbum...</p>
                        ) : !editingAlbumDetail.images?.length ? (
                          <p className="state-empty">Este álbum aún no tiene imágenes.</p>
                        ) : (
                          <div className="news-draft-manager__list">
                            {editingAlbumDetail.images.map((image) => {
                              const isCover = Boolean(editingAlbumDetail.cover_image && image.url === editingAlbumDetail.cover_image)
                              return (
                                <div key={image.id} className="news-draft-item">
                                  <div className="news-draft-item__thumb">
                                    <img src={image.thumbnail_url || image.url} alt={image.alt_text || 'Imagen del álbum'} />
                                  </div>
                                  <div className="news-draft-item__body">
                                    <strong>{isCover ? 'Portada actual' : 'Imagen del álbum'}</strong>
                                    <small>{image.alt_text || image.url}</small>
                                  </div>
                                  <button
                                    className="btn btn--small"
                                    type="button"
                                    disabled={isCover || editingAlbumLoading}
                                    onClick={() => setAlbumCoverFromImage(image.url)}
                                  >
                                    {isCover ? 'Portada seleccionada' : 'Usar como portada'}
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {activeAdminSection === 'historia' && (
          <Card title="Editar historia" subtitle="Historia institucional">
            <form className="stack gap-sm" onSubmit={saveHistory}>
              <label className="field">
                <span>Contenido</span>
                <textarea rows="6" value={historyContent} onChange={(e) => setHistoryContent(e.target.value)} placeholder="Escribe la historia de la unidad educativa" />
              </label>
               <LoadingButton className="btn" loading={savingHistoryLoading} type="submit">Guardar historia</LoadingButton>
            </form>
          </Card>
        )}

        {activeAdminSection === 'notificaciones' && (
          <Card title="Enviar notificación" subtitle="Email + Web Push">
            <form className="stack gap-sm" onSubmit={sendNotification}>
              <label className="field"><span>Título</span><input value={form.notificationTitle} onChange={(e) => setForm((p) => ({ ...p, notificationTitle: e.target.value }))} /></label>
              <label className="field"><span>Mensaje</span><textarea rows="4" value={form.notificationBody} onChange={(e) => setForm((p) => ({ ...p, notificationBody: e.target.value }))} /></label>
               <LoadingButton className="btn" loading={sendingNotificationLoading} type="submit">Enviar</LoadingButton>
            </form>
          </Card>
        )}

        {activeAdminSection === 'google' && (
          <Card title="Sincronizar evento Google" subtitle="Google Calendar">
            <form className="stack gap-sm" onSubmit={syncGoogleEvent}>
              <label className="field"><span>Título del evento</span><input value={form.googleSummary} onChange={(e) => setForm((p) => ({ ...p, googleSummary: e.target.value }))} /></label>
              <label className="field"><span>Descripción</span><textarea rows="3" value={form.googleDescription} onChange={(e) => setForm((p) => ({ ...p, googleDescription: e.target.value }))} /></label>
              <label className="field"><span>Lugar</span><input value={form.googleLocation} onChange={(e) => setForm((p) => ({ ...p, googleLocation: e.target.value }))} /></label>
              <label className="field"><span>Inicio (ISO)</span><input value={form.googleStart} onChange={(e) => setForm((p) => ({ ...p, googleStart: e.target.value }))} placeholder="2026-05-23T18:00:00Z" /></label>
              <label className="field"><span>Fin (ISO)</span><input value={form.googleEnd} onChange={(e) => setForm((p) => ({ ...p, googleEnd: e.target.value }))} placeholder="2026-05-23T19:00:00Z" /></label>
              <button className="btn" type="submit">Sincronizar</button>
            </form>
          </Card>
        )}
      </div>
    </section>
  )
}

export default function App() {
  const [activeSection, setActiveSection] = useState('inicio')
  const [token, setToken] = useState(() => localStorage.getItem('school-auth-token') || '')
  const [userLabel, setUserLabel] = useState(() => localStorage.getItem('school-auth-user') || '')
  const [roleLabel, setRoleLabel] = useState(() => localStorage.getItem('school-auth-role') || '')
  const [userId, setUserId] = useState(() => localStorage.getItem('school-auth-id') || '')
  // avatar URL for logged user (shown in header). stored in localStorage to persist across reloads
  const [userAvatar, setUserAvatar] = useState(() => localStorage.getItem('school-auth-avatar') || '')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [profileAvatarFile, setProfileAvatarFile] = useState(null)
  const [profileAvatarLoading, setProfileAvatarLoading] = useState(false)
  const [profileAvatarStatus, setProfileAvatarStatus] = useState('')
  const [profileAvatarError, setProfileAvatarError] = useState('')
  const [pushMessage, setPushMessage] = useState('')
  const [pushError, setPushError] = useState('')
  const [isPushSubscribed, setIsPushSubscribed] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [noticeAudience, setNoticeAudience] = useState('all')
  const [activityFilter, setActivityFilter] = useState('all')
  const [editingNotice, setEditingNotice] = useState(null)
  const [editNoticeForm, setEditNoticeForm] = useState({ title: '', content: '', audience: 'all', end_at: '' })
  const [selectedNews, setSelectedNews] = useState(null)
   const [editingNews, setEditingNews] = useState(null)
   const [editNewsForm, setEditNewsForm] = useState({ title: '', excerpt: '', content: '' })
   const [savingNewsLoading, setSavingNewsLoading] = useState(false)
   const [savingNoticeLoading, setSavingNoticeLoading] = useState(false)
   const [deletingNoticeId, setDeletingNoticeId] = useState('')
    const [editingActivity, setEditingActivity] = useState(null)
    const [editActivityForm, setEditActivityForm] = useState({ title: '', description: '', activityType: 'cultural', location: '', date: '', publish_at: '' })
    const [savingActivityLoading, setSavingActivityLoading] = useState(false)
    const [activityEditFiles, setActivityEditFiles] = useState([])
    const [uploadingActivityEditLoading, setUploadingActivityEditLoading] = useState(false)
    const [activityImageEditFiles, setActivityImageEditFiles] = useState([])
    const [uploadingActivityImagesLoading, setUploadingActivityImagesLoading] = useState(false)
      const [error, setError] = useState('')
      const [status, setStatus] = useState('')
   const { profile, news, notices, activities, albums, galleries, history, loading, warning, reload } = usePublicData()
   const { addToast } = useToast()

    const recentAlbums = useMemo(() => {
      return [...albums]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3)
    }, [albums])

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash && navItems.some((item) => item.id === hash)) setActiveSection(hash)
    }
    onHashChange()
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])


  function openEditNotice(notice) {
    setEditingNotice(notice)
    setEditNoticeForm({
      title: notice.title,
      content: notice.content,
      audience: notice.audience,
      end_at: notice.end_at ? new Date(notice.end_at).toISOString().slice(0, 16) : ''
    })
  }

  function closeEditNotice() {
    setEditingNotice(null)
    setEditNoticeForm({ title: '', content: '', audience: 'all', end_at: '' })
  }

  function openNews(item) {
    setSelectedNews(item)
  }

  function closeNews() {
    setSelectedNews(null)
  }

  function openEditNews(newsItem) {
    setEditingNews(newsItem)
    setEditNewsForm({
      title: newsItem.title,
      excerpt: newsItem.excerpt,
      content: newsItem.content
    })
  }

  function closeEditNews() {
    setEditingNews(null)
    setEditNewsForm({ title: '', excerpt: '', content: '' })
  }

  async function updateNews(e) {
    e.preventDefault()
    if (!token || !editingNews) return
    setSavingNewsLoading(true)
    try {
      await api(`/news/${editingNews.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: editNewsForm.title,
          excerpt: editNewsForm.excerpt,
          content: editNewsForm.content,
          status: editingNews.status
        })
      })
      closeEditNews()
      reload()
      addToast('Noticia actualizada correctamente', { type: 'success' })
    } catch (err) {
      addToast('Error al actualizar noticia: ' + err.message, { type: 'error' })
    } finally {
      setSavingNewsLoading(false)
    }
  }

  function openEditActivity(activity) {
    setEditingActivity(activity)
    setEditActivityForm({
      title: activity.title || '',
      description: activity.description || '',
      activityType: activity.activity_type || 'cultural',
      location: activity.location || '',
      date: activity.date ? new Date(activity.date).toISOString().slice(0, 16) : '',
      publish_at: activity.publish_at ? new Date(activity.publish_at).toISOString().slice(0, 16) : '',
    })
    setActivityEditFiles([])
  }

  function closeEditActivity() {
    setEditingActivity(null)
    setEditActivityForm({ title: '', description: '', activityType: 'cultural', location: '', date: '', publish_at: '' })
    setActivityEditFiles([])
  }

  function handleActivityEditFilesChange(e) {
    const files = Array.from(e.target.files || [])
    setActivityEditFiles((prev) => {
      prev.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
      })
      return files.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        kind: file.type.startsWith('image/')
          ? 'image'
          : file.type.startsWith('video/')
            ? 'video'
            : file.type.startsWith('audio/')
              ? 'audio'
              : 'document',
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      }))
    })
  }

  function handleActivityImageEditFilesChange(e) {
    const files = Array.from(e.target.files || [])
    setActivityImageEditFiles((prev) => {
      prev.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
      })
      return files.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        kind: 'image',
        previewUrl: URL.createObjectURL(file),
      }))
    })
  }

  function removeActivityEditFile(fileId) {
    setActivityEditFiles((prev) => {
      const target = prev.find((it) => it.id === fileId)
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((it) => it.id !== fileId)
    })
  }

  function removeActivityImageEditFile(fileId) {
    setActivityImageEditFiles((prev) => {
      const target = prev.find((it) => it.id === fileId)
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((it) => it.id !== fileId)
    })
  }

  async function setActivityCoverFromAttachment(url) {
    if (!token || !editingActivity || !url) return
    try {
      const updated = await api(`/activities/${editingActivity.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cover_image: url }),
      })
      setEditingActivity(updated)
      await reload()
      addToast('Portada asignada desde un adjunto', { type: 'success' })
    } catch (err) {
      addToast('Error al asignar portada: ' + err.message, { type: 'error' })
    }
  }

  async function updateActivity(e) {
    e.preventDefault()
    if (!token || !editingActivity) return
    setSavingActivityLoading(true)
    try {
      const payload = {
        title: editActivityForm.title,
        description: editActivityForm.description,
        activity_type: editActivityForm.activityType,
        location: editActivityForm.location || null,
      }
      if (editActivityForm.date) payload.date = new Date(editActivityForm.date).toISOString()
      if (editActivityForm.publish_at) payload.publish_at = new Date(editActivityForm.publish_at).toISOString()
      await api(`/activities/${editingActivity.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      closeEditActivity()
      reload()
      addToast('Actividad actualizada correctamente', { type: 'success' })
    } catch (err) {
      addToast('Error al actualizar actividad: ' + err.message, { type: 'error' })
    } finally {
      setSavingActivityLoading(false)
    }
  }

  async function uploadActivityAttachmentsForEdit(e) {
    e.preventDefault()
    if (!token || !editingActivity) return
    const files = Array.from(activityEditFiles || [])
    if (!files.length) {
      addToast('Selecciona uno o más archivos', { type: 'warning' })
      return
    }
    setUploadingActivityEditLoading(true)
    setError('')
    setStatus('')
    try {
      const fd = new FormData()
      for (const it of files) fd.append('file', it.file)
      const response = await fetch(`${API_BASE}/activities/${editingActivity.id}/attachments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      if (!response.ok) {
        let detail = 'No se pudieron subir los archivos'
        try {
          const json = await response.json()
          detail = json.detail || detail
        } catch {
          // ignore malformed bodies
        }
        throw new Error(detail)
      }
      const updated = await response.json()
      setEditingActivity(updated)
      setActivityEditFiles([])
      await reload()
      addToast('Archivos agregados a la actividad', { type: 'success' })
    } catch (err) {
      addToast('Error al agregar archivos: ' + err.message, { type: 'error' })
    } finally {
      setUploadingActivityEditLoading(false)
    }
  }

  async function uploadActivityImagesForEdit(e) {
    e.preventDefault()
    if (!token || !editingActivity) return
    const files = Array.from(activityImageEditFiles || [])
    if (!files.length) {
      addToast('Selecciona una o más imágenes', { type: 'warning' })
      return
    }
    setUploadingActivityImagesLoading(true)
    try {
      const fd = new FormData()
      for (const it of files) fd.append('file', it.file)
      const response = await fetch(`${API_BASE}/activities/${editingActivity.id}/attachments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      if (!response.ok) {
        let detail = 'No se pudieron subir las imágenes'
        try {
          const json = await response.json()
          detail = json.detail || detail
        } catch {
          // ignore malformed bodies
        }
        throw new Error(detail)
      }
      const updated = await response.json()
      setEditingActivity(updated)
      setActivityImageEditFiles([])
      await reload()
      addToast('Imágenes agregadas a la actividad', { type: 'success' })
    } catch (err) {
      addToast('Error al agregar imágenes: ' + err.message, { type: 'error' })
    } finally {
      setUploadingActivityImagesLoading(false)
    }
  }

  async function deleteActivityAttachmentForEdit(attachmentId) {
    if (!token || !editingActivity) return
    try {
      const updated = await api(`/activities/${editingActivity.id}/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setEditingActivity(updated)
      await reload()
      addToast('Adjunto eliminado', { type: 'success' })
    } catch (err) {
      addToast('Error al eliminar adjunto: ' + err.message, { type: 'error' })
    }
  }

  async function updateNotice(e) {
    e.preventDefault()
    if (!token || !editingNotice) return
    setSavingNoticeLoading(true)
    try {
      const payload = {
        title: editNoticeForm.title,
        content: editNoticeForm.content,
        audience: editNoticeForm.audience,
      }
      if (editNoticeForm.end_at) {
        payload.end_at = new Date(editNoticeForm.end_at).toISOString()
      }
      await api(`/notices/${editingNotice.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      closeEditNotice()
      reload()
      addToast('Aviso actualizado correctamente', { type: 'success' })
    } catch (err) {
      addToast('Error al actualizar aviso: ' + err.message, { type: 'error' })
    } finally {
      setSavingNoticeLoading(false)
    }
  }

  async function deleteNotice(noticeId) {
    if (!token) return
    if (!window.confirm('¿Estás seguro de que deseas eliminar este aviso?')) return
    setDeletingNoticeId(noticeId)
    try {
      await api(`/notices/${noticeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      reload()
      addToast('Aviso eliminado', { type: 'success' })
    } catch (err) {
      addToast('Error al eliminar aviso: ' + err.message, { type: 'error' })
    } finally {
      setDeletingNoticeId('')
    }
  }

  const filteredNews = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return news
    return news.filter((item) => {
      const text = `${item.title || ''} ${item.excerpt || ''} ${item.content || ''}`.toLowerCase()
      return text.includes(term)
    })
  }, [news, searchTerm])

  const sortedNews = useMemo(() => {
    // ensure deterministic order: newest first by created_at
    try {
      return [...filteredNews].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } catch (err) {
      return filteredNews
    }
  }, [filteredNews])

  const filteredNotices = useMemo(() => {
    if (noticeAudience === 'all') return notices
    return notices.filter((item) => (item.audience || 'all') === noticeAudience || (item.audience || 'all') === 'all')
  }, [notices, noticeAudience])

  const filteredActivities = useMemo(() => {
    if (activityFilter === 'all') return activities
    return activities.filter((item) => (item.activity_type || '').toLowerCase() === activityFilter)
  }, [activities, activityFilter])

  async function handleLogin(accessToken) {
    setToken(accessToken)
    localStorage.setItem('school-auth-token', accessToken)
    try {
      const me = await api('/auth/me', { headers: { Authorization: `Bearer ${accessToken}` } })
      const label = me?.name || 'Usuario'
      const roleName = me?.role_name || 'STUDENT'
      const id = me?.id || ''
      // detect avatar from common fields returned by API
      const avatarUrl = me?.avatar || me?.avatar_url || me?.picture || me?.image || me?.photo || me?.photo_url || ''
      setUserId(id)
      setUserLabel(label)
      setRoleLabel(roleName)
      setUserAvatar(avatarUrl)
      localStorage.setItem('school-auth-id', id)
      localStorage.setItem('school-auth-user', label)
      localStorage.setItem('school-auth-role', roleName)
      localStorage.setItem('school-auth-avatar', avatarUrl)
      setShowUserMenu(false)
    } catch {
      setUserLabel('Usuario')
      setRoleLabel('STUDENT')
      localStorage.setItem('school-auth-user', 'Usuario')
      localStorage.setItem('school-auth-role', 'STUDENT')
      setShowUserMenu(false)
    }
  }

  async function updateMyAvatar(e) {
    e.preventDefault()
    setProfileAvatarError('')
    setProfileAvatarStatus('')
    if (!token) {
      setProfileAvatarError('Inicia sesión para cambiar tu foto.')
      return
    }
    if (!profileAvatarFile) {
      setProfileAvatarError('Selecciona una imagen primero.')
      return
    }
    setProfileAvatarLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', profileAvatarFile)
      const response = await fetch(`${API_BASE}/auth/me/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      if (!response.ok) {
        let detail = 'No se pudo actualizar tu foto'
        try {
          const json = await response.json()
          detail = json.detail || detail
        } catch {
          // ignore malformed error bodies
        }
        throw new Error(detail)
      }
      const updated = await response.json()
      const nextAvatar = updated?.avatar_url || ''
      setUserAvatar(nextAvatar)
      localStorage.setItem('school-auth-avatar', nextAvatar || '')
      setProfileAvatarFile(null)
      setProfileAvatarStatus('Foto de perfil actualizada')
      setShowUserMenu(false)
    } catch (err) {
      setProfileAvatarError(err.message)
    } finally {
      setProfileAvatarLoading(false)
    }
  }

  function handleLogout() {
    setToken('')
    setUserId('')
    setUserLabel('')
    setRoleLabel('')
    setUserAvatar('')
    setProfileAvatarFile(null)
    setProfileAvatarLoading(false)
    setProfileAvatarStatus('')
    setProfileAvatarError('')
    localStorage.removeItem('school-auth-token')
    localStorage.removeItem('school-auth-id')
    localStorage.removeItem('school-auth-user')
    localStorage.removeItem('school-auth-role')
    localStorage.removeItem('school-auth-avatar')
    setShowUserMenu(false)
  }

  async function subscribePush() {
    setPushError('')
    setPushMessage('')
    if (!token) {
      setPushError('Inicia sesión como admin o usuario autenticado para suscribirte.')
      return
    }
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushError('Este navegador no soporta notificaciones push.')
      return
    }
    try {
      const registration = await navigator.serviceWorker.ready
      const existing = await registration.pushManager.getSubscription()
      if (existing) {
        setIsPushSubscribed(true)
        setPushMessage('Ya existe una suscripción activa en este navegador.')
        return
      }
      const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
      if (!publicKey) {
        setPushError('Falta VITE_VAPID_PUBLIC_KEY en el frontend')
        return
      }
      const convertedKey = Uint8Array.from(atob(publicKey), (c) => c.charCodeAt(0))
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      })
      await api('/notifications/subscribe', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(subscription.toJSON()),
      })
      setIsPushSubscribed(true)
      setPushMessage('Suscripción push registrada correctamente.')
    } catch (err) {
      setPushError(err.message)
    }
  }

  async function unsubscribePush() {
    setPushError('')
    setPushMessage('')
    if (!token) {
      setPushError('No hay sesión activa.')
      return
    }
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushError('Este navegador no soporta notificaciones push.')
      return
    }
    try {
      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.getSubscription()
      if (!sub) {
        setPushMessage('No había suscripción activa.')
        return
      }
      await api(`/notifications/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      await sub.unsubscribe()
      setIsPushSubscribed(false)
      setPushMessage('Suscripción push eliminada.')
    } catch (err) {
      setPushError(err.message)
    }
  }

  const latestNews = sortedNews[0]
  const latestNotice = filteredNotices[0]
  const latestActivity = filteredActivities[0]
  const [selectedAlbum, setSelectedAlbum] = useState(null)
  const canOpenAdminPanel = ['ADMIN', 'EDITOR', 'PROFESSOR'].includes((roleLabel || '').toUpperCase())
  const headerAvatar = useMemo(
    () => userAvatar || buildAvatarDataUrl(userLabel || userId || roleLabel || 'usuario'),
    [userAvatar, userLabel, userId, roleLabel],
  )
   const headerLogoUrl = '/escudo.png'
  const heroImageStyle = profile?.hero_image_url
    ? { backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.02), rgba(0,0,0,0.28)), url(${profile.hero_image_url})` }
    : undefined

  function goToSection(sectionId) {
    if (sectionId === 'acceso') {
      setShowUserMenu(true)
      return
    }
    setShowUserMenu(false)
    window.location.hash = sectionId
    setActiveSection(sectionId)
  }

  return (
    <AppErrorBoundary title="No se pudo cargar la aplicación" subtitle="Se produjo un error al renderizar la interfaz.">
    <div className="shell">
      <header className="topbar">
         <div className="brand">
           <img
             className="brand__logo"
             src={headerLogoUrl}
             alt={profile?.school_name || 'Escudo del colegio'}
             onError={(e) => {
               e.currentTarget.onerror = null
               e.currentTarget.src = '/escudo.jpg'
             }}
           />
           <div>
             <h1>{profile?.school_name || 'Cargando perfil institucional...'}</h1>
             <p>{profile?.tagline || 'Recuperando información desde la base de datos...'}</p>
           </div>
         </div>
        <div className="topbar__actions">
          <div className="socials" aria-label="Redes sociales">
            {profile?.facebook_url ? (
              <a className="socials__item socials__item--facebook" href={profile.facebook_url} target="_blank" rel="noreferrer" aria-label="Facebook"><SocialIcon network="facebook" /></a>
            ) : (
              <span className="socials__item socials__item--facebook" aria-hidden="true"><SocialIcon network="facebook" /></span>
            )}
            {profile?.instagram_url ? (
              <a className="socials__item socials__item--instagram" href={profile.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram"><SocialIcon network="instagram" /></a>
            ) : (
              <span className="socials__item socials__item--instagram" aria-hidden="true"><SocialIcon network="instagram" /></span>
            )}
            {profile?.youtube_url ? (
              <a className="socials__item socials__item--youtube" href={profile.youtube_url} target="_blank" rel="noreferrer" aria-label="YouTube"><SocialIcon network="youtube" /></a>
            ) : (
              <span className="socials__item socials__item--youtube" aria-hidden="true"><SocialIcon network="youtube" /></span>
            )}
          </div>
          <input
            className="search"
            placeholder={profile?.search_placeholder || 'Buscar noticias...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="header-auth" role="region" aria-label="Usuario">
            <button
              className="header-auth__trigger"
              type="button"
              onClick={() => setShowUserMenu((s) => !s)}
              aria-expanded={showUserMenu}
              aria-haspopup="menu"
            >
              <img className="header-auth__avatar" src={headerAvatar} alt={token ? (userLabel || 'Avatar de usuario') : 'Acceso'} />
                <span className="header-auth__label">
                  <strong>{token ? (userLabel || 'Usuario') : 'Acceso'}</strong>
                  <small>{token ? (displayRole(roleLabel) || 'Sin rol') : 'Iniciar sesión'}</small>
                </span>
            </button>
            {showUserMenu ? (
              <div className="header-auth__popover" role="dialog" aria-label="Menú de usuario">
                {token ? (
                  <div className="header-auth__menu" role="menu">
                    <div className="header-auth__menu-profile">
                      <img className="auth-avatar" src={headerAvatar} alt={userLabel || 'Avatar de usuario'} />
                        <div>
                        <strong>{userLabel || 'Usuario'}</strong>
                        <small>{displayRole(roleLabel) || 'Sin rol'}</small>
                      </div>
                    </div>

                    <form className="header-auth__avatar-form stack gap-sm" onSubmit={updateMyAvatar}>
                      <label className="field">
                        <span>Cambiar foto de perfil</span>
                        <input type="file" accept="image/*" onChange={(e) => setProfileAvatarFile(e.target.files?.[0] || null)} />
                      </label>
                      {profileAvatarError ? <p className="error">{profileAvatarError}</p> : null}
                      {profileAvatarStatus ? <p className="success">{profileAvatarStatus}</p> : null}
                      <LoadingButton className="btn btn--ghost btn--small" loading={profileAvatarLoading} disabled={profileAvatarLoading || !profileAvatarFile} type="submit">
                        {profileAvatarLoading ? 'Guardando...' : 'Guardar foto'}
                      </LoadingButton>
                    </form>

                    <button type="button" className="header-auth__menu-item" role="menuitem" onClick={() => { localStorage.setItem('school-admin-section','perfil'); goToSection('admin'); setShowUserMenu(false); }}>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span>Mi perfil</span>
                    </button>

                    {(roleLabel || '').toUpperCase() === 'ADMIN' ? (
                      <button type="button" className="header-auth__menu-item" role="menuitem" onClick={() => { localStorage.setItem('school-admin-section','overview'); goToSection('admin'); setShowUserMenu(false); }}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M3 13h8V3H3z" />
                          <path d="M13 21h8v-8h-8z" />
                        </svg>
                        <span>Administración</span>
                      </button>
                    ) : null}

                    <button type="button" className="header-auth__menu-item header-auth__menu-item--danger" role="menuitem" onClick={() => { handleLogout(); setShowUserMenu(false); }}>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <path d="M16 17l5-5-5-5" />
                        <path d="M21 12H9" />
                      </svg>
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                ) : (
                  <AuthPanel
                    compact
                    token={token}
                    userLabel={userLabel}
                    roleLabel={roleLabel}
                    avatarUrl={headerAvatar}
                    onLogin={handleLogin}
                    onLogout={handleLogout}
                    onAvatarUpdated={(nextAvatar) => {
                      setUserAvatar(nextAvatar)
                      localStorage.setItem('school-auth-avatar', nextAvatar || '')
                    }}
                    onOpenAdmin={() => {
                      goToSection('admin')
                      setShowUserMenu(false)
                    }}
                  />
                )}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <nav className="navbar">
        {navItems
          .filter((item) => item.id !== 'admin' || token)
          .map((item) => (
          <SectionButton
            key={item.id}
            active={activeSection === item.id}
            iconId={item.id}
            onClick={() => {
              goToSection(item.id)
            }}
          >
            {item.label}
          </SectionButton>
        ))}
      </nav>

      <main className="content" aria-busy={loading}>
        {warning ? <p className="state-empty">{warning}</p> : null}

        {activeSection === 'inicio' && (
          <>
            <section className="hero">
              <div className="hero__copy">
                <p className="hero__eyebrow">Periodismo estudiantil • Comunidad • Educación</p>
                <h2>{profile?.hero_title || 'Sagrado Corazón 4'}</h2>
                <p>{profile?.hero_subtitle || 'Promovemos el periodismo estudiantil para informar, inspirar y conectar a toda nuestra comunidad educativa.'}</p>
                <div className="hero__actions">
                  <button className="btn" onClick={() => goToSection('noticias')} type="button">
                    {profile?.hero_cta || 'Más información'}
                  </button>
                  <button className="btn btn--ghost" onClick={() => goToSection('acceso')} type="button">Iniciar sesión</button>
                </div>
                <div className="hero__stats">
                  <div><strong>{news.length}</strong><span>Noticias</span></div>
                  <div><strong>{notices.length}</strong><span>Avisos</span></div>
                  <div><strong>{activities.length}</strong><span>Actividades</span></div>
                  <div><strong>{galleries.length}</strong><span>Galerías</span></div>
                </div>
              </div>
              <div className="hero__image">
                <div className="hero__image-frame" style={heroImageStyle} />
                <div className="hero__overlay">
                  <strong>{profile?.school_name || 'U.E. Sagrado Corazón 4'}</strong>
                  <span>{latestNews?.title || latestNotice?.title || 'Contenido institucional actualizado en tiempo real.'}</span>
                </div>
              </div>
            </section>

            <section className="grid grid--2">
               <Card title="Últimas noticias" subtitle="Noticias publicadas">
                 {loading ? (
                   <LoadingState message="Cargando noticias..." />
                 ) : filteredNews.length === 0 ? (
                   <EmptyState message="Sin noticias por ahora." />
                 ) : (
                   <div className="news-feed news-feed--compact">
                     {sortedNews.slice(0, 3).map((item) => (
                         <NewsPostCard key={item.id} item={item} compact onOpen={openNews} canEdit={token && (roleLabel === 'ADMIN' || item.author_id === userId)} onEdit={openEditNews} />
                     ))}
                   </div>
                 )}
               </Card>

               <Card title="Avisos importantes" subtitle="Comunicados oficiales">
                 {loading ? (
                   <LoadingState message="Cargando avisos..." />
                 ) : filteredNotices.length === 0 ? (
                   <EmptyState message="Sin avisos por ahora." />
                 ) : (
                   <div className="stack gap-sm">
                      {filteredNotices.slice(0, 3).map((item) => {
                        const noticeType = (item.type || item.notice_type || item.kind || item.category || item.icon || '').toString().toLowerCase()
                        function NoticeIcon() {
                          if (noticeType.includes('reunion') || noticeType.includes('meeting') || noticeType.includes('calendar')) {
                            return (
                              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                <rect x="3" y="5" width="18" height="16" rx="2" />
                                <path d="M16 3v4M8 3v4" />
                                <path d="M3 11h18" />
                              </svg>
                            )
                          }
                          if (noticeType.includes('entrega') || noticeType.includes('delivery') || noticeType.includes('paper') || noticeType.includes('boletin')) {
                            return (
                              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                <path d="M21 15V6a2 2 0 0 0-2-2H7L3 6v9a2 2 0 0 0 2 2h14a0 0 0 0 0 0" />
                                <path d="M21 15l-5-5-5 5" />
                              </svg>
                            )
                          }
                          // default: megaphone / speaker
                          return (
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                              <path d="M3 11v2a2 2 0 0 0 2 2h3l6 3V6L8 9H5a2 2 0 0 0-2 2z" />
                              <path d="M19 7a7 7 0 0 1 0 10" />
                            </svg>
                          )
                        }

                        return (
                          <div key={item.id} className="notice-row">
                            <div className="notice-row__icon" aria-hidden>
                              <NoticeIcon />
                            </div>
                            <div>
                              <strong>{item.title}</strong>
                              <p>{item.content}</p>
                              <small>{item.audience || 'all'} • {formatDateTime(item.end_at || item.created_at)}</small>
                            </div>
                          </div>
                        )
                      })}
                   </div>
                 )}
               </Card>
            </section>

            <section className="grid grid--3">
              <Card title="Actividad destacada" subtitle={latestActivity?.activity_type || 'Actividad'}>
                {latestActivity ? (
                  <>
                    <strong>{latestActivity.title}</strong>
                    <p>{latestActivity.description}</p>
                    <small>{formatDate(latestActivity.date)}</small>
                  </>
                ) : (
                  <p className="state-empty">No hay actividades registradas.</p>
                )}
              </Card>
              <Card title="Galería destacada" subtitle={recentAlbums[0] ? `${recentAlbums[0].images_count || 0} imágenes` : 'Galería'}>
                {recentAlbums.length ? (
                  <AlbumFeaturedCarousel albums={recentAlbums} onOpen={setSelectedAlbum} />
                ) : (
                  <p className="state-empty">No hay galerías registradas.</p>
                )}
              </Card>
              <Card title="Contacto institucional" subtitle="Datos dinámicos">
                <p><strong>Dirección:</strong> {profile?.address || 'Sin dirección registrada'}</p>
                <p><strong>Teléfono:</strong> {profile?.phone || 'Sin teléfono registrado'}</p>
                <p><strong>Correo:</strong> {profile?.email || 'Sin correo registrado'}</p>
              </Card>
            </section>
          </>
        )}

        {activeSection === 'avisos' && (
          <section>
            <SectionTitle kicker="Avisos" title="Comunicados importantes" description="Filtrados desde la base de datos para estudiantes, padres y profesores." />
            <div className="toolbar">
              {['all', 'students', 'parents', 'teachers'].map((audience) => (
                <button
                  key={audience}
                  className={`nav-pill ${noticeAudience === audience ? 'active' : ''}`}
                  type="button"
                  onClick={() => setNoticeAudience(audience)}
                >
                  {audience === 'all' ? 'Todos' : audience}
                </button>
              ))}
            </div>
            {loading ? (
              <p className="state-loading">Cargando avisos...</p>
            ) : filteredNotices.length === 0 ? (
              <p className="state-empty">Sin avisos por ahora.</p>
            ) : (
              <div className="grid grid--3">
                {filteredNotices.map((item) => (
                  <Card key={item.id} title={item.title} subtitle={item.audience || 'all'}>
                    <p>{item.content}</p>
                    {item.created_by_name && <small className="notice-creator">Creador: {item.created_by_name}</small>}
                    <small>Publicado: {formatDateTime(item.created_at)}</small>
                    {item.end_at && <small>Vence: {formatDate(item.end_at)}</small>}
                    {token && (roleLabel === 'ADMIN' || item.created_by === userId) && (
                      <div className="admin-actions" style={{ marginTop: '12px' }}>
                        <button className="btn btn--small" onClick={() => openEditNotice(item)} type="button">Editar</button>
                        <button className="btn btn--small btn--ghost" onClick={() => deleteNotice(item.id)} type="button" disabled={deletingNoticeId === item.id}>
                          {deletingNoticeId === item.id ? 'Eliminando...' : 'Eliminar'}
                        </button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}

            {editingNotice && (
              <div className="modal-overlay" onClick={closeEditNotice}>
                <Card title="Editar aviso" subtitle="Actualiza los campos que desees cambiar">
                  <form className="stack gap-sm" onSubmit={updateNotice} onClick={(e) => e.stopPropagation()}>
                    <label className="field"><span>Título</span><input value={editNoticeForm.title} onChange={(e) => setEditNoticeForm((p) => ({ ...p, title: e.target.value }))} /></label>
                    <label className="field"><span>Contenido</span><textarea rows="4" value={editNoticeForm.content} onChange={(e) => setEditNoticeForm((p) => ({ ...p, content: e.target.value }))} /></label>
                    <label className="field">
                      <span>Audiencia</span>
                      <select value={editNoticeForm.audience} onChange={(e) => setEditNoticeForm((p) => ({ ...p, audience: e.target.value }))}>
                        <option value="all">Todos</option>
                        <option value="students">Estudiantes</option>
                        <option value="parents">Padres</option>
                        <option value="teachers">Profesores</option>
                      </select>
                    </label>
                    <label className="field">
                      <span>Fecha límite (opcional)</span>
                      <input type="datetime-local" value={editNoticeForm.end_at} onChange={(e) => setEditNoticeForm((p) => ({ ...p, end_at: e.target.value }))} />
                    </label>
                    <div className="admin-actions">
                      <LoadingButton className="btn" loading={savingNoticeLoading} type="submit">Guardar cambios</LoadingButton>
                      <button className="btn btn--ghost" type="button" onClick={closeEditNotice}>Cancelar</button>
                    </div>
                  </form>
                </Card>
              </div>
            )}
          </section>
        )}

        {activeSection === 'noticias' && (
          <section>
            <SectionTitle kicker="Noticias" title="Actividades de la unidad educativa y comunidad" description="Todo el contenido viene de la base de datos." />
            {loading ? (
              <div className="grid">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : filteredNews.length === 0 ? (
              <p className="state-empty">Sin noticias por ahora.</p>
            ) : (
              <div className="news-feed">
                 {sortedNews.map((item) => (
                     <NewsPostCard key={item.id} item={item} onOpen={openNews} canEdit={token && (roleLabel === 'ADMIN' || item.author_id === userId)} onEdit={openEditNews} />
                 ))}
              </div>
            )}
          </section>
        )}

        {selectedNews ? (
          <NewsReadModal
            item={selectedNews}
            onClose={closeNews}
            canEdit={token && (roleLabel === 'ADMIN' || selectedNews.author_id === userId)}
            onEdit={() => { openEditNews(selectedNews); closeNews() }}
          />
        ) : null}

        {editingNews && (
          <div className="modal-overlay" onClick={closeEditNews}>
            <Card title={`Editar noticia: ${editingNews.title.substring(0, 40)}...`} subtitle={`Creada por: ${editingNews.author_name || 'Redacción'}`}>
              <form className="stack gap-sm" onSubmit={updateNews} onClick={(e) => e.stopPropagation()}>
                <label className="field"><span>Título</span><input value={editNewsForm.title} onChange={(e) => setEditNewsForm((p) => ({ ...p, title: e.target.value }))} /></label>
                <label className="field"><span>Resumen</span><input value={editNewsForm.excerpt} onChange={(e) => setEditNewsForm((p) => ({ ...p, excerpt: e.target.value }))} /></label>
                <label className="field"><span>Contenido</span><textarea rows="5" value={editNewsForm.content} onChange={(e) => setEditNewsForm((p) => ({ ...p, content: e.target.value }))} /></label>
                <div className="admin-actions">
                  <button className="btn" type="submit">Guardar cambios</button>
                  <button className="btn btn--ghost" type="button" onClick={closeEditNews}>Cancelar</button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {editingActivity && (
          <div className="modal-overlay" onClick={closeEditActivity}>
            <Card className="activity-edit-modal" title={`Editar: ${editingActivity.title?.substring(0, 35) || ''}`} subtitle={`Por: ${editingActivity.created_by_name || ''}`}>
              <form className="activity-edit-modal__form stack gap-sm" onSubmit={updateActivity} onClick={(e) => e.stopPropagation()}>
                <label className="field"><span>Título</span><input value={editActivityForm.title} onChange={(e) => setEditActivityForm((p) => ({ ...p, title: e.target.value }))} /></label>
                <label className="field"><span>Descripción</span><textarea rows="3" value={editActivityForm.description} onChange={(e) => setEditActivityForm((p) => ({ ...p, description: e.target.value }))} /></label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <label className="field"><span>Tipo</span>
                    <select value={editActivityForm.activityType} onChange={(e) => setEditActivityForm((p) => ({ ...p, activityType: e.target.value }))}>
                      <option value="cultural">cultural</option>
                      <option value="deportiva">deportiva</option>
                      <option value="academica">academica</option>
                    </select>
                  </label>
                  <label className="field"><span>Lugar</span><input value={editActivityForm.location} onChange={(e) => setEditActivityForm((p) => ({ ...p, location: e.target.value }))} /></label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <label className="field"><span>Fecha (evento)</span><input type="datetime-local" value={editActivityForm.date} onChange={(e) => setEditActivityForm((p) => ({ ...p, date: e.target.value }))} /></label>
                  <label className="field"><span>Publicar en</span><input type="datetime-local" value={editActivityForm.publish_at} onChange={(e) => setEditActivityForm((p) => ({ ...p, publish_at: e.target.value }))} /></label>
                </div>
                <div className="admin-actions" style={{ gap: 8 }}>
                  <LoadingButton className="btn" loading={savingActivityLoading} type="submit">Guardar cambios</LoadingButton>
                  <button className="btn btn--ghost" type="button" onClick={closeEditActivity}>Cancelar</button>
                </div>
              </form>

              <div className="activity-edit-modal__separator"></div>

              <div className="activity-edit-modal__media-section">
                <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 700 }}>Imágenes y portada</h4>

                <form className="stack gap-sm" onSubmit={uploadActivityImagesForEdit} onClick={(e) => e.stopPropagation()}>
                  <label className="field"><span>📸 Subir más imágenes</span><input type="file" accept="image/*" multiple onChange={handleActivityImageEditFilesChange} /></label>
                  {activityImageEditFiles.length ? (
                    <ActivityFilePreviewList files={activityImageEditFiles.map((it) => ({ id: it.id, file: it.file, previewUrl: it.previewUrl, kind: it.kind }))} onRemove={removeActivityImageEditFile} />
                  ) : null}
                  <LoadingButton className="btn btn--ghost btn--small" loading={uploadingActivityImagesLoading} type="submit">Agregar</LoadingButton>
                </form>

                {editingActivity.cover_image && (
                  <div style={{ marginTop: 12, padding: '12px', border: '2px solid var(--primary)', borderRadius: '12px', background: 'rgba(109, 40, 217, 0.05)' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>Portada actual:</p>
                    <img src={editingActivity.cover_image} alt="Portada" style={{ width: '100%', borderRadius: '8px', maxHeight: '140px', objectFit: 'cover' }} />
                  </div>
                )}

                {Array.isArray(editingActivity.attachments) && editingActivity.attachments.filter((att) => att.kind === 'image').length > 0 ? (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ margin: '12px 0 8px 0', fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)' }}>Elige una imagen como portada:</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }}>
                      {editingActivity.attachments.filter((att) => att.kind === 'image').map((att) => (
                        <button
                          key={att.id}
                          type="button"
                          onClick={() => setActivityCoverFromAttachment(att.url)}
                          style={{
                            border: editingActivity.cover_image === att.url ? '3px solid var(--primary)' : '1px solid var(--line)',
                            borderRadius: '8px',
                            padding: 0,
                            overflow: 'hidden',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            opacity: editingActivity.cover_image === att.url ? 1 : 0.7,
                          }}
                          title={att.filename}
                        >
                          <img src={att.url} alt={att.filename} style={{ width: '100%', height: '80px', objectFit: 'cover', display: 'block' }} />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="activity-edit-modal__separator"></div>

              <div className="activity-edit-modal__media-section">
                <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 700 }}>Otros archivos (videos, audio, PDF)</h4>
                <form className="stack gap-sm" onSubmit={uploadActivityAttachmentsForEdit} onClick={(e) => e.stopPropagation()}>
                  <label className="field"><span>Seleccionar archivos</span><input type="file" accept="video/*,audio/*,application/pdf" multiple onChange={handleActivityEditFilesChange} /></label>
                  {activityEditFiles.length ? (
                    <ActivityFilePreviewList files={activityEditFiles.map((it) => ({ id: it.id, file: it.file, previewUrl: it.previewUrl, kind: it.kind }))} onRemove={removeActivityEditFile} />
                  ) : null}
                  <LoadingButton className="btn btn--ghost btn--small" loading={uploadingActivityEditLoading} type="submit">Subir</LoadingButton>
                </form>

                {Array.isArray(editingActivity.attachments) && editingActivity.attachments.filter((att) => att.kind !== 'image').length > 0 ? (
                  <div style={{ marginTop: 12 }}>
                    <div className="news-draft-manager__list">
                      {editingActivity.attachments.filter((att) => att.kind !== 'image').map((att) => (
                        <div key={att.id} className="news-draft-item">
                          <div className="news-draft-item__thumb news-draft-item__thumb--doc"><strong>{(att.filename || 'FILE').split('.').pop()?.toUpperCase()}</strong></div>
                          <div className="news-draft-item__body"><strong>{att.filename}</strong><small>{att.content_type}</small></div>
                          <a className="btn btn--ghost btn--small" href={att.url} target="_blank" rel="noreferrer">Abrir</a>
                          <button className="btn btn--ghost btn--small" type="button" onClick={() => deleteActivityAttachmentForEdit(att.id)}>Borrar</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </Card>
          </div>
        )}

        {activeSection === 'actividades' && (
          <section>
            <SectionTitle kicker="Actividades" title="Deportivas, culturales y académicas" description="Hechas por nuestros estudiantes." />
            <div className="toolbar">
              {['all', 'cultural', 'deportiva', 'academica'].map((type) => (
                <button
                  key={type}
                  className={`nav-pill ${activityFilter === type ? 'active' : ''}`}
                  type="button"
                  onClick={() => setActivityFilter(type)}
                >
                  {type === 'all' ? 'Todas' : type}
                </button>
              ))}
            </div>
            {loading ? (
              <div className="grid grid--3">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : filteredActivities.length === 0 ? (
              <p className="state-empty">Sin actividades por ahora.</p>
            ) : (
              <div className="grid grid--3">
                {filteredActivities.map((item) => (
                  <Card key={item.id} title={item.title} subtitle={item.activity_type || 'Actividad'}>
                    {(() => {
                      const media = splitActivityMedia(item)
                      const firstImage = media.images[0]
                      const firstVideo = media.videos[0]
                      const firstAudio = media.audios[0]
                      return (
                        <div className="activity-media-stack">
                          {firstImage ? (
                            <div className="activity-media-preview"><img src={firstImage.url} alt={firstImage.caption || firstImage.filename || item.title} /></div>
                          ) : null}
                          {firstVideo ? (
                            <video className="activity-media-player" controls preload="metadata" src={firstVideo.url} />
                          ) : null}
                          {firstAudio ? (
                            <audio className="activity-media-player" controls preload="metadata" src={firstAudio.url} />
                          ) : null}
                        </div>
                      )
                    })()}
                    <p>{item.description}</p>
                    {item.location ? <small>{item.location}</small> : null}
                    {item.date ? <small>Evento: {formatDateTime(item.date)}</small> : null}
                    {item.publish_at ? <small>Publicado: {formatDateTime(item.publish_at)}</small> : null}
                    {token && ((roleLabel || '').toUpperCase() === 'ADMIN' || item.created_by === userId) ? (
                      <div className="admin-actions" style={{ marginTop: '8px', gap: '6px' }}>
                        <button className="btn btn--small" type="button" onClick={() => openEditActivity(item)}>Editar</button>
                      </div>
                    ) : null}
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        {activeSection === 'galeria' && (() => {
          const albumsToShow = albums || [];
          return (
            <section>
              <SectionTitle kicker="Galería" title="Actos y memorias de la unidad educativa" description="Álbumes y fotografías organizadas desde la base de datos." />
              {loading ? (
                <div className="grid grid--3">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : albumsToShow.length === 0 ? (
                <p className="state-empty">Sin álbumes por ahora.</p>
              ) : (
                <div className="grid grid--3">
                  {albumsToShow.map((item) => (
                    <GalleryCard key={item.id} item={item} onOpen={setSelectedAlbum} />
                  ))}
                </div>
              )}
            </section>
          );
        })()}

        {activeSection === 'historia' && (
          <section>
            <SectionTitle kicker="Historia" title="Historia de la unidad educativa" description="Este apartado se carga desde la base de datos." />
            {loading ? (
              <LoadingState message="Cargando historia..." />
            ) : (
              <Card title="Historia institucional" subtitle="Texto de presentación">
                <p>{history?.content || 'Historia no disponible por ahora.'}</p>
              </Card>
            )}
          </section>
        )}


        {activeSection === 'admin' && (
          <section>
            <SectionTitle kicker="Admin" title="Panel de administración" description="Cada acción se ejecuta con el usuario autenticado y los límites de su rol." />
            <div className="grid grid--2">
              <Card title="Sesión activa" subtitle="Usuario y rol">
                {token ? (
                  <div className="stack gap-sm">
                    <p><strong>Usuario:</strong> {userLabel || 'Usuario'}</p>
                    <p><strong>Rol:</strong> {roleLabel || 'Sin rol'}</p>
                    <button className="btn btn--ghost" onClick={handleLogout} type="button">Cerrar sesión</button>
                  </div>
                ) : (
                  <div className="stack gap-sm">
                    <p className="state-empty">No hay sesión activa.</p>
                    <button className="btn" onClick={() => goToSection('acceso')} type="button">Ir a iniciar sesión</button>
                  </div>
                )}
              </Card>
              <Card title="Estado del navegador" subtitle="Push y permisos">
                <p><strong>Token:</strong> {token ? 'activo' : 'no autenticado'}</p>
                <p><strong>Push:</strong> {isPushSubscribed ? 'suscrito' : 'no suscrito'}</p>
                <div className="stack gap-sm">
                  <button className="btn" onClick={subscribePush} type="button">Suscribir dispositivo</button>
                  <button className="btn btn--ghost" onClick={unsubscribePush} type="button">Desuscribir</button>
                </div>
                {pushMessage ? <p className="success">{pushMessage}</p> : null}
                {pushError ? <p className="error">{pushError}</p> : null}
              </Card>
            </div>

            {canOpenAdminPanel ? (
              <AppErrorBoundary title="Panel de administración" subtitle="No se pudo cargar la vista">
                <AdminPanel token={token} roleLabel={roleLabel} profile={profile} history={history} refreshPublic={reload} onTokenMissing={handleLogout} />
              </AppErrorBoundary>
            ) : (
              <Card title="Acceso restringido" subtitle="Permisos por rol">
                {token ? (
                  <p className="state-empty">Tu rol actual ({roleLabel || 'sin rol'}) no tiene permisos para publicar o editar contenido administrativo.</p>
                ) : (
                  <p className="state-empty">Inicia sesión para que el sistema evalúe tus permisos por rol.</p>
                )}
              </Card>
            )}
          </section>
        )}
      </main>


      {selectedAlbum ? <AlbumViewerModal album={selectedAlbum} onClose={() => setSelectedAlbum(null)} /> : null}

      <footer className="footer">
        <div className="footer__col footer__brand">
          <strong>{profile?.school_name || 'U.E. Sagrado Corazón 4'}</strong>
          <p>{profile?.tagline || 'Formamos con valores, educamos para la vida.'}</p>
        </div>
        <div className="footer__col">
          <div className="footer__item">
            <span className="footer__icon" aria-hidden="true">📍</span>
            <div>
              <strong>Dirección</strong>
              <span>{profile?.address || 'San Juan de Yapacaní, Bolivia'}</span>
            </div>
          </div>
          <div className="footer__item">
            <span className="footer__icon" aria-hidden="true">📞</span>
            <div>
              <strong>Teléfono</strong>
              <span>{profile?.phone || '+591 3 1234567'}</span>
            </div>
          </div>
          <div className="footer__item">
            <span className="footer__icon" aria-hidden="true">✉️</span>
            <div>
              <strong>Correo</strong>
              <span>{profile?.email || 'uesagradocorazon4@gmail.com'}</span>
            </div>
          </div>
        </div>
        <div className="footer__col">
          <strong>Redes sociales</strong>
          <div className="footer__socials" aria-label="Redes sociales del colegio">
            {profile?.facebook_url ? (
              <a className="socials__item socials__item--facebook" href={profile.facebook_url} target="_blank" rel="noreferrer" aria-label="Facebook"><SocialIcon network="facebook" /></a>
            ) : (
              <span className="socials__item socials__item--facebook" aria-hidden="true"><SocialIcon network="facebook" /></span>
            )}
            {profile?.instagram_url ? (
              <a className="socials__item socials__item--instagram" href={profile.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram"><SocialIcon network="instagram" /></a>
            ) : (
              <span className="socials__item socials__item--instagram" aria-hidden="true"><SocialIcon network="instagram" /></span>
            )}
            {profile?.youtube_url ? (
              <a className="socials__item socials__item--youtube" href={profile.youtube_url} target="_blank" rel="noreferrer" aria-label="YouTube"><SocialIcon network="youtube" /></a>
            ) : (
              <span className="socials__item socials__item--youtube" aria-hidden="true"><SocialIcon network="youtube" /></span>
            )}
          </div>
        </div>
      </footer>
    </div>
    </AppErrorBoundary>
  )
}
