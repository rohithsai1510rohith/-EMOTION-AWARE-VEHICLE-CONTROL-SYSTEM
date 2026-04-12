import React, { useEffect } from 'react';
import { useStore } from './store/useStore';
import { startHardwarePolling } from './api/api';
import Hero from './components/Hero';
import Dashboard from './components/Dashboard';

export default function App() {
  const mode = useStore((state) => state.mode);
  const theme = useStore((state) => state.theme);

  useEffect(() => {
    // Start interval to ping the python/node simulated backend
    startHardwarePolling();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className={`min-h-screen text-slate-900 dark:text-white transition-colors duration-300 ${theme === 'dark' ? 'bg-darkbg' : 'bg-lightbg'} font-sans`}>
      {/* Dynamic Render based on Mode */}
      {mode === 'CINEMATIC' ? <Hero /> : <Dashboard />}
    </div>
  );
}
