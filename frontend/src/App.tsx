import { Navigate, Route, Routes } from 'react-router-dom'

import { AppShell } from './components/shell/AppShell'
import { GameplanPage } from './features/gameplan/pages/GameplanPage'
import { CalculatorPage } from './pages/CalculatorPage'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/calc" replace />} />
        <Route path="/calc" element={<CalculatorPage />} />
        <Route path="/gameplan" element={<GameplanPage />} />
      </Route>
    </Routes>
  )
}

export default App
