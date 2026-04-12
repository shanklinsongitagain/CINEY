import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getBackdropUrl,
  getImageUrl,
  getMediaReleaseDate,
  getMediaTitle,
  getMovieDetails,
  getTvDetails,
} from '../lib/tmdb'

function MovieDetails({ mediaType }) {
  const { id } = useParams()
  const [media, setMedia] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadMedia() {
      try {
        const details = mediaType === 'tv' ? await getTvDetails(id) : await getMovieDetails(id)
        if (active) {
          setMedia(details)
          setError('')
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadMedia()
    return () => {
      active = false
    }
  }, [id, mediaType])

  if (loading) {
    return (
      <main className="page container">
        <p className="status-message">Loading details…</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="page container">
        <p className="status-message status-message--error">{error}</p>
      </main>
    )
  }

  if (!media) {
    return null
  }

  const trailer = media.videos?.results?.find(
    (video) => video.site === 'YouTube' && video.type === 'Trailer',
  )
  const releaseDate = getMediaReleaseDate(media)
  const seasonsCount = media.number_of_seasons
  const watchUrl =
    mediaType === 'tv'
      ? `/watch/tv/${media.id}?season=${media.seasons?.[0]?.season_number ?? 1}&episode=1`
      : `/watch/movie/${media.id}`

  return (
    <main className="page container">
      <section className="detail-hero">
        <div className="detail-backdrop">
          {media.backdrop_path ? <img src={getBackdropUrl(media.backdrop_path)} alt="" /> : null}
        </div>
        <div className="detail-grid">
          <div>
            {media.poster_path ? (
              <img src={getImageUrl(media.poster_path)} alt={getMediaTitle(media)} className="detail-poster" />
            ) : null}
          </div>
          <div className="detail-copy">
            <p className="eyebrow">{mediaType === 'tv' ? 'TV series' : 'Movie'} details</p>
            <h1>{getMediaTitle(media)}</h1>
            <div className="detail-meta">
              <span>{releaseDate ? new Date(releaseDate).getFullYear() : 'TBA'}</span>
              <span>
                {mediaType === 'tv'
                  ? `${seasonsCount ?? 0} season${seasonsCount === 1 ? '' : 's'}`
                  : media.runtime
                    ? `${media.runtime} min`
                    : 'Runtime unavailable'}
              </span>
              <span>{media.vote_average ? `${media.vote_average.toFixed(1)} / 10` : 'No rating yet'}</span>
            </div>
            <p>{media.overview || 'No overview is available for this title.'}</p>
            {media.genres?.length ? (
              <div className="genre-list">
                {media.genres.map((genre) => (
                  <span key={genre.id}>{genre.name}</span>
                ))}
              </div>
            ) : null}
            <div className="hero-actions">
              <Link to={watchUrl} className="primary-button">
                Watch now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {trailer ? (
        <section className="section-block section-block--compact">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Trailer</p>
              <h2>Official preview</h2>
            </div>
          </div>
          <div className="player-shell">
            <iframe
              title={`${getMediaTitle(media)} trailer`}
              src={`https://www.youtube.com/embed/${trailer.key}`}
              className="player-frame"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      ) : null}
    </main>
  )
}

export default MovieDetails
