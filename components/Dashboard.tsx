
import React, { useState, useEffect, useCallback } from 'react';
import { StartupContext, AgentType, CEOSummary } from '../types';
import { directorService } from '../services/geminiService';
import Chat from './Chat';

interface Props {
  context: StartupContext;
}

const Dashboard: React.FC<Props> = ({ context }) => {
  const [activeTab, setActiveTab] = useState<AgentType>('CEO');
  const [ceoSummary, setCeoSummary] = useState<CEOSummary | null>(null);
  const [agentOutputs, setAgentOutputs] = useState<Partial<Record<AgentType, string>>>({});
  const [isLoading, setIsLoading] = useState(false);

  const loadCEOSummary = useCallback(async () => {
    try {
      const summary = await directorService.generateCEOSummary(context);
      setCeoSummary(summary);
    } catch (e) {
      console.error(e);
    }
  }, [context]);

  const loadAgentOutput = useCallback(async (agent: AgentType) => {
    if (agentOutputs[agent]) return;
    
    setIsLoading(true);
    try {
      const output = await directorService.generateAgentOutput(agent, context);
      setAgentOutputs(prev => ({ ...prev, [agent]: output }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [agentOutputs, context]);

  useEffect(() => {
    loadCEOSummary();
    loadAgentOutput('CEO');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadAgentOutput(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const renderCleanMandate = (text: string) => {
    const segments = text.split('\n').filter(s => s.trim().length > 0);
    return (
      <div className="space-y-4">
        {segments.map((segment, i) => {
          const isHeader = segment === segment.toUpperCase() && segment.length < 150;
          const isMainTitle = isHeader && (segment.includes('MANDATE') || segment.includes('PREPARED BY') || segment.includes('TARGET'));
          const isSectionHeader = isHeader && !isMainTitle;

          return (
            <div key={i} className={isHeader ? 'mt-4 mb-1' : 'mb-3'}>
              <p className={`
                ${isMainTitle ? 'text-lg font-black text-blue-500 uppercase tracking-tight leading-tight' : ''}
                ${isSectionHeader ? 'text-xs font-bold text-white uppercase tracking-tight border-l-2 border-blue-600/40 pl-4 py-0.5 mt-2' : ''}
                ${!isHeader ? 'text-neutral-300 text-[18px] leading-[1.8] font-light tracking-tight text-justify' : ''}
              `}>
                {segment}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[#08080a] overflow-hidden">
      <header className="px-12 py-5 border-b border-neutral-800/40 flex justify-between items-center bg-[#0a0a0c] z-50">
        <div className="flex items-center space-x-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white shadow-2xl shadow-blue-600/20">SD</div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Startup Director</h1>
            <p className="text-[9px] text-neutral-600 font-bold uppercase mt-1.5 tracking-normal">Autonomous Executive Intelligence</p>
          </div>
          <div className="h-8 w-px bg-neutral-800 mx-2"></div>
          <span className="px-4 py-1 rounded-lg bg-blue-950/20 text-blue-500 text-[10px] font-black uppercase border border-blue-900/20">
            {context.stage} Deployment
          </span>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-neutral-400 font-black uppercase mb-1 tracking-tight">{context.name}</p>
          <div className="flex items-center justify-end space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.4)]"></span>
            <p className="text-[9px] text-neutral-700 font-bold uppercase tracking-tight">Board Sync Active</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#08080a]">
        <section className="px-12 py-10 border-b border-neutral-800/10 bg-[#0a0a0c]/50">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              {[
                { label: 'Current Context', value: ceoSummary?.stage, color: 'text-neutral-500' },
                { label: 'Strategic Pillar', value: ceoSummary?.objective, color: 'text-blue-500' },
                { label: 'Critical Risk', value: ceoSummary?.risk, color: 'text-red-500' },
                { label: 'Board Mandate', value: ceoSummary?.decision, color: 'text-green-500' }
              ].map((stat, i) => (
                <div key={i} className="p-6 bg-[#0c0c0f] rounded-2xl border border-neutral-800/40 hover:border-neutral-700/60 transition-all">
                  <h3 className={`text-[8px] font-black uppercase mb-3 ${stat.color} tracking-tight`}>
                    {stat.label}
                  </h3>
                  <p className="text-[13px] text-white font-bold leading-relaxed">{stat.value || 'Synthesizing...'}</p>
                </div>
              ))}
            </div>
            {ceoSummary && (
              <div className="flex flex-wrap gap-16 items-start border-t border-neutral-800/10 pt-10">
                <div className="flex-1 min-w-[300px]">
                  <span className="font-black text-neutral-600 uppercase text-[9px] block mb-4 tracking-tight">Board Kill List (Stop Doing)</span>
                  <div className="flex flex-wrap gap-3">
                    {ceoSummary.doNotDo.map((item, i) => (
                      <span key={i} className="text-[10px] px-4 py-1.5 bg-red-950/10 text-red-500 border border-red-900/20 rounded-lg font-black uppercase">{item}</span>
                    ))}
                  </div>
                </div>
                <div className="w-1/3 min-w-[300px]">
                  <span className="font-black text-neutral-600 uppercase text-[9px] block mb-3 tracking-tight">Next 30D Mandate</span>
                  <p className="text-[13px] text-neutral-400 font-bold leading-relaxed italic border-l-2 border-neutral-800 pl-6">“{ceoSummary.focusNext}”</p>
                </div>
              </div>
            )}
          </div>
        </section>

        <nav className="flex items-center justify-center bg-[#0a0a0c] sticky top-0 z-40 border-b border-neutral-800/50 shadow-2xl">
          <div className="flex px-4 overflow-x-auto no-scrollbar">
            {(['CEO', 'CPO', 'CMO', 'SALES', 'CFO', 'FUNDRAISING'] as AgentType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-12 py-6 text-[10px] font-black uppercase tracking-tight border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab 
                  ? 'border-blue-600 text-blue-500 bg-blue-600/5' 
                  : 'border-transparent text-neutral-600 hover:text-neutral-400'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </nav>

        <main className="py-20 max-w-4xl mx-auto w-full min-h-[500px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-48 opacity-30">
              <div className="w-12 h-12 border-t-2 border-blue-600 rounded-full animate-spin mb-10"></div>
              <p className="text-white text-[10px] font-black uppercase tracking-tight">Compiling Mandate...</p>
            </div>
          ) : (
            <div className="animate-in fade-in duration-1000">
              <div className="flex flex-col items-center justify-center border-b border-neutral-800/30 pb-10 mb-14 text-center">
                <h2 className="text-6xl font-black m-0 tracking-tighter uppercase text-white mb-2">{activeTab} Mandate</h2>
                <p className="text-neutral-600 font-bold uppercase text-[10px] tracking-tight">Executive Strategic Briefing — Confirmed</p>
              </div>
              <div className="px-4">
                {agentOutputs[activeTab] ? renderCleanMandate(agentOutputs[activeTab]!) : 'Initiating boardroom compilation...'}
              </div>
            </div>
          )}
        </main>

        <section className="bg-[#09090b] border-t border-neutral-800/20 px-12 pb-32">
           <Chat context={context} />
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
