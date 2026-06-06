import { Cuboid, Map } from 'lucide-react'
import { useState } from 'react'
import { NavigationPage2D } from './NavigationPage2D'
import { NavigationPage3D } from './NavigationPage3D'

type DriverNavigationMode = '2d' | '3d'

export function NavigationPage() {
  const [mode, setMode] = useState<DriverNavigationMode>('2d')

  return (
    <div className="driver-navigation-mode-shell">
      <div className="driver-navigation-mode-toggle" role="group" aria-label="Navigation view mode">
        <button
          aria-pressed={mode === '2d'}
          className={mode === '2d' ? 'is-active' : ''}
          onClick={() => setMode('2d')}
          type="button"
        >
          <Map size={16} />
          2D
        </button>
        <button
          aria-pressed={mode === '3d'}
          className={mode === '3d' ? 'is-active' : ''}
          onClick={() => setMode('3d')}
          type="button"
        >
          <Cuboid size={16} />
          3D
        </button>
      </div>

      {mode === '2d' ? <NavigationPage2D /> : <NavigationPage3D />}
    </div>
  )
}
