const progressPrefix = 'ciney_progress_'
const continueWatchingKey = 'ciney_continue_watching'
const continueWatchingChangedEvent = 'ciney:continue-watching-changed'

export function getProgressKey(mediaType, id, season, episode) {
  if (mediaType === 'tv') {
    return `${progressPrefix}${mediaType}_${id}_s${season}_e${episode}`
  }

  return `${progressPrefix}${mediaType}_${id}`
}

function readContinueWatchingStore() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const rawValue = window.localStorage.getItem(continueWatchingKey)
    const parsed = JSON.parse(rawValue ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function notifyContinueWatchingChanged() {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new CustomEvent(continueWatchingChangedEvent))
}

function writeContinueWatchingStore(items) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(continueWatchingKey, JSON.stringify(items))
  notifyContinueWatchingChanged()
}

export function readSavedProgress(mediaType, id, season = 1, episode = 1) {
  if (!id || typeof window === 'undefined') {
    return 0
  }

  const value = window.localStorage.getItem(getProgressKey(mediaType, id, season, episode))
  const parsed = Number.parseFloat(value ?? '0')
  return Number.isFinite(parsed) ? parsed : 0
}

export function saveProgress(mediaType, id, seconds, season = 1, episode = 1, metadata = {}) {
  if (!id || typeof window === 'undefined' || !Number.isFinite(seconds)) {
    return
  }

  const safeSeconds = Math.max(0, seconds)
  const progressKey = getProgressKey(mediaType, id, season, episode)

  window.localStorage.setItem(progressKey, String(safeSeconds))

  const items = readContinueWatchingStore()
  const itemKey = mediaType === 'tv' ? `${mediaType}_${id}_${season}_${episode}` : `${mediaType}_${id}`
  const nextItem = {
    key: itemKey,
    id,
    mediaType,
    season,
    episode,
    progress: safeSeconds,
    updatedAt: Date.now(),
    ...metadata,
  }

  const filteredItems = items.filter((item) => item.key !== itemKey)
  writeContinueWatchingStore([nextItem, ...filteredItems].slice(0, 24))
}

export function removeContinueWatchingItem(item) {
  if (!item || typeof window === 'undefined') {
    return
  }

  const items = readContinueWatchingStore().filter((entry) => entry.key !== item.key)
  writeContinueWatchingStore(items)

  if (item.mediaType === 'tv') {
    window.localStorage.removeItem(getProgressKey(item.mediaType, item.id, item.season ?? 1, item.episode ?? 1))
    return
  }

  window.localStorage.removeItem(getProgressKey(item.mediaType, item.id, 1, 1))
}

export function getContinueWatchingItems() {
  return readContinueWatchingStore().sort((left, right) => (right.updatedAt ?? 0) - (left.updatedAt ?? 0))
}

export function getContinueWatchingChangedEventName() {
  return continueWatchingChangedEvent
}
