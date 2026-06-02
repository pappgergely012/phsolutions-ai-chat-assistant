import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const container = document.createElement('div')
container.id = 'ph-chat-widget'
document.body.appendChild(container)

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
