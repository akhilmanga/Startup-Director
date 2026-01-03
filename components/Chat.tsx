
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
  const [isDragging, setIsDragging] = useState(false);
  
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
      content: forceMode ? `Selected Mode: ${forceMode}` : (textToSend || (pendingImages.length > 0 || pendingFiles.length > 0 ? "Analyzing attached intelligence assets." : "Process intelligence artifact.")),
      images: pendingImages.length > 0 ? [...pendingImages] : undefined,
      files: pendingFiles.length > 0 ? [...pendingFiles] : undefined
    };
    
    const hasFiles = pendingFiles.length > 0;
    const hasPitchDeckFile = pendingFiles.some(f => /\.(pdf|pptx)$/i.test(f.name));
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setPendingImages([]);
    setPendingFiles([]);
    
    setIsLoading(true);
    setIsThinking(true);

    try {
      // INTENT CLASSIFICATION - HARD GATE
      // INTENT_A: PITCH DECK CREATION (Must contain explicit keywords)
      const creationKeywords = /(create|generate|build|make)\s+(a\s+)?(pitch|investor|fundraising|series\s+[a-b]|seed)\s+deck/i;
      const explicitCreationRequest = creationKeywords.test(textToSend) || forceMode;
      
      // INTENT_B: PITCH DECK AUDIT
      const auditKeywords = /(audit|review|rate|feedback|critique)/i;
      const isAuditRequest = hasPitchDeckFile || auditKeywords.test(textToSend);

      // ROUTING ENFORCEMENT
      if (explicitCreationRequest && !hasPitchDeckFile) {
        // INTENT_A — PITCH DECK CREATION
        setActivationText("Activating FUNDRAISING — Reason: ASSEMBLING INSTITUTIONAL ARTIFACT");
        setIsActivating(true);
        const slides = await directorService.generateDeckArtifact(context, textToSend, messages);
        setIsActivating(false);
        
        const enrichedSlides = await Promise.all(slides.map(async s => {
          const img = await directorService.generateSlideImage(s);
          return { ...s, imageUrl: img ? `data:image/png;base64,${img}` : undefined };
        }));

        setMessages(prev => [...prev, { 
          role: 'model', 
          content: "INVESTOR ARTIFACT GENERATED — READY FOR DEPLOYMENT",
          isDeckGeneration: true,
          slides: enrichedSlides 
        }]);
      } else {
        // INTENT_B (Audit) or INTENT_C (Casual/General)
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

  const processFileList = async (fileList: FileList) => {
    const files = Array.from(fileList);
    const newImages: { data: string; mimeType: string }[] = [];
    const newFiles: { data: string; mimeType: string; name: string }[] = [];
    
    for (const file of files) {
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = () => {
          const base64Data = (reader.result as string).split(',')[1];
          if (file.type.startsWith('image/')) {
            newImages.push({ data: base64Data, mimeType: file.type });
          } else {
            newFiles.push({ data: base64Data, mimeType: file.type, name: file.name });
          }
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    setPendingImages(prev => [...prev, ...newImages]);
    setPendingFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await processFileList(e.target.files);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      await processFileList(e.dataTransfer.files);
    }
  };

  const removePendingImage = (index: number) => {
    setPendingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const exportPPTX = (slides: PitchDeckSlide[]) => {
    const pres = new pptxgen();
    pres.layout = 'LAYOUT_WIDE';
    
    slides.forEach(slide => {
      const s = pres.addSlide();
      s.background = { color: '0a0a0c' };
      
      if (slide.imageUrl) {
        s.addImage({ data: slide.imageUrl, x: 0, y: 0, w: '100%', h: '100%', opacity: 15 });
      }

      // Title Rendering — Auto-fit and Safe Margins (Enforced 90% Box)
      s.addText(slide.title, { 
        x: '5%', y: '5%', w: '90%', h: 1.2,
        fontSize: 44, 
        bold: true, 
        color: '2563eb', 
        fontFace: 'Inter',
        align: 'left',
        valign: 'middle',
        autoFit: true, // Prevents truncation by shrinking text to fit
        breakLine: true
      });

      // Content Rendering — Strict Margin Bounding
      s.addText(slide.content, { 
        x: '5%', y: '20%', w: '55%', h: '70%',
        fontSize: 20, 
        color: 'ffffff', 
        fontFace: 'Inter', 
        valign: 'top', 
        lineSpacing: 24,
        autoFit: true,
        breakLine: true
      });

      if (slide.chartData && slide.chartData.length > 0) {
        const labels = slide.chartData.map(d => d.label);
        const data = slide.chartData.map(d => d.value);
        s.addChart(pres.ChartType.bar, [ { name: 'Institutional Metric', labels, values: data } ], { 
          x: 7.2, y: 2.5, w: 4.8, h: 4, 
          showLegend: false, 
          barDir: 'col', 
          chartColors: ['2563eb'] 
        });
      }
    });

    pres.writeFile({ fileName: `Executive_Artifact_${context.name}.pptx` });
  };

  const renderChart = (data: ChartDataPoint[]) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
      <div className="flex items-end space-x-3 h-56 w-full bg-[#121216]/60 rounded-3xl p-8 border border-white/5">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center group h-full justify-end">
            <div 
              className="w-full bg-blue-600 rounded-t-xl transition-all duration-1000 group-hover:bg-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.2)]" 
              style={{ height: `${(d.value / max) * 100}%` }}
            ></div>
            <span className="mt-4 text-[8px] font-black uppercase text-neutral-600 tracking-widest whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">{d.label}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderSlidesPreview = (slides: PitchDeckSlide[]) => (
    <div className="space-y-16 py-12">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-10">
        <div>
          <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Institutional Artifact</h3>
          <p className="text-[10px] text-blue-500 font-black uppercase mt-2 tracking-[0.3em]">Status: High-Conviction Investor Ready</p>
        </div>
        <button 
          onClick={() => exportPPTX(slides)}
          className="flex items-center space-x-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] transition-all shadow-2xl shadow-blue-900/40 active:scale-95 border border-blue-400/20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span>Download PPTX</span>
        </button>
      </div>
      <div className="grid grid-cols-1 gap-20">
        {slides.map((slide, idx) => (
          <div key={idx} className="relative aspect-video w-full bg-[#0a0a0c] border border-neutral-800/80 rounded-[56px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-1000">
            {slide.imageUrl && (
              <img src={slide.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none grayscale" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent pointer-events-none" />
            
            <div className="relative z-10 flex flex-col h-full p-20">
              <div className="flex justify-between items-start mb-16">
                <div className="flex flex-col space-y-4">
                   <div className="px-5 py-2 bg-blue-600/10 border border-blue-500/20 text-blue-500 font-black text-[9px] rounded-full uppercase tracking-[0.4em] inline-block w-fit">{slide.layoutType}</div>
                   <h4 className="text-5xl font-black text-white uppercase tracking-tighter leading-[0.9]">{slide.title}</h4>
                </div>
                <div className="text-[12px] font-black text-neutral-800 uppercase tracking-widest border-2 border-neutral-900 px-4 py-1 rounded-xl">0{idx + 1}</div>
              </div>
              
              <div className="flex flex-1 gap-16 overflow-hidden">
                <div className="flex-[3] flex flex-col justify-center">
                   <p className="text-3xl font-light text-neutral-200 leading-[1.4] tracking-tight">{slide.content}</p>
                </div>
                {slide.chartData && slide.chartData.length > 0 && (
                   <div className="flex-[2] flex flex-col justify-center">
                      <p className="text-[10px] font-black text-blue-500/60 uppercase tracking-[0.5em] mb-6 text-center">Institutional Data Wedge</p>
                      {renderChart(slide.chartData)}
                   </div>
                )}
              </div>
              
              <div className="mt-16 pt-10 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center space-x-4 opacity-40">
                  <div className="w-10 h-10 bg-neutral-900 rounded-2xl flex items-center justify-center text-[11px] font-black text-neutral-500">SD</div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Startup Director</span>
                    <span className="text-[8px] font-bold uppercase text-neutral-600">Executive Artifact v4.0</span>
                  </div>
                </div>
                <div className="max-w-[300px]">
                  <p className="text-[9px] font-black text-neutral-700 uppercase tracking-widest text-right leading-relaxed">{slide.visualGuidance.substring(0, 120)}</p>
                </div>
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
                    {(m.images || m.files) && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {m.images?.map((img, idx) => (
                          <img key={idx} src={`data:${img.mimeType};base64,${img.data}`} className="w-16 h-16 object-cover rounded-lg border border-white/10" alt="attachment" />
                        ))}
                        {m.files?.map((file, idx) => (
                          <div key={idx} className="px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 text-[10px] font-black uppercase flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            <span className="max-w-[100px] truncate">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        <div 
          className={`p-10 border-t border-neutral-800/30 bg-[#0d0d10] transition-all duration-300 ${isDragging ? 'bg-blue-600/5 ring-2 ring-inset ring-blue-600/30' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Pending Attachments Preview Area */}
          {(pendingImages.length > 0 || pendingFiles.length > 0) && (
            <div className="flex flex-wrap gap-4 mb-8 animate-in slide-in-from-bottom-2 duration-300">
              {pendingImages.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img src={`data:${img.mimeType};base64,${img.data}`} className="w-24 h-24 object-cover rounded-2xl border border-neutral-700 shadow-xl" alt="pending" />
                  <button 
                    onClick={() => removePendingImage(idx)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              ))}
              {pendingFiles.map((file, idx) => (
                <div key={idx} className="relative group flex items-center space-x-4 bg-[#1a1a20] px-6 py-4 rounded-2xl border border-neutral-700 shadow-xl">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase text-white tracking-wider max-w-[150px] truncate">{file.name}</span>
                    <span className="text-[9px] font-bold uppercase text-neutral-500">Document</span>
                  </div>
                  <button 
                    onClick={() => removePendingFile(idx)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={isDragging ? "Drop artifacts to analyze..." : "Direct the Executive Board... e.g. 'Audit this pitch deck for seed readiness'"}
              className="w-full bg-[#14141a] border border-neutral-800 rounded-3xl px-10 py-8 pr-32 text-xl text-white focus:outline-none focus:border-blue-600/30 transition-all resize-none font-light min-h-[100px]"
            />
            <div className="absolute right-6 bottom-6 flex items-center space-x-4">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()} 
                className="p-3 text-neutral-600 hover:text-white transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*,.pdf,.ppt,.pptx" 
                multiple 
              />
              <button onClick={() => handleSend()} disabled={isLoading} className="w-14 h-14 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 rounded-2xl flex items-center justify-center text-white transition-all shadow-2xl shadow-blue-900/40">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
              </button>
            </div>
          </div>
          {isDragging && (
            <div className="mt-4 flex items-center justify-center pointer-events-none">
              <span className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em] animate-pulse">Release to attach intelligence assets</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
