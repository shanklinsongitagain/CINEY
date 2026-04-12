import { createContext, useCallback, useContext, useState } from 'react'

const Ctx = createContext(null)

/**
 * player shape:
 * {
 *   id, mediaType, season, episode,
 *   title, posterPath, backdropPath,
 *   seasons   // optional – array of season objects from TMDB
 * }
 */
export function PlayerProvider({ children }) {
  const [player, setPlayer] = useState(null)

  const openPlayer = useCallback((id, mediaType, season = 1, episode = 1, meta = {}) => {
    setPlayer({ id: String(id), mediaType, season, episode, ...meta })
  }, [])

  const closePlayer = useCallback(() => setPlayer(null), [])

  const updateEpisode = useCallback((season, episode) => {
    setPlayer((prev) => (prev ? { ...prev, season, episode } : null))
  }, [])

  return (
    <Ctx.Provider value={{ player, openPlayer, closePlayer, updateEpisode }}>
      {children}
    </Ctx.Provider>
  )
}

export function usePlayer() {
  return useContext(Ctx)
}
