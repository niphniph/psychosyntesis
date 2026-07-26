import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if (window.location.pathname === '/psychosyntesis') {
  window.history.replaceState(null, '', '/psychosyntesis/' + window.location.search + window.location.hash);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
