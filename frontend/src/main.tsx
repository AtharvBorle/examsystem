import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/global.css'

// Global fetch interceptor for hybrid app (offline assets loading from APK file:/// protocol)
const originalFetch = window.fetch;
window.fetch = function (input, init) {
  let url = typeof input === 'string' ? input : (input instanceof Request ? input.url : '');
  if (url && url.startsWith('/api/')) {
    const isLocalFile = window.location.protocol === 'file:' || !window.location.host;
    if (isLocalFile) {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://192.168.0.151:5000';
      const fullUrl = `${backendUrl}${url}`;
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
    <App />
  </React.StrictMode>,
)
