import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { memo, useEffect } from 'react'
import MovieCard from './MovieCard'

function MovieGrid({ movies, emptyMessage = 'No movies found.', autoFocus = false }) {
  const { ref, focusKey, focusSelf } = useFocusable({ trackChildren: true })

  useEffect(() => {
    if (autoFocus) focusSelf()
  }, [autoFocus, focusSelf])

  if (!movies.length) {
    return <p className="empty-state">{emptyMessage}</p>
  }

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref} className="movie-grid">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </FocusContext.Provider>
  )
}

export default memo(MovieGrid)
