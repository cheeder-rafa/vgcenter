import { Navigate, Route, Routes } from 'react-router-dom'

import { AppShell } from './components/shell/AppShell'
import { CalculatorPage } from './pages/CalculatorPage'
import { PreviewPage } from './pages/PreviewPage'
import { SpeedTierPage } from './pages/SpeedTierPage'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/calc" replace />} />
        <Route path="/calc" element={<CalculatorPage />} />
        <Route path="/preview" element={<PreviewPage />} />
        <Route path="/speed" element={<SpeedTierPage />} />
      </Route>
    </Routes>
  )
}

export default App
