import { init } from '@noriginmedia/norigin-spatial-navigation'

let initialized = false

export function initializeSpatialNavigation() {
  if (initialized || typeof window === 'undefined') {
    return
  }

  init({
    debug: false,
    visualDebug: false,
  })

  initialized = true
}
