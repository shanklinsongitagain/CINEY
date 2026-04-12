import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { Link, useNavigate } from 'react-router-dom'
import { getImageUrl, getMediaReleaseDate, getMediaTitle, getMediaType } from '../lib/tmdb'

function MovieCard({ movie }) {
  const navigate = useNavigate()
  const mediaType = getMediaType(movie)
  const posterUrl = getImageUrl(movie.poster_path)
  const releaseDate = getMediaReleaseDate(movie)
  const watchPath =
    mediaType === 'tv' ? `/watch/tv/${movie.id}?season=1&episode=1` : `/watch/movie/${movie.id}`
  const { ref, focused } = useFocusable({ onEnterPress: () => navigate(watchPath) })

  return (
    <article ref={ref} tabIndex={0} className={`movie-card${focused ? ' spatial-focused' : ''}`}>
      <Link to={watchPath} className="movie-card-link" tabIndex={-1}>
        {posterUrl ? (
          <img src={posterUrl} alt={getMediaTitle(movie)} className="movie-poster" loading="lazy" />
        ) : (
          <div className="movie-poster movie-poster--empty">No image</div>
        )}
        <div className="movie-card-body">
          <h2>{getMediaTitle(movie)}</h2>
          <p>{releaseDate ? new Date(releaseDate).getFullYear() : 'Upcoming'}</p>
        </div>
      </Link>
      <div className="movie-card-actions">
        <Link to={watchPath} className="watch-link" tabIndex={-1}>
          Play
        </Link>
        <Link to={`/${mediaType}/${movie.id}`} className="secondary-button details-link" tabIndex={-1}>
          Details
        </Link>
      </div>
    </article>
  )
}

export default MovieCard
