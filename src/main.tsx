import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { InputsProvider } from './state/InputsProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <InputsProvider>
      <App />
    </InputsProvider>
  </StrictMode>,
)
