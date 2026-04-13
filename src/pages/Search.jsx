import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import MovieGrid from '../components/MovieGrid'
import { searchTitles } from '../lib/tmdb'

function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [inputValue, setInputValue] = useState(searchParams.get('q') ?? '')
  const [movies, setMovies] = useState([])
  const [error, setError] = useState('')
  const [resolvedQuery, setResolvedQuery] = useState('')

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
    searchTitles(query)
      .then((r) => {
        if (active) {
          setMovies(r)
          setError('')
          setResolvedQuery(query)
        }
      })
      .catch((e) => {
        if (active) {
          setError(e.message)
          setResolvedQuery(query)
        }
      })
    return () => { active = false }
  }, [query])

  const loading = Boolean(query.trim()) && resolvedQuery !== query
  const visibleMovies = resolvedQuery === query ? movies : []
  const visibleError = resolvedQuery === query ? error : ''

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
        {visibleError && <p className="status-message status-message--error">{visibleError}</p>}
        {!loading && !visibleError && query && (
          <MovieGrid
            movies={visibleMovies}
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
