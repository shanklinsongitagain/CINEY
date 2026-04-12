import { useEffect, useMemo, useRef, useState } from 'react'
import { buildPlayerUrl } from '../lib/player'
import { parsePlayerMessage, shouldPersistProgress } from '../lib/playerEvents'
import { readSavedProgress, saveProgress } from '../lib/progress'
import { getMediaTitle } from '../lib/tmdb'

const defaultAllowedOrigin = 'https://www.vidking.net'
const allowedOrigin = import.meta.env.VITE_PLAYER_ALLOWED_ORIGIN || defaultAllowedOrigin

function PlayerFrame({ mediaType, id, season = 1, episode = 1, media, episodeDetails }) {
  const [startTime, setStartTime] = useState(0)
  const [frameLoaded, setFrameLoaded] = useState(false)
  const [playerHealthy, setPlayerHealthy] = useState(false)
  const [showFallback, setShowFallback] = useState(false)
  const [sourceIndex, setSourceIndex] = useState(null)
  const [retryTick, setRetryTick] = useState(0)
  const lastSavedAtRef = useRef(0)

  useEffect(() => {
    setStartTime(readSavedProgress(mediaType, id, season, episode))
    lastSavedAtRef.current = 0
    setSourceIndex(null)
    setRetryTick(0)
  }, [mediaType, id, season, episode])

  const sourceUrl = useMemo(() => {
    const url = new URL(buildPlayerUrl(mediaType, id, season, episode, startTime))
    if (sourceIndex !== null) {
      url.searchParams.set('source', String(sourceIndex))
    }
    if (retryTick > 0) {
      url.searchParams.set('retry', String(retryTick))
    }
    return url.toString()
  }, [episode, id, mediaType, retryTick, season, sourceIndex, startTime])

  const progressMetadata = useMemo(
    () => ({
      title: getMediaTitle(media),
      posterPath: media?.poster_path ?? '',
      backdropPath: media?.backdrop_path ?? '',
      releaseDate: media?.release_date || media?.first_air_date || '',
      episodeName: episodeDetails?.name ?? '',
    }),
    [episodeDetails?.name, media],
  )

  useEffect(() => {
    setFrameLoaded(false)
    setPlayerHealthy(false)
    setShowFallback(false)
  }, [sourceUrl])

  useEffect(() => {
    function handleMessage(event) {
      if (allowedOrigin && event.origin !== allowedOrigin) return

      const parsed = parsePlayerMessage(event.data)
      if (!parsed) return

      setPlayerHealthy(true)
      setShowFallback(false)

      const eventType = parsed.eventType
      const currentTime = parsed.currentTime

      if (!shouldPersistProgress(eventType, currentTime, lastSavedAtRef.current)) {
        return
      }

      saveProgress(
        parsed.mediaType ?? mediaType,
        parsed.id ?? id,
        currentTime,
        Number(parsed.season ?? season),
        Number(parsed.episode ?? episode),
        progressMetadata,
      )
      lastSavedAtRef.current = Date.now()
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [episode, id, mediaType, progressMetadata, season])

  useEffect(() => {
    if (!frameLoaded || playerHealthy) return
    const timeoutId = window.setTimeout(() => setShowFallback(true), 12000)
    return () => window.clearTimeout(timeoutId)
  }, [frameLoaded, playerHealthy])

  function handleRetry() {
    setShowFallback(false)
    setRetryTick((v) => v + 1)
  }

  function handleSource2() {
    setShowFallback(false)
    setSourceIndex(2)
    setRetryTick((v) => v + 1)
  }

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
          onError={() => setShowFallback(true)}
        />
      </div>

      {showFallback && (
        <div className="player-fallback-bar">
          <span className="player-fallback-label">Playback stalled</span>
          <button type="button" className="player-link-button" onClick={handleRetry}>Retry</button>
          <button type="button" className="player-link-button" onClick={handleSource2}>Source 2</button>
        </div>
      )}
    </div>
  )
}

export default PlayerFrame
