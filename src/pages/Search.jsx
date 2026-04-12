import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import MovieGrid from '../components/MovieGrid'
import { searchTitles } from '../lib/tmdb'

function Search() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function runSearch() {
      if (!query.trim()) {
        setMovies([])
        setError('')
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const results = await searchTitles(query)
        if (active) {
          setMovies(results)
          setError('')
        }
      } catch (searchError) {
        if (active) {
          setError(searchError.message)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    runSearch()
    return () => {
      active = false
    }
  }, [query])

  return (
    <main className="page container">
      <section className="section-block section-block--compact">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Search</p>
            <h1>Find movies and shows</h1>
          </div>
        </div>

        {!query ? <p className="status-message">Enter a title in the header search box.</p> : null}
        {loading ? <p className="status-message">Searching…</p> : null}
        {error ? <p className="status-message status-message--error">{error}</p> : null}
        {!loading && !error && query ? (
          <MovieGrid movies={movies} emptyMessage={`No results found for “${query}”.`} autoFocus />
        ) : null}
      </section>
    </main>
  )
}

export default Search
