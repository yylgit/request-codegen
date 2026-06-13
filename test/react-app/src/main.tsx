import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

async function enableMocking() {
  // 生产环境直接 return，不启动 MSW
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  // 只在开发环境动态加载并启动 worker
  const { worker } = await import('./mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

async function start() {
  await enableMocking()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

start()
