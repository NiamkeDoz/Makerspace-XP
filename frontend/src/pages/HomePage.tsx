import { Leaderboard } from '../components/Leaderboard'
import { Occupancy } from '../components/Occupancy'
import { TapSimulator } from '../components/TapSimulator'

export function HomePage() {
  return (
    <div className="grid w-full grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start">
      <Leaderboard />
      <Occupancy />
      <div className="lg:col-span-2">
        <TapSimulator />
      </div>
    </div>
  )
}
