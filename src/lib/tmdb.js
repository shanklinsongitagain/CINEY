import axios from 'axios'

const API_BASE = 'https://api.themoviedb.org/3'
const IMG_BASE = 'https://image.tmdb.org/t/p'
const apiKey   = import.meta.env.VITE_TMDB_API_KEY

const api = axios.create({
  baseURL: API_BASE,
  params:  { api_key: apiKey },
})

async function get(path, params = {}) {
  if (!apiKey) throw new Error('Missing VITE_TMDB_API_KEY in .env')
  const { data } = await api.get(path, { params })
  return data
}

export function getImageUrl(path, size = 'w500') {
  return path ? `${IMG_BASE}/${size}${path}` : ''
}

export function getBackdropUrl(path, size = 'original') {
  return getImageUrl(path, size)
}

export function getMediaType(item) {
  if (item?.media_type === 'tv' || item?.first_air_date || item?.name) return 'tv'
  return 'movie'
}

export function getMediaTitle(item) {
  return item?.title || item?.name || 'Untitled'
}

export function getMediaReleaseDate(item) {
  return item?.release_date || item?.first_air_date || ''
}

/* ── Content fetchers ────────────────────────────────── */
export async function getTrendingMovies() {
  const d = await get('/trending/movie/week')
  return d.results ?? []
}

export async function getTrendingShows() {
  const d = await get('/trending/tv/week')
  return d.results ?? []
}

export async function getTopRatedMovies() {
  const d = await get('/movie/top_rated')
  return d.results ?? []
}

export async function getTopRatedShows() {
  const d = await get('/tv/top_rated')
  return d.results ?? []
}

export async function getPopularMovies() {
  const d = await get('/movie/popular')
  return d.results ?? []
}

export async function getActionMovies() {
  const d = await get('/discover/movie', { with_genres: '28', sort_by: 'popularity.desc' })
  return d.results ?? []
}

export async function searchTitles(query) {
  const d = await get('/search/multi', { query, include_adult: 'false' })
  return (d.results ?? []).filter((i) => i.media_type === 'movie' || i.media_type === 'tv')
}

export async function getMovieDetails(id) {
  return get(`/movie/${id}`, { append_to_response: 'videos' })
}

export async function getTvDetails(id) {
  return get(`/tv/${id}`, { append_to_response: 'videos' })
}

export async function getTvSeasonDetails(id, seasonNumber) {
  return get(`/tv/${id}/season/${seasonNumber}`)
}
