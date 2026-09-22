import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App.tsx'

/**
 * Mounts the AlegrIA 3D application.
 * @link https://react.dev/reference/react/StrictMode
 */
const root = document.getElementById('root')

if (!root) throw new Error('Root element #root not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
