import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import PlayerView from './components/PlayerView'
import Home from './pages/Home'
import Search from './pages/Search'
import MovieDetails from './pages/MovieDetails'
import Watch from './pages/Watch'
import { PlayerProvider, usePlayer } from './context/PlayerContext'
import { initializeSpatialNavigation } from './lib/spatialNavigation'
import { getLatestReleaseVersion, isNewerVersion } from './lib/updates'
import './App.css'

initializeSpatialNavigation()

const appVersion = import.meta.env.VITE_APP_VERSION || '0.0.0-local'

/* ── Inner shell — must live inside PlayerProvider ─── */
function AppInner() {
  const { player, closePlayer } = usePlayer()
  const { ref: shellRef, focusKey: shellFocusKey } = useFocusable({
    trackChildren: true,
    focusable: false,
  })
  const location = useLocation()
  const navigate = useNavigate()
  const [showExitToast, setShowExitToast] = useState(false)
  const [updateToast, setUpdateToast] = useState(null)
  const [navSolid, setNavSolid] = useState(false)
  const lastBackPressRef = useRef(0)
  const exitToastTimerRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    let active = true
    async function checkForUpdates() {
      const latestRelease = await getLatestReleaseVersion()
      if (!active || !latestRelease) return
      if (isNewerVersion(appVersion, latestRelease.version)) {
        setUpdateToast({
          message: 'New Update Available! Use Downloader to update.',
          url: latestRelease.url,
        })
      }
    }
    checkForUpdates()
    return () => { active = false }
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
      if (exitToastTimerRef.current) window.clearTimeout(exitToastTimerRef.current)
      exitToastTimerRef.current = window.setTimeout(() => {
        setShowExitToast(false)
        exitToastTimerRef.current = null
      }, 2000)
    }

    async function handleBackAction() {
      if (player) { closePlayer(); return true }

      const pathname = location.pathname
      if (pathname.startsWith('/watch/')) { clearExitToast(); navigate(-1); return true }

      if (pathname === '/') {
        const now = Date.now()
        if (now - lastBackPressRef.current < 2000) {
          clearExitToast()
          if (Capacitor.isNativePlatform()) await CapacitorApp.exitApp()
          return true
        }
        lastBackPressRef.current = now
        showExitPrompt()
        return true
      }

      clearExitToast()
      navigate(-1)
      return true
    }

    const nativeBackListenerPromise = CapacitorApp.addListener('backButton', async () => {
      await handleBackAction()
    })

    const handleKeyDown = async (event) => {
      if (event.keyCode === 27 || event.keyCode === 4) {
        event.preventDefault()
        await handleBackAction()
      }
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
  }, [location.pathname, navigate, player, closePlayer])

  return (
    <FocusContext.Provider value={shellFocusKey}>
      <div ref={shellRef} className="app-shell">
        {/* Full-screen player overlay — z-index 9999, above everything */}
        <PlayerView />

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
              <a href={updateToast.url} target="_blank" rel="noreferrer">Release</a>
            ) : null}
          </div>
        ) : null}
      </div>
    </FocusContext.Provider>
  )
}

/* ── Root — wraps everything with PlayerProvider ───── */
function App() {
  return (
    <PlayerProvider>
      <AppInner />
    </PlayerProvider>
  )
}

export default App
