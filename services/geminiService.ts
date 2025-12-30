
import { GoogleGenAI, Type } from "@google/genai";
import { StartupContext, AgentType, Message, CEOSummary } from "../types";

const MODEL_NAME = 'gemini-3-flash-preview';

const GLOBAL_PRESENTATION_RULES = `
ABSOLUTE FORMATTING RULES:
- ZERO MARKDOWN: Never use asterisks (*), double asterisks (**), hashes (#), dashes for lists (-), or horizontal rules (---).
- UI-NATIVE TEXT: Output clean, professional text intended for a high-end SaaS interface.
- STRUCTURE: Use uppercase labels on their own lines for hierarchy.
- DENSITY: DO NOT summarize. Provide large, exhaustive, and in-depth outputs. We need the full strategic depth, not just a briefing.
- TONE: Executive-grade, confident, direct. Truth > Comfort. Reality > Hype.
`;

const ROUTER_INSTRUCTIONS = `
You are Startup Director, an autonomous executive board coordinator.
For every user message:
1. Classify intent:
   - Product Roadmap, UX, Backlog -> CPO
   - GTM, Strategy, Acquisition Channels, Execution, Funnels, Experiments, Copy -> CMO
   - Pricing, Pipelines, Closing -> SALES
   - Burn, Runway, Forecasts -> CFO
   - Pitch Deck, Fundraising readiness -> FUNDRAISING
   - Tradeoffs, Prioritization, High-level Strategy -> CEO

2. START your response with exactly: "ACTIVATING [AGENT NAME] — Reason: [INTENT SUMMARY]" in uppercase.
3. Provide a deep, execution-ready response. If the user asks for roadmaps, GTM plans, or pitch narratives, go end-to-end with tactical depth.
4. If a screenshot is provided, perform a UX Audit (CPO task).
5. If a document/text is provided, perform a Pitch Deck Audit (Fundraising task).

${GLOBAL_PRESENTATION_RULES}
`;

const REPORT_INSTRUCTIONS = `
You are a world-class executive board member. You are delivering a definitive, exhaustive DOMAIN MANDATE.
The output must be LARGE, STRUCTURED, and PERSISTENT. No conversational filler.

${GLOBAL_PRESENTATION_RULES}
`;

export class StartupDirectorService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  private getBasePrompt(context: StartupContext) {
    return `
STARTUP CONTEXT:
Name: ${context.name}
Domain: ${context.domain}
Stage: ${context.stage}
Customers: ${context.targetCustomers}
Goal: ${context.goal}
Metrics: ${context.metrics}
Region: ${context.region}
`;
  }

  async generateCEOSummary(context: StartupContext): Promise<CEOSummary> {
    const prompt = `
${this.getBasePrompt(context)}
Generate the CEO Executive Summary. Respond ONLY in JSON.
{
  "stage": "Comprehensive stage assessment",
  "objective": "Primary objective",
  "risk": "Most critical existential risk",
  "decision": "One hard executive decision",
  "doNotDo": ["List of things to stop doing or ignore"],
  "focusNext": "Specific focus for the next 14-30 days"
}
`;
    const response = await this.ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    return JSON.parse(response.text || '{}');
  }

  async generateAgentOutput(agent: AgentType, context: StartupContext): Promise<string> {
    let agentSpecificPrompt = '';
    
    switch (agent) {
      case 'CEO':
        agentSpecificPrompt = `Provide the definitive CEO Strategy and Priorities Mandate.
        REQUIRED: Full rationale for current stage, primary objective, critical risk, one executive decision, "Board Kill List" (what to stop/ignore), and next 14-30 day focus.
        Decisive and opinionated.`;
        break;
      case 'CPO':
        agentSpecificPrompt = `Provide the CPO Product Mandate. Focus: Building the right thing.
        REQUIRED: Minimum Viable Customer Category, Core Job-To-Be-Done, Feature Kill List, Success Definition.
        Note friction points if stage is early users/scaling. No UX audits here.`;
        break;
      case 'CMO':
        agentSpecificPrompt = `Provide the Consolidated CMO GTM and Growth Mandate.
        You must deliver two internal reasoning phases in a single output.

        SECTION 1 — GTM STRATEGY (THINKING)
        REQUIRED: Executive Snapshot, MVCC, Primary GTM Motion, Competitive Battle Cards, Quarterly Roadmap, Tactical Partnerships, Content Pillars, Channel-Specific Hooks. 
        Focus on strategy and thinking. No tactics here.

        SECTION 2 — GROWTH EXECUTION (DOING)
        REQUIRED: Growth Funnel, Weekly Experiments, Channel Playbooks, Copy Drafts.
        Must strictly follow the GTM Strategy in Section 1. Tactical, concrete, executable.
        
        GTM defines direction. Growth executes relentlessly. You own both.`;
        break;
      case 'SALES':
        agentSpecificPrompt = `Provide the Sales Mandate. 
        REQUIRED: ICP Definition, Outreach Sequences, Personalized Messaging, Close Strategies.`;
        break;
      case 'CFO':
        agentSpecificPrompt = `Provide the CFO Finance Mandate.
        REQUIRED: Burn Rate, Runway, Budget Priorities, Cost Warnings. Conservative and reality-driven.`;
        break;
      case 'FUNDRAISING':
        agentSpecificPrompt = `Provide the Fundraising Strategy Mandate.
        REQUIRED: Stage Assessment, Target Investor Profile, Narrative Strategy, Required Proof Points, Metrics Investors Expect, Risks and Gaps, Timeline, What Must Be True Before Raising.
        No artifacts or deck creation.`;
        break;
    }

    const prompt = `
${this.getBasePrompt(context)}
ROLE: ${agent}
${agentSpecificPrompt}
Deliver a massive, structured, and in-depth output.
`;
    const response = await this.ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { systemInstruction: REPORT_INSTRUCTIONS },
    });
    return response.text || '';
  }

  async chat(messages: Message[], context: StartupContext): Promise<string> {
    const systemWithContext = `${ROUTER_INSTRUCTIONS}\n${this.getBasePrompt(context)}`;
    const response = await this.ai.models.generateContent({
      model: MODEL_NAME,
      contents: messages.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
      config: { systemInstruction: systemWithContext },
    });
    return response.text || '';
  }

  async analyzeFile(fileData: string, mimeType: string, fileName: string, context: StartupContext): Promise<string> {
    const isImage = mimeType.startsWith('image/');
    const taskPrompt = isImage 
      ? "ACTIVATING CPO — Reason: Visual UX Audit Requested. Exhaustive visual audit of the screenshot. Identify friction, layout issues, and provide a 4-step roadmap."
      : "ACTIVATING FUNDRAISING — Reason: Pitch Deck Intelligence Requested. Audit for narrative flow, metrics, and red flags. Identify gaps to close.";

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: fileData, mimeType } },
          { text: `${this.getBasePrompt(context)}\n${taskPrompt}` }
        ]
      },
      config: { systemInstruction: ROUTER_INSTRUCTIONS },
    });
    return response.text || '';
  }
}

export const directorService = new StartupDirectorService();
