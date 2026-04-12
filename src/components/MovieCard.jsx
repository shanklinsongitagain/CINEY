import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getImageUrl, getMediaReleaseDate, getMediaTitle, getMediaType } from '../lib/tmdb'

function MovieCard({ movie }) {
  const navigate = useNavigate()
  const mediaType = getMediaType(movie)
  const watchPath =
    mediaType === 'tv' ? `/watch/tv/${movie.id}?season=1&episode=1` : `/watch/movie/${movie.id}`
  const { ref, focused } = useFocusable({ onEnterPress: () => navigate(watchPath) })
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
        <div className="movie-poster movie-poster--empty">No image</div>
      )}
      <div className="movie-card-body">
        <h2>{getMediaTitle(movie)}</h2>
        <p>{year} · {mediaType === 'tv' ? 'TV' : 'Movie'}</p>
      </div>
    </article>
  )
}

export default memo(MovieCard)
