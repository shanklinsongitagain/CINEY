import { FocusContext, setFocus, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildPlayerUrl } from '../lib/player'
import { readSavedProgress, saveProgress } from '../lib/progress'
import { usePlayer } from '../context/PlayerContext'

const ALLOWED_ORIGIN = import.meta.env.VITE_PLAYER_ALLOWED_ORIGIN || 'https://www.vidking.net'
const CONTROLS_TIMEOUT_MS = 5000
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

/* ── ‹ Label › arrow row ──────────────────────────────── */
function PVPicker({ label, value, canPrev, canNext, onPrev, onNext }) {
  return (
    <div className="pv-picker">
      <PVBtn onEnterPress={onPrev} disabled={!canPrev}>‹</PVBtn>
      <span className="pv-picker-label">{label}: {value}</span>
      <PVBtn onEnterPress={onNext} disabled={!canNext}>›</PVBtn>
    </div>
  )
}

/* ── Main PlayerView ──────────────────────────────────── */
export default function PlayerView() {
  const { player, closePlayer, updateEpisode } = usePlayer()
  const [loading, setLoading] = useState(true)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [season,  setSeason]  = useState(1)
  const [episode, setEpisode] = useState(1)

  const iframeRef    = useRef(null)
  const hideTimerRef = useRef(null)

  const { ref: ctrlRef, focusKey: ctrlKey } = useFocusable({
    trackChildren: true,
    isFocusBoundary: true,
    focusable: false,
  })

  /* ── Sync local state when player opens ─────────────── */
  useEffect(() => {
    if (player) {
      setSeason(player.season   ?? 1)
      setEpisode(player.episode ?? 1)
      setLoading(true)
      setControlsVisible(true)
    }
  }, [player?.id, player?.mediaType])

  /* ── Build iframe URL ────────────────────────────────── */
  const startTime = useMemo(
    () => (player ? readSavedProgress(player.mediaType, player.id, season, episode) : 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [player?.id, player?.mediaType, season, episode],
  )

  const src = useMemo(
    () => (player ? buildPlayerUrl(player.mediaType, player.id, season, episode, startTime) : null),
    [player, season, episode, startTime],
  )

  /* ── Auto-hide controls ──────────────────────────────── */
  const scheduleHide = useCallback(() => {
    clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => {
      setControlsVisible(false)
      iframeRef.current?.focus()
    }, CONTROLS_TIMEOUT_MS)
  }, [])

  /* Show controls + reset timer on any key press */
  useEffect(() => {
    function onKey() {
      setControlsVisible(true)
      setFocus(BACK_KEY)
      scheduleHide()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [scheduleHide])

  useEffect(() => {
    if (player) scheduleHide()
    return () => clearTimeout(hideTimerRef.current)
  }, [player, scheduleHide])

  /* ── postMessage: progress + next-episode sync ───────── */
  useEffect(() => {
    if (!player) return

    function onMsg(event) {
      if (ALLOWED_ORIGIN && event.origin !== ALLOWED_ORIGIN) return
      if (typeof event.data !== 'string') return
      try {
        const { type, data } = JSON.parse(event.data)
        if (type !== 'PLAYER_EVENT') return

        const t  = Number(data.currentTime ?? 0)
        const s  = Number(data.season   ?? season)
        const ep = Number(data.episode  ?? episode)

        /* Detect when the player's own next-episode button was used */
        if (s !== season || ep !== episode) {
          setSeason(s)
          setEpisode(ep)
          updateEpisode(s, ep)
        }

        if (data.event === 'timeupdate' && Number.isFinite(t) && t > 2) {
          saveProgress(player.mediaType, player.id, t, s, ep, {
            title:        player.title        ?? '',
            posterPath:   player.posterPath   ?? '',
            backdropPath: player.backdropPath ?? '',
          })
        }
      } catch { /* ignore malformed */ }
    }

    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [player, season, episode, updateEpisode])

  /* ── Season helpers ──────────────────────────────────── */
  const validSeasons = useMemo(
    () => (player?.seasons ?? []).filter((s) => s.season_number > 0),
    [player?.seasons],
  )
  const hasSeasonData = validSeasons.length > 0

  if (!player) return null

  const isTV = player.mediaType === 'tv'

  return (
    <div className="pv-shell">
      {/* Loading spinner */}
      {loading && (
        <div className="pv-spinner" aria-label="Loading">
          <div className="pv-spinner-ring" />
        </div>
      )}

      {/* Player iframe — fills entire viewport */}
      <iframe
        ref={iframeRef}
        key={src}
        src={src}
        className="pv-frame"
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        allowFullScreen
        onLoad={() => setLoading(false)}
        title="Ciney player"
      />

      {/* Controls overlay — always mounted, opacity controlled */}
      <FocusContext.Provider value={ctrlKey}>
        <div
          ref={ctrlRef}
          className="pv-controls"
          style={{ opacity: controlsVisible ? 1 : 0, pointerEvents: controlsVisible ? 'auto' : 'none' }}
        >
          {/* Top bar */}
          <div className="pv-bar pv-bar--top">
            <PVBtn focusKey={BACK_KEY} onEnterPress={closePlayer}>← Back</PVBtn>
            <span className="pv-title">
              {player.title ?? ''}
              {isTV ? ` — S${season} · E${episode}` : ''}
            </span>
          </div>

          {/* Bottom bar — TV episode navigation */}
          {isTV && (
            <div className="pv-bar pv-bar--bottom">
              <PVPicker
                label="Season"
                value={season}
                canPrev={hasSeasonData
                  ? validSeasons.some((s) => s.season_number < season)
                  : season > 1}
                canNext={hasSeasonData
                  ? validSeasons.some((s) => s.season_number > season)
                  : true}
                onPrev={() => { setSeason((s) => s - 1); setEpisode(1) }}
                onNext={() => { setSeason((s) => s + 1); setEpisode(1) }}
              />
              <PVPicker
                label="Episode"
                value={episode}
                canPrev={episode > 1}
                canNext
                onPrev={() => setEpisode((e) => e - 1)}
                onNext={() => setEpisode((e) => e + 1)}
              />
            </div>
          )}
        </div>
      </FocusContext.Provider>
    </div>
  )
}
