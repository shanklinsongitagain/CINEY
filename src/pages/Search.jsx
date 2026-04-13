import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import MovieGrid from '../components/MovieGrid'
import { getTrendingMovies, getTrendingShows, searchTitles } from '../lib/tmdb'

function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [inputValue, setInputValue] = useState(searchParams.get('q') ?? '')
  const [movies, setMovies] = useState([])
  const [error, setError] = useState('')
  const [resolvedQuery, setResolvedQuery] = useState('')

  const query = searchParams.get('q') ?? ''
  const browseType = searchParams.get('type') ?? ''

  const { ref: inputRef, focused: inputFocused, focusSelf } = useFocusable()
  const { ref: btnRef, focused: btnFocused } = useFocusable({
    onEnterPress: submitSearch,
  })

  // Auto-focus the search input when the page opens
  useEffect(() => { focusSelf() }, [focusSelf])

  function submitSearch() {
    const q = inputValue.trim()
    if (q) {
      if (browseType) setSearchParams({ q, type: browseType })
      else setSearchParams({ q })
    }
  }

  useEffect(() => {
    let active = true

    if (!query.trim()) {
      const loadBrowse = async () => {
        try {
          if (browseType === 'tv' || browseType === 'episode') {
            const shows = await getTrendingShows()
            if (active) {
              setMovies(shows)
              setError('')
              setResolvedQuery('')
            }
          } else if (browseType === 'movie') {
            const films = await getTrendingMovies()
            if (active) {
              setMovies(films)
              setError('')
              setResolvedQuery('')
            }
          } else {
            if (active) {
              setMovies([])
              setError('')
              setResolvedQuery('')
            }
          }
        } catch (e) {
          if (active) {
            setError(e.message)
            setResolvedQuery('')
          }
        }
      }
      loadBrowse()
      return () => { active = false }
    }

    searchTitles(query)
      .then((r) => {
        if (active) {
          const filtered = browseType === 'movie'
            ? r.filter((i) => i.media_type === 'movie')
            : (browseType === 'tv' || browseType === 'episode')
              ? r.filter((i) => i.media_type === 'tv')
              : r
          setMovies(filtered)
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
  }, [query, browseType])

  const loading = Boolean(query.trim()) && resolvedQuery !== query
  const visibleMovies = query ? (resolvedQuery === query ? movies : []) : movies
  const visibleError = query ? (resolvedQuery === query ? error : '') : error

  const heading = useMemo(() => {
    if (browseType === 'movie') return 'Browse Movies'
    if (browseType === 'tv') return 'Browse TV Shows'
    if (browseType === 'episode') return 'Browse Episodes'
    return 'Find movies & shows'
  }, [browseType])

  return (
    <main className="page container">
      <section className="section-block">
        <div className="section-heading">
          <div><p className="eyebrow">Search</p><h1>{heading}</h1></div>
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
        {!loading && !visibleError && (query || browseType) && (
          <MovieGrid
            movies={visibleMovies}
            emptyMessage={query
              ? `No results for "${query}".`
              : `No ${browseType === 'movie' ? 'movies' : 'shows'} found.`}
            autoFocus
          />
        )}
        {!query && !browseType && !loading && (
          <p className="status-message">Use the top nav for Movies, TV, Episodes, or enter a search title.</p>
        )}
      </section>
    </main>
  )
}

export default Search
