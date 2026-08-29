import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'
import App from './App.tsx'

const getBasename = () => {
  const path = window.location.pathname;
  if (path.includes('/psychosyntesis')) return '/psychosyntesis';
  if (path.includes('/psychosynthesis')) return '/psychosynthesis';
  return '/';
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename={getBasename()}>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
