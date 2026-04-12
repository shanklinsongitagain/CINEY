import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getBackdropUrl, getImageUrl, getMediaReleaseDate,
  getMediaTitle, getMovieDetails, getTvDetails,
} from '../lib/tmdb'

function FocusBtn({ children, onEnterPress, primary = false, autoFocus = false }) {
  const { ref, focused, focusSelf } = useFocusable({ onEnterPress })
  useEffect(() => { if (autoFocus) focusSelf() }, [autoFocus, focusSelf])
  const cls = `${primary ? 'primary-button' : 'secondary-button'}${focused ? ' spatial-focused' : ''}`
  return <button ref={ref} type="button" className={cls} onClick={onEnterPress} tabIndex={0}>{children}</button>
}

function MovieDetails({ mediaType }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [media, setMedia] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const { ref: pageRef, focusKey: pageFocusKey } = useFocusable({
    trackChildren: true, focusable: false,
  })

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const d = mediaType === 'tv' ? await getTvDetails(id) : await getMovieDetails(id)
        if (active) { setMedia(d); setError('') }
      } catch (e) { if (active) setError(e.message) }
      finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [id, mediaType])

  if (loading) return <main className="page container"><p className="status-message">Loading…</p></main>
  if (error) return <main className="page container"><p className="status-message status-message--error">{error}</p></main>
  if (!media) return null

  const trailer = media.videos?.results?.find((v) => v.site === 'YouTube' && v.type === 'Trailer')
  const releaseDate = getMediaReleaseDate(media)
  const watchUrl = mediaType === 'tv'
    ? `/watch/tv/${media.id}?season=${media.seasons?.[0]?.season_number ?? 1}&episode=1`
    : `/watch/movie/${media.id}`

  return (
    <FocusContext.Provider value={pageFocusKey}>
      <main ref={pageRef} className="page container">
        <section className="detail-hero">
          <div className="detail-backdrop">
            {media.backdrop_path && <img src={getBackdropUrl(media.backdrop_path)} alt="" />}
          </div>
          <div className="detail-grid">
            <div>
              {media.poster_path && (
                <img src={getImageUrl(media.poster_path)} alt={getMediaTitle(media)} className="detail-poster" />
              )}
            </div>
            <div className="detail-copy">
              <p className="eyebrow">{mediaType === 'tv' ? 'TV Series' : 'Movie'}</p>
              <h1>{getMediaTitle(media)}</h1>
              <div className="detail-meta">
                <span>{releaseDate ? new Date(releaseDate).getFullYear() : 'TBA'}</span>
                <span>
                  {mediaType === 'tv'
                    ? `${media.number_of_seasons ?? 0} season${media.number_of_seasons === 1 ? '' : 's'}`
                    : media.runtime ? `${media.runtime} min` : 'N/A'}
                </span>
                {media.vote_average > 0 && <span>★ {media.vote_average.toFixed(1)}</span>}
              </div>
              {media.genres?.length > 0 && (
                <div className="genre-list">
                  {media.genres.map((g) => <span key={g.id}>{g.name}</span>)}
                </div>
              )}
              <p>{media.overview || 'No overview available.'}</p>
              <div className="hero-actions">
                <FocusBtn primary autoFocus onEnterPress={() => navigate(watchUrl)}>▶ Watch now</FocusBtn>
                <FocusBtn onEnterPress={() => navigate(-1)}>← Back</FocusBtn>
              </div>
            </div>
          </div>
        </section>

        {trailer && (
          <section className="section-block">
            <div className="section-heading">
              <div><p className="eyebrow">Trailer</p><h2>Official preview</h2></div>
            </div>
            <div className="player-shell trailer-shell">
              <iframe
                title={`${getMediaTitle(media)} trailer`}
                src={`https://www.youtube.com/embed/${trailer.key}`}
                className="player-frame"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          </section>
        )}
      </main>
    </FocusContext.Provider>
  )
}

export default MovieDetails
