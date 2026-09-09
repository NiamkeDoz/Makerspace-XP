import { AdminPanel } from '../components/AdminPanel'
import { Leaderboard } from '../components/Leaderboard'
import { TapSimulator } from '../components/TapSimulator'

export function HomePage() {
  return (
    <>
      <Leaderboard />
      <TapSimulator />
      <AdminPanel />
    </>
  )
}
