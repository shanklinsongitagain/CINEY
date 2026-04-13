import { FocusContext, setFocus, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { Link, useLocation, useNavigate } from 'react-router-dom'

export const NAVBAR_FOCUS_KEY = 'CINEY_NAVBAR'
export const CONTENT_FOCUS_KEY = 'CINEY_CONTENT'

function NavItem({ children, to, activeMatch, onEnterPress }) {
  const location = useLocation()
  const isActive = activeMatch(location)

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
  const navigate = useNavigate()
  const { ref, focusKey } = useFocusable({ trackChildren: true, focusKey: NAVBAR_FOCUS_KEY })

  return (
    <header className={`site-header${solid ? ' site-header--solid' : ''}`}>
      <div className="nav-content">
        <Link to="/" className="brand-mark" tabIndex={-1}>
          <span className="brand-pill">C</span>
          <span>Ciney</span>
        </Link>

        <FocusContext.Provider value={focusKey}>
          <nav ref={ref} className="nav-links">
            <NavItem to="/" activeMatch={(l) => l.pathname === '/'} onEnterPress={() => navigate('/')}>Home</NavItem>
            <NavItem to="/search?type=movie" activeMatch={(l) => l.pathname === '/search' && (new URLSearchParams(l.search).get('type') === 'movie')} onEnterPress={() => navigate('/search?type=movie')}>Movies</NavItem>
            <NavItem to="/search?type=tv" activeMatch={(l) => l.pathname === '/search' && (new URLSearchParams(l.search).get('type') === 'tv')} onEnterPress={() => navigate('/search?type=tv')}>TV</NavItem>
            <NavItem to="/search?type=episode" activeMatch={(l) => l.pathname === '/search' && (new URLSearchParams(l.search).get('type') === 'episode')} onEnterPress={() => navigate('/search?type=episode')}>Episodes</NavItem>
            <NavItem to="/search" activeMatch={(l) => l.pathname === '/search' && !(new URLSearchParams(l.search).get('type'))} onEnterPress={() => navigate('/search')}>Search</NavItem>
          </nav>
        </FocusContext.Provider>
      </div>
    </header>
  )
}

export default Navbar
