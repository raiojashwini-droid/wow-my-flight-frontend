import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './theme/dark-color-tokens.css'
import App from './App.jsx'
import { installApiAuth } from './services/apiAuth'

installApiAuth();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
