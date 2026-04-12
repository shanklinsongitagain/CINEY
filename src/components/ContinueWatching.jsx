import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useNavigate } from 'react-router-dom'
import { removeContinueWatchingItem } from '../lib/progress'
import { getImageUrl } from '../lib/tmdb'

function formatProgress(seconds) {
  const totalSeconds = Math.max(0, Math.floor(seconds ?? 0))
  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${remainingSeconds}`
}

function ContinueWatchingCard({ item, onRemove }) {
  const navigate = useNavigate()
  const watchPath =
    item.mediaType === 'tv'
      ? `/watch/tv/${item.id}?season=${item.season ?? 1}&episode=${item.episode ?? 1}`
      : `/watch/movie/${item.id}`

  const {
    ref: cardRef,
    focusKey,
    focused: cardFocused,
    hasFocusedChild,
  } = useFocusable({ trackChildren: true })
  const { ref: posterRef, focused: posterFocused } = useFocusable({ onEnterPress: () => navigate(watchPath) })
  const { ref: resumeRef, focused: resumeFocused } = useFocusable({ onEnterPress: () => navigate(watchPath) })
  const { ref: removeRef, focused: removeFocused } = useFocusable({
    onEnterPress: () => {
      removeContinueWatchingItem(item)
      onRemove?.(item.key)
    },
  })

  const isActive = cardFocused || hasFocusedChild

  const handleRemove = (event) => {
    event.stopPropagation()
    removeContinueWatchingItem(item)
    onRemove?.(item.key)
  }

  return (
    <article ref={cardRef} className={`continue-card${isActive ? ' continue-card--active' : ''}`}>
      <FocusContext.Provider value={focusKey}>
        <button
          ref={posterRef}
          type="button"
          className={`continue-card-button${posterFocused ? ' continue-card-button--focused' : ''}`}
          onClick={() => navigate(watchPath)}
        >
          {item.posterPath ? (
            <img
              src={getImageUrl(item.posterPath)}
              alt={item.title}
              className="continue-card-poster"
              loading="lazy"
            />
          ) : (
            <div className="continue-card-poster continue-card-poster--empty">No image</div>
          )}
          <div className="continue-card-body">
            <h3>{item.title}</h3>
            <p>
              {item.mediaType === 'tv'
                ? `Season ${item.season ?? 1} • Episode ${item.episode ?? 1}${item.episodeName ? ` • ${item.episodeName}` : ''}`
                : 'Movie'}
            </p>
            <p>Resume at {formatProgress(item.progress)}</p>
          </div>
        </button>

        <div className="continue-card-actions">
          <button
            ref={resumeRef}
            type="button"
            className={`continue-action-button${resumeFocused ? ' continue-action-button--focused' : ''}`}
            onClick={() => navigate(watchPath)}
          >
            Resume
          </button>
          <button
            ref={removeRef}
            type="button"
            className={`continue-remove-button${removeFocused ? ' continue-remove-button--focused' : ''}`}
            onClick={handleRemove}
          >
            Remove
          </button>
        </div>
      </FocusContext.Provider>
    </article>
  )
}

function ContinueWatching({ items, onRemove }) {
  if (!items.length) {
    return null
  }

  return (
    <section className="section-block">
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
  )
}

export default ContinueWatching
