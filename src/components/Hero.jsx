import { FocusContext, setFocus, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { NAVBAR_FOCUS_KEY } from './Navbar'
import { getBackdropUrl, getMediaTitle, getMediaType } from '../lib/tmdb'

export const HERO_FOCUS_KEY = 'CINEY_HERO'

function HeroBtn({ children, to, primary = false, autoFocus = false }) {
  const navigate = useNavigate()
  const { ref, focused, focusSelf } = useFocusable({
    onEnterPress: () => navigate(to),
    onArrowPress: (dir) => {
      if (dir === 'up') { setFocus(NAVBAR_FOCUS_KEY); return false }
    },
  })

  useEffect(() => { if (autoFocus) focusSelf() }, [autoFocus, focusSelf])

  const cls = `${primary ? 'primary-button' : 'secondary-button'}${focused ? ' spatial-focused' : ''}`
  return (
    <Link ref={ref} to={to} className={cls} tabIndex={0}>
      {children}
    </Link>
  )
}

function Hero({ movie }) {
  const { ref, focusKey } = useFocusable({
    trackChildren: true,
    focusable: false,
    focusKey: HERO_FOCUS_KEY,
  })

  if (!movie) return null

  const mediaType = getMediaType(movie)
  const watchPath = mediaType === 'tv'
    ? `/watch/tv/${movie.id}?season=1&episode=1`
    : `/watch/movie/${movie.id}`
  const bg = movie.backdrop_path
    ? `linear-gradient(90deg,rgba(5,7,13,.92),rgba(5,7,13,.45)),url(${getBackdropUrl(movie.backdrop_path)})`
    : undefined

  return (
    <FocusContext.Provider value={focusKey}>
      <section ref={ref} className="hero-banner" style={{ backgroundImage: bg }}>
        <div className="hero-copy">
          <p className="eyebrow">Trending now</p>
          <h1>{getMediaTitle(movie)}</h1>
          <p className="hero-description">{movie.overview || ''}</p>
          <div className="hero-actions">
            <HeroBtn to={watchPath} primary>▶ Watch now</HeroBtn>
            <HeroBtn to={`/${mediaType}/${movie.id}`}>ⓘ Details</HeroBtn>
          </div>
        </div>
      </section>
    </FocusContext.Provider>
  )
}

export default Hero
