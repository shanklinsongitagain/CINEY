import { FocusContext, setFocus, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

export const NAVBAR_FOCUS_KEY = 'CINEY_NAVBAR'
export const CONTENT_FOCUS_KEY = 'CINEY_CONTENT'

function NavItem({ children, to, onEnterPress }) {
  const location = useLocation()
  const isActive = to === '/'
    ? location.pathname === '/'
    : location.pathname.startsWith(to)

  const { ref, focused } = useFocusable({
    onEnterPress,
    onArrowPress: (dir) => {
      if (dir === 'down') {
        setFocus(CONTENT_FOCUS_KEY)
        return false
      }
    },
  })

  return (
    <Link
      ref={ref}
      to={to}
      className={`nav-link-pill${isActive ? ' active' : ''}${focused ? ' spatial-focused' : ''}`}
      tabIndex={0}
    >
      {children}
    </Link>
  )
}

function Navbar({ solid = false }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { ref, focusKey } = useFocusable({ trackChildren: true, focusKey: NAVBAR_FOCUS_KEY })

  const handleSearch = () => {
    const q = query.trim()
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
  }

  const { ref: inputRef, focused: inputFocused } = useFocusable({
    onArrowPress: (dir) => {
      if (dir === 'down') { setFocus(CONTENT_FOCUS_KEY); return false }
    },
  })
  const { ref: searchBtnRef, focused: searchBtnFocused } = useFocusable({
    onEnterPress: handleSearch,
    onArrowPress: (dir) => {
      if (dir === 'down') { setFocus(CONTENT_FOCUS_KEY); return false }
    },
  })

  return (
    <header className={`site-header${solid ? ' site-header--solid' : ''}`}>
      <div className="nav-content">
        <Link to="/" className="brand-mark" tabIndex={-1}>
          <span className="brand-pill">C</span>
          <span>Ciney</span>
        </Link>

        <FocusContext.Provider value={focusKey}>
          <nav ref={ref} className="nav-links">
            <NavItem to="/" onEnterPress={() => navigate('/')}>Home</NavItem>
            <NavItem to="/search" onEnterPress={() => navigate('/search')}>Search</NavItem>
          </nav>
        </FocusContext.Provider>

        <form
          className="search-form"
          onSubmit={(e) => { e.preventDefault(); handleSearch() }}
        >
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            aria-label="Search"
            className={inputFocused ? 'spatial-focused' : ''}
          />
          <button
            ref={searchBtnRef}
            type="submit"
            className={searchBtnFocused ? 'spatial-focused' : ''}
          >
            Go
          </button>
        </form>
      </div>
    </header>
  )
}

export default Navbar
