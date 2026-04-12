import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { removeContinueWatchingItem } from '../lib/progress'
import { getImageUrl } from '../lib/tmdb'

function fmt(s) {
  const t = Math.max(0, Math.floor(s ?? 0))
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`
}

function ContinueWatchingCard({ item, onRemove }) {
  const navigate = useNavigate()
  const watchPath = item.mediaType === 'tv'
    ? `/watch/tv/${item.id}?season=${item.season ?? 1}&episode=${item.episode ?? 1}`
    : `/watch/movie/${item.id}`

  const {
    ref: cardRef, focusKey,
    focused: cardFocused, hasFocusedChild,
  } = useFocusable({ trackChildren: true })
  const { ref: resumeRef, focused: resumeFocused } = useFocusable({
    onEnterPress: () => navigate(watchPath),
  })
  const { ref: removeRef, focused: removeFocused } = useFocusable({
    onEnterPress: () => { removeContinueWatchingItem(item); onRemove?.(item.key) },
  })

  const active = cardFocused || hasFocusedChild

  return (
    <article
      ref={cardRef}
      className={`continue-card${active ? ' continue-card--active' : ''}`}
    >
      <FocusContext.Provider value={focusKey}>
        {item.posterPath ? (
          <img src={getImageUrl(item.posterPath)} alt={item.title} className="continue-card-poster" loading="lazy" />
        ) : (
          <div className="continue-card-poster continue-card-poster--empty">No image</div>
        )}
        <div className="continue-card-body">
          <h3>{item.title}</h3>
          <p>{item.mediaType === 'tv'
            ? `S${item.season ?? 1} E${item.episode ?? 1}`
            : 'Movie'} · {fmt(item.progress)}</p>
        </div>
        <div className="continue-card-actions">
          <button
            ref={resumeRef}
            type="button"
            className={`continue-action-button${resumeFocused ? ' spatial-focused' : ''}`}
            onClick={() => navigate(watchPath)}
          >
            Resume
          </button>
          <button
            ref={removeRef}
            type="button"
            className={`continue-remove-button${removeFocused ? ' spatial-focused' : ''}`}
            onClick={() => { removeContinueWatchingItem(item); onRemove?.(item.key) }}
          >
            Remove
          </button>
        </div>
      </FocusContext.Provider>
    </article>
  )
}

function ContinueWatching({ items, onRemove }) {
  const { ref, focusKey } = useFocusable({ trackChildren: true, focusable: false })

  if (!items.length) return null

  return (
    <FocusContext.Provider value={focusKey}>
      <section ref={ref} className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Resume</p>
            <h2>Continue watching</h2>
          </div>
        </div>
        <div className="continue-grid">
          {items.map((item) => (
            <ContinueWatchingCard key={item.key} item={item} onRemove={onRemove} />
          ))}
        </div>
      </section>
    </FocusContext.Provider>
  )
}

export default memo(ContinueWatching)
