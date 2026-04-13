import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { initializeSpatialNavigation } from './lib/spatialNavigation'

function Root() {
  useEffect(() => {
    initializeSpatialNavigation()
  }, [])

  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  )
}

export default Root
