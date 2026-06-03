import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const host = document.createElement('div')
host.id = 'ph-chat-widget'
document.body.appendChild(host)

const shadow = host.attachShadow({ mode: 'open' })

// cssInjectedByJs injects the compiled Tailwind CSS into <head> first.
// Clone it into the shadow root so host page styles can't override widget styles.
const widgetStyle = document.getElementById('ph-widget-css')
if (widgetStyle) {
  shadow.appendChild(widgetStyle.cloneNode(true))
}

const mountPoint = document.createElement('div')
shadow.appendChild(mountPoint)

createRoot(mountPoint).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
