import { CarFront, Layers, Monitor, Route } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

export function AppLayout() {
  const { pathname } = useLocation()
  const floorActive = pathname.startsWith('/floors')

  return (
    <div className="admin-shell">
      <aside className="side-nav">
        <NavLink className="brand" to="/floors/floor-b2">
          <strong>AVM Admin</strong>
          <span>Parking Hub v2.4</span>
        </NavLink>

        <nav>
          <NavLink className={({ isActive }) => isActive || floorActive ? 'active' : ''} to="/floors/floor-b2">
            <Layers size={20} />
            <span>Floor Maps</span>
          </NavLink>
          <NavLink to="/signage">
            <Monitor size={20} />
            <span>Digital Signage</span>
          </NavLink>
          <NavLink to="/driver/welcome">
            <CarFront size={20} />
            <span>Driver Welcome</span>
          </NavLink>
          <NavLink to="/driver/navigation">
            <Route size={20} />
            <span>Driver Route</span>
          </NavLink>
        </nav>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
