
import React, { useState } from 'react';
import { StartupContext } from './types';
import StartupForm from './components/StartupForm';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';

type ViewState = 'landing' | 'form' | 'dashboard';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('landing');
  const [startupContext, setStartupContext] = useState<StartupContext | null>(null);

  const handleStart = () => {
    setView('form');
  };

  const handleInitialize = (context: StartupContext) => {
    setStartupContext(context);
    setView('dashboard');
  };

  return (
    <div className="min-h-screen w-full bg-[#060608]">
      {view === 'landing' && (
        <LandingPage onInitialize={handleStart} />
      )}
      {view === 'form' && (
        <StartupForm onSubmit={handleInitialize} />
      )}
      {view === 'dashboard' && startupContext && (
        <Dashboard context={startupContext} />
      )}
    </div>
  );
};

export default App;
