import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initDatabase } from './config/supabase';

// Initialize database tables and start listening for changes
const cleanup = await initDatabase().catch(console.error);

// Cleanup function for real-time subscriptions
window.addEventListener('unload', () => {
  if (cleanup) cleanup();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);