const defaultPlayerBaseUrl = 'https://www.vidking.net/embed'

const playerBaseUrl = import.meta.env.VITE_PLAYER_BASE_URL || defaultPlayerBaseUrl

export function buildPlayerUrl(mediaType, id, season = 1, episode = 1, progress = 0) {
  const trimmedBaseUrl = playerBaseUrl.replace(/\/$/, '')
  const safeSeason = Number.isFinite(Number(season)) ? Number(season) : 1
  const safeEpisode = Number.isFinite(Number(episode)) ? Number(episode) : 1
  const route = mediaType === 'tv' ? `tv/${id}/${safeSeason}/${safeEpisode}` : `movie/${id}`
  const url = new URL(`${trimmedBaseUrl}/${route}`)

  url.searchParams.set('color', 'ff0000')
  url.searchParams.set('autoPlay', 'true')

  if (mediaType === 'tv') {
    url.searchParams.set('nextEpisode', 'true')
    url.searchParams.set('episodeSelector', 'true')
  }

  if (progress > 0) {
    url.searchParams.set('progress', String(Math.floor(progress)))
  }

  return url.toString()
}
