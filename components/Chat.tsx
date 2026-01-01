
import React, { useState, useRef, useEffect } from 'react';
import { Message, StartupContext, AgentType, PitchDeckSlide, ChartDataPoint } from '../types';
import { directorService } from '../services/geminiService';
import pptxgen from 'pptxgenjs';

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
  const [pendingImages, setPendingImages] = useState<{ data: string; mimeType: string }[]>([]);
  const [pendingFiles, setPendingFiles] = useState<{ data: string; mimeType: string; name: string }[]>([]);
  
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
      setMessages(prev => [...prev, { role: 'model', content: response, agent }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "SYSTEM ERROR: Failed to process intelligence mandate." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (overrideInput?: string, forceMode?: string) => {
    const textToSend = (overrideInput || input).trim();
    if (!textToSend && pendingImages.length === 0 && pendingFiles.length === 0 && !forceMode) return;
    if (isLoading) return;

    const userMsg: Message = { 
      role: 'user', 
      content: forceMode ? `Selected Mode: ${forceMode}` : (textToSend || "Process intelligence artifact."),
      images: pendingImages.length > 0 ? [...pendingImages] : undefined,
      files: pendingFiles.length > 0 ? [...pendingFiles] : undefined
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setPendingImages([]);
    setPendingFiles([]);
    
    setIsLoading(true);
    setIsThinking(true);

    try {
      // 1. Check intent for Deck Generation
      const isDeckRequest = /deck|pitch|presentation|slides/i.test(textToSend) || forceMode;
      
      if (isDeckRequest) {
        setActivationText("Activating FUNDRAISING — Reason: ASSEMBLING PRESENTATION ARTIFACT");
        setIsActivating(true);
        const slides = await directorService.generateDeckArtifact(context, textToSend, messages);
        setIsActivating(false);
        
        // Parallel generate images for all slides
        const enrichedSlides = await Promise.all(slides.map(async s => {
          const img = await directorService.generateSlideImage(s);
          return { ...s, imageUrl: img ? `data:image/png;base64,${img}` : undefined };
        }));

        setMessages(prev => [...prev, { 
          role: 'model', 
          content: "PRESENTATION ARTIFACT GENERATED — READY FOR DOWNLOAD",
          isDeckGeneration: true,
          slides: enrichedSlides 
        }]);
      } else {
        // Standard chat routing
        const response = await directorService.chat([...messages, userMsg], context);
        setIsThinking(false);
        
        if (response.includes("MODE_SELECTION_REQUIRED")) {
          setMessages(prev => [...prev, { role: 'model', content: "MODE SELECTION — REQUIRED", isModeSelection: true }]);
        } else {
          const activationRegex = /^ACTIVATING (.*?) — Reason: (.*?)\n/i;
          const match = response.match(activationRegex);
          let finalContent = response;
          if (match) {
            const [fullLine, agent, reason] = match;
            setActivationText(`Activating ${agent}\nReason: ${reason}`);
            setIsActivating(true);
            finalContent = response.replace(fullLine, '').trim();
            await new Promise(r => setTimeout(r, 1200));
            setIsActivating(false);
          }
          setMessages(prev => [...prev, { role: 'model', content: finalContent }]);
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "SYSTEM ERROR: Boardroom communications interrupted." }]);
    } finally {
      setIsThinking(false);
      setIsActivating(false);
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    // Fix: Explicitly cast Array.from(fileList) to File[] to resolve 'unknown' type issues
    const files = Array.from(fileList) as File[];
    const newImages: { data: string; mimeType: string }[] = [];
    const newFiles: { data: string; mimeType: string; name: string }[] = [];
    for (const file of files) {
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = () => {
          const base64Data = (reader.result as string).split(',')[1];
          if (file.type.startsWith('image/')) newImages.push({ data: base64Data, mimeType: file.type });
          else newFiles.push({ data: base64Data, mimeType: file.type, name: file.name });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    setPendingImages(prev => [...prev, ...newImages]);
    setPendingFiles(prev => [...prev, ...newFiles]);
  };

  const exportPPTX = (slides: PitchDeckSlide[]) => {
    const pres = new pptxgen();
    pres.layout = 'LAYOUT_WIDE';
    
    slides.forEach(slide => {
      const s = pres.addSlide();
      s.background = { color: '0a0a0c' };
      
      if (slide.imageUrl) {
        s.addImage({ data: slide.imageUrl, x: 0, y: 0, w: '100%', h: '100%', opacity: 20 });
      }

      s.addText(slide.title, { 
        x: 0.5, y: 0.5, w: '90%', fontSize: 36, bold: true, color: '2563eb', fontFace: 'Inter' 
      });

      s.addText(slide.content, { 
        x: 0.5, y: 1.5, w: '60%', fontSize: 18, color: 'ffffff', fontFace: 'Inter', valign: 'top' 
      });

      if (slide.chartData && slide.chartData.length > 0) {
        const labels = slide.chartData.map(d => d.label);
        const data = slide.chartData.map(d => d.value);
        s.addChart(pres.ChartType.bar, [ { name: 'Traction', labels, values: data } ], { 
          x: 7, y: 2, w: 5, h: 4, showLegend: false, barDir: 'col', chartColors: ['2563eb'] 
        });
      }
    });

    pres.writeFile({ fileName: `Startup_Director_Deck_${context.name}.pptx` });
  };

  const renderChart = (data: ChartDataPoint[]) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
      <div className="flex items-end space-x-3 h-48 w-full bg-neutral-900/40 rounded-2xl p-6 border border-white/5">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center group">
            <div 
              className="w-full bg-blue-600 rounded-t-lg transition-all duration-1000 group-hover:bg-blue-400" 
              style={{ height: `${(d.value / max) * 100}%` }}
            ></div>
            <span className="mt-3 text-[9px] font-black uppercase text-neutral-500 whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">{d.label}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderSlidesPreview = (slides: PitchDeckSlide[]) => (
    <div className="space-y-10 py-8">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-6">
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">Deck Artifact Assembly</h3>
          <p className="text-[10px] text-neutral-500 font-bold uppercase mt-1">Status: Confirmed High-Fidelity Output</p>
        </div>
        <button 
          onClick={() => exportPPTX(slides)}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-blue-900/20 active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span>Download PPTX</span>
        </button>
      </div>
      <div className="grid grid-cols-1 gap-12">
        {slides.map((slide, idx) => (
          <div key={idx} className="relative aspect-video w-full bg-[#0c0c0e] border border-neutral-800/60 rounded-[40px] overflow-hidden shadow-2xl flex flex-col animate-in fade-in duration-700">
            {slide.imageUrl && (
              <img src={slide.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none" />
            )}
            <div className="relative z-10 flex flex-col h-full p-16">
              <div className="flex justify-between items-start mb-10">
                <div className="flex items-center space-x-4">
                   <div className="px-4 py-1.5 bg-blue-600 text-white font-black text-[10px] rounded-lg uppercase tracking-widest">{slide.layoutType}</div>
                   <h4 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{slide.title}</h4>
                </div>
                <span className="text-[11px] font-black text-neutral-700 uppercase">Slide {idx + 1}</span>
              </div>
              <div className="flex flex-1 gap-12 overflow-hidden">
                <div className="flex-[3] space-y-6">
                   <p className="text-2xl font-light text-neutral-300 leading-relaxed tracking-tight">{slide.content}</p>
                </div>
                {slide.chartData && slide.chartData.length > 0 && (
                   <div className="flex-[2] flex flex-col justify-end">
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4">Live Traction Data</p>
                      {renderChart(slide.chartData)}
                   </div>
                )}
              </div>
              <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center space-x-3 opacity-30">
                  <div className="w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center text-[10px] font-black">SD</div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Startup Director v3.1</span>
                </div>
                <p className="text-[10px] italic text-neutral-600 font-medium">Visual: {slide.visualGuidance.substring(0, 100)}...</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-[95%] mx-auto py-16 animate-in fade-in duration-700 relative">
      {(isThinking || isActivating) && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-[#0c0c10] border-2 border-blue-600 px-8 py-4 rounded-2xl shadow-2xl flex items-center space-x-4 animate-in zoom-in">
          <div className="w-4 h-4 border-t-2 border-blue-500 rounded-full animate-spin"></div>
          <div className="text-center">
            <p className="text-blue-500 text-[14px] font-black uppercase tracking-[0.2em] mb-0.5">
              {isActivating ? activationText.split('\n')[0] : "Board Synchronizing..."}
            </p>
            {isActivating && <p className="text-white text-[9px] font-bold uppercase opacity-60">{activationText.split('\n')[1]}</p>}
          </div>
        </div>
      )}

      <div className="bg-[#0b0b0e] border border-neutral-800/40 rounded-[48px] overflow-hidden flex flex-col shadow-2xl min-h-[800px]">
        <div className="flex-1 overflow-y-auto p-16 space-y-16 custom-scrollbar">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-48 opacity-10">
              <p className="text-[12px] font-black uppercase text-white tracking-[0.4em]">Awaiting Board Directives</p>
            </div>
          )}
          
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`w-full ${m.role === 'user' ? 'max-w-[80%]' : ''}`}>
                {m.role === 'model' ? (
                  <div className="bg-[#121216]/50 border border-neutral-800/30 rounded-[40px] p-12">
                    {m.isModeSelection ? (
                      <div className="text-center py-10">
                        <h3 className="text-3xl font-black text-white uppercase mb-8 tracking-tighter">Mode Selection — Required</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
                          {['Pre-Traction', 'Early Users', 'Traction'].map(mode => (
                            <button key={mode} onClick={() => handleSend(undefined, mode)} className="px-8 py-8 border border-neutral-800 rounded-3xl text-[11px] font-black uppercase text-neutral-400 hover:text-white hover:border-blue-500 hover:bg-blue-600/5 transition-all">
                              {mode}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : m.isDeckGeneration && m.slides ? (
                      renderSlidesPreview(m.slides)
                    ) : (
                      <div className="space-y-6">
                        {m.content.split('\n').filter(l => l.trim()).map((line, lidx) => (
                          <p key={lidx} className="text-neutral-300 text-[19px] font-light leading-relaxed tracking-tight">{line}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-blue-600/5 rounded-3xl px-10 py-8 text-white border border-blue-500/10 shadow-xl self-end">
                    <p className="text-2xl font-light tracking-tight">{m.content}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        <div className="p-10 border-t border-neutral-800/30 bg-[#0d0d10]">
          <div className="relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Direct the Executive Board... e.g. 'Build a seed stage deck focusing on our growth metrics'"
              className="w-full bg-[#14141a] border border-neutral-800 rounded-3xl px-10 py-8 pr-32 text-xl text-white focus:outline-none focus:border-blue-600/30 transition-all resize-none font-light min-h-[100px]"
            />
            <div className="absolute right-6 bottom-6 flex items-center space-x-4">
              <button onClick={() => fileInputRef.current?.click()} className="p-3 text-neutral-600 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,.pdf,.ppt,.pptx" multiple />
              <button onClick={() => handleSend()} disabled={isLoading} className="w-14 h-14 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 rounded-2xl flex items-center justify-center text-white transition-all shadow-2xl shadow-blue-900/40">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
