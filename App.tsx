
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
    <div className="h-screen w-screen overflow-hidden">
      {!startupContext ? (
        <StartupForm onSubmit={handleInitialize} />
      ) : (
        <Dashboard context={startupContext} />
      )}
    </div>
  );
};

export default App;
