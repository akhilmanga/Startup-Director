
export type StartupStage = 'Idea' | 'MVP' | 'Early Users' | 'Revenue' | 'Scaling';
export type Domain = 'Web2/AI' | 'Web3/Blockchain';

export interface StartupContext {
  name: string;
  domain: Domain;
  stage: StartupStage;
  url?: string;
  publicAssets?: string;
  targetCustomer: string;
  urgency: string;
  metrics: string;
  founderAdvantage: string;
  teamSetup: string;
  constraints?: string;
  revenueModel: string;
  goal: string;
}

export type AgentType = 'CEO' | 'CPO' | 'CMO' | 'SALES' | 'CFO' | 'FUNDRAISING';

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface PitchDeckSlide {
  title: string;
  content: string;
  visualGuidance: string;
  layoutType: 'Title' | 'Problem' | 'Solution' | 'Market' | 'Traction' | 'BusinessModel' | 'Team' | 'Ask';
  chartData?: ChartDataPoint[];
  imageUrl?: string;
}

export interface Message {
  role: 'user' | 'model';
  content: string;
  agent?: AgentType;
  images?: { data: string; mimeType: string }[];
  files?: { data: string; mimeType: string; name: string }[];
  isModeSelection?: boolean;
  isDeckGeneration?: boolean;
  slides?: PitchDeckSlide[];
}

export interface CEOSummary {
  stage: string;
  objective: string;
  risk: string;
  decision: string;
  doNotDo: string[];
  focusNext: string;
}
