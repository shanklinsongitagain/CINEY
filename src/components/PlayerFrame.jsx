import { useEffect, useMemo, useState } from 'react'
import { buildPlayerUrl } from '../lib/player'
import { readSavedProgress, saveProgress } from '../lib/progress'
import { getMediaTitle } from '../lib/tmdb'

const defaultAllowedOrigin = 'https://www.vidking.net'
const allowedOrigin = import.meta.env.VITE_PLAYER_ALLOWED_ORIGIN || defaultAllowedOrigin

function PlayerFrame({ mediaType, id, season = 1, episode = 1, media, episodeDetails }) {
  const [startTime, setStartTime] = useState(0)
  const [frameLoaded, setFrameLoaded] = useState(false)
  const [playerHealthy, setPlayerHealthy] = useState(false)
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    setStartTime(readSavedProgress(mediaType, id, season, episode))
  }, [mediaType, id, season, episode])

  const sourceUrl = useMemo(
    () => buildPlayerUrl(mediaType, id, season, episode, startTime),
    [episode, id, mediaType, season, startTime],
  )

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
      if (allowedOrigin && event.origin !== allowedOrigin) {
        return
      }

      if (typeof event.data !== 'string') {
        return
      }

      try {
        const payload = JSON.parse(event.data)

        if (payload?.type === 'PLAYER_EVENT') {
          const nextEvent = payload?.data?.event ?? 'unknown'
          const nextTime = Number(payload?.data?.currentTime ?? 0)

          setPlayerHealthy(true)
          setShowFallback(false)

          if (nextEvent === 'timeupdate') {
            saveProgress(
              payload.data.mediaType ?? mediaType,
              id,
              nextTime,
              Number(payload.data.season ?? season),
              Number(payload.data.episode ?? episode),
              progressMetadata,
            )
          }
        }
      } catch {
        return
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [episode, id, mediaType, progressMetadata, season])

  useEffect(() => {
    if (!frameLoaded || playerHealthy) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setShowFallback(true)
    }, 12000)

    return () => window.clearTimeout(timeoutId)
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
          onLoad={() => {
            setFrameLoaded(true)
          }}
        />
      </div>

      {showFallback ? (
        <div className="player-fallback-bar">
          <a href={sourceUrl} className="player-link-button">
            Open full player
          </a>
        </div>
      ) : null}
    </div>
  )
}

export default PlayerFrame
