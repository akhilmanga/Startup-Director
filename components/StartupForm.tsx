
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

  return (
    <div className="min-h-screen w-full flex justify-center py-12 md:py-24 px-4 md:px-8 bg-[#08080a]">
      <div className="w-full max-w-5xl bg-[#0c0c0e] rounded-[48px] border border-neutral-800/40 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-10 md:p-14 border-b border-neutral-800/30 flex-shrink-0">
          <div className="flex items-center space-x-4 mb-3">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-2xl shadow-blue-600/20">SD</div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Initialize Startup Director</h1>
          </div>
          <p className="text-neutral-500 text-base font-light">Executive Calibration — Stage-Aware Signal Analysis</p>
        </div>
        
        {/* Form Body */}
        <form 
          onSubmit={handleSubmit} 
          className="p-10 md:p-14 space-y-16"
        >
          {/* SECTION 1 — COMPANY BASICS */}
          <section className="space-y-8">
            <h2 className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em]">Section 1 — Company Basics</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-tight mb-3">Startup Name</label>
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Nexus AI"
                  className="w-full bg-[#141416] border border-neutral-800/60 rounded-xl px-5 py-4 text-lg text-white focus:outline-none focus:border-blue-600 transition-all placeholder:text-neutral-700"
                />
                <p className="mt-2 text-[10px] text-neutral-600 uppercase font-medium">Internal reference name used across all agents.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-tight mb-3">Product Domain</label>
                  <select
                    name="domain"
                    value={formData.domain}
                    onChange={handleChange}
                    className="w-full bg-[#141416] border border-neutral-800/60 rounded-xl px-5 py-4 text-lg text-white focus:outline-none focus:border-blue-600 transition-all appearance-none"
                  >
                    <option value="Web2/AI">Web2 / AI Applications</option>
                    <option value="Web3/Blockchain">Web3 / Blockchain Applications</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-tight mb-3">Current Startup Stage</label>
                  <select
                    name="stage"
                    value={formData.stage}
                    onChange={handleChange}
                    className="w-full bg-[#141416] border border-neutral-800/60 rounded-xl px-5 py-4 text-lg text-white focus:outline-none focus:border-blue-600 transition-all appearance-none"
                  >
                    <option value="Idea">Idea / Concept</option>
                    <option value="MVP">MVP Built</option>
                    <option value="Early Users">Early Users</option>
                    <option value="Revenue">Revenue</option>
                    <option value="Scaling">Scaling</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2 — ONLINE PRESENCE (Conditional) */}
          {!isIdeaStage && (
            <section className="space-y-8 animate-in fade-in duration-500">
              <h2 className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em]">Section 2 — Online Presence</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-tight mb-3">Website / Product Link</label>
                  <input
                    name="url"
                    value={formData.url}
                    onChange={handleChange}
                    placeholder="https://yourstartup.com"
                    className="w-full bg-[#141416] border border-neutral-800/60 rounded-xl px-5 py-4 text-lg text-white focus:outline-none focus:border-blue-600 transition-all placeholder:text-neutral-700"
                  />
                  <p className="mt-2 text-[10px] text-neutral-600 uppercase font-medium">Used for UX and positioning analysis.</p>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-tight mb-3">Public Assets (Optional)</label>
                  <input
                    name="publicAssets"
                    value={formData.publicAssets}
                    onChange={handleChange}
                    placeholder="Pitch deck link, docs, etc."
                    className="w-full bg-[#141416] border border-neutral-800/60 rounded-xl px-5 py-4 text-lg text-white focus:outline-none focus:border-blue-600 transition-all placeholder:text-neutral-700"
                  />
                </div>
              </div>
            </section>
          )}

          {/* SECTION 3 — CUSTOMER & MARKET */}
          <section className="space-y-8">
            <h2 className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em]">Section 3 — Customer & Market</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-tight mb-3">Primary Target Customer</label>
                <input
                  required
                  name="targetCustomer"
                  value={formData.targetCustomer}
                  onChange={handleChange}
                  placeholder="e.g. Mid-market SaaS CTOs with 20–100 engineers"
                  className="w-full bg-[#141416] border border-neutral-800/60 rounded-xl px-5 py-4 text-lg text-white focus:outline-none focus:border-blue-600 transition-all placeholder:text-neutral-700"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-tight mb-3">How painful is the problem today?</label>
                <select
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleChange}
                  className="w-full bg-[#141416] border border-neutral-800/60 rounded-xl px-5 py-4 text-lg text-white focus:outline-none focus:border-blue-600 transition-all appearance-none"
                >
                  <option value="Nice-to-have">Nice-to-have</option>
                  <option value="Painful but tolerable">Painful but tolerable</option>
                  <option value="Actively costing time or money">Actively costing time or money</option>
                  <option value="Mission-critical / existential">Mission-critical / existential</option>
                </select>
              </div>
            </div>
          </section>

          {/* SECTION 4 — CURRENT SIGNALS (Stage-Aware) */}
          <section className="space-y-8">
            <h2 className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em]">Section 4 — Current Signals</h2>
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-tight mb-3">Metrics / Traction</label>
              <textarea
                name="metrics"
                value={formData.metrics}
                onChange={handleChange}
                disabled={isIdeaStage}
                rows={3}
                placeholder={isIdeaStage ? "No metrics expected at this stage" : (isRevenueScaling ? "e.g. $8k MRR, growing 12% MoM" : "e.g. 50 weekly active users")}
                className={`w-full bg-[#141416] border border-neutral-800/60 rounded-xl px-5 py-4 text-lg text-white focus:outline-none transition-all resize-none placeholder:text-neutral-700 ${isIdeaStage ? 'opacity-50 cursor-not-allowed' : 'focus:border-blue-600'}`}
              />
            </div>
          </section>

          {/* SECTION 5 — EXECUTION CONTEXT */}
          <section className="space-y-8">
            <h2 className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em]">Section 5 — Execution Context</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-tight mb-3">Founder Advantage</label>
                <input
                  required
                  name="founderAdvantage"
                  value={formData.founderAdvantage}
                  onChange={handleChange}
                  placeholder="Built internal tooling for this problem at X for 4 years"
                  className="w-full bg-[#141416] border border-neutral-800/60 rounded-xl px-5 py-4 text-lg text-white focus:outline-none focus:border-blue-600 transition-all placeholder:text-neutral-700"
                />
                <p className="mt-2 text-[10px] text-neutral-600 uppercase font-medium">Unique insight or unfair access. No fluff.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-tight mb-3">Team Reality</label>
                  <select
                    name="teamSetup"
                    value={formData.teamSetup}
                    onChange={handleChange}
                    className="w-full bg-[#141416] border border-neutral-800/60 rounded-xl px-5 py-4 text-lg text-white focus:outline-none focus:border-blue-600 transition-all appearance-none"
                  >
                    <option value="Solo founder">Solo founder</option>
                    <option value="2–3 founders">2–3 founders</option>
                    <option value="Small team (4–10)">Small team (4–10)</option>
                    <option value="Growing team (10+)">Growing team (10+)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-tight mb-3">Hard Constraints (Optional)</label>
                  <input
                    name="constraints"
                    value={formData.constraints}
                    onChange={handleChange}
                    placeholder="e.g. Limited capital, Regulatory risk"
                    className="w-full bg-[#141416] border border-neutral-800/60 rounded-xl px-5 py-4 text-lg text-white focus:outline-none focus:border-blue-600 transition-all placeholder:text-neutral-700"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 6 — BUSINESS MODEL INTENT (Stage-Aware) */}
          <section className="space-y-8">
            <h2 className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em]">Section 6 — Business Model Intent</h2>
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-tight mb-3">Primary Revenue Model</label>
              <select
                required={isRevenueScaling}
                name="revenueModel"
                value={formData.revenueModel}
                onChange={handleChange}
                className="w-full bg-[#141416] border border-neutral-800/60 rounded-xl px-5 py-4 text-lg text-white focus:outline-none focus:border-blue-600 transition-all appearance-none"
              >
                <option value="Subscription (SaaS)">Subscription (SaaS)</option>
                <option value="Usage-based / credits">Usage-based / credits</option>
                <option value="Transaction / marketplace">Transaction / marketplace</option>
                <option value="Enterprise contracts">Enterprise contracts</option>
                <option value="Token / protocol fees">Token / protocol fees</option>
                <option value="Not decided yet">Not decided yet</option>
              </select>
            </div>
          </section>

          {/* SECTION 7 — PRIMARY GOAL */}
          <section className="space-y-8">
            <h2 className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em]">Section 7 — Primary Goal</h2>
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-tight mb-3">Primary Goal (Next 90 Days)</label>
              <textarea
                required
                name="goal"
                value={formData.goal}
                onChange={handleChange}
                rows={4}
                placeholder="e.g. Raise $500k pre-seed or Close first 3 paying customers"
                className="w-full bg-[#141416] border border-neutral-800/60 rounded-xl px-5 py-4 text-lg text-white focus:outline-none focus:border-blue-600 transition-all resize-none placeholder:text-neutral-700"
              />
              <p className="mt-3 text-[10px] text-neutral-600 uppercase font-medium leading-relaxed">If this is achieved, the company meaningfully moves forward. Anchors all agent decisions.</p>
            </div>
          </section>

          {/* Footer CTA */}
          <div className="pt-12 pb-6">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-[0.4em] py-7 rounded-3xl transition-all shadow-2xl shadow-blue-900/10 active:scale-[0.99] transform hover:-translate-y-1"
            >
              Deploy Executive Board
            </button>
            <p className="mt-6 text-center text-[11px] text-neutral-700 font-bold uppercase tracking-widest">Initialization Complete. Secure Connection.</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StartupForm;
