import { Outlet } from 'react-router-dom'
import { FirstRunFlowCard } from './FirstRunFlowCard'
import { TopNav } from './TopNav'

export function AppShell() {
  return (
    <div className="min-h-screen bg-arena-void text-white">
      <TopNav />
      <div className="min-w-0 pt-16">
        <Outlet />
      </div>
      <FirstRunFlowCard />
    </div>
  )
}
