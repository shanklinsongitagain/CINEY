import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { memo, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import PlayerFrame from '../components/PlayerFrame'
import { NAVBAR_FOCUS_KEY } from '../components/Navbar'
import { setFocus } from '@noriginmedia/norigin-spatial-navigation'
import {
  getBackdropUrl, getMediaTitle,
  getMovieDetails, getTvDetails, getTvSeasonDetails,
} from '../lib/tmdb'

/* ── Small focusable button ─────────────────────────────── */
function TVBtn({ children, onEnterPress, disabled = false, autoFocus = false, className = '' }) {
  const { ref, focused, focusSelf } = useFocusable({
    onEnterPress: disabled ? undefined : onEnterPress,
  })
  useEffect(() => { if (autoFocus) focusSelf() }, [autoFocus, focusSelf])
  return (
    <button
      ref={ref}
      type="button"
      tabIndex={0}
      disabled={disabled}
      className={`tv-btn${focused ? ' spatial-focused' : ''} ${className}`}
      onClick={disabled ? undefined : onEnterPress}
    >
      {children}
    </button>
  )
}

/* ── Arrow picker row: ‹ Label › ────────────────────────── */
function TVArrowPicker({ label, value, onPrev, onNext, canPrev, canNext }) {
  return (
    <div className="tv-arrow-picker">
      <TVBtn onEnterPress={onPrev} disabled={!canPrev}>‹</TVBtn>
      <span className="tv-arrow-label">{label}: {value}</span>
      <TVBtn onEnterPress={onNext} disabled={!canNext}>›</TVBtn>
    </div>
  )
}

/* ── Watch page ─────────────────────────────────────────── */
function Watch({ mediaType }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [media, setMedia] = useState(null)
  const [seasonDetails, setSeasonDetails] = useState(null)
  const [error, setError] = useState('')

  const { ref: pageRef, focusKey: pageFocusKey } = useFocusable({
    trackChildren: true, focusable: false,
  })

  const selectedSeason = Number(searchParams.get('season') ?? 1)
  const selectedEpisode = Number(searchParams.get('episode') ?? 1)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const d = mediaType === 'tv' ? await getTvDetails(id) : await getMovieDetails(id)
        if (active) { setMedia(d); setError('') }
      } catch (e) { if (active) setError(e.message) }
    }
    load()
    return () => { active = false }
  }, [id, mediaType])

  useEffect(() => {
    if (mediaType !== 'tv') return
    let active = true
    async function loadSeason() {
      try {
        const d = await getTvSeasonDetails(id, selectedSeason)
        if (active) { setSeasonDetails(d); setError('') }
      } catch (e) { if (active) setError(e.message) }
    }
    loadSeason()
    return () => { active = false }
  }, [id, mediaType, selectedSeason])

  const sortedEpisodes = useMemo(
    () => [...(seasonDetails?.episodes ?? [])].sort((a, b) => a.episode_number - b.episode_number),
    [seasonDetails],
  )

  const currentEpisode = useMemo(
    () => sortedEpisodes.find((e) => e.episode_number === selectedEpisode),
    [sortedEpisodes, selectedEpisode],
  )

  const validSeasons = useMemo(
    () => (media?.seasons ?? []).filter((s) => s.season_number > 0),
    [media],
  )

  const prevEpNum = useMemo(
    () => [...sortedEpisodes].reverse().find((e) => e.episode_number < selectedEpisode)?.episode_number,
    [sortedEpisodes, selectedEpisode],
  )
  const nextEpNum = useMemo(
    () => sortedEpisodes.find((e) => e.episode_number > selectedEpisode)?.episode_number,
    [sortedEpisodes, selectedEpisode],
  )

  function setEpisode(ep) {
    const p = new URLSearchParams(searchParams)
    p.set('episode', String(ep))
    setSearchParams(p)
  }
  function setSeason(s) {
    const p = new URLSearchParams(searchParams)
    p.set('season', String(s))
    p.set('episode', '1')
    setSearchParams(p)
  }

  const heroStyle = media?.backdrop_path
    ? { backgroundImage: `linear-gradient(180deg,rgba(5,7,13,.1),rgba(5,7,13,.92)),url(${getBackdropUrl(media.backdrop_path)})` }
    : undefined

  return (
    <FocusContext.Provider value={pageFocusKey}>
      <main ref={pageRef} className="page container page--watch">

        {/* Header with back/details buttons */}
        <section className="watch-page-header" style={heroStyle}>
          <div className="watch-page-header-content">
            <p className="eyebrow">Now watching</p>
            <h1 className="watch-title">{media ? getMediaTitle(media) : 'Loading…'}</h1>
            {mediaType === 'tv' && currentEpisode && (
              <p className="watch-subtitle">
                S{selectedSeason} · E{selectedEpisode} · {currentEpisode.name}
              </p>
            )}
          </div>
          <div className="watch-header-actions">
            <TVBtn autoFocus onEnterPress={() => navigate(`/${mediaType}/${id}`)}>ⓘ Details</TVBtn>
            <TVBtn
              onEnterPress={() => setFocus(NAVBAR_FOCUS_KEY)}
            >
              ☰ Menu
            </TVBtn>
          </div>
        </section>

        {/* Player */}
        <section className="watch-layout">
          <PlayerFrame
            mediaType={mediaType}
            id={id}
            season={selectedSeason}
            episode={selectedEpisode}
            media={media}
            episodeDetails={currentEpisode}
          />
        </section>

        {/* Overview + episode picker */}
        <section className="watch-details-panel">
          {error && <p className="status-message status-message--error">{error}</p>}
          {!error && <p>{currentEpisode?.overview || media?.overview || ''}</p>}

          {mediaType === 'tv' && media && (
            <div className="tv-pickers">
              <TVArrowPicker
                label="Season"
                value={selectedSeason}
                canPrev={validSeasons.some((s) => s.season_number < selectedSeason)}
                canNext={validSeasons.some((s) => s.season_number > selectedSeason)}
                onPrev={() => setSeason(selectedSeason - 1)}
                onNext={() => setSeason(selectedSeason + 1)}
              />
              <TVArrowPicker
                label="Episode"
                value={currentEpisode ? `${selectedEpisode}: ${currentEpisode.name}` : selectedEpisode}
                canPrev={prevEpNum !== undefined}
                canNext={nextEpNum !== undefined}
                onPrev={() => setEpisode(prevEpNum)}
                onNext={() => setEpisode(nextEpNum)}
              />
            </div>
          )}
        </section>

      </main>
    </FocusContext.Provider>
  )
}

export default Watch
