const telemetryKey = 'ciney_player_telemetry'
const maxEvents = 60

function readEvents() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(telemetryKey)
    const parsed = JSON.parse(raw ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function logPlayerTelemetry(type, payload = {}) {
  if (typeof window === 'undefined') return

  const event = {
    type,
    timestamp: Date.now(),
    ...payload,
  }

  const events = readEvents()
  const next = [event, ...events].slice(0, maxEvents)
  window.localStorage.setItem(telemetryKey, JSON.stringify(next))
}

export function getPlayerTelemetryEvents() {
  return readEvents()
}
