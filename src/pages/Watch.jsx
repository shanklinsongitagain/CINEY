import { FocusContext, setFocus, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { memo, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import PlayerFrame from '../components/VideoPlayer'
import { NAVBAR_FOCUS_KEY } from '../components/Navbar'
import { getBackdropUrl, getMediaTitle, getMovieDetails, getTvDetails, getTvSeasonDetails } from '../lib/tmdb'

function TVBtn({ children, onEnterPress, disabled = false, autoFocus = false, className = '' }) {
  const { ref, focused, focusSelf } = useFocusable({ onEnterPress: disabled ? undefined : onEnterPress })
  useEffect(() => { if (autoFocus) focusSelf() }, [autoFocus, focusSelf])
  return (
    <button
      ref={ref} type="button" tabIndex={0} disabled={disabled}
      className={`tv-btn${focused ? ' spatial-focused' : ''} ${className}`}
      onClick={disabled ? undefined : onEnterPress}
    >
      {children}
    </button>
  )
}

function TVArrowPicker({ label, value, onPrev, onNext, canPrev, canNext }) {
  return (
    <div className="tv-arrow-picker">
      <TVBtn onEnterPress={onPrev} disabled={!canPrev}>‹</TVBtn>
      <span className="tv-arrow-label">{label}: {value}</span>
      <TVBtn onEnterPress={onNext} disabled={!canNext}>›</TVBtn>
    </div>
  )
}

function Watch({ mediaType }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [media, setMedia] = useState(null)
  const [seasonDetails, setSeasonDetails] = useState(null)
  const [error, setError] = useState('')

  const { ref: pageRef, focusKey } = useFocusable({ trackChildren: true, focusable: false })

  // Hide navbar — makes it feel like a real video player app
  useEffect(() => {
    document.documentElement.classList.add('is-watch')
    return () => document.documentElement.classList.remove('is-watch')
  }, [])

  const selectedSeason  = Number(searchParams.get('season')  ?? 1)
  const selectedEpisode = Number(searchParams.get('episode') ?? 1)

  useEffect(() => {
    let active = true
    ;(mediaType === 'tv' ? getTvDetails(id) : getMovieDetails(id))
      .then((d) => { if (active) { setMedia(d); setError('') } })
      .catch((e) => { if (active) setError(e.message) })
    return () => { active = false }
  }, [id, mediaType])

  useEffect(() => {
    if (mediaType !== 'tv') return
    let active = true
    getTvSeasonDetails(id, selectedSeason)
      .then((d) => { if (active) { setSeasonDetails(d); setError('') } })
      .catch((e) => { if (active) setError(e.message) })
    return () => { active = false }
  }, [id, mediaType, selectedSeason])

  const sorted = useMemo(
    () => [...(seasonDetails?.episodes ?? [])].sort((a, b) => a.episode_number - b.episode_number),
    [seasonDetails],
  )

  const currentEpisode = useMemo(
    () => sorted.find((e) => e.episode_number === selectedEpisode),
    [sorted, selectedEpisode],
  )

  const validSeasons = useMemo(
    () => (media?.seasons ?? []).filter((s) => s.season_number > 0),
    [media],
  )

  const prevEp = useMemo(() => [...sorted].reverse().find((e) => e.episode_number < selectedEpisode)?.episode_number, [sorted, selectedEpisode])
  const nextEp = useMemo(() => sorted.find((e) => e.episode_number > selectedEpisode)?.episode_number, [sorted, selectedEpisode])

  function setSeason(s) {
    const p = new URLSearchParams(searchParams); p.set('season', String(s)); p.set('episode', '1')
    setSearchParams(p)
  }
  function setEpisode(e) {
    const p = new URLSearchParams(searchParams); p.set('episode', String(e))
    setSearchParams(p)
  }

  const title = media ? getMediaTitle(media) : 'Loading…'
  const subtitle = mediaType === 'tv' && currentEpisode
    ? `S${selectedSeason} · E${selectedEpisode} · ${currentEpisode.name}`
    : null

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={pageRef} className="watch-shell">

        {/* Top bar */}
        <div className="watch-topbar">
          <TVBtn autoFocus onEnterPress={() => navigate(-1)}>← Back</TVBtn>
          <span className="watch-topbar-title">{title}{subtitle ? ` — ${subtitle}` : ''}</span>
          <TVBtn onEnterPress={() => setFocus(NAVBAR_FOCUS_KEY)}>☰</TVBtn>
        </div>

        {/* Player — fills remaining height */}
        <div className="watch-player-wrap">
          <PlayerFrame
            mediaType={mediaType} id={id}
            season={selectedSeason} episode={selectedEpisode}
            media={media} episodeDetails={currentEpisode}
          />
        </div>

        {/* Controls bar */}
        <div className="watch-controls">
          {error && <p className="status-message status-message--error" style={{ marginBottom: '0.5rem' }}>{error}</p>}
          {!error && <p className="watch-meta">{currentEpisode?.overview || media?.overview || ''}</p>}

          {mediaType === 'tv' && media && (
            <div className="tv-pickers">
              <TVArrowPicker
                label="Season" value={selectedSeason}
                canPrev={validSeasons.some((s) => s.season_number < selectedSeason)}
                canNext={validSeasons.some((s) => s.season_number > selectedSeason)}
                onPrev={() => setSeason(selectedSeason - 1)}
                onNext={() => setSeason(selectedSeason + 1)}
              />
              <TVArrowPicker
                label="Episode"
                value={currentEpisode ? `${selectedEpisode}: ${currentEpisode.name}` : selectedEpisode}
                canPrev={prevEp !== undefined} canNext={nextEp !== undefined}
                onPrev={() => setEpisode(prevEp)} onNext={() => setEpisode(nextEp)}
              />
            </div>
          )}
        </div>

      </div>
    </FocusContext.Provider>
  )
}

export default Watch
