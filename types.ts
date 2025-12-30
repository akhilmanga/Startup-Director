
export type StartupStage = 'Idea' | 'MVP' | 'Early Users' | 'Revenue' | 'Scaling';
export type Domain = 'Web2/AI' | 'Web3/Blockchain';

export interface StartupContext {
  name: string;
  domain: Domain;
  stage: StartupStage;
  targetCustomers: string;
  region: string;
  metrics: string;
  goal: string;
}

export type AgentType = 'CEO' | 'CPO' | 'CMO' | 'SALES' | 'CFO' | 'FUNDRAISING';

export interface Message {
  role: 'user' | 'model';
  content: string;
  agent?: AgentType;
}

export interface CEOSummary {
  stage: string;
  objective: string;
  risk: string;
  decision: string;
  doNotDo: string[];
  focusNext: string;
}
