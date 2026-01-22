
import { GoogleGenAI, Type } from "@google/genai";
import { StartupContext, AgentType, Message, CEOSummary, PitchDeckSlide } from "../types";

const MODEL_NAME = 'gemini-3-pro-preview';
const IMAGE_MODEL = 'gemini-2.5-flash-image';

const EXECUTIVE_HEADER_INSTRUCTIONS = `
EXECUTIVE COMMUNICATION STANDARD (MANDATORY):
1. Every report MUST start with this exact header block:
TO: [Recipient]
FROM: [Agent Role]
SUBJECT: [Directive-style headline]
SUMMARY:

2. RECIPIENT RULES:
   - If ROLE is CEO: TO: Founder / User, FROM: CEO Agent
   - Otherwise: TO: CEO Agent, FROM: [Specific Agent Role] (e.g., CPO Agent, CMO Agent)

3. SUBJECT RULES:
   - Must be a directive-style headline (e.g., OPERATION REVENUE VELOCITY).
   - Core mandate or decision oriented.
   - FULL UPPERCASE.
   - No punctuation except slashes.
   - NO DATES.

4. TERMINATION RULE:
   - Every report MUST end with a decisive final paragraph, followed by the exact phrase on its own line:
Execution required.
`;

const QUANTIFICATION_UPGRADE_INSTRUCTIONS = `
EXECUTIVE QUANTIFICATION & DECISION ANCHOR (STRATEGIC INTENT ONLY):
When the intent is Strategic Decision or Execution Planning:

1. QUANTIFICATION RULES:
   - Augment reasoning with lightweight, decision-grade quantification.
   - Use RANGES (e.g., +10–20%), not single points.
   - State assumptions briefly (e.g., "Assuming CAC remains stable...").
   - Directional impact (↑ / ↓) and time-bound expectations (60–90 days).

2. DECISION ANCHOR (APPEND TO END):
   Decision Anchor:
   - Primary metric impacted
   - Expected direction of change (↑ / ↓)
   - Estimated magnitude (range)
   - Confidence level (Low / Medium / High)
   - Time horizon

3. RISK ACKNOWLEDGEMENT (APPEND TO END):
   If This Fails, It Will Be Because:
   - One flawed assumption
   - One execution risk
   - One external risk
   (Be direct, specific, and avoid hedging.)

DOMAIN METRICS:
- Web2/AI: activation, retention (D7/D30), ARPU, CAC/LTV, inference cost.
- Web3/Blockchain: active wallets, protocol TVL, audit participation, submission quality, DAO engagement.
`;

const PITCH_DECK_AUDIT_INSTRUCTIONS = `
PITCH DECK AUDIT MODE (INTENT_B — HARD OVERRIDE):
When a pitch deck file (PDF or PPTX) is uploaded OR user asks for audit/review/critique:
1. YOU MUST treat the uploaded file as the ONLY source of truth.
2. YOU MUST audit the actual content: Narrative coherence, Problem clarity, Market framing, Solution differentiation, Traction, Business model, Visuals, and Investor readiness.
3. YOU MUST NOT generate new slides, slide previews, thumbnails, or PPTX artifacts.
4. YOUR OUTPUT must be textual analysis only. No Decision Anchors or Failure sections.
5. Provide slide-by-slide feedback and actionable improvement suggestions.
`;

const PRESENTATION_ARTIFACT_INSTRUCTIONS = `
INSTITUTIONAL-GRADE PITCH DECK GENERATION (INTENT_A):
Trigger ONLY if the user explicitly requests to "create", "generate", "build", or "make" a pitch deck.
1. Deliver presentation-ready slide content in JSON.
2. NO Decision Anchors or Failure sections.
`;

const GLOBAL_PRESENTATION_RULES = `
ABSOLUTE FORMATTING RULES:
- ZERO MARKDOWN: Never use asterisks, hashes, or dashes in agent text outputs.
- UI-NATIVE TEXT: Output clean text for high-end SaaS.
- DENSITY: Provide exhaustive, in-depth strategic content.
- TONE: Executive, decisive, calm, no filler.
`;

