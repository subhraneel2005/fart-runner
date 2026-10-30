import { createRoot } from 'react-dom/client'
import App from './App'
import { runtime } from './game/runtime'
import { useGameStore } from './store/gameStore'
import './styles.css'

const root = document.getElementById('root')
if (import.meta.env.DEV) {
  ;(window as unknown as { __fart: unknown }).__fart = { store: useGameStore, runtime }
}

if (root) {
  createRoot(root).render(<App />)
}
