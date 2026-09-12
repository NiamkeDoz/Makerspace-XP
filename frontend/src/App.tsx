import { Route, Routes } from 'react-router-dom'
import { Layout } from './Layout'
import { AdminPage } from './pages/AdminPage'
import { AllBadgesPage } from './pages/AllBadgesPage'
import { DashboardPage } from './pages/DashboardPage'
import { HomePage } from './pages/HomePage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="dashboard/:memberId/badges" element={<AllBadgesPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>
    </Routes>
  )
}

export default App
