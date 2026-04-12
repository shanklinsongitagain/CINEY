import { FocusContext, setFocus, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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

  const cls = [
    primary ? 'primary-button' : 'secondary-button',
    focused ? 'spatial-focused' : '',
  ].filter(Boolean).join(' ')

  return (
    <button ref={ref} type="button" onClick={() => navigate(to)} className={cls} tabIndex={0}>
      {children}
    </button>
  )
}

function Hero({ movie }) {
  const { ref, focusKey } = useFocusable({
    trackChildren: true,
    focusable: false,
    focusKey: HERO_FOCUS_KEY,
  })

  if (!movie) return (
    <section className="hero-banner" style={{ minHeight: '56vw', background: '#000' }} />
  )

  const mediaType = getMediaType(movie)
  const watchPath = mediaType === 'tv'
    ? `/watch/tv/${movie.id}?season=1&episode=1`
    : `/watch/movie/${movie.id}`
  const detailPath = `/${mediaType}/${movie.id}`

  const bg = movie.backdrop_path
    ? `url(${getBackdropUrl(movie.backdrop_path)})`
    : undefined

  return (
    <FocusContext.Provider value={focusKey}>
      <section
        ref={ref}
        className="hero-banner"
        style={{ backgroundImage: bg }}
      >
        <div className="hero-copy">
          <p className="eyebrow">Trending now</p>
          <h1>{getMediaTitle(movie)}</h1>
          {movie.overview && (
            <p className="hero-description">{movie.overview}</p>
          )}
          <div className="hero-actions">
            <HeroBtn to={watchPath} primary autoFocus>▶ Play</HeroBtn>
            <HeroBtn to={detailPath}>ⓘ More Info</HeroBtn>
          </div>
        </div>
      </section>
    </FocusContext.Provider>
  )
}

export default Hero
