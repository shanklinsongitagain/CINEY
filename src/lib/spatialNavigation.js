import { init, setFocus } from '@noriginmedia/norigin-spatial-navigation'

let initialized = false

export function initializeSpatialNavigation() {
  if (initialized || typeof window === 'undefined') {
    return
  }

  init({
    debug: false,
    visualDebug: false,
    shouldFocusDOMNode: true,
    isLayoutShifting: false,
    straightOnly: false,
    straightOverlapThreshold: 0.5,
    rememberSource: false,
    enterTo: 'default',
    leaveFor: null,
    restrict: 'self-first',
    tabIndexIgnoreList: [],
    diagonalAllowance: 100,
    paragraphIndex: -1,
    wrap: false,
  })

  initialized = true
}

export { setFocus }
