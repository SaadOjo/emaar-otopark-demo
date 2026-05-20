import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { NavigationPage } from './features/driver/NavigationPage'
import { WelcomePage } from './features/driver/WelcomePage'
import { BlockMapPage } from './features/floors/BlockMapPage'
import { FloorMapPage } from './features/floors/FloorMapPage'
import { SignageDetailPage } from './features/signage/SignageDetailPage'
import { SignageOverviewPage } from './features/signage/SignageOverviewPage'
import { VehicleTemplatesPage } from './features/vehicles/VehicleTemplatesPage'

export default function App() {
  return (
    <Routes>
      <Route path="/driver/welcome" element={<WelcomePage />} />
      <Route path="/driver/navigation" element={<NavigationPage />} />

      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/floors/floor-b2" replace />} />
        <Route path="floors" element={<Navigate to="/floors/floor-b2" replace />} />
        <Route path="floors/:floorId" element={<FloorMapPage />} />
        <Route path="floors/:floorId/blocks/:blockId" element={<BlockMapPage />} />
        <Route path="floors/:floorId/blocks/:blockId/signage/:signageId" element={<SignageDetailPage />} />
        <Route path="floors/:floorId/blocks/:blockId/vehicles/:vehicleId/templates" element={<VehicleTemplatesPage />} />
        <Route path="signage" element={<SignageOverviewPage />} />
        <Route path="signage/:signageId" element={<SignageDetailPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/floors/floor-b2" replace />} />
    </Routes>
  )
}
