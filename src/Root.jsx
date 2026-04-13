import { useEffect } from 'react'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import App from './App.jsx'
import { initializeSpatialNavigation } from './lib/spatialNavigation'

function Root() {
  useEffect(() => {
    initializeSpatialNavigation()

    if (Capacitor.isNativePlatform()) {
      if (!window.location.hash || window.location.hash === '#') {
        window.location.replace(`${window.location.pathname}#/`)
      }
    }
  }, [])

  const Router = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter

  return (
    <Router>
      <App />
    </Router>
  )
}

export default Root
