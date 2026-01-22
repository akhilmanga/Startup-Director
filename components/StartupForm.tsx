
import React, { useState } from 'react';
import { StartupContext, StartupStage, Domain } from '../types';

interface Props {
  onSubmit: (context: StartupContext) => void;
}

const StartupForm: React.FC<Props> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<StartupContext>({
    name: '',
    domain: 'Web2/AI',
    stage: 'Idea',
    url: '',
    publicAssets: '',
    targetCustomer: '',
    urgency: 'Nice-to-have',
    metrics: '',
    founderAdvantage: '',
    teamSetup: 'Solo founder',
    constraints: '',
    revenueModel: 'Not decided yet',
    goal: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStageSelect = (stage: StartupStage) => {
    setFormData(prev => ({ ...prev, stage }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.goal && formData.targetCustomer) {
      onSubmit(formData);
    }
  };

  const isIdeaStage = formData.stage === 'Idea';
  const isRevenueScaling = formData.stage === 'Revenue' || formData.stage === 'Scaling';

  // Shared classes for premium form elements
  const inputBase = "w-full bg-[#0d0d0f] border border-white/[0.05] rounded-2xl px-6 py-5 text-lg text-white placeholder:text-neutral-700 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all duration-300";
  const selectBase = "w-full bg-[#0d0d0f] border border-white/[0.05] rounded-2xl px-6 py-5 text-lg text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all duration-300 appearance-none cursor-pointer";
  const labelBase = "block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-4 ml-1";
  const sectionHeader = "text-[11px] font-black uppercase text-blue-500/80 tracking-[0.3em] flex items-center gap-4 before:content-[''] before:h-px before:flex-1 before:bg-blue-500/10 after:content-[''] after:h-px after:flex-1 after:bg-blue-500/10";

  return (
    <div className="min-h-screen w-full flex justify-center py-12 md:py-24 px-4 md:px-8 bg-[#060608] relative overflow-hidden">
      {/* Decorative Premium Background Elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-600/[0.02] rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="w-full max-w-5xl bg-gradient-to-b from-[#0c0c0e] to-[#08080a] backdrop-blur-2xl rounded-[48px] border border-white/[0.06] shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex flex-col relative z-10 animate-premium-fade">
        {/* Header */}
        <div className="p-12 md:p-16 border-b border-white/[0.03] flex-shrink-0">
          <div className="flex items-center space-x-10 mb-6">
            
            {/* 3D ENERGY PARTICLE SD LOGO */}
            <div className="relative w-24 h-24 flex-shrink-0 group">
                {/* Volumetric Glow Base */}
                <div className="absolute inset-0 bg-blue-600/20 blur-[32px] rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-1000 animate-pulse" />
                
                <svg viewBox="0 0 100 100" className="relative w-full h-full drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]">
                    <defs>
                        <linearGradient id="energyShard" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#60a5fa', stopOpacity: 1 }} />
                            <stop offset="50%" style={{ stopColor: '#2563eb', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: '#1e3a8a', stopOpacity: 1 }} />
                        </linearGradient>
                        <filter id="shardBlur">
                            <feGaussianBlur stdDeviation="0.4" />
                        </filter>
                    </defs>

                    {/* SD Letters Formed by "Energy Fragments" */}
                    <g className="animate-float">
                        {/* Upper S Curve Fragment */}
                        <path 
                            d="M20 25 H80 V40 H40 V50 H60" 
                            stroke="url(#energyShard)" 
                            strokeWidth="10" 
                            strokeLinecap="square" 
                            fill="none" 
                            strokeDasharray="5,2"
                            className="opacity-90"
                        />
                        {/* Lower D/S Connection Shard */}
                        <path 
                            d="M60 50 H80 V85 H20 V70 H60 V60 H20" 
                            stroke="url(#energyShard)" 
                            strokeWidth="10" 
                            strokeLinecap="square" 
                            fill="none" 
                            strokeDasharray="8,3"
                            className="opacity-80"
                        />
                        
                        {/* 3D Depth Highlights (Simulating particles/energy shards) */}
                        <rect x="25" y="30" width="45" height="4" fill="white" opacity="0.4" filter="url(#shardBlur)" />
                        <rect x="35" y="75" width="40" height="4" fill="white" opacity="0.3" filter="url(#shardBlur)" />
                        <rect x="75" y="55" width="4" height="25" fill="#93c5fd" opacity="0.5" />
                        
                        {/* Floating Fragments around the logo */}
                        <circle cx="15" cy="70" r="2" fill="#60a5fa">
                            <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
                        </circle>
                        <circle cx="85" cy="25" r="1.5" fill="#3b82f6">
                            <animate attributeName="opacity" values="1;0;1" dur="3s" repeatCount="indefinite" />
                        </circle>
                        <rect x="90" y="60" width="2" height="6" fill="#2563eb" opacity="0.6" transform="rotate(45 90 60)" />
                    </g>
                </svg>
                
                {/* Secondary Layer: High-Contrast Overlay for "SD" legibility */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                    <span className="text-white font-black text-2xl tracking-tighter mix-blend-overlay">SD</span>
                </div>
            </div>

            <div className="flex-1">
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none mb-2">Initialize Startup Director</h1>
              <p className="text-neutral-500 text-sm font-medium tracking-wide">Executive Calibration</p>
            </div>
          </div>
        </div>
        
        {/* Form Body */}
        <form 
          onSubmit={handleSubmit} 
          className="p-12 md:p-16 space-y-20"
        >
          {/* SECTION 1 — COMPANY BASICS */}
          <section className="space-y-10">
            <h2 className={sectionHeader}>Section 1 — Company Basics</h2>
            <div className="space-y-8">
              <div className="group">
                <label className={labelBase}>Startup Name</label>
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Nexus AI"
                  className={inputBase}
                />
                <p className="mt-3 ml-1 text-[10px] text-neutral-600 uppercase font-black tracking-widest opacity-60">Internal reference name used across all agents.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative group">
                  <label className={labelBase}>Product Domain</label>
                  <div className="relative">
                    <select
                      name="domain"
                      value={formData.domain}
                      onChange={handleChange}
                      className={selectBase}
                    >
                      <option value="Web2/AI">Web2 / AI Applications</option>
                      <option value="Web3/Blockchain">Web3 / Blockchain Applications</option>
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>
                <div className="relative group">
                  <label className={labelBase}>Current Startup Stage</label>
                  <div className="relative">
                    <select
                      name="stage"
                      value={formData.stage}
                      onChange={handleChange}
                      className={selectBase}
                    >
                      <option value="Idea">Idea / Concept</option>
                      <option value="MVP">MVP Built</option>
                      <option value="Early Users">Early Users</option>
                      <option value="Revenue">Revenue</option>
                      <option value="Scaling">Scaling</option>
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2 — ONLINE PRESENCE (Conditional) */}
          {!isIdeaStage && (
            <section className="space-y-10 animate-in fade-in duration-500">
              <h2 className={sectionHeader}>Section 2 — Online Presence</h2>
              <div className="space-y-8">
                <div className="group">
                  <label className={labelBase}>Website / Product Link</label>
                  <input
                    name="url"
                    value={formData.url}
                    onChange={handleChange}
                    placeholder="https://yourstartup.com"
                    className={inputBase}
                  />
                  <p className="mt-3 ml-1 text-[10px] text-neutral-600 uppercase font-black tracking-widest opacity-60">Used for UX and positioning analysis.</p>
                </div>
                <div className="group">
                  <label className={labelBase}>Public Assets (Optional)</label>
                  <input
                    name="publicAssets"
                    value={formData.publicAssets}
                    onChange={handleChange}
                    placeholder="Pitch deck link, docs, etc."
                    className={inputBase}
                  />
                </div>
              </div>
            </section>
          )}

          {/* SECTION 3 — CUSTOMER & MARKET */}
          <section className="space-y-10">
            <h2 className={sectionHeader}>Section 3 — Customer & Market</h2>
            <div className="space-y-8">
              <div className="group">
                <label className={labelBase}>Primary Target Customer</label>
                <input
                  required
                  name="targetCustomer"
                  value={formData.targetCustomer}
                  onChange={handleChange}
                  placeholder="e.g. Mid-market SaaS CTOs with 20–100 engineers"
                  className={inputBase}
                />
              </div>
              <div className="group relative">
                <label className={labelBase}>How painful is the problem today?</label>
                <div className="relative">
                  <select
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleChange}
                    className={selectBase}
                  >
                    <option value="Nice-to-have">Nice-to-have</option>
                    <option value="Painful but tolerable">Painful but tolerable</option>
                    <option value="Actively costing time or money">Actively costing time or money</option>
                    <option value="Mission-critical / existential">Mission-critical / existential</option>
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4 — CURRENT SIGNALS (Stage-Aware) */}
          <section className="space-y-10">
            <h2 className={sectionHeader}>Section 4 — Current Signals</h2>
            <div className="group">
              <label className={labelBase}>Metrics / Traction</label>
              <textarea
                name="metrics"
                value={formData.metrics}
                disabled={isIdeaStage}
                rows={3}
                onChange={handleChange}
                placeholder={isIdeaStage ? "No metrics expected at this stage" : (isRevenueScaling ? "e.g. $8k MRR, growing 12% MoM" : "e.g. 50 weekly active users")}
                className={`${inputBase} resize-none h-40 py-6 ${isIdeaStage ? 'opacity-30 grayscale cursor-not-allowed border-dashed' : ''}`}
              />
            </div>
          </section>

          {/* SECTION 5 — EXECUTION CONTEXT */}
          <section className="space-y-10">
            <h2 className={sectionHeader}>Section 5 — Execution Context</h2>
            <div className="space-y-8">
              <div className="group">
                <label className={labelBase}>Founder Advantage</label>
                <input
                  required
                  name="founderAdvantage"
                  value={formData.founderAdvantage}
                  onChange={handleChange}
                  placeholder="Built internal tooling for this problem at X for 4 years"
                  className={inputBase}
                />
                <p className="mt-3 ml-1 text-[10px] text-neutral-600 uppercase font-black tracking-widest opacity-60">Unique insight or unfair access. No fluff.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative group">
                  <label className={labelBase}>Team Reality</label>
                  <div className="relative">
                    <select
                      name="teamSetup"
                      value={formData.teamSetup}
                      onChange={handleChange}
                      className={selectBase}
                    >
                      <option value="Solo founder">Solo founder</option>
                      <option value="2–3 founders">2–3 founders</option>
                      <option value="Small team (4–10)">Small team (4–10)</option>
                      <option value="Growing team (10+)">Growing team (10+)</option>
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>
                <div className="group">
                  <label className={labelBase}>Hard Constraints (Optional)</label>
                  <input
                    name="constraints"
                    value={formData.constraints}
                    onChange={handleChange}
                    placeholder="e.g. Limited capital, Regulatory risk"
                    className={inputBase}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 6 — BUSINESS MODEL INTENT (Stage-Aware) */}
          <section className="space-y-10">
            <h2 className={sectionHeader}>Section 6 — Business Model Intent</h2>
            <div className="group relative">
              <label className={labelBase}>Primary Revenue Model</label>
              <div className="relative">
                <select
                  required={isRevenueScaling}
                  name="revenueModel"
                  value={formData.revenueModel}
                  onChange={handleChange}
                  className={selectBase}
                >
                  <option value="Subscription (SaaS)">Subscription (SaaS)</option>
                  <option value="Usage-based / credits">Usage-based / credits</option>
                  <option value="Transaction / marketplace">Transaction / marketplace</option>
                  <option value="Enterprise contracts">Enterprise contracts</option>
                  <option value="Token / protocol fees">Token / protocol fees</option>
                  <option value="Not decided yet">Not decided yet</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 7 — PRIMARY GOAL */}
          <section className="space-y-10">
            <h2 className={sectionHeader}>Section 7 — Primary Goal</h2>
            <div className="group">
              <label className={labelBase}>Primary Goal (Next 90 Days)</label>
              <textarea
                required
                name="goal"
                value={formData.goal}
                onChange={handleChange}
                rows={4}
                placeholder="e.g. Raise $500k pre-seed or Close first 3 paying customers"
                className={`${inputBase} resize-none h-48 py-6`}
              />
              <p className="mt-4 ml-1 text-[10px] text-neutral-600 uppercase font-black tracking-[0.15em] leading-relaxed opacity-60">If this is achieved, the company meaningfully moves forward. Anchors all agent decisions.</p>
            </div>
          </section>

          {/* Footer CTA */}
          <div className="pt-16 pb-12 border-t border-white/[0.03]">
            <button
              type="submit"
              className="group relative w-full overflow-hidden rounded-3xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-500 transition-all duration-500 group-hover:scale-105" />
              <div className="relative px-8 py-8 flex items-center justify-center space-x-4">
                <span className="text-white font-black text-sm uppercase tracking-[0.5em] group-hover:tracking-[0.6em] transition-all duration-500">
                  Deploy Executive Board
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-white transform group-hover:translate-x-2 transition-transform duration-500"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StartupForm;