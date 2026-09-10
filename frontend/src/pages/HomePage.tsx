import { AdminPanel } from '../components/AdminPanel'
import { Leaderboard } from '../components/Leaderboard'
import { Occupancy } from '../components/Occupancy'
import { TapSimulator } from '../components/TapSimulator'

export function HomePage() {
  return (
    <>
      <Leaderboard />
      <Occupancy />
      <TapSimulator />
      <AdminPanel />
    </>
  )
}
