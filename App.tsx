
import React, { useState } from 'react';
import { StartupContext } from './types';
import StartupForm from './components/StartupForm';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [startupContext, setStartupContext] = useState<StartupContext | null>(null);

  const handleInitialize = (context: StartupContext) => {
    setStartupContext(context);
  };

  return (
    <div className="min-h-screen w-full bg-[#08080a]">
      {!startupContext ? (
        <StartupForm onSubmit={handleInitialize} />
      ) : (
        <Dashboard context={startupContext} />
      )}
    </div>
  );
};

export default App;
