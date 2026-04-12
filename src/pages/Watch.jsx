import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import PlayerFrame from '../components/PlayerFrame'
import {
  getBackdropUrl,
  getMediaTitle,
  getMovieDetails,
  getTvDetails,
  getTvSeasonDetails,
} from '../lib/tmdb'

function Watch({ mediaType }) {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [media, setMedia] = useState(null)
  const [seasonDetails, setSeasonDetails] = useState(null)
  const [error, setError] = useState('')

  const selectedSeason = Number(searchParams.get('season') ?? 1)
  const selectedEpisode = Number(searchParams.get('episode') ?? 1)

  useEffect(() => {
    let active = true

    async function loadMedia() {
      try {
        const details = mediaType === 'tv' ? await getTvDetails(id) : await getMovieDetails(id)
        if (active) {
          setMedia(details)
          setError('')
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message)
        }
      }
    }

    loadMedia()
    return () => {
      active = false
    }
  }, [id, mediaType])

  useEffect(() => {
    if (mediaType !== 'tv') {
      return
    }

    let active = true

    async function loadSeason() {
      try {
        const details = await getTvSeasonDetails(id, selectedSeason)
        if (active) {
          setSeasonDetails(details)
          setError('')
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message)
        }
      }
    }

    loadSeason()
    return () => {
      active = false
    }
  }, [id, mediaType, selectedSeason])

  useEffect(() => {
    if (mediaType !== 'tv' || !seasonDetails?.episodes?.length) {
      return
    }

    const episodeExists = seasonDetails.episodes.some((entry) => entry.episode_number === selectedEpisode)
    if (!episodeExists) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('episode', String(seasonDetails.episodes[0].episode_number))
      setSearchParams(nextParams, { replace: true })
    }
  }, [mediaType, searchParams, seasonDetails, selectedEpisode, setSearchParams])

  const currentEpisode = useMemo(
    () => seasonDetails?.episodes?.find((entry) => entry.episode_number === selectedEpisode),
    [seasonDetails, selectedEpisode],
  )

  const handleSeasonChange = (event) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('season', event.target.value)
    nextParams.set('episode', '1')
    setSearchParams(nextParams)
  }

  const handleEpisodeChange = (event) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('episode', event.target.value)
    setSearchParams(nextParams)
  }

  const detailsUrl = `/${mediaType}/${id}`
  const heroStyle = media?.backdrop_path
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(5, 7, 13, 0.10), rgba(5, 7, 13, 0.95)), url(${getBackdropUrl(media.backdrop_path)})`,
      }
    : undefined

  return (
    <main className="page container page--watch">
      <section className="watch-page-header watch-page-header--hero" style={heroStyle}>
        <div className="watch-page-header-content">
          <p className="eyebrow">Now watching</p>
          <h1 className="watch-title">{media ? getMediaTitle(media) : 'Loading…'}</h1>
          {mediaType === 'tv' && currentEpisode ? (
            <p className="watch-subtitle">
              Season {selectedSeason} • Episode {selectedEpisode} • {currentEpisode.name}
            </p>
          ) : null}
        </div>
        <div className="watch-header-actions">
          <Link to={detailsUrl} className="secondary-button">
            Details
          </Link>
          <Link to="/" className="secondary-button">
            Home
          </Link>
        </div>
      </section>

      <section className="watch-layout watch-layout--single">
        <div>
          <PlayerFrame
            mediaType={mediaType}
            id={id}
            season={selectedSeason}
            episode={selectedEpisode}
            media={media}
            episodeDetails={currentEpisode}
          />
        </div>
      </section>

      <section className="watch-details-panel">
        {error ? <p className="status-message status-message--error">{error}</p> : null}
        {!error ? <p>{currentEpisode?.overview || media?.overview || 'Loading overview…'}</p> : null}

        {mediaType === 'tv' && media ? (
          <div className="episode-picker-grid">
            <label className="picker-card">
              <span>Season</span>
              <select value={selectedSeason} onChange={handleSeasonChange}>
                {(media.seasons ?? [])
                  .filter((season) => season.season_number > 0)
                  .map((season) => (
                    <option key={season.id} value={season.season_number}>
                      Season {season.season_number}
                    </option>
                  ))}
              </select>
            </label>

            <label className="picker-card picker-card--wide">
              <span>Episode</span>
              <select value={selectedEpisode} onChange={handleEpisodeChange}>
                {(seasonDetails?.episodes ?? []).map((entry) => (
                  <option key={entry.id} value={entry.episode_number}>
                    Episode {entry.episode_number}: {entry.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}
      </section>
    </main>
  )
}

export default Watch
