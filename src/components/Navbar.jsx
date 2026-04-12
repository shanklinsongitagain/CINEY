import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

function NavbarItem({ children, onEnterPress, to, href, isActive = false }) {
  const { ref, focused } = useFocusable({ onEnterPress })
  const className = `nav-link-pill${isActive ? ' active' : ''}${focused ? ' spatial-focused' : ''}`

  if (to) {
    return (
      <NavLink ref={ref} to={to} className={className}>
        {children}
      </NavLink>
    )
  }

  return (
    <a ref={ref} href={href} className={className}>
      {children}
    </a>
  )
}

function Navbar() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { ref, focusKey } = useFocusable({ trackChildren: true })

  const handleSubmit = (event) => {
    if (event?.preventDefault) event.preventDefault()
    const trimmedQuery = query.trim()
    if (!trimmedQuery) {
      navigate('/search')
      return
    }
    navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`)
  }

  const { ref: searchInputRef, focused: searchInputFocused } = useFocusable()
  const { ref: searchBtnRef, focused: searchBtnFocused } = useFocusable({
    onEnterPress: handleSubmit,
  })

  return (
    <header className="site-header">
      <div className="container nav-content">
        <Link to="/" className="brand-mark" tabIndex={-1}>
          <span className="brand-pill">C</span>
          <span>Ciney</span>
        </Link>

        <FocusContext.Provider value={focusKey}>
          <nav ref={ref} className="nav-links" aria-label="Primary">
            <NavbarItem to="/" isActive={window.location.pathname === '/'} onEnterPress={() => navigate('/')}>
              Home
            </NavbarItem>
            <NavbarItem href="/#movies" onEnterPress={() => { window.location.href = '/#movies' }}>
              Movies
            </NavbarItem>
            <NavbarItem href="/#shows" onEnterPress={() => { window.location.href = '/#shows' }}>
              TV Shows
            </NavbarItem>
            <NavbarItem to="/search" isActive={window.location.pathname.startsWith('/search')} onEnterPress={() => navigate('/search')}>
              Search
            </NavbarItem>
          </nav>
        </FocusContext.Provider>

        <form className="search-form" onSubmit={handleSubmit}>
          <input
            ref={searchInputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search movies or shows"
            aria-label="Search movies or shows"
            className={searchInputFocused ? 'spatial-focused' : ''}
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
