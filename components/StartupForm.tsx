
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
    targetCustomers: '',
    region: 'Global',
    metrics: 'No metrics yet.',
    goal: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.goal) {
      onSubmit(formData);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0a]">
      <div className="max-w-xl w-full bg-[#111] p-8 rounded-2xl border border-[#222] shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-2">Initialize Startup Director</h1>
        <p className="text-neutral-400 mb-8">Deploy your autonomous executive board. Be precise.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Startup Name</label>
              <input
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Nexus AI"
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Domain</label>
              <select
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="Web2/AI">Web2 / AI Applications</option>
                <option value="Web3/Blockchain">Web3 / Blockchain</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Stage</label>
              <select
                name="stage"
                value={formData.stage}
                onChange={handleChange}
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="Idea">Idea / concept</option>
                <option value="MVP">MVP</option>
                <option value="Early Users">Early Users</option>
                <option value="Revenue">Revenue</option>
                <option value="Scaling">Scaling</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Region</label>
              <input
                name="region"
                value={formData.region}
                onChange={handleChange}
                placeholder="e.g. US / EU / Global"
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Target Customers</label>
            <input
              required
              name="targetCustomers"
              value={formData.targetCustomers}
              onChange={handleChange}
              placeholder="e.g. Mid-market SaaS CTOs"
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Current Metrics</label>
            <textarea
              name="metrics"
              value={formData.metrics}
              onChange={handleChange}
              rows={2}
              placeholder="DAU, MRR, Burn, or 'None'"
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Primary Goal (Next 90 Days)</label>
            <textarea
              required
              name="goal"
              value={formData.goal}
              onChange={handleChange}
              rows={3}
              placeholder="What must happen for you to win?"
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
          >
            Deploy Board
          </button>
        </form>
      </div>
    </div>
  );
};

export default StartupForm;
