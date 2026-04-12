export function parsePlayerMessage(rawData) {
  try {
    const payload = typeof rawData === 'string' ? JSON.parse(rawData) : rawData
    if (!payload || payload.type !== 'PLAYER_EVENT' || typeof payload.data !== 'object') {
      return null
    }

    const data = payload.data
    const eventType = data.event ?? data.eventType ?? 'unknown'
    const currentTime = Number(data.currentTime ?? 0)
    const duration = Number(data.duration ?? 0)

    return {
      id: data.id ?? data.mediaId ?? null,
      mediaType: data.mediaType,
      season: Number(data.season ?? 1),
      episode: Number(data.episode ?? 1),
      currentTime: Number.isFinite(currentTime) ? currentTime : 0,
      duration: Number.isFinite(duration) ? duration : 0,
      eventType,
      payload,
    }
  } catch {
    return null
  }
}

export function shouldPersistProgress(eventType, currentTime, lastSavedAt, throttleMs = 7000) {
  if (!Number.isFinite(currentTime) || currentTime < 0) {
    return false
  }

  if (eventType === 'pause' || eventType === 'ended') {
    return true
  }

  if (eventType !== 'timeupdate') {
    return false
  }

  return Date.now() - lastSavedAt >= throttleMs
}
