import React from 'react'

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    try {
      const key = 'ciney_startup_error'
      const payload = {
        message: String(error?.message || error),
        timestamp: Date.now(),
      }
      window.localStorage.setItem(key, JSON.stringify(payload))
    } catch {
      // ignore
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#141414', color: '#fff', display: 'grid', placeItems: 'center', padding: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ marginBottom: '0.5rem' }}>Ciney failed to start</h2>
            <p style={{ color: '#cbd5e1' }}>Please restart the app. If this persists, reinstall the latest APK.</p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default AppErrorBoundary
