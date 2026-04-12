import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { Link, useNavigate } from 'react-router-dom'
import { getBackdropUrl, getMediaTitle, getMediaType } from '../lib/tmdb'

function FocusableAction({ children, to, primary = false }) {
  const navigate = useNavigate()
  const { ref, focused } = useFocusable({ onEnterPress: () => navigate(to) })
  const className = `${primary ? 'primary-button' : 'secondary-button'}${focused ? ' spatial-focused' : ''}`

  return (
    <Link ref={ref} to={to} className={className}>
      {children}
    </Link>
  )
}

function Hero({ movie }) {
  if (!movie) {
    return null
  }

  const mediaType = getMediaType(movie)
  const watchPath =
    mediaType === 'tv' ? `/watch/tv/${movie.id}?season=1&episode=1` : `/watch/${mediaType}/${movie.id}`
  const backgroundImage = movie.backdrop_path
    ? `linear-gradient(90deg, rgba(5, 7, 13, 0.92), rgba(5, 7, 13, 0.55)), url(${getBackdropUrl(movie.backdrop_path)})`
    : undefined

  return (
    <section className="hero-banner" style={{ backgroundImage }}>
      <div className="hero-copy">
        <p className="eyebrow">Trending now</p>
        <h1>{getMediaTitle(movie)}</h1>
        <p className="hero-description">{movie.overview || 'Browse your licensed catalog and start playback.'}</p>
        <div className="hero-actions">
          <FocusableAction to={watchPath} primary>
            Watch now
          </FocusableAction>
          <FocusableAction to={`/${mediaType}/${movie.id}`}>
            Details
          </FocusableAction>
        </div>
      </div>
    </section>
  )
}

export default Hero
