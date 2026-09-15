import { Route, Routes } from 'react-router-dom'
import { Layout } from './Layout'
import { AdminPage } from './pages/AdminPage'
import { AdminCustomBadgesPage } from './pages/AdminCustomBadgesPage'
import { AdminMemberEditPage } from './pages/AdminMemberEditPage'
import { AdminXpSettingsPage } from './pages/AdminXpSettingsPage'
import { AllBadgesPage } from './pages/AllBadgesPage'
import { DashboardPage } from './pages/DashboardPage'
import { HomePage } from './pages/HomePage'
import { WheelPage } from './pages/WheelPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="dashboard/:memberId" element={<DashboardPage />} />
        <Route path="dashboard/:memberId/badges" element={<AllBadgesPage />} />
        <Route path="wheel" element={<WheelPage />} />
        <Route path="wheel/:memberId" element={<WheelPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="admin/members/:memberId" element={<AdminMemberEditPage />} />
        <Route path="admin/xp-settings" element={<AdminXpSettingsPage />} />
        <Route path="admin/custom-badges" element={<AdminCustomBadgesPage />} />
      </Route>
    </Routes>
  )
}

export default App
