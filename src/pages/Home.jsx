import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useEffect, useState } from 'react'
import ContinueWatching from '../components/ContinueWatching'
import Hero from '../components/Hero'
import MovieRow from '../components/MovieRow'
import { CONTENT_FOCUS_KEY } from '../components/Navbar'
import { getContinueWatchingChangedEventName, getContinueWatchingItems } from '../lib/progress'
import {
  getActionMovies,
  getPopularMovies,
  getTopRatedMovies,
  getTopRatedShows,
  getTrendingMovies,
  getTrendingShows,
} from '../lib/tmdb'

function Home() {
  const [trendingMovies, setTrendingMovies] = useState([])
  const [trendingShows,  setTrendingShows]  = useState([])
  const [topMovies,      setTopMovies]      = useState([])
  const [topShows,       setTopShows]       = useState([])
  const [popularMovies,  setPopularMovies]  = useState([])
  const [actionMovies,   setActionMovies]   = useState([])
  const [cw,             setCw]             = useState([])
  const [error,          setError]          = useState('')
  const [loading,        setLoading]        = useState(true)

  const { ref, focusKey } = useFocusable({
    trackChildren: true, focusable: false, focusKey: CONTENT_FOCUS_KEY,
  })

  /* Load all content rows in parallel */
  useEffect(() => {
    let active = true
    Promise.all([
      getTrendingMovies(),
      getTrendingShows(),
      getTopRatedMovies(),
      getTopRatedShows(),
      getPopularMovies(),
      getActionMovies(),
    ])
      .then(([tm, ts, topM, topS, pop, action]) => {
        if (!active) return
        setTrendingMovies(tm)
        setTrendingShows(ts)
        setTopMovies(topM)
        setTopShows(topS)
        setPopularMovies(pop)
        setActionMovies(action)
        setLoading(false)
      })
      .catch((e) => { if (active) { setError(e.message); setLoading(false) } })
    return () => { active = false }
  }, [])

  /* Keep continue-watching in sync */
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
      <main ref={ref} className="home-page">
        {/* Cinematic hero billboard */}
        <Hero movie={trendingMovies[0] ?? trendingShows[0]} />

        <div className="content-rows">
          {/* Continue watching row */}
          <ContinueWatching
            items={cw}
            onRemove={(key) => setCw((cur) => cur.filter((i) => i.key !== key))}
          />

          {loading && <p className="status-message" style={{ margin: '1.5rem var(--safe)' }}>Loading…</p>}
          {error   && <p className="status-message status-message--error" style={{ margin: '1.5rem var(--safe)' }}>{error}</p>}

          {!loading && !error && (
            <>
              <MovieRow movies={trendingMovies} title="Trending Movies"   eyebrow="Popular right now" autoFocus />
              <MovieRow movies={trendingShows}  title="Trending TV Shows" eyebrow="Series" />
              <MovieRow movies={topMovies}      title="Top Rated Movies"  eyebrow="All time greats" />
              <MovieRow movies={topShows}       title="Top Rated TV"      eyebrow="Must-watch series" />
              <MovieRow movies={popularMovies}  title="Popular Now"       eyebrow="Everyone's watching" />
              <MovieRow movies={actionMovies}   title="Action & Adventure" />
            </>
          )}
        </div>
      </main>
    </FocusContext.Provider>
  )
}

export default Home
