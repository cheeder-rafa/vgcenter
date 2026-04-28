import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { AppShell } from './components/shell/AppShell'
import { useSpeedTierStore } from './features/speed/store/useSpeedTierStore'
import { CalculatorPage } from './pages/CalculatorPage'
import { PreviewPage } from './pages/PreviewPage'
import { ReplayPage } from './pages/ReplayPage'
import { SpeedTierPage } from './pages/SpeedTierPage'

function App() {
  const fetchBase = useSpeedTierStore((s) => s.fetchBase)
  const speedStatus = useSpeedTierStore((s) => s.status)

  useEffect(() => {
    if (speedStatus === 'idle') {
      fetchBase([], {
        tailwind: false,
        trickRoom: false,
        paralysis: false,
        choiceScarf: false,
        stages: 0,
      })
    }
  }, [fetchBase, speedStatus])

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/calc" replace />} />
        <Route path="/calc" element={<CalculatorPage />} />
        <Route path="/preview" element={<PreviewPage />} />
        <Route path="/speed" element={<SpeedTierPage />} />
        <Route path="/replay" element={<ReplayPage />} />
      </Route>
    </Routes>
  )
}

export default App
