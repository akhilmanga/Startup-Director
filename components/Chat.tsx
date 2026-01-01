
import React, { useState, useRef, useEffect } from 'react';
import { Message, StartupContext, AgentType, PitchDeckSlide } from '../types';
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
      const boardMsg: Message = { role: 'model', content: response, agent };
      setMessages(prev => [...prev, boardMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "SYSTEM ERROR: Failed to process intelligence mandate." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const parseSlides = (content: string): PitchDeckSlide[] | null => {
    const match = content.match(/\[SLIDES\]([\s\S]*?)\[\/SLIDES\]/);
    if (!match) return null;
    try {
      const jsonStr = match[1].trim();
      // Expecting an array of JSON objects or just one big JSON array
      const slides = JSON.parse(jsonStr.startsWith('[') ? jsonStr : `[${jsonStr}]`);
      return slides;
    } catch (e) {
      console.error("Failed to parse slides", e);
      return null;
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
      const response = await directorService.chat([...messages, userMsg], context);
      setIsThinking(false);
      
      if (response.includes("MODE_SELECTION_REQUIRED")) {
        setMessages(prev => [...prev, { role: 'model', content: "MODE SELECTION — REQUIRED", isModeSelection: true }]);
        setIsLoading(false);
        return;
      }

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

      const slides = parseSlides(finalContent);
      if (slides) {
        // Enrichment with images (Optional background/visuals)
        const enrichedSlides = await Promise.all(slides.map(async s => {
          const img = await directorService.generateSlideImage(s);
          return { ...s, imageUrl: img ? `data:image/png;base64,${img}` : undefined };
        }));
        
        setMessages(prev => [...prev, { 
          role: 'model', 
          content: finalContent.replace(/\[SLIDES\][\s\S]*?\[\/SLIDES\]/, '').trim(),
          slides: enrichedSlides 
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', content: finalContent }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "SYSTEM ERROR: Boardroom communications interrupted." }]);
      setIsThinking(false);
      setIsActivating(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Fixed handleFileChange logic to correctly resolve FileList based on event type
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let fileList: FileList | null = null;
    
    if ('dataTransfer' in e && e.dataTransfer) {
      fileList = e.dataTransfer.files;
    } else if (e.target && (e.target as HTMLInputElement).files) {
      fileList = (e.target as HTMLInputElement).files;
    }
    
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const newImages: { data: string; mimeType: string }[] = [];
    const newFiles: { data: string; mimeType: string; name: string }[] = [];
    
    for (const file of files) {
      const reader = new FileReader();
      const promise = new Promise<void>((resolve) => {
        reader.onload = () => {
          const base64Data = (reader.result as string).split(',')[1];
          if (file.type.startsWith('image/')) {
            newImages.push({ data: base64Data, mimeType: file.type });
          } else {
            newFiles.push({ data: base64Data, mimeType: file.type, name: file.name });
          }
          resolve();
        };
      });
      reader.readAsDataURL(file);
      await promise;
    }

    setPendingImages(prev => [...prev, ...newImages]);
    setPendingFiles(prev => [...prev, ...newFiles]);
  };

  const downloadDeck = (slides: PitchDeckSlide[]) => {
    const text = slides.map((s, i) => `SLIDE ${i+1}: ${s.title}\n\n${s.content}\n\nVISUALS: ${s.visualGuidance}\n\n${'='.repeat(30)}\n`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Pitch_Deck_${context.name}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderSlides = (slides: PitchDeckSlide[]) => {
    return (
      <div className="space-y-12 py-10">
        <div className="grid grid-cols-1 gap-12">
          {slides.map((slide, idx) => (
            <div key={idx} className="relative aspect-video w-full bg-[#16161c] border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in duration-700">
              {slide.imageUrl && (
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="relative z-10 flex flex-col h-full p-12">
                <div className="flex justify-between items-start mb-8">
                  <h3 className="text-3xl font-black text-blue-500 uppercase tracking-tighter">{slide.title}</h3>
                  <span className="text-[10px] font-black text-neutral-600 bg-neutral-900 px-3 py-1 rounded-full uppercase">Slide {idx + 1}</span>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar">
                  <p className="text-2xl font-light text-white leading-relaxed tracking-tight">{slide.content}</p>
                </div>
                <div className="mt-8 pt-6 border-t border-neutral-800/50">
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Visual Direction</p>
                  <p className="text-[12px] text-neutral-400 italic font-medium leading-snug">{slide.visualGuidance}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center pt-10">
          <button 
            onClick={() => downloadDeck(slides)}
            className="group flex items-center space-x-3 px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[12px] rounded-full shadow-2xl transition-all active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Download High-Resolution Deck (PDF)</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`w-full max-w-[95%] mx-auto py-16 animate-in fade-in duration-700 relative ${isDragging ? 'bg-blue-600/5 rounded-3xl' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileChange(e); }}
    >
      {isThinking && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] bg-[#1a1a24] border border-blue-500/30 px-6 py-3 rounded-full shadow-2xl flex items-center space-x-3 animate-in fade-in zoom-in">
          <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
          </div>
          <span className="text-[11px] font-black text-white uppercase tracking-widest">Board Analyzing…</span>
        </div>
      )}

      {isActivating && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] bg-[#0c0c10] border-2 border-blue-600 px-8 py-4 rounded-2xl shadow-2xl animate-in zoom-in">
          <div className="text-center">
            <p className="text-blue-500 text-[14px] font-black uppercase tracking-[0.2em] mb-1">{activationText.split('\n')[0]}</p>
            <p className="text-white text-[10px] font-bold uppercase opacity-60">{activationText.split('\n')[1]}</p>
          </div>
        </div>
      )}

      <div className="bg-[#0b0b0e] border border-neutral-800/40 rounded-[32px] overflow-hidden flex flex-col shadow-2xl min-h-[700px]">
        <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-48 opacity-10">
              <p className="text-[11px] font-black uppercase text-white tracking-widest">Awaiting Board Directives</p>
            </div>
          )}
          
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[95%] ${m.role === 'user' ? 'bg-blue-600/5 rounded-2xl px-8 py-5 text-white shadow-lg' : 'w-full'}`}>
                {m.role === 'model' ? (
                  <div className="bg-[#121216] border border-neutral-800/30 rounded-3xl p-10">
                    {m.isModeSelection ? (
                      <div className="text-center py-10">
                        <h3 className="text-2xl font-black text-white uppercase mb-8 tracking-tighter">MODE SELECTION — REQUIRED</h3>
                        <p className="text-neutral-500 text-[11px] font-bold uppercase mb-10 tracking-widest">Select Fundraising Stage to Initialize Generation</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
                          {['Pre-Traction', 'Early Users', 'Traction'].map(mode => (
                            <button 
                              key={mode}
                              onClick={() => handleSend(undefined, mode)}
                              className="px-6 py-6 border border-neutral-800 rounded-2xl text-[10px] font-black uppercase text-neutral-400 hover:text-white hover:border-blue-500 hover:bg-blue-600/5 transition-all"
                            >
                              {mode}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          {m.content.split('\n').filter(l => l.trim()).map((line, lidx) => (
                            <p key={lidx} className="text-neutral-300 text-[17px] font-normal tracking-tight">{line}</p>
                          ))}
                        </div>
                        {m.slides && renderSlides(m.slides)}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {m.images && (
                      <div className="flex flex-wrap gap-2">
                        {m.images.map((img, idx) => <img key={idx} src={`data:${img.mimeType};base64,${img.data}`} className="h-24 w-auto rounded-lg border border-white/10" />)}
                      </div>
                    )}
                    {m.files && (
                      <div className="flex flex-wrap gap-2">
                        {m.files.map((file, idx) => (
                          <div key={idx} className="flex items-center space-x-2 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                            <span className="text-[10px] font-black text-neutral-400 uppercase">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xl font-light leading-relaxed">{m.content}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        <div className="p-8 border-t border-neutral-800/30 bg-[#0d0d10]">
          {(pendingImages.length > 0 || pendingFiles.length > 0) && (
            <div className="flex flex-wrap gap-2 mb-6 px-2">
              {pendingImages.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img src={`data:${img.mimeType};base64,${img.data}`} className="h-20 w-auto rounded-lg border border-blue-500/40" />
                  <button onClick={() => setPendingImages(prev => prev.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white text-[10px]">✕</button>
                </div>
              ))}
              {pendingFiles.map((file, idx) => (
                <div key={idx} className="relative group bg-neutral-900 border border-blue-500/30 rounded-lg px-4 py-3 flex items-center space-x-2">
                   <span className="text-[9px] font-black text-neutral-300 uppercase">{file.name}</span>
                   <button onClick={() => setPendingFiles(prev => prev.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white text-[10px]">✕</button>
                </div>
              ))}
            </div>
          )}

          <div className="relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Direct the Executive Board... Drag files to attach."
              className="w-full bg-[#14141a] border border-neutral-800 rounded-2xl px-8 py-5 pr-24 text-lg text-white focus:outline-none focus:border-blue-600/30 transition-all resize-none font-normal min-h-[90px]"
            />
            <div className="absolute right-4 bottom-4 flex items-center space-x-3">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-neutral-600 hover:text-white transition-colors"
                title="Attach Intelligence Artifacts"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,.pdf,.ppt,.pptx" multiple />
              <button onClick={() => handleSend()} disabled={isLoading} className="w-12 h-12 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 rounded-xl flex items-center justify-center text-white transition-all">
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
