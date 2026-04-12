import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getBackdropUrl, getImageUrl, getMediaReleaseDate,
  getMediaTitle, getMovieDetails, getTvDetails,
} from '../lib/tmdb'

function FBtn({ children, onEnterPress, primary = false, autoFocus = false }) {
  const { ref, focused, focusSelf } = useFocusable({ onEnterPress })
  useEffect(() => { if (autoFocus) focusSelf() }, [autoFocus, focusSelf])
  return (
    <button
      ref={ref} type="button" tabIndex={0}
      className={`btn ${primary ? 'btn-primary' : 'btn-secondary'}${focused ? ' spatial-focused' : ''}`}
      onClick={onEnterPress}
    >
      {children}
    </button>
  )
}

function MovieDetails({ mediaType }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [media, setMedia] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { ref, focusKey } = useFocusable({ trackChildren: true, focusable: false })

  useEffect(() => {
    let active = true
    ;(mediaType === 'tv' ? getTvDetails(id) : getMovieDetails(id))
      .then((d) => { if (active) { setMedia(d); setError('') } })
      .catch((e) => { if (active) setError(e.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, mediaType])

  if (loading) return <main className="page"><div style={{ padding: '2rem 4vw' }}><p className="status-message">Loading…</p></div></main>
  if (error)   return <main className="page"><div style={{ padding: '2rem 4vw' }}><p className="status-message status-message--error">{error}</p></div></main>
  if (!media)  return null

  const watchUrl = mediaType === 'tv'
    ? `/watch/tv/${media.id}?season=${media.seasons?.[0]?.season_number ?? 1}&episode=1`
    : `/watch/movie/${media.id}`
  const releaseDate = getMediaReleaseDate(media)
  const trailer = media.videos?.results?.find((v) => v.site === 'YouTube' && v.type === 'Trailer')

  return (
    <FocusContext.Provider value={focusKey}>
      <main ref={ref} className="page">

        {/* Backdrop */}
        {media.backdrop_path && (
          <div
            className="detail-backdrop-wrap"
            style={{ backgroundImage: `url(${getBackdropUrl(media.backdrop_path)})` }}
          />
        )}

        {/* Info grid */}
        <div className="detail-page">
          <div className="detail-info">
            <div>
              {media.poster_path && (
                <img src={getImageUrl(media.poster_path)} alt={getMediaTitle(media)} className="detail-poster" />
              )}
            </div>
            <div className="detail-copy">
              <p className="eyebrow">{mediaType === 'tv' ? 'TV Series' : 'Movie'}</p>
              <h1>{getMediaTitle(media)}</h1>

              <div className="detail-meta">
                {releaseDate && <span>{new Date(releaseDate).getFullYear()}</span>}
                {mediaType === 'tv'
                  ? <span>{media.number_of_seasons ?? 0} season{media.number_of_seasons === 1 ? '' : 's'}</span>
                  : media.runtime ? <span>{media.runtime} min</span> : null}
                {media.vote_average > 0 && <span>★ {media.vote_average.toFixed(1)}</span>}
              </div>

              {media.genres?.length > 0 && (
                <div className="genre-list">
                  {media.genres.map((g) => <span key={g.id}>{g.name}</span>)}
                </div>
              )}

              <p>{media.overview || 'No overview available.'}</p>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                <FBtn primary autoFocus onEnterPress={() => navigate(watchUrl)}>▶ Watch Now</FBtn>
                <FBtn onEnterPress={() => navigate(-1)}>← Back</FBtn>
              </div>
            </div>
          </div>

          {trailer && (
            <div style={{ marginTop: '2rem' }}>
              <p className="eyebrow">Trailer</p>
              <div className="player-shell" style={{ maxWidth: '720px', borderRadius: '6px' }}>
                <iframe
                  title="trailer"
                  src={`https://www.youtube.com/embed/${trailer.key}`}
                  className="player-frame"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>

      </main>
    </FocusContext.Provider>
  )
}

export default MovieDetails
