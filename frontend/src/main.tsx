import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/global.css'
import { AppIconProvider } from './context/AppIconContext.tsx'

// Global fetch interceptor for hybrid app (offline assets loading from APK file:/// protocol)
const originalFetch = window.fetch;
window.fetch = function (input, init) {
  let url = typeof input === 'string' ? input : (input instanceof Request ? input.url : '');
  if (url && url.startsWith('/api/')) {
    const isLocalFile = window.location.protocol === 'file:' || !window.location.host;
    if (isLocalFile) {
      const envUrl = import.meta.env.VITE_API_URL || 'https://bvpindia.org';
      // Clean backend base URL (strip trailing slashes and subpaths like /oes)
      const cleanBackend = envUrl.replace(/\/+$/, '').replace(/\/oes$/, '');
      const fullUrl = `${cleanBackend}${url}`;
      if (typeof input === 'string') {
        input = fullUrl;
      } else if (input instanceof Request) {
        input = new Request(fullUrl, input);
      }
    }
  }
  return originalFetch(input, init);
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppIconProvider>
      <App />
    </AppIconProvider>
  </React.StrictMode>,
)
