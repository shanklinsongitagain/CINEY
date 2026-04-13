import { FocusContext, setFocus, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildPlayerUrl } from '../lib/player'
import { parsePlayerMessage, shouldPersistProgress } from '../lib/playerEvents'
import { getPlayerSourceBase, getPlayerSourceCount } from '../lib/playerSources'
import { logPlayerTelemetry } from '../lib/playerTelemetry'
import { readSavedProgress, saveProgress } from '../lib/progress'
import { usePlayer } from '../context/usePlayer'

const ALLOWED_ORIGIN = import.meta.env.VITE_PLAYER_ALLOWED_ORIGIN || 'https://www.vidking.net'
const CONTROLS_TIMEOUT_MS = 5000
const SMART_BUFFER_DELAY_MS = 3000
const RECOVERY_TIMEOUT_MS = 15000
const BACK_KEY = 'PV_BACK'

/* ── Small control button ─────────────────────────────── */
function PVBtn({ children, onEnterPress, focusKey: fk, disabled = false }) {
  const { ref, focused } = useFocusable({
    focusKey: fk,
    onEnterPress: disabled ? undefined : onEnterPress,
  })
  return (
    <button
      ref={ref} type="button" tabIndex={0} disabled={disabled}
      className={`pv-btn${focused ? ' spatial-focused' : ''}`}
      onClick={disabled ? undefined : onEnterPress}
    >
      {children}
    </button>
  )
}

