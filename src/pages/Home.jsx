import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useEffect, useState } from 'react'
import ContinueWatching from '../components/ContinueWatching'
import Hero from '../components/Hero'
import MovieRow from '../components/MovieRow'
import { CONTENT_FOCUS_KEY } from '../components/Navbar'
import { getContinueWatchingChangedEventName, getContinueWatchingItems } from '../lib/progress'
import { getTrendingMovies, getTrendingShows } from '../lib/tmdb'

function Home() {
  const [movies, setMovies]   = useState([])
  const [shows,  setShows]    = useState([])
  const [cw,     setCw]       = useState([])
  const [error,  setError]    = useState('')
  const [loading, setLoading] = useState(true)

  const { ref, focusKey } = useFocusable({
    trackChildren: true, focusable: false, focusKey: CONTENT_FOCUS_KEY,
  })

  useEffect(() => {
    let active = true
    Promise.all([getTrendingMovies(), getTrendingShows()])
      .then(([m, s]) => { if (active) { setMovies(m); setShows(s) } })
      .catch((e)     => { if (active) setError(e.message) })
      .finally(()    => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const load = () => setCw(getContinueWatchingItems())
    load()
    window.addEventListener(getContinueWatchingChangedEventName(), load)
    window.addEventListener('focus', load)
    return () => {
      window.removeEventListener(getContinueWatchingChangedEventName(), load)
      window.removeEventListener('focus', load)
    }
  }, [])

  return (
    <FocusContext.Provider value={focusKey}>
      <main ref={ref} className="page">
        <Hero movie={movies[0] ?? shows[0]} />

        <div className="content-rows">
          <ContinueWatching
            items={cw}
            onRemove={(key) => setCw((cur) => cur.filter((i) => i.key !== key))}
          />

          {loading && <p className="status-message" style={{ margin: '1.5rem 0' }}>Loading…</p>}
          {error   && <p className="status-message status-message--error" style={{ margin: '1.5rem 0' }}>{error}</p>}

          {!loading && !error && (
            <>
              <MovieRow
                movies={movies}
                title="Trending Movies"
                eyebrow="Popular right now"
                autoFocus
              />
              <MovieRow
                movies={shows}
                title="Trending TV Shows"
                eyebrow="Series"
              />
            </>
          )}
        </div>
      </main>
    </FocusContext.Provider>
  )
}

export default Home
