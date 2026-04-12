import { useEffect, useMemo, useState } from 'react'
import { buildPlayerUrl } from '../lib/player'
import { readSavedProgress, saveProgress } from '../lib/progress'
import { getMediaTitle } from '../lib/tmdb'

const defaultAllowedOrigin = 'https://www.vidking.net'
const allowedOrigin = import.meta.env.VITE_PLAYER_ALLOWED_ORIGIN || defaultAllowedOrigin

function PlayerFrame({ mediaType, id, season = 1, episode = 1, media, episodeDetails }) {
  const [startTime, setStartTime]       = useState(0)
  const [frameLoaded, setFrameLoaded]   = useState(false)
  const [playerHealthy, setPlayerHealthy] = useState(false)
  const [showFallback, setShowFallback] = useState(false)

  // Read saved progress whenever the content changes
  useEffect(() => {
    setStartTime(readSavedProgress(mediaType, id, season, episode))
  }, [mediaType, id, season, episode])

  const sourceUrl = useMemo(
    () => buildPlayerUrl(mediaType, id, season, episode, startTime),
    [episode, id, mediaType, season, startTime],
  )

  const progressMetadata = useMemo(
    () => ({
      title:        getMediaTitle(media),
      posterPath:   media?.poster_path    ?? '',
      backdropPath: media?.backdrop_path  ?? '',
      releaseDate:  media?.release_date || media?.first_air_date || '',
      episodeName:  episodeDetails?.name  ?? '',
    }),
    [episodeDetails?.name, media],
  )

  // Reset health flags when source changes
  useEffect(() => {
    setFrameLoaded(false)
    setPlayerHealthy(false)
    setShowFallback(false)
  }, [sourceUrl])

  // Listen for postMessage progress events from vidking.net
  useEffect(() => {
    function handleMessage(event) {
      if (allowedOrigin && event.origin !== allowedOrigin) return
      if (typeof event.data !== 'string') return
      try {
        const payload = JSON.parse(event.data)
        if (payload?.type === 'PLAYER_EVENT') {
          const nextEvent = payload?.data?.event ?? 'unknown'
          const nextTime  = Number(payload?.data?.currentTime ?? 0)
          setPlayerHealthy(true)
          setShowFallback(false)
          if (nextEvent === 'timeupdate') {
            saveProgress(
              payload.data.mediaType ?? mediaType,
              id,
              nextTime,
              Number(payload.data.season  ?? season),
              Number(payload.data.episode ?? episode),
              progressMetadata,
            )
          }
        }
      } catch {
        // ignore malformed messages
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [episode, id, mediaType, progressMetadata, season])

  // Show fallback "Open full player" link if iframe loads but player never responds
  useEffect(() => {
    if (!frameLoaded || playerHealthy) return
    const id = window.setTimeout(() => setShowFallback(true), 12000)
    return () => window.clearTimeout(id)
  }, [frameLoaded, playerHealthy])

  return (
    <div className="player-block">
      <div className="player-shell">
        <iframe
          key={sourceUrl}
          title="Ciney player"
          src={sourceUrl}
          className="player-frame"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          onLoad={() => setFrameLoaded(true)}
        />
      </div>

      {showFallback && (
        <div className="player-fallback-bar">
          <a href={sourceUrl} className="player-link-button" target="_blank" rel="noreferrer">
            Open full player ↗
          </a>
        </div>
      )}
    </div>
  )
}

export default PlayerFrame
