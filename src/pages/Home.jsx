import { useEffect, useState } from 'react'
import ContinueWatching from '../components/ContinueWatching'
import Hero from '../components/Hero'
import MovieGrid from '../components/MovieGrid'
import { getContinueWatchingChangedEventName, getContinueWatchingItems } from '../lib/progress'
import { getTrendingMovies, getTrendingShows } from '../lib/tmdb'

function Home() {
  const [movies, setMovies] = useState([])
  const [shows, setShows] = useState([])
  const [continueWatching, setContinueWatching] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadMedia() {
      try {
        const [trendingMovies, trendingShows] = await Promise.all([
          getTrendingMovies(),
          getTrendingShows(),
        ])

        if (active) {
          setMovies(trendingMovies)
          setShows(trendingShows)
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
  }, [])

  useEffect(() => {
    const loadContinueWatching = () => {
      setContinueWatching(getContinueWatchingItems())
    }

    loadContinueWatching()
    window.addEventListener(getContinueWatchingChangedEventName(), loadContinueWatching)
    window.addEventListener('focus', loadContinueWatching)

    return () => {
      window.removeEventListener(getContinueWatchingChangedEventName(), loadContinueWatching)
      window.removeEventListener('focus', loadContinueWatching)
    }
  }, [])

  const handleRemoveContinueWatching = (itemKey) => {
    setContinueWatching((currentItems) => currentItems.filter((item) => item.key !== itemKey))
  }

  const featuredMedia = movies[0] ?? shows[0]

  return (
    <main className="page container">
      <Hero movie={featuredMedia} />
      <ContinueWatching items={continueWatching} onRemove={handleRemoveContinueWatching} />

      <section id="movies" className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Library</p>
            <h2>Trending movies</h2>
          </div>
        </div>

        {loading ? <p className="status-message">Loading movies and shows…</p> : null}
        {error ? <p className="status-message status-message--error">{error}</p> : null}
        {!loading && !error ? <MovieGrid movies={movies} emptyMessage="No trending movies found." autoFocus /> : null}
      </section>

      <section id="shows" className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Series</p>
            <h2>Trending TV shows</h2>
          </div>
        </div>

        {!loading && !error ? <MovieGrid movies={shows} emptyMessage="No trending shows found." /> : null}
      </section>
    </main>
  )
}

export default Home
