import { FocusContext, setFocus, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { memo, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getImageUrl, getMediaReleaseDate, getMediaTitle, getMediaType } from '../lib/tmdb'
import { NAVBAR_FOCUS_KEY } from './Navbar'

/* ── Single card inside a row ───────────────────────── */
function RowCard({ movie, focusKey, prevKey, nextKey }) {
  const navigate = useNavigate()
  const mediaType = getMediaType(movie)
  const watchPath = mediaType === 'tv'
    ? `/watch/tv/${movie.id}?season=1&episode=1`
    : `/watch/movie/${movie.id}`

  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: () => navigate(watchPath),
    // O(1) left/right navigation — avoids full bounding-box scan
    onArrowPress: (dir) => {
      if (dir === 'left'  && prevKey) { setFocus(prevKey); return false }
      if (dir === 'right' && nextKey) { setFocus(nextKey); return false }
      if (dir === 'up')               { setFocus(NAVBAR_FOCUS_KEY); return false }
    },
  })

  // Scroll this card into view instantly when it gets focus
  useEffect(() => {
    if (focused && ref.current) {
      ref.current.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'nearest' })
    }
  }, [focused, ref])

  const year = getMediaReleaseDate(movie)
    ? new Date(getMediaReleaseDate(movie)).getFullYear()
    : 'TBA'

  return (
    <article
      ref={ref}
      tabIndex={0}
      className={`movie-card${focused ? ' spatial-focused' : ''}`}
      onClick={() => navigate(watchPath)}
    >
      {getImageUrl(movie.poster_path) ? (
        <img
          src={getImageUrl(movie.poster_path)}
          alt={getMediaTitle(movie)}
          className="movie-poster"
          loading="lazy"
        />
      ) : (
        <div className="movie-poster movie-poster--empty">No poster</div>
      )}
      <div className="movie-card-body">
        <h2>{getMediaTitle(movie)}</h2>
        <p>{year} · {mediaType === 'tv' ? 'TV' : 'Film'}</p>
      </div>
    </article>
  )
}

/* ── The row itself ─────────────────────────────────── */
function MovieRow({ movies, title, eyebrow, autoFocus = false }) {
  const { ref, focusKey, focusSelf } = useFocusable({ trackChildren: true })
  const rowId = useRef(`row-${title.replace(/\s+/g, '-').toLowerCase()}-`)

  const cardKey = useCallback(
    (movie) => `${rowId.current}${movie.id}`,
    [],
  )

  useEffect(() => {
    if (autoFocus && movies.length) focusSelf()
  }, [autoFocus, movies.length, focusSelf])

  if (!movies.length) return null

  return (
    <div className="content-row">
      <div className="row-header">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="row-title">{title}</h2>
      </div>
      <FocusContext.Provider value={focusKey}>
        <div ref={ref} className="row-track">
          {movies.map((movie, i) => (
            <RowCard
              key={movie.id}
              movie={movie}
              focusKey={cardKey(movie)}
              prevKey={i > 0               ? cardKey(movies[i - 1]) : null}
              nextKey={i < movies.length-1 ? cardKey(movies[i + 1]) : null}
            />
          ))}
        </div>
      </FocusContext.Provider>
    </div>
  )
}

export default memo(MovieRow)
