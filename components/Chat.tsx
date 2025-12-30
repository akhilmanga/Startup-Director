
import React, { useState, useRef, useEffect } from 'react';
import { Message, StartupContext, AgentType } from '../types';
import { directorService } from '../services/geminiService';

interface Props {
  context: StartupContext;
  activeTabTrigger?: AgentType;
}

const Chat: React.FC<Props> = ({ context, activeTabTrigger }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [activationText, setActivationText] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTabTrigger) {
      triggerAgentReport(activeTabTrigger);
    }
  }, [activeTabTrigger]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isThinking, isActivating]);

  const triggerAgentReport = async (agent: AgentType) => {
    setIsLoading(true);
    try {
      const response = await directorService.generateAgentOutput(agent, context);
      const boardMsg: Message = { role: 'model', content: response, agent };
      setMessages(prev => [...prev, boardMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "SYSTEM ERROR: Failed to process intelligence mandate." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    if (!overrideInput) setInput('');
    
    setIsLoading(true);
    setIsThinking(true);

    try {
      const response = await directorService.chat([...messages, userMsg], context);
      setIsThinking(false);
      
      const activationRegex = /^ACTIVATING (.*?) — Reason: (.*?)\n/i;
      const match = response.match(activationRegex);
      
      if (match) {
        const [fullLine, agent, reason] = match;
        setActivationText(`Activating ${agent}\nReason: ${reason}`);
        setIsActivating(true);
        
        const cleanContent = response.replace(fullLine, '').trim();
        
        // Show activation ephemeral overlay for a brief moment
        await new Promise(r => setTimeout(r, 1200));
        setIsActivating(false);
        
        setMessages(prev => [...prev, { role: 'model', content: cleanContent }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', content: response }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "SYSTEM ERROR: Boardroom communications interrupted." }]);
      setIsThinking(false);
      setIsActivating(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isLoading) return;

    setIsLoading(true);
    setIsThinking(true);
    const userMsg: Message = { role: 'user', content: `Uploaded intelligence artifact: ${file.name}` };
    setMessages(prev => [...prev, userMsg]);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const response = await directorService.analyzeFile(base64Data, file.type, file.name, context);
        setIsThinking(false);

        const activationRegex = /^ACTIVATING (.*?) — Reason: (.*?)\n/i;
        const match = response.match(activationRegex);
        
        if (match) {
          const [fullLine, agent, reason] = match;
          setActivationText(`Activating ${agent}\nReason: ${reason}`);
          setIsActivating(true);
          const cleanContent = response.replace(fullLine, '').trim();
          await new Promise(r => setTimeout(r, 1200));
          setIsActivating(false);
          setMessages(prev => [...prev, { role: 'model', content: cleanContent }]);
        } else {
          setMessages(prev => [...prev, { role: 'model', content: response }]);
        }
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "SYSTEM ERROR: Artifact analysis failed." }]);
      setIsLoading(false);
      setIsThinking(false);
    }
  };

  const downloadArtifact = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderContent = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    return (
      <div className="space-y-4">
        {lines.map((line, idx) => {
          const isHeader = line === line.toUpperCase() && line.length < 150;
          const isMainTitle = isHeader && (line.includes('MANDATE') || line.includes('PREPARED BY') || line.includes('TARGET'));
          const isSectionHeader = isHeader && !isMainTitle;

          return (
            <div key={idx} className={isHeader ? 'mt-4 mb-1' : 'mb-2'}>
              <p className={`
                ${isMainTitle ? 'text-[15px] font-black text-blue-500 uppercase tracking-tight leading-tight' : ''}
                ${isSectionHeader ? 'text-[11px] font-bold text-white uppercase tracking-normal border-l-2 border-blue-600/30 pl-4 py-0.5 mt-2' : ''}
                ${!isHeader ? 'text-neutral-300 text-[17px] leading-[1.7] font-normal tracking-tight' : ''}
              `}>
                {line}
              </p>
            </div>
          );
        })}
        {content.length > 500 && (
          <div className="flex justify-start pt-8">
            <button 
              onClick={() => downloadArtifact(content, 'Executive_Strategy')}
              className="flex items-center space-x-2 px-4 py-2 border border-neutral-800 text-[10px] font-black text-neutral-500 uppercase rounded-lg hover:text-white hover:border-neutral-600 transition-all bg-[#111]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Export Strategic Brief</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-[95%] mx-auto py-16 animate-in fade-in duration-700 relative">
      {/* Floating System Thinking Overlay */}
      {isThinking && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] bg-[#1a1a24] border border-blue-500/30 px-6 py-3 rounded-full shadow-2xl flex items-center space-x-3 animate-in fade-in zoom-in duration-300">
          <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
          </div>
          <span className="text-[11px] font-black text-white uppercase tracking-widest">Analyzing request…</span>
        </div>
      )}

      {/* Floating Agent Activation Overlay */}
      {isActivating && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] bg-[#0c0c10] border-2 border-blue-600 px-8 py-4 rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.4)] animate-in fade-in zoom-in slide-in-from-top-4 duration-400">
          <div className="text-center">
            <p className="text-blue-500 text-[14px] font-black uppercase tracking-[0.2em] mb-1">{activationText.split('\n')[0]}</p>
            <p className="text-white text-[10px] font-bold uppercase opacity-60 tracking-tight">{activationText.split('\n')[1]}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-10 px-4">
        <div className="flex items-center space-x-4">
          <span className="text-blue-500 font-black text-2xl tracking-tighter">///</span>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Executive Board Chat</h2>
        </div>
        <div className="flex items-center space-x-2 px-4 py-1.5 bg-neutral-900/50 border border-neutral-800 rounded-full">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
          <span className="text-[10px] font-black text-neutral-400 uppercase tracking-tight">Boardroom Active</span>
        </div>
      </div>

      <div className="bg-[#0b0b0e] border border-neutral-800/40 rounded-[32px] overflow-hidden flex flex-col shadow-2xl min-h-[700px]">
        <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-48 opacity-10">
              <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-white mb-6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>
              <p className="text-[11px] font-black uppercase text-white tracking-tight">Board Synchronized. Awaiting Founder Input.</p>
            </div>
          )}
          
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-400`}>
              <div className={`max-w-[95%] ${m.role === 'user' ? 'bg-blue-600/5 border border-blue-600/10 rounded-2xl px-8 py-5 text-white text-xl font-light italic text-right' : 'w-full'}`}>
                {m.role === 'model' ? (
                  <div className="bg-[#121216] border border-neutral-800/30 rounded-3xl p-10 shadow-sm">
                    {renderContent(m.content)}
                  </div>
                ) : (
                   `“${m.content}”`
                )}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        <div className="p-8 border-t border-neutral-800/30 bg-[#0d0d10]">
          <div className="flex flex-wrap gap-2 mb-8 px-2">
            {[
              "Synthesize full GTM roadmap",
              "Draft series A investor narrative",
              "Analyze current burn vs growth metrics",
              "Perform UX audit of screenshot",
              "Critique pitch deck narrative"
            ].map((pill, idx) => (
              <button 
                key={idx}
                onClick={() => handleSend(pill)}
                className="px-5 py-2 bg-[#16161c] border border-neutral-800 hover:border-blue-500/30 text-[9px] font-black text-neutral-500 hover:text-white rounded-lg transition-all uppercase tracking-tight"
              >
                {pill}
              </button>
            ))}
          </div>

          <div className="relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Direct the Executive Board…"
              className="w-full bg-[#14141a] border border-neutral-800 rounded-2xl px-8 py-5 pr-24 text-lg text-white placeholder-neutral-700 focus:outline-none focus:border-blue-600/30 transition-all resize-none font-normal min-h-[90px] shadow-inner"
            />
            <div className="absolute right-4 bottom-4 flex items-center space-x-3">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-neutral-600 hover:text-white transition-colors"
                title="Attach Intelligence Artifact (Screenshot or PDF)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,.pdf" />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="w-12 h-12 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-700 rounded-xl flex items-center justify-center text-white transition-all shadow-xl shadow-blue-900/20 active:scale-95 transform"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
