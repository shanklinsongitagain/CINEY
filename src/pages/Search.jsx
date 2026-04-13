import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import MovieGrid from '../components/MovieGrid'
import { searchTitles } from '../lib/tmdb'

function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [inputValue, setInputValue] = useState(searchParams.get('q') ?? '')
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const query = searchParams.get('q') ?? ''

  const { ref: inputRef, focused: inputFocused, focusSelf } = useFocusable()
  const { ref: btnRef, focused: btnFocused } = useFocusable({
    onEnterPress: submitSearch,
  })

  // Auto-focus the search input when the page opens
  useEffect(() => { focusSelf() }, [focusSelf])

  function submitSearch() {
    const q = inputValue.trim()
    if (q) setSearchParams({ q })
  }

  useEffect(() => {
    let active = true
    if (!query.trim()) {
      return () => { active = false }
    }
    setLoading(true)
    searchTitles(query)
      .then((r) => { if (active) { setMovies(r); setError('') } })
      .catch((e) => { if (active) setError(e.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [query])

  return (
    <main className="page container">
      <section className="section-block">
        <div className="section-heading">
          <div><p className="eyebrow">Search</p><h1>Find movies &amp; shows</h1></div>
        </div>

        <form
          className="search-page-form"
          onSubmit={(e) => { e.preventDefault(); submitSearch() }}
        >
          <input
            ref={inputRef}
            type="search"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a title and press Search…"
            aria-label="Search titles"
            className={`search-page-input${inputFocused ? ' spatial-focused' : ''}`}
          />
          <button
            ref={btnRef}
            type="submit"
            className={`search-page-btn${btnFocused ? ' spatial-focused' : ''}`}
          >
            Search
          </button>
        </form>

        {loading && <p className="status-message">Searching…</p>}
        {error && <p className="status-message status-message--error">{error}</p>}
        {!loading && !error && query && (
          <MovieGrid
            movies={movies}
            emptyMessage={`No results for "${query}".`}
            autoFocus
          />
        )}
        {!query && !loading && (
          <p className="status-message">Use the D-pad to focus the input above, then press Select to type.</p>
        )}
      </section>
    </main>
  )
}

export default Search
