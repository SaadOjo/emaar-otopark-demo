import { CarFront, CreditCard, Layers, Monitor } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

export function AppLayout() {
  const { pathname } = useLocation()
  const floorActive = pathname.startsWith('/floors')

  return (
    <div className="admin-shell">
      <aside className="side-nav">
        <NavLink className="brand" to="/floors">
          <strong>AVM Admin</strong>
        </NavLink>

        <nav>
          <NavLink className={({ isActive }) => isActive || floorActive ? 'active' : ''} to="/floors">
            <Layers size={20} />
            <span>Floor Maps</span>
          </NavLink>
          <NavLink to="/signage">
            <Monitor size={20} />
            <span>Digital Signage</span>
          </NavLink>
          <NavLink to="/payments">
            <CreditCard size={20} />
            <span>Payment</span>
          </NavLink>
          <NavLink to="/driver/welcome">
            <CarFront size={20} />
            <span className="nav-item-copy">
              <span>Driver Welcome</span>
              <small className="nav-badge">Customer View</small>
            </span>
          </NavLink>
        </nav>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
