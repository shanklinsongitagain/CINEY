const defaultPlayerBaseUrl = import.meta.env.VITE_PLAYER_BASE_URL || 'https://www.vidking.net/embed'

export function getPlayerSourceBases() {
  const configured = import.meta.env.VITE_PLAYER_SOURCE_BASES
  const list = (configured ? configured.split(',') : [defaultPlayerBaseUrl])
    .map((entry) => entry.trim())
    .filter(Boolean)

  return list.length > 0 ? list : [defaultPlayerBaseUrl]
}

export function getPlayerSourceBase(sourceIndex = 0) {
  const sources = getPlayerSourceBases()
  const safeIndex = Number.isFinite(Number(sourceIndex)) ? Number(sourceIndex) : 0
  return sources[Math.max(0, Math.min(safeIndex, sources.length - 1))]
}

export function getPlayerSourceCount() {
  return getPlayerSourceBases().length
}
