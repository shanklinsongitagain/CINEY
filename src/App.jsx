import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Search from './pages/Search'
import MovieDetails from './pages/MovieDetails'
import Watch from './pages/Watch'
import { initializeSpatialNavigation } from './lib/spatialNavigation'
import { getLatestReleaseVersion, isNewerVersion } from './lib/updates'
import './App.css'

initializeSpatialNavigation()

const appVersion = import.meta.env.VITE_APP_VERSION || '0.0.0-local'

function App() {
  const { ref: shellRef, focusKey: shellFocusKey } = useFocusable({
    trackChildren: true,
    focusable: false,
  })
  const location          = useLocation()
  const navigate          = useNavigate()
  const [showExitToast,   setShowExitToast]  = useState(false)
  const [updateToast,     setUpdateToast]    = useState(null)
  const [navSolid,        setNavSolid]       = useState(false)
  const lastBackPressRef  = useRef(0)
  const exitToastTimerRef = useRef(null)

  /* ── Make navbar solid once user scrolls down ────────── */
  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    let active = true

    async function checkForUpdates() {
      const latestRelease = await getLatestReleaseVersion()
      if (!active || !latestRelease) {
        return
      }

      if (isNewerVersion(appVersion, latestRelease.version)) {
        setUpdateToast({
          message: 'New Update Available! Use Downloader to update.',
          url: latestRelease.url,
        })
      }
    }

    checkForUpdates()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    function clearExitToast() {
      if (exitToastTimerRef.current) {
        window.clearTimeout(exitToastTimerRef.current)
        exitToastTimerRef.current = null
      }
      setShowExitToast(false)
    }

    function showExitPrompt() {
      setShowExitToast(true)
      if (exitToastTimerRef.current) {
        window.clearTimeout(exitToastTimerRef.current)
      }
      exitToastTimerRef.current = window.setTimeout(() => {
        setShowExitToast(false)
        exitToastTimerRef.current = null
      }, 2000)
    }

    async function handleBackAction() {
      const pathname = location.pathname
      const isWatchPage = pathname.startsWith('/watch/')
      const isHomePage = pathname === '/'

      if (isWatchPage) {
        clearExitToast()
        navigate('/', { replace: true })
        return true
      }

      if (isHomePage) {
        const now = Date.now()
        if (now - lastBackPressRef.current < 2000) {
          clearExitToast()
          if (Capacitor.isNativePlatform()) {
            await CapacitorApp.exitApp()
          }
          return true
        }

        lastBackPressRef.current = now
        showExitPrompt()
        return true
      }

      clearExitToast()
      navigate('/', { replace: true })
      return true
    }

    const nativeBackListenerPromise = CapacitorApp.addListener('backButton', async () => {
      await handleBackAction()
    })

    /* ── Global keycodes for Firestick remote ──────────────
       38 = Up     40 = Down   37 = Left   39 = Right
       13 = Select 27 = Back/Escape
    ─────────────────────────────────────────────────────── */
    const handleKeyDown = async (event) => {
      /* Back / Escape */
      if (event.keyCode === 27 || event.keyCode === 4) {
        event.preventDefault()
        await handleBackAction()
      }
      /* Prevent default scroll on arrow keys so spatial nav handles them */
      if ([37, 38, 39, 40].includes(event.keyCode)) {
        event.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearExitToast()
      nativeBackListenerPromise.then((listener) => listener.remove())
    }
  }, [location.pathname, navigate])

  return (
    <FocusContext.Provider value={shellFocusKey}>
      <div ref={shellRef} className="app-shell">
        <Navbar solid={navSolid} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/movie/:id" element={<MovieDetails mediaType="movie" />} />
          <Route path="/tv/:id" element={<MovieDetails mediaType="tv" />} />
          <Route path="/watch/movie/:id" element={<Watch mediaType="movie" />} />
          <Route path="/watch/tv/:id" element={<Watch mediaType="tv" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {showExitToast ? <div className="exit-toast">Press back again to exit</div> : null}
        {updateToast ? (
          <div className="update-toast">
            <span>{updateToast.message}</span>
            {updateToast.url ? (
              <a href={updateToast.url} target="_blank" rel="noreferrer">
                Release
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </FocusContext.Provider>
  )
}

export default App
