
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
      <div className="space-y-6">
        {segments.map((segment, i) => {
          const isHeader = segment === segment.toUpperCase() && segment.length < 150;
          const isMemoField = segment.startsWith('TO:') || segment.startsWith('FROM:') || segment.startsWith('SUBJECT:') || segment.startsWith('SUMMARY:');
          const isMainTitle = isHeader && (segment.includes('MANDATE') || segment.includes('PREPARED BY') || segment.includes('TARGET'));
          const isSectionHeader = isHeader && !isMainTitle && !isMemoField;

          return (
            <div key={i} className={(isHeader || isMemoField) ? 'mt-8 mb-2' : 'mb-4'}>
              <p className={`
                ${isMainTitle ? 'text-2xl font-black text-white uppercase tracking-tighter leading-none mb-4' : ''}
                ${isSectionHeader ? 'text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] flex items-center gap-4 before:content-[""] before:h-px before:w-6 before:bg-blue-500/30' : ''}
                ${isMemoField ? 'text-[11px] font-black text-neutral-400 uppercase tracking-[0.2em] py-3 border-y border-white/[0.03] mb-4 flex justify-between' : ''}
                ${(!isHeader && !isMemoField) ? 'text-neutral-400 text-[18px] leading-[1.7] font-light tracking-tight' : ''}
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
    <div className="flex flex-col h-screen bg-[#060608] overflow-hidden">
      {/* Premium Header */}
      <header className="px-12 py-6 border-b border-white/[0.04] flex justify-between items-center bg-[#08080a] z-50">
        <div className="flex items-center space-x-10">
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-600/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative w-11 h-11 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center font-black text-white shadow-[0_0_20px_rgba(37,99,235,0.2)]">SD</div>
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tighter uppercase leading-none mb-1">Startup Director</h1>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <p className="text-[9px] text-neutral-600 font-black uppercase tracking-[0.1em]">Autonomous Executive Intelligence</p>
            </div>
          </div>
          <div className="h-8 w-px bg-white/[0.05] mx-2"></div>
          <div className="flex flex-col">
            <span className="text-blue-500 text-[9px] font-black uppercase tracking-widest mb-0.5">Deployment</span>
            <span className="text-white text-[11px] font-bold uppercase tracking-tight">{context.stage} Phase</span>
          </div>
        </div>
        <div className="flex items-center space-x-8">
           <div className="text-right">
            <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mb-1">{context.name}</p>
            <div className="flex items-center justify-end space-x-2">
              <span className="text-[9px] text-neutral-700 font-black uppercase tracking-tighter">Active Sync</span>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500/40 shadow-[0_0_8px_rgba(34,197,94,0.3)]"></div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#060608]">
        {/* Board Overview Section */}
        <section className="px-12 py-12 border-b border-white/[0.02] bg-[#08080a]/40">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              {[
                { label: 'Context', value: ceoSummary?.stage, color: 'text-neutral-600' },
                { label: 'Primary Objective', value: ceoSummary?.objective, color: 'text-blue-500' },
                { label: 'Systemic Risk', value: ceoSummary?.risk, color: 'text-red-500/80' },
                { label: 'Board Directive', value: ceoSummary?.decision, color: 'text-green-500/80' }
              ].map((stat, i) => (
                <div key={i} className="group p-8 bg-[#0d0d0f]/60 backdrop-blur-md rounded-[32px] border border-white/[0.03] hover:border-white/[0.08] transition-all duration-500 shadow-2xl">
                  <h3 className={`text-[9px] font-black uppercase mb-4 ${stat.color} tracking-[0.2em]`}>
                    {stat.label}
                  </h3>
                  <p className="text-[14px] text-white font-medium leading-relaxed tracking-tight">{stat.value || 'Processing intelligence...'}</p>
                </div>
              ))}
            </div>
            
            {ceoSummary && (
              <div className="flex flex-col md:flex-row gap-12 items-start border-t border-white/[0.03] pt-12">
                <div className="flex-1">
                  <span className="font-black text-neutral-600 uppercase text-[9px] block mb-6 tracking-[0.3em]">Institutional Stop List</span>
                  <div className="flex flex-wrap gap-3">
                    {ceoSummary.doNotDo.map((item, i) => (
                      <span key={i} className="text-[10px] px-5 py-2 bg-red-500/[0.03] text-red-400/80 border border-red-500/10 rounded-xl font-bold uppercase tracking-wide">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="md:w-1/3 p-8 bg-blue-600/[0.02] border border-blue-500/5 rounded-[32px] relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <span className="font-black text-blue-500/60 uppercase text-[9px] block mb-4 tracking-[0.3em]">Next 30D Mandate</span>
                  <p className="text-[14px] text-white font-medium leading-relaxed tracking-tight">
                    {ceoSummary.focusNext}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Tab Navigation - Tactical Bezel Look */}
        <nav className="flex items-center justify-center bg-[#08080a]/80 backdrop-blur-2xl sticky top-0 z-40 border-b border-white/[0.04] shadow-2xl">
          <div className="flex px-8 space-x-2">
            {(['CEO', 'CPO', 'CMO', 'SALES', 'CFO', 'FUNDRAISING'] as AgentType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-12 py-8 text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-500 ${
                  activeTab === tab 
                  ? 'text-white' 
                  : 'text-neutral-600 hover:text-neutral-400'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.6)] animate-in fade-in duration-500" />
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Mandate Content Area */}
        <main className="py-24 max-w-4xl mx-auto w-full min-h-[600px] px-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-48 opacity-20">
              <div className="w-10 h-10 border-2 border-t-blue-600 border-white/5 rounded-full animate-spin mb-8"></div>
              <p className="text-white text-[10px] font-black uppercase tracking-[0.4em]">Board Compilation In Progress</p>
            </div>
          ) : (
            <div className="animate-in fade-in duration-[1500ms]">
              <div className="flex flex-col items-center justify-center border-b border-white/[0.03] pb-12 mb-16 text-center">
                <h2 className="text-7xl font-black m-0 tracking-tighter uppercase text-white mb-2 leading-none">
                  {activeTab} <span className="text-neutral-800">Briefing</span>
                </h2>
              </div>
              <div className="px-4 pb-32">
                {agentOutputs[activeTab] ? renderCleanMandate(agentOutputs[activeTab]!) : 'Synchronizing boardroom signals...'}
              </div>
            </div>
          )}
        </main>

        {/* Global Chat Integration */}
        <section className="bg-[#060608] border-t border-white/[0.03] px-12 pb-32">
           <Chat context={context} />
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
