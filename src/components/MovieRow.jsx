import { FocusContext, setFocus, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { memo, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getImageUrl, getMediaReleaseDate, getMediaTitle, getMediaType } from '../lib/tmdb'
import { NAVBAR_FOCUS_KEY } from './Navbar'

/* ── Single card ────────────────────────────────────── */
function RowCard({ movie, focusKey, prevKey, nextKey }) {
  const navigate  = useNavigate()
  const mediaType = getMediaType(movie)
  const watchPath = mediaType === 'tv'
    ? `/watch/tv/${movie.id}?season=1&episode=1`
    : `/watch/movie/${movie.id}`
  const detailPath = `/${mediaType}/${movie.id}`

  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: () => navigate(watchPath),
    onArrowPress: (dir) => {
      if (dir === 'left'  && prevKey) { setFocus(prevKey); return false }
      if (dir === 'right' && nextKey) { setFocus(nextKey); return false }
      if (dir === 'up')               { setFocus(NAVBAR_FOCUS_KEY); return false }
    },
  })

  /* scroll focused card into view — smooth on TV */
  useEffect(() => {
    if (focused && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [focused, ref])

  const year  = getMediaReleaseDate(movie) ? new Date(getMediaReleaseDate(movie)).getFullYear() : null
  const score = movie.vote_average ? movie.vote_average.toFixed(1) : null
  const title = getMediaTitle(movie)
  const type  = mediaType === 'tv' ? 'TV' : 'Film'

  return (
    <article
      ref={ref}
      tabIndex={0}
      className={`movie-card${focused ? ' spatial-focused' : ''}`}
      onClick={() => navigate(watchPath)}
    >
      {getImageUrl(movie.poster_path) ? (
        <img src={getImageUrl(movie.poster_path)} alt={title} className="movie-poster" loading="lazy" />
      ) : (
        <div className="movie-poster movie-poster--empty">No poster</div>
      )}
      <div className="movie-card-body">
        <h2>{title}</h2>
        <p>{[year, type].filter(Boolean).join(' · ')}</p>
        {score && <p className="card-rating">★ {score}</p>}
      </div>

      {/* Description popup when focused via D-pad */}
      {focused && (
        <div className="card-description-popup">
          <p className="popup-title">{title}</p>
          <div className="popup-meta">
            {year  && <span className="popup-year">{year}</span>}
            {score && <span className="popup-score">★ {score}</span>}
            <span>{type}</span>
          </div>
          {movie.overview && (
            <p className="popup-overview">{movie.overview}</p>
          )}
        </div>
      )}
    </article>
  )
}

/* ── The row ────────────────────────────────────────── */
function MovieRow({ movies, title, eyebrow, autoFocus = false }) {
  const { ref, focusKey, focusSelf } = useFocusable({ trackChildren: true })
  const rowId   = useRef(`row-${title.replace(/\s+/g, '-').toLowerCase()}-`)
  const cardKey = useCallback((movie) => `${rowId.current}${movie.id}`, [])

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
