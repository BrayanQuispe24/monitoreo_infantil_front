import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { MonitoreoApp } from './MonitoreoApp.tsx'
import { AuthProvider } from './context/auth/AuthContext.tsx'
import { DaycareProvider } from './context/daycare/DaycareContext.tsx'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <DaycareProvider>
        <MonitoreoApp />
      </DaycareProvider>
    </AuthProvider>
  </StrictMode>,
)
