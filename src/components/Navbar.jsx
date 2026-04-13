import { FocusContext, setFocus, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
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
  const navigate = useNavigate()
  const { ref, focusKey } = useFocusable({ trackChildren: true, focusKey: NAVBAR_FOCUS_KEY })
  const { ref: searchCtaRef, focused: searchCtaFocused } = useFocusable({
    onEnterPress: () => navigate('/search'),
    onArrowPress: (dir) => {
      if (dir === 'down') {
        setFocus(CONTENT_FOCUS_KEY)
        return false
      }
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

        <div className="nav-utility tv-safe-zone">
          <button
            ref={searchCtaRef}
            type="button"
            className={`nav-utility-button${searchCtaFocused ? ' spatial-focused' : ''}`}
            onClick={() => navigate('/search')}
          >
            Open Search
          </button>
          <span className="nav-utility-copy">Press Select to open the Fire TV keyboard</span>
        </div>
      </div>
    </header>
  )
}

export default Navbar
