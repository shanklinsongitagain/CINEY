const API_BASE_URL = 'https://api.themoviedb.org/3'
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'

const apiKey = import.meta.env.VITE_TMDB_API_KEY

function buildUrl(path, params = {}) {
  const url = new URL(`${API_BASE_URL}${path}`)
  url.searchParams.set('api_key', apiKey ?? '')

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  })

  return url.toString()
}

async function request(path, params) {
  if (!apiKey) {
    throw new Error('Missing VITE_TMDB_API_KEY. Add it to your .env file and restart the dev server.')
  }

  const response = await fetch(buildUrl(path, params))

  if (!response.ok) {
    throw new Error(`TMDB request failed with status ${response.status}`)
  }

  return response.json()
}

export function getImageUrl(path, size = 'w500') {
  if (!path) {
    return ''
  }

  return `${IMAGE_BASE_URL}/${size}${path}`
}

export function getBackdropUrl(path, size = 'original') {
  return getImageUrl(path, size)
}

export function getMediaType(item) {
  if (item?.media_type === 'tv' || item?.first_air_date || item?.name) {
    return 'tv'
  }

  return 'movie'
}

export function getMediaTitle(item) {
  return item?.title || item?.name || 'Untitled'
}

export function getMediaReleaseDate(item) {
  return item?.release_date || item?.first_air_date || ''
}

export async function getTrendingMovies() {
  const data = await request('/trending/movie/week')
  return data.results ?? []
}

export async function getTrendingShows() {
  const data = await request('/trending/tv/week')
  return data.results ?? []
}

export async function searchTitles(query) {
  const data = await request('/search/multi', { query, include_adult: 'false' })
  return (data.results ?? []).filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
}

export async function getMovieDetails(id) {
  return request(`/movie/${id}`, { append_to_response: 'videos' })
}

export async function getTvDetails(id) {
  return request(`/tv/${id}`, { append_to_response: 'videos' })
}

export async function getTvSeasonDetails(id, seasonNumber) {
  return request(`/tv/${id}/season/${seasonNumber}`)
}
