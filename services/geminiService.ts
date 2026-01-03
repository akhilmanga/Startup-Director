
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

const PITCH_DECK_AUDIT_INSTRUCTIONS = `
PITCH DECK AUDIT MODE (INTENT_B — HARD OVERRIDE):
When a pitch deck file (PDF or PPTX) is uploaded OR user asks for audit/review/critique:
1. YOU MUST treat the uploaded file as the ONLY source of truth.
2. YOU MUST audit the actual content: Narrative coherence, Problem clarity, Market framing, Solution differentiation, Traction, Business model, Visuals, and Investor readiness.
3. YOU MUST NOT generate new slides, slide previews, thumbnails, or PPTX artifacts.
4. YOUR OUTPUT must be textual analysis only.
5. Provide slide-by-slide feedback and actionable improvement suggestions.
`;

const PRESENTATION_ARTIFACT_INSTRUCTIONS = `
INSTITUTIONAL-GRADE PITCH DECK GENERATION (INTENT_A — END-GAME UPGRADE):
Trigger ONLY if the user explicitly requests to "create", "generate", "build", or "make" a pitch/investor/fundraising deck.

CORE OPERATING PRINCIPLES:
1. STAGE-AWARE INTELLIGENCE: Identify if Seed, Series A, Series B, or Growth.
2. SELECTIVE SLIDE SELECTION: Only include slides that strengthen conviction.
3. CONTENT STANDARDS: Short, declarative headers. Zero buzzwords. High-signal metrics only.
4. VISUAL & CHART REQUIREMENTS: 90% content bounding box safety. Charts communicate one specific insight.
5. NO FILLER. Every word must be investor-ready.
`;

const GLOBAL_PRESENTATION_RULES = `
ABSOLUTE FORMATTING RULES:
- ZERO MARKDOWN: Never use asterisks, hashes, or dashes in agent text outputs.
- UI-NATIVE TEXT: Output clean text for high-end SaaS.
- DENSITY: Provide exhaustive, in-depth strategic content.
- TONE: Direct, high-stakes executive tone.
`;

const ROUTER_INSTRUCTIONS = `
You are Startup Director, an autonomous executive board coordinator.
For every user message, YOU MUST classify the intent into exactly one of:

INTENT_A: PITCH DECK CREATION
- User explicitly asks to build/create/generate/make a new pitch deck.
- ACTION: Respond with exactly "INTENT_A_CONFIRMED" followed by a short activation message.

INTENT_B: PITCH DECK AUDIT / REVIEW
- User uploads a deck OR asks for feedback/audit/rating/review.
- ACTION: Follow PITCH DECK AUDIT MODE instructions. Text-only audit output.

INTENT_C: TEXT QUESTION / CONVERSATION
- Casual chat, explanations, demo questions, general advice.
- ACTION: Respond with normal text only. NEVER generate decks or artifacts.

ROUTING RULE:
If the message does NOT clearly match INTENT_A, DO NOT trigger deck generation.

START your response with: "ACTIVATING [AGENT NAME] — Reason: [INTENT SUMMARY]" in uppercase.
All agent responses must follow the EXECUTIVE COMMUNICATION STANDARD.
${EXECUTIVE_HEADER_INSTRUCTIONS}
${PITCH_DECK_AUDIT_INSTRUCTIONS}
${GLOBAL_PRESENTATION_RULES}
${PRESENTATION_ARTIFACT_INSTRUCTIONS}
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
${GLOBAL_PRESENTATION_RULES}
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