const ROUTER_INSTRUCTIONS = `
You are Startup Director, an autonomous executive board coordinator.
Before generating any response, internally classify the user request into ONE intent type:

1. STRATEGIC DECISION / EXECUTION PLANNING (e.g., GTM plans, Roadmaps, Sales strategy, Finance):
   - ACTION: Apply ALL quantification rules, append Decision Anchor, and append "If This Fails, It Will Be Because".
   
2. ARTIFACT CREATION (e.g., Pitch deck creation, Investor narratives):
   - ACTION: Deliver clean, presentation-ready output. DO NOT include Decision Anchors or Failure sections.

3. DIAGNOSTIC / AUDIT (e.g., UX audits, Deck reviews, Critiques):
   - ACTION: Deliver deep analysis. DO NOT include Decision Anchors or Failure sections.

This classification is internal and must never be mentioned.
Always start with "ACTIVATING [AGENT NAME] — Reason: [INTENT SUMMARY]" in uppercase.
${EXECUTIVE_HEADER_INSTRUCTIONS}
${QUANTIFICATION_UPGRADE_INSTRUCTIONS}
${GLOBAL_PRESENTATION_RULES}
`;

export class StartupDirectorService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private getBasePrompt(context: StartupContext) {
    return `
STARTUP CALIBRATION CONTEXT:
Name: ${context.name}
Domain: ${context.domain}
Stage: ${context.stage}
URL: ${context.url || 'N/A'}
Target: ${context.targetCustomer}
Traction: ${context.metrics}
Revenue: ${context.revenueModel}
Goal: ${context.goal}
`;
  }

  async generateCEOSummary(context: StartupContext): Promise<CEOSummary> {
    const prompt = `
${this.getBasePrompt(context)}
Generate the CEO Executive Summary. Respond ONLY in JSON.
`;
    const response = await this.ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            stage: { type: Type.STRING },
            objective: { type: Type.STRING },
            risk: { type: Type.STRING },
            decision: { type: Type.STRING },
            doNotDo: { type: Type.ARRAY, items: { type: Type.STRING } },
            focusNext: { type: Type.STRING }
          }
        }
      },
    });
    return JSON.parse(response.text || '{}');
  }

  async generateAgentOutput(agent: AgentType, context: StartupContext): Promise<string> {
    const prompt = `
${this.getBasePrompt(context)}
ROLE: ${agent}
Deliver a massive, structured, and in-depth strategic mandate.
This is a board-level directive. Apply Strategic Decision quantification and Anchors.
${GLOBAL_PRESENTATION_RULES}
${QUANTIFICATION_UPGRADE_INSTRUCTIONS}
${EXECUTIVE_HEADER_INSTRUCTIONS}
`;
    const response = await this.ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || '';
  }

  async generateDeckArtifact(context: StartupContext, userPrompt: string, history: Message[]): Promise<PitchDeckSlide[]> {
    const systemInstruction = `
${PRESENTATION_ARTIFACT_INSTRUCTIONS}
${this.getBasePrompt(context)}
Generate an institutional-grade pitch deck. Be opinionated and selective.
`;
    const response = await this.ai.models.generateContent({
      model: MODEL_NAME,
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Short, declarative, high-impact header." },
              content: { type: Type.STRING, description: "Institutional-grade, proof-heavy copy. No fluff." },
              visualGuidance: { type: Type.STRING, description: "Detailed cinematic direction for the design team." },
              layoutType: { 
                type: Type.STRING, 
                enum: ['Title', 'Problem', 'Solution', 'Market', 'Traction', 'BusinessModel', 'Team', 'Ask'] 
              },
              chartData: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.NUMBER }
                  }
                }
              }
            },
            required: ['title', 'content', 'visualGuidance', 'layoutType']
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  }

  async chat(messages: Message[], context: StartupContext): Promise<string> {
    const systemWithContext = `${ROUTER_INSTRUCTIONS}\n${this.getBasePrompt(context)}`;
    const formattedContents = messages.map(m => ({
      role: m.role,
      parts: [
        { text: m.content }, 
        ...(m.images?.map(i => ({ inlineData: { data: i.data, mimeType: i.mimeType } })) || []),
        ...(m.files?.map(f => ({ inlineData: { data: f.data, mimeType: f.mimeType } })) || [])
      ]
    }));

    const response = await this.ai.models.generateContent({
      model: MODEL_NAME,
      contents: formattedContents,
      config: { systemInstruction: systemWithContext },
    });
    return response.text || '';
  }

  async generateSlideImage(slide: PitchDeckSlide): Promise<string | undefined> {
    try {
      const prompt = `Cinematic, hyper-professional, minimalist business photography for a "${slide.layoutType}" pitch slide. Theme: ${slide.visualGuidance}. Dark aesthetic, high-contrast, premium 4k SaaS style. Zero text in image.`;
      const response = await this.ai.models.generateContent({
        model: IMAGE_MODEL,
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "16:9" } }
      });
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return part.inlineData.data;
      }
    } catch (e) {
      console.error("Image gen failed", e);
    }
    return undefined;
  }
}

export const directorService = new StartupDirectorService();
