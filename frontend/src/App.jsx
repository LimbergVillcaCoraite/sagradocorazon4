import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { LoadingButton, useToast } from './ui.jsx'
import './styles.css'

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

const navItems = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'avisos', label: 'Avisos' },
  { id: 'noticias', label: 'Noticias' },
  { id: 'actividades', label: 'Actividades' },
  { id: 'galeria', label: 'Galería' },
  { id: 'historia', label: 'Historia' },
  { id: 'acceso', label: 'Acceso' },
  { id: 'admin', label: 'Admin' },
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

const defaultStudentForm = {
  name: '',
  email: '',
  password: '',
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
    pushAttachment({
      ...attachment,
      kind: attachment.kind || (attachment.content_type?.startsWith('image/') ? 'image' : 'document'),
    })
  })
  const unique = Array.from(uniqueByUrl.values())
  return {
    images: unique.filter((attachment) => attachment.kind === 'image'),
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
// Grid of thumbnails showing all images for a news post.
function NewsImagesGrid({ images, title, compact = false, onOpen }) {
  if (!images.length) return null
  const thumbSize = compact ? 90 : 140
  return (
    <div className={`news-post__images ${compact ? 'news-post__images--compact' : ''}`}>
      {images.map((att, idx) => (
        <button
          key={att.id || `${att.url}-${idx}`}
          type="button"
          className="news-post__images__item"
          onClick={(e) => { e.stopPropagation(); if (onOpen) onOpen() }}
          aria-label={`Ver imagen ${idx + 1}`}
        >
          <img src={att.url} alt={att.caption || att.filename || title || `Imagen ${idx + 1}`} style={{ height: thumbSize }} />
        </button>
      ))}
    </div>
  )
}
function NewsPostCard({ item, compact = false, onOpen, canEdit = false, onEdit }) {
  const { images, documents } = useMemo(() => splitNewsMedia(item), [item])
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
      {images.length ? (
        images.length === 1 ? (
          <div className="news-post__cover">
            <img src={images[0].url} alt={images[0].caption || images[0].filename || item.title || 'Imagen de noticia'} />
          </div>
        ) : (
          <NewsImagesGrid images={images} title={item.title} compact={compact} onOpen={() => onOpen && onOpen(item)} />
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
          ) : (
            <div className="news-preview-card__media news-preview-card__media--doc">
              <strong>{item.file.name.split('.').pop()?.toUpperCase() || 'DOC'}</strong>
              <span>Documento</span>
            </div>
          )}
          <div className="news-preview-card__body">
            <strong>{item.file.name}</strong>
            <small>{item.kind === 'image' ? 'Se mostrará como imagen' : 'Se adjuntará como archivo descargable'}</small>
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
  const { images, documents } = useMemo(() => splitNewsMedia(item), [item])
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
          {images.length ? <NewsImageCarousel images={images} title={item.title} /> : null}
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
          ) : (
            <div className="news-preview-card__media news-preview-card__media--doc">
              <strong>{item.kind.toUpperCase()}</strong>
              <span>{item.file.name.split('.').pop()?.toUpperCase() || 'FILE'}</span>
            </div>
          )}
          <div className="news-preview-card__body">
            <strong>{item.file.name}</strong>
            <small>{item.kind === 'image' ? 'Se mostrara como imagen' : `Adjunto tipo ${item.kind}`}</small>
          </div>
          <button className="btn btn--ghost btn--small" type="button" onClick={() => onRemove(item.id)}>Quitar</button>
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

function Card({ title, subtitle, children, className = '' }) {
  return (
    <article className={`card ${className}`}>
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
    galleries: [],
    history: { content: '' },
    loading: true,
    warning: null,
  })

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, warning: null }))
    const [profileRes, newsRes, noticesRes, activitiesRes, galleriesRes, historyRes] = await Promise.allSettled([
      api('/site/profile'),
      api('/news?limit=100'),
      api('/notices?limit=100'),
      api('/activities?limit=100'),
      api('/galleries?limit=100'),
      api('/history'),
    ])

    const failedSections = [
      ['perfil', profileRes],
      ['noticias', newsRes],
      ['avisos', noticesRes],
      ['actividades', activitiesRes],
      ['galerías', galleriesRes],
      ['historia', historyRes],
    ].filter(([, result]) => result.status === 'rejected').map(([name]) => name)
    const successCount = 6 - failedSections.length

    setState({
      profile: profileRes.status === 'fulfilled' ? profileRes.value : null,
      news: newsRes.status === 'fulfilled' && Array.isArray(newsRes.value) ? newsRes.value : [],
      notices: noticesRes.status === 'fulfilled' && Array.isArray(noticesRes.value) ? noticesRes.value : [],
      activities: activitiesRes.status === 'fulfilled' && Array.isArray(activitiesRes.value) ? activitiesRes.value : [],
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

function AuthPanel({ token, userLabel, roleLabel, onLogin, onLogout }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState(defaultStudentForm)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notificationsError, setNotificationsError] = useState('')
  const [notificationsLoading, setNotificationsLoading] = useState(false)

  async function loadNotifications(accessToken = token) {
    if (!accessToken) return
    setNotificationsLoading(true)
    setNotificationsError('')
    try {
      const data = await api('/notifications/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      setNotifications(Array.isArray(data) ? data : [])
    } catch (err) {
      setNotifications([])
      setNotificationsError(err.message)
    } finally {
      setNotificationsLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      loadNotifications(token)
    } else {
      setNotifications([])
    }
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setStatus('')
    try {
      if (mode === 'register') {
        if (!form.name.trim()) {
          setError('Ingresa tu nombre')
          setLoading(false)
          return
        }
        await api('/auth/register', {
          method: 'POST',
          body: JSON.stringify(form),
        })
        setStatus('Cuenta de estudiante creada. Iniciando sesión...')
      }
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: form.email, password: form.password }),
      })
      await onLogin(data.access_token)
      setStatus(mode === 'register' ? 'Registro completado y sesión activa' : 'Sesión iniciada')
      await loadNotifications(data.access_token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="student-access">
      <div className="grid grid--2">
        <Card title="Acceso único" subtitle="Un solo login para todos los roles">
          <div className="admin-actions">
            <button className={`nav-pill ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')} type="button">Ingresar</button>
            <button className={`nav-pill ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')} type="button">Registrarme</button>
          </div>

          <form className="stack gap-sm" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <label className="field">
                <span>Nombre completo</span>
                <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Tu nombre" />
              </label>
            )}
            <label className="field">
              <span>Email</span>
              <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} type="email" placeholder="correo@ejemplo.com" />
            </label>
            <label className="field">
              <span>Contraseña</span>
              <input value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} type="password" placeholder="Crea o escribe tu contraseña" />
            </label>

            {error ? <p className="error">{error}</p> : null}
            {status ? <p className="success">{status}</p> : null}

            <LoadingButton className="btn" disabled={loading} loading={loading} type="submit">
              {loading ? 'Procesando...' : mode === 'register' ? 'Crear cuenta' : 'Entrar'}
            </LoadingButton>
          </form>

          <div className="student-hint">
            <p><strong>Nota:</strong> al registrarte se crea tu cuenta con rol <strong>STUDENT</strong>.</p>
            <p>El mismo login aplica para ADMIN, EDITOR y PROFESSOR según su rol en base de datos.</p>
          </div>
        </Card>

        <Card title="Mi sesión" subtitle="Usuario, rol y notificaciones">
          {token ? (
            <div className="stack gap-sm">
              <p><strong>Usuario:</strong> {userLabel || 'Sin nombre'}</p>
              <p><strong>Rol:</strong> {roleLabel || 'Sin rol'}</p>
              <div className="admin-actions">
                <button className="btn btn--ghost" onClick={() => loadNotifications()} type="button">Ver notificaciones</button>
                <button className="btn btn--ghost" onClick={onLogout} type="button">Cerrar sesión</button>
              </div>
            </div>
          ) : (
            <p className="state-empty">Inicia sesión para acceder según tu rol.</p>
          )}

          <div className="student-feed">
            <div className="card__header">
              <h3>Mis notificaciones</h3>
              <span>{notifications.length}</span>
            </div>
            {notificationsLoading ? (
              <LoadingState message="Cargando notificaciones..." />
            ) : notificationsError ? (
              <p className="error">{notificationsError}</p>
            ) : notifications.length === 0 ? (
              <p className="state-empty">No tienes notificaciones personales todavía.</p>
            ) : (
              <div className="stack gap-sm">
                {notifications.slice(0, 5).map((item) => (
                  <div key={item.id} className="mini-item">
                    <span className="mini-item__tag">{item.audience || 'all'}</span>
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
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
  // search state for admin drawer (filter sections)
  const [adminSearch, setAdminSearch] = useState('')
  const filteredAdminSections = useMemo(() => {
    const term = (adminSearch || '').trim().toLowerCase()
    if (!term) return adminSections
    return adminSections.filter((s) => (s.label || s.id || '').toLowerCase().includes(term))
  }, [adminSearch])
  const [form, setForm] = useState(defaultContentForm)
  const [createdNews, setCreatedNews] = useState(null)
  const [newsDraftFiles, setNewsDraftFiles] = useState([])
  const [newsAttachmentFiles, setNewsAttachmentFiles] = useState([])
  const [activityDraftFiles, setActivityDraftFiles] = useState([])
  const [activityAttachmentFiles, setActivityAttachmentFiles] = useState([])
  const [createdActivity, setCreatedActivity] = useState(null)
  const [createdGalleryId, setCreatedGalleryId] = useState('')
  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token])
  const activeSection = adminSections.find((section) => section.id === activeAdminSection) || adminSections[0]

  useEffect(() => {
    if (!adminSections.some((section) => section.id === activeAdminSection)) {
      setActiveAdminSection('overview')
      return
    }
    localStorage.setItem('school-admin-section', activeAdminSection)
  }, [activeAdminSection])

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

  function guard() {
    if (!token) {
      onTokenMissing?.()
      throw new Error('Debes iniciar sesión como administrador')
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

  function mapActivityFileKind(file) {
    if (file.type.startsWith('image/')) return 'image'
    if (file.type.startsWith('video/')) return 'video'
    if (file.type.startsWith('audio/')) return 'audio'
    return 'document'
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
        kind: mapActivityFileKind(file),
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
        kind: mapActivityFileKind(file),
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
        refreshPublic?.()
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
            <button className="btn btn--ghost" type="button" onClick={() => navigateAdminSection('galeria')}>Nueva galería</button>
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
                {filteredAdminSections.map((section) => (
                  <option key={section.id} value={section.id}>{section.label}</option>
                ))}
              </select>
            </label>
          </div>
          <nav className="admin-tabs admin-nav-desktop" aria-label="Secciones de administración">
            {filteredAdminSections.map((section) => (
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
                <label className="field"><span>Descripcion</span><textarea rows="4" value={form.activityDescription} onChange={(e) => setForm((p) => ({ ...p, activityDescription: e.target.value }))} /></label>
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
                    <span>Descripcion opcional</span>
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
                          <button className="btn btn--ghost btn--small" type="button" onClick={() => deleteActivityAttachment(createdActivity.id, attachment.id)}>Borrar</button>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </Card>
            )}
          </div>
        )}

        {activeAdminSection === 'galeria' && (
          <div className="grid gap-sm">
            <Card title="Crear galería" subtitle="Galería institucional">
              <form className="stack gap-sm" onSubmit={createGallery}>
                <label className="field"><span>Título</span><input value={form.galleryTitle} onChange={(e) => setForm((p) => ({ ...p, galleryTitle: e.target.value }))} /></label>
                <label className="field"><span>Descripción</span><textarea rows="4" value={form.galleryDescription} onChange={(e) => setForm((p) => ({ ...p, galleryDescription: e.target.value }))} /></label>
                 <LoadingButton className="btn" loading={creatingGalleryLoading} type="submit">Guardar galería</LoadingButton>
              </form>
            </Card>

            {createdGalleryId && (
              <Card title="Subir imágenes a la galería" subtitle={`Añadir fotos a galería ${createdGalleryId.substring(0, 8)}`}>
                <form className="stack gap-sm" onSubmit={uploadImageToGallery}>
                    <label className="field">
                        <span>Imagen(es)</span>
                        <input name="galleryImage" type="file" accept="image/*" multiple />
                      </label>
                  <label className="field">
                    <span>Descripción (alt text)</span>
                    <input name="galleryAltText" type="text" placeholder="Descripción de la imagen" />
                  </label>
                   <LoadingButton className="btn" loading={uploadingGalleryLoading} type="submit">Subir imagen</LoadingButton>
                  <button className="btn btn--ghost" type="button" onClick={() => setCreatedGalleryId('')}>Finalizar galería</button>
                </form>
              </Card>
            )}
          </div>
        )}

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
  const { profile, news, notices, activities, galleries, history, loading, warning, reload } = usePublicData()
  const { addToast } = useToast()

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
      setUserId(id)
      setUserLabel(label)
      setRoleLabel(roleName)
      localStorage.setItem('school-auth-id', id)
      localStorage.setItem('school-auth-user', label)
      localStorage.setItem('school-auth-role', roleName)
    } catch {
      setUserLabel('Usuario')
      setRoleLabel('STUDENT')
      localStorage.setItem('school-auth-user', 'Usuario')
      localStorage.setItem('school-auth-role', 'STUDENT')
    }
  }

  function handleLogout() {
    setToken('')
    setUserId('')
    setUserLabel('')
    setRoleLabel('')
    localStorage.removeItem('school-auth-token')
    localStorage.removeItem('school-auth-id')
    localStorage.removeItem('school-auth-user')
    localStorage.removeItem('school-auth-role')
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
  const latestGallery = galleries[0]
  const canOpenAdminPanel = ['ADMIN', 'EDITOR', 'PROFESSOR'].includes((roleLabel || '').toUpperCase())
  const heroImageStyle = profile?.hero_image_url
    ? { backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.02), rgba(0,0,0,0.28)), url(${profile.hero_image_url})` }
    : undefined

  function goToSection(sectionId) {
    window.location.hash = sectionId
    setActiveSection(sectionId)
  }

  return (
    <AppErrorBoundary title="No se pudo cargar la aplicación" subtitle="Se produjo un error al renderizar la interfaz.">
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand__logo">SC4</div>
          <div>
            <h1>{profile?.school_name || 'Cargando perfil institucional...'}</h1>
            <p>{profile?.tagline || 'Recuperando información desde la base de datos...'}</p>
          </div>
        </div>
        <div className="topbar__actions">
          <input
            className="search"
            placeholder={profile?.search_placeholder || 'Buscar noticias...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="socials" aria-label="Redes sociales">
            {profile?.facebook_url ? <a href={profile.facebook_url} target="_blank" rel="noreferrer">f</a> : <span>f</span>}
            {profile?.instagram_url ? <a href={profile.instagram_url} target="_blank" rel="noreferrer">ig</a> : <span>ig</span>}
            {profile?.youtube_url ? <a href={profile.youtube_url} target="_blank" rel="noreferrer">yt</a> : <span>yt</span>}
          </div>
        </div>
      </header>

      <nav className="navbar">
        {navItems.map((item) => (
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
                     {filteredNotices.slice(0, 3).map((item) => (
                       <div key={item.id} className="notice-row">
                         <div className="notice-row__icon">!</div>
                         <div>
                           <strong>{item.title}</strong>
                           <p>{item.content}</p>
                            <small>{item.audience || 'all'} • {formatDateTime(item.end_at || item.created_at)}</small>
                         </div>
                       </div>
                     ))}
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
              <Card title="Galería destacada" subtitle={latestGallery ? `${latestGallery.images_count || 0} imágenes` : 'Galería'}>
                {latestGallery ? (
                  <>
                    <strong>{latestGallery.title}</strong>
                    <p>{latestGallery.description || 'Álbum institucional actualizado desde la base de datos.'}</p>
                  </>
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
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        {activeSection === 'galeria' && (
          <section>
            <SectionTitle kicker="Galería" title="Actos y memorias de la unidad educativa" description="Álbumes y fotografías organizadas desde la base de datos." />
            {loading ? (
              <div className="grid grid--3">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : galleries.length === 0 ? (
              <p className="state-empty">Sin galerías por ahora.</p>
            ) : (
              <div className="grid grid--3">
                {galleries.map((item) => (
                  <Card key={item.id} title={item.title} subtitle={`${item.images_count || 0} imágenes`}>
                    <div className="gallery-thumb" />
                    <p>{item.description || 'Galería institucional actualizada.'}</p>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

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

        {activeSection === 'acceso' && (
          <section>
            <SectionTitle kicker="Acceso" title="Inicia sesión" description="Usa un solo login; los permisos se aplican automáticamente según tu rol." />
            <AuthPanel
              token={token}
              userLabel={userLabel}
              roleLabel={roleLabel}
              onLogin={handleLogin}
              onLogout={handleLogout}
            />
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

      <footer className="footer">
        <div><strong>Dirección:</strong> {profile?.address || 'San Juan de Yapacaní, Bolivia'}</div>
        <div><strong>Correo:</strong> uesagradocorazon4@gmail.com</div>
        <div><strong>Teléfono:</strong> {profile?.phone || '+591 3 1234567'}</div>
      </footer>
    </div>
    </AppErrorBoundary>
  )
}
