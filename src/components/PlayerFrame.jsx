import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { buildPlayerUrl } from '../lib/player'
import { parsePlayerMessage, shouldPersistProgress } from '../lib/playerEvents'
import { getPlayerSourceBase, getPlayerSourceCount } from '../lib/playerSources'
import { logPlayerTelemetry } from '../lib/playerTelemetry'
import { readSavedProgress, saveProgress } from '../lib/progress'
import { getMediaTitle } from '../lib/tmdb'

const defaultAllowedOrigin = 'https://www.vidking.net'
const allowedOrigin = import.meta.env.VITE_PLAYER_ALLOWED_ORIGIN || defaultAllowedOrigin

function FallbackBtn({ children, onClick }) {
  const { ref, focused } = useFocusable({ onEnterPress: onClick })
  return (
    <button
      ref={ref}
      type="button"
      className={`player-link-button${focused ? ' spatial-focused' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function PlayerEmbedSession({ sourceUrl, mediaType, id, sourceIndex, onRetry, onSwitchSource }) {
  const [frameLoaded, setFrameLoaded] = useState(false)
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    if (!frameLoaded || showFallback) return
    const timeoutId = window.setTimeout(() => {
      setShowFallback(true)
      logPlayerTelemetry('playerframe_stalled', { mediaType, id, sourceIndex })
    }, 12000)
    return () => window.clearTimeout(timeoutId)
  }, [frameLoaded, showFallback, mediaType, id, sourceIndex])

  return (
    <>
      <div className="player-shell">
        <iframe
          key={sourceUrl}
          title="Ciney player"
          src={sourceUrl}
          className="player-frame"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          onLoad={() => setFrameLoaded(true)}
          onError={() => {
            setShowFallback(true)
            logPlayerTelemetry('playerframe_iframe_error', { mediaType, id, sourceIndex })
          }}
        />
      </div>

      {showFallback && (
        <div className="player-fallback-bar">
          <span className="player-fallback-label">Playback stalled</span>
          <FallbackBtn onClick={() => { setShowFallback(false); onRetry() }}>Retry</FallbackBtn>
          <FallbackBtn onClick={() => { setShowFallback(false); onSwitchSource() }}>Source 2</FallbackBtn>
        </div>
      )}
    </>
  )
}

function PlayerFrame({ mediaType, id, season = 1, episode = 1, media, episodeDetails }) {
  const [sessionState, setSessionState] = useState({ token: '', sourceIndex: 0, retryTick: 0 })
  const lastSavedAtRef = useRef(0)

  const sourceCount = getPlayerSourceCount()
  const sessionToken = `${mediaType}:${id}:${season}:${episode}`
  const sourceIndex = sessionState.token === sessionToken ? sessionState.sourceIndex : 0
  const retryTick = sessionState.token === sessionToken ? sessionState.retryTick : 0

  const startTime = useMemo(
    () => readSavedProgress(mediaType, id, season, episode),
    [mediaType, id, season, episode],
  )

  const activeBaseUrl = getPlayerSourceBase(sourceIndex)

  const sourceUrl = useMemo(() => {
    const url = new URL(buildPlayerUrl(mediaType, id, season, episode, startTime, activeBaseUrl))
    if (retryTick > 0) {
      url.searchParams.set('retry', String(retryTick))
    }
    return url.toString()
  }, [episode, id, mediaType, retryTick, season, startTime, activeBaseUrl])

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
    function handleMessage(event) {
      if (allowedOrigin && event.origin !== allowedOrigin) return

      const parsed = parsePlayerMessage(event.data)
      if (!parsed) return

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

  function handleRetry() {
    setSessionState((prev) => ({
      token: sessionToken,
      sourceIndex: prev.token === sessionToken ? prev.sourceIndex : 0,
      retryTick: (prev.token === sessionToken ? prev.retryTick : 0) + 1,
    }))
    logPlayerTelemetry('playerframe_retry', { mediaType, id, sourceIndex })
  }

  function handleSource2() {
    if (sourceCount < 2) {
      handleRetry()
      return
    }

    setSessionState((prev) => ({
      token: sessionToken,
      sourceIndex: 1,
      retryTick: (prev.token === sessionToken ? prev.retryTick : 0) + 1,
    }))
    logPlayerTelemetry('playerframe_source_switch', { mediaType, id, sourceIndex: 1 })
  }

  return (
    <div className="player-block">
      <PlayerEmbedSession
        key={`${sessionToken}:${sourceIndex}:${retryTick}`}
        sourceUrl={sourceUrl}
        mediaType={mediaType}
        id={id}
        sourceIndex={sourceIndex}
        onRetry={handleRetry}
        onSwitchSource={handleSource2}
      />
    </div>
  )
}

export default PlayerFrame
