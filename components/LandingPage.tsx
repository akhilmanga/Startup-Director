
import React, { useEffect, useState } from 'react';

interface Props {
  onInitialize: () => void;
}

const LandingPage: React.FC<Props> = ({ onInitialize }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const agents = [
    { id: 'CPO', label: 'CPO' },
    { id: 'CMO', label: 'CMO' },
    { id: 'Sales', label: 'SALES' },
    { id: 'CFO', label: 'CFO' },
    { id: 'Fundraising', label: 'FUNDRAISING' },
  ];

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#060608] flex flex-col font-inter">
      {/* CANONICAL VISUAL FOUNDATION: Cinematic Boardroom Background */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover scale-[1.02]"
          style={{ filter: 'brightness(0.25) contrast(1.1) saturate(0.8)' }}
        >
          <source src="https://storage.googleapis.com/static.recommender.google.com/startup_director/boardroom_cinematic.mp4" type="video/mp4" />
          <source src="boardroom_cinematic.mp4" type="video/mp4" />
        </video>
        
        {/* Institutional Grade Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.04)_0%,transparent_80%)]" />
      </div>

      {/* Main UI Layer */}
      <div className="relative z-20 flex flex-col h-full items-center justify-between py-16 px-8">
        
        {/* HERO CONTENT */}
        <div className={`flex flex-col items-center text-center transition-all duration-[2000ms] cubic-bezier(0.16, 1, 0.3, 1) ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h1 className="text-5xl md:text-[84px] font-extrabold text-white uppercase tracking-tighter mb-6 leading-[0.95] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/20">
            Your Autonomous <br /> Executive Board.
          </h1>
          
          <div className="flex flex-col items-center space-y-4 mb-12">
            <p className="text-neutral-500 text-sm md:text-lg font-light tracking-[0.5em] uppercase">
              Strategy. Execution. Fundraising.
            </p>
            <div className="h-px w-16 bg-blue-600/30" />
            <p className="text-blue-500/50 text-[10px] md:text-xs font-bold tracking-[0.8em] uppercase">
              One system. Zero employees.
            </p>
          </div>

          {/* THE SINGLE ACTION - Primary CTA */}
          <div className="relative group">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onInitialize();
              }}
              className="relative px-12 py-6 bg-white/[0.03] backdrop-blur-xl border border-white/[0.1] rounded-full overflow-hidden transition-all duration-700 hover:border-blue-500/50 hover:bg-blue-600/[0.08] hover:shadow-[0_0_80px_rgba(37,99,235,0.3)] active:scale-95 group z-50 cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <span className="relative z-10 text-[11px] font-black text-white uppercase tracking-[0.8em] group-hover:tracking-[0.9em] transition-all duration-700">
                Initialize Startup Director
              </span>
            </button>
            <div className="absolute -inset-6 bg-blue-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />
          </div>
        </div>

        {/* MINDMAP VISUAL: AGENT HIERARCHY */}
        <div className={`w-full max-w-6xl mt-12 transition-all duration-[2500ms] delay-500 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="relative h-[400px] flex flex-col items-center">
            
            {/* CEO Node - Central Authority */}
            <div className="relative z-30 flex flex-col items-center group mb-12">
              <div className="relative">
                <div className="absolute -inset-10 bg-blue-500/10 blur-3xl rounded-full opacity-40 group-hover:opacity-80 transition-opacity animate-pulse" />
                <div className="relative bg-[#0a0a0c] border border-white/10 w-28 h-28 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-all duration-700 group-hover:scale-105 group-hover:border-blue-500/30">
                  <span className="text-white text-3xl font-black uppercase tracking-tighter">CEO</span>
                </div>
              </div>
            </div>

            {/* SVG Connections Layer */}
            <svg className="absolute top-14 left-0 w-full h-[300px] pointer-events-none z-10" viewBox="0 0 1000 300" preserveAspectRatio="none">
              <defs>
                <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(37, 99, 235, 0.4)" />
                  <stop offset="100%" stopColor="rgba(37, 99, 235, 0.05)" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Hierarchical Paths */}
              {agents.map((_, i) => {
                const xEnd = (i * 200) + 100;
                // Cubic bezier for elegant organic curves
                const pathData = `M500 0 C 500 150, ${xEnd} 50, ${xEnd} 200`;
                return (
                  <g key={i}>
                    <path 
                      d={pathData} 
                      stroke="url(#pathGradient)" 
                      strokeWidth="1.5" 
                      fill="none" 
                      opacity="0.3" 
                      filter="url(#glow)" 
                      className="transition-opacity duration-1000"
                    />
                    {/* Data Pulse Animation */}
                    <circle r="2" fill="#3b82f6" opacity="0.8">
                      <animateMotion 
                        dur={`${2.5 + i * 0.5}s`} 
                        repeatCount="indefinite" 
                        path={pathData} 
                        begin={`${i * 0.4}s`}
                      />
                    </circle>
                  </g>
                );
              })}
            </svg>

            {/* Subordinate Nodes Container */}
            <div className="relative z-30 w-full flex justify-between items-start pt-12">
              {agents.map((agent, i) => (
                <div key={agent.id} className="flex flex-col items-center group w-1/5 animate-premium-fade" style={{ animationDelay: `${700 + i * 150}ms` }}>
                  <div className="relative bg-[#0d0d10]/40 backdrop-blur-md border border-white/[0.05] px-8 py-4 rounded-2xl transition-all duration-700 group-hover:border-blue-500/40 group-hover:bg-blue-600/[0.04] group-hover:shadow-[0_0_30px_rgba(37,99,235,0.15)] group-hover:-translate-y-1">
                    <span className="text-[11px] font-black text-neutral-500 group-hover:text-blue-400 uppercase tracking-[0.5em] transition-colors">{agent.label}</span>
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-600/20 group-hover:bg-blue-500 group-hover:shadow-[0_0_10px_rgba(37,99,235,1)] transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cinematic Depth Elements */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute top-[30%] left-[15%] w-[500px] h-[500px] bg-blue-600/[0.03] rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[15%] w-[600px] h-[600px] bg-blue-600/[0.02] rounded-full blur-[180px] animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      {/* Grid Overlay for Technical Feel */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
    </div>
  );
};

export default LandingPage;