/* ── Main PlayerView ──────────────────────────────────── */
export default function PlayerView() {
  const { player, closePlayer, updateEpisode } = usePlayer()
  const [loading, setLoading] = useState(true)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [hasPlayEvent, setHasPlayEvent] = useState(false)
  const [showSmartBuffer, setShowSmartBuffer] = useState(false)
  const [showRecovery, setShowRecovery] = useState(false)
  const [sourceIndex, setSourceIndex] = useState(0)
  const [retryTick, setRetryTick] = useState(0)

  const iframeRef = useRef(null)
  const hideTimerRef = useRef(null)
  const smartBufferTimerRef = useRef(null)
  const recoveryTimerRef = useRef(null)
  const lastSavedAtRef = useRef(0)

  const { ref: ctrlRef, focusKey: ctrlKey } = useFocusable({
    trackChildren: true,
    isFocusBoundary: true,
    focusable: false,
  })

  const sourceCount = getPlayerSourceCount()
  const activeBaseUrl = getPlayerSourceBase(sourceIndex)
  const playerId = player?.id ?? null
  const playerMediaType = player?.mediaType ?? null

  /* ── Sync local state when player opens ─────────────── */
  useEffect(() => {
    if (player) {
      setSeason(player.season ?? 1)
      setEpisode(player.episode ?? 1)
      setLoading(true)
      setControlsVisible(true)
      setHasPlayEvent(false)
      setShowSmartBuffer(false)
      setShowRecovery(false)
      setSourceIndex(0)
      setRetryTick(0)
      lastSavedAtRef.current = 0
    }
  }, [player, playerId, playerMediaType])

  /* ── Build iframe URL ────────────────────────────────── */
  const startTime = useMemo(
    () => (player ? readSavedProgress(player.mediaType, player.id, season, episode) : 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [player?.id, player?.mediaType, season, episode],
  )

  const src = useMemo(() => {
    if (!player) return null
    const url = new URL(buildPlayerUrl(player.mediaType, player.id, season, episode, startTime, activeBaseUrl))
    if (retryTick > 0) {
      url.searchParams.set('retry', String(retryTick))
    }
    return url.toString()
  }, [player, season, episode, startTime, activeBaseUrl, retryTick])

  /* ── Inactivity timer ────────────────────────────────── */
  const clearInactivityTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  const scheduleHide = useCallback(() => {
    clearInactivityTimer()
    hideTimerRef.current = setTimeout(() => {
      setControlsVisible(false)
      iframeRef.current?.focus()
    }, CONTROLS_TIMEOUT_MS)
  }, [clearInactivityTimer])

  /* ── Smart buffering + recovery timers ───────────────── */
  const clearSmartTimers = useCallback(() => {
    if (smartBufferTimerRef.current) {
      clearTimeout(smartBufferTimerRef.current)
      smartBufferTimerRef.current = null
    }
    if (recoveryTimerRef.current) {
      clearTimeout(recoveryTimerRef.current)
      recoveryTimerRef.current = null
    }
  }, [])

  const startSmartTimers = useCallback(() => {
    clearSmartTimers()
    smartBufferTimerRef.current = setTimeout(() => {
      if (!hasPlayEvent) {
        setShowSmartBuffer(true)
        logPlayerTelemetry('smart_buffer_waiting', {
          mediaType: player?.mediaType,
          id: player?.id,
          sourceIndex,
        })
      }
    }, SMART_BUFFER_DELAY_MS)

    recoveryTimerRef.current = setTimeout(() => {
      if (!hasPlayEvent) {
        setShowRecovery(true)
        logPlayerTelemetry('recovery_shown', {
          mediaType: player?.mediaType,
          id: player?.id,
          sourceIndex,
        })
      }
    }, RECOVERY_TIMEOUT_MS)
  }, [clearSmartTimers, hasPlayEvent, player?.id, player?.mediaType, sourceIndex])

  /* ── Key handlers + side effects ─────────────────────── */
  useEffect(() => {
    function onKey(event) {
      const handledKeys = new Set([13, 19, 20, 21, 22, 23, 66, 4, 27])
      if (!handledKeys.has(event.keyCode)) return
      setControlsVisible(true)
      setFocus(BACK_KEY)
      scheduleHide()
    }

    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [scheduleHide])

  useEffect(() => {
    if (player) scheduleHide()
    return () => {
      clearInactivityTimer()
      clearSmartTimers()
    }
  }, [player, scheduleHide, clearInactivityTimer, clearSmartTimers])

  /* ── postMessage: progress + next-episode sync ───────── */
  useEffect(() => {
    if (!player) return

    function onMsg(event) {
      if (ALLOWED_ORIGIN && event.origin !== ALLOWED_ORIGIN) return

      const parsed = parsePlayerMessage(event.data)
      if (!parsed) return

      const eventType = parsed.eventType
      if (eventType === 'play') {
        setHasPlayEvent(true)
        setShowSmartBuffer(false)
        setShowRecovery(false)
        clearSmartTimers()
      }

      const t = parsed.currentTime
      const s = Number(parsed.season ?? season)
      const ep = Number(parsed.episode ?? episode)

      if (s !== season || ep !== episode) {
        setSeason(s)
        setEpisode(ep)
        updateEpisode(s, ep)
      }

      if (!shouldPersistProgress(eventType, t, lastSavedAtRef.current)) {
        return
      }

      saveProgress(player.mediaType, player.id, t, s, ep, {
        title: player.title ?? '',
        posterPath: player.posterPath ?? '',
        backdropPath: player.backdropPath ?? '',
      })
      lastSavedAtRef.current = Date.now()
    }

    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [player, season, episode, updateEpisode, clearSmartTimers])

  /* ── Retry / source switch handlers ──────────────────── */
  const handleRetry = useCallback(() => {
    setLoading(true)
    setHasPlayEvent(false)
    setShowSmartBuffer(false)
    setShowRecovery(false)
    setRetryTick((v) => v + 1)
    logPlayerTelemetry('manual_retry', {
      mediaType: player?.mediaType,
      id: player?.id,
      sourceIndex,
    })
  }, [player?.id, player?.mediaType, sourceIndex])

  const handleSource2 = useCallback(() => {
    if (sourceCount < 2) {
      handleRetry()
      return
    }

    setLoading(true)
    setHasPlayEvent(false)
    setShowSmartBuffer(false)
    setShowRecovery(false)
    setSourceIndex(1)
    setRetryTick((v) => v + 1)
    logPlayerTelemetry('source_switch', {
      mediaType: player?.mediaType,
      id: player?.id,
      sourceIndex: 1,
    })
  }, [handleRetry, player?.id, player?.mediaType, sourceCount])

  if (!player) return null

  const isTV = player.mediaType === 'tv'

  return (
    <div className="pv-shell">
      {loading && (
        <div className="pv-spinner" aria-label="Loading">
          <div className="pv-spinner-ring" />
        </div>
      )}

      {showSmartBuffer && !loading && !showRecovery ? (
        <div className="pv-spinner pv-spinner--smart" aria-label="Buffering">
          <div className="pv-spinner-ring" />
        </div>
      ) : null}

      <iframe
        ref={iframeRef}
        key={src}
        src={src}
        className="pv-frame"
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
        referrerPolicy="no-referrer"
        allowFullScreen
        onLoad={() => {
          setLoading(false)
          setHasPlayEvent(false)
          setShowSmartBuffer(false)
          setShowRecovery(false)
          startSmartTimers()
        }}
        onError={() => {
          setLoading(false)
          setShowSmartBuffer(false)
          setShowRecovery(true)
          clearSmartTimers()
          logPlayerTelemetry('iframe_error', {
            mediaType: player?.mediaType,
            id: player?.id,
            sourceIndex,
          })
        }}
        title="Ciney player"
      />

      <FocusContext.Provider value={ctrlKey}>
        <div
          ref={ctrlRef}
          className="pv-controls"
          style={{ opacity: controlsVisible ? 1 : 0, pointerEvents: controlsVisible ? 'auto' : 'none' }}
        >
          <div className="pv-bar pv-bar--top">
            <PVBtn focusKey={BACK_KEY} onEnterPress={closePlayer}>← Back</PVBtn>
            <span className="pv-title">
              {player.title ?? ''}
              {isTV ? ` — S${season} · E${episode}` : ''}
            </span>
          </div>
        </div>
      </FocusContext.Provider>

      {showRecovery ? (
        <div className="pv-recovery tv-safe-zone" role="alert" aria-live="polite">
          <p className="pv-recovery-title">Playback source is taking too long.</p>
          <p className="pv-recovery-subtitle">Try another source or retry.</p>
          <div className="pv-recovery-actions">
            <PVBtn onEnterPress={handleRetry}>Retry</PVBtn>
            <PVBtn onEnterPress={handleSource2}>Source 2</PVBtn>
          </div>
        </div>
      ) : null}
    </div>
  )
}
