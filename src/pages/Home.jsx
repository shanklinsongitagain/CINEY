import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useEffect, useState } from 'react'
import ContinueWatching from '../components/ContinueWatching'
import Hero from '../components/Hero'
import MovieGrid from '../components/MovieGrid'
import { CONTENT_FOCUS_KEY } from '../components/Navbar'
import { getContinueWatchingChangedEventName, getContinueWatchingItems } from '../lib/progress'
import { getTrendingMovies, getTrendingShows } from '../lib/tmdb'

function Home() {
  const [movies, setMovies] = useState([])
  const [shows, setShows] = useState([])
  const [continueWatching, setContinueWatching] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // Register the stable content focusKey so navbar DOWN handler lands here
  const { ref: contentRef, focusKey: contentFocusKey } = useFocusable({
    trackChildren: true,
    focusable: false,
    focusKey: CONTENT_FOCUS_KEY,
  })

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [m, s] = await Promise.all([getTrendingMovies(), getTrendingShows()])
        if (active) { setMovies(m); setShows(s); setError('') }
      } catch (e) {
        if (active) setError(e.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  useEffect(() => {
    const load = () => setContinueWatching(getContinueWatchingItems())
    load()
    window.addEventListener(getContinueWatchingChangedEventName(), load)
    window.addEventListener('focus', load)
    return () => {
      window.removeEventListener(getContinueWatchingChangedEventName(), load)
      window.removeEventListener('focus', load)
    }
  }, [])

  const featured = movies[0] ?? shows[0]

  return (
    <FocusContext.Provider value={contentFocusKey}>
      <main ref={contentRef} className="page container">
        <Hero movie={featured} />
        <ContinueWatching
          items={continueWatching}
          onRemove={(key) => setContinueWatching((cur) => cur.filter((i) => i.key !== key))}
        />

        <section className="section-block">
          <div className="section-heading">
            <div><p className="eyebrow">Library</p><h2>Trending Movies</h2></div>
          </div>
          {loading && <p className="status-message">Loading…</p>}
          {error && <p className="status-message status-message--error">{error}</p>}
          {!loading && !error && (
            <MovieGrid movies={movies} emptyMessage="No trending movies found." autoFocus />
          )}
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div><p className="eyebrow">Series</p><h2>Trending TV Shows</h2></div>
          </div>
          {!loading && !error && (
            <MovieGrid movies={shows} emptyMessage="No trending shows found." />
          )}
        </section>
      </main>
    </FocusContext.Provider>
  )
}

export default Home
