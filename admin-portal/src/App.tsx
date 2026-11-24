import { useState, useEffect } from 'react';
import { useStore } from './store';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  const token = useStore((s) => s.token);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Quick token presence check
    setChecking(false);
  }, []);

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="animate-spin h-8 w-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return token ? <DashboardPage /> : <LoginPage />;
}
