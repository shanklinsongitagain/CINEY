import { FocusContext, setFocus, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { memo, useCallback, useEffect, useRef } from 'react'
import { usePlayer } from '../context/PlayerContext'
import { NAVBAR_FOCUS_KEY } from './Navbar'
import { removeContinueWatchingItem } from '../lib/progress'
import { getImageUrl } from '../lib/tmdb'

function fmt(s) {
  const t = Math.max(0, Math.floor(s ?? 0))
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`
}

function CWCard({ item, onRemove, focusKey, prevKey, nextKey }) {
  const { openPlayer } = usePlayer()

  function handleResume() {
    openPlayer(item.id, item.mediaType, item.season ?? 1, item.episode ?? 1, {
      title:        item.title        ?? '',
      posterPath:   item.posterPath   ?? '',
      backdropPath: item.backdropPath ?? '',
    })
  }

  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: handleResume,
    onArrowPress: (dir) => {
      if (dir === 'left'  && prevKey) { setFocus(prevKey); return false }
      if (dir === 'right' && nextKey) { setFocus(nextKey); return false }
      if (dir === 'up')               { setFocus(NAVBAR_FOCUS_KEY); return false }
    },
  })

  useEffect(() => {
    if (focused && ref.current) {
      ref.current.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'nearest' })
    }
  }, [focused, ref])

  return (
    <article
      ref={ref}
      tabIndex={0}
      className={`continue-card${focused ? ' spatial-focused' : ''}`}
      onClick={handleResume}
    >
      {item.posterPath ? (
        <img src={getImageUrl(item.posterPath)} alt={item.title} className="continue-card-poster" loading="lazy" />
      ) : (
        <div className="continue-card-poster continue-card-poster--empty">No image</div>
      )}
      <div className="continue-card-body">
        <h3>{item.title}</h3>
        <p>
          {item.mediaType === 'tv' ? `S${item.season ?? 1} E${item.episode ?? 1} · ` : ''}
          {fmt(item.progress)}
          {' · '}
          <span
            style={{ color: '#888', cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation()
              removeContinueWatchingItem(item)
              onRemove?.(item.key)
            }}
          >
            Remove
          </span>
        </p>
      </div>
    </article>
  )
}

function ContinueWatching({ items, onRemove }) {
  const rowId = useRef('cw-')
  const cardKey = useCallback((item) => `${rowId.current}${item.key}`, [])
  const { ref, focusKey } = useFocusable({ trackChildren: true, focusable: false })

  if (!items.length) return null

  return (
    <div className="content-row">
      <div className="row-header">
        <p className="eyebrow">Resume</p>
        <h2 className="row-title">Continue Watching</h2>
      </div>
      <FocusContext.Provider value={focusKey}>
        <div ref={ref} className="row-track">
          {items.map((item, i) => (
            <CWCard
              key={item.key}
              item={item}
              onRemove={onRemove}
              focusKey={cardKey(item)}
              prevKey={i > 0               ? cardKey(items[i - 1]) : null}
              nextKey={i < items.length - 1 ? cardKey(items[i + 1]) : null}
            />
          ))}
        </div>
      </FocusContext.Provider>
    </div>
  )
}

export default memo(ContinueWatching)
