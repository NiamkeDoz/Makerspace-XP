import { Route, Routes } from 'react-router-dom'
import { Layout } from './Layout'
import { DashboardPage } from './pages/DashboardPage'
import { HomePage } from './pages/HomePage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="dashboard" element={<DashboardPage />} />
      </Route>
    </Routes>
  )
}

export default App
