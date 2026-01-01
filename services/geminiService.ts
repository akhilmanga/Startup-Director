
import { GoogleGenAI, Type } from "@google/genai";
import { StartupContext, AgentType, Message, CEOSummary, PitchDeckSlide } from "../types";

// Complex Text Tasks (advanced reasoning) should use gemini-3-pro-preview
const MODEL_NAME = 'gemini-3-pro-preview';
const IMAGE_MODEL = 'gemini-2.5-flash-image';

const GLOBAL_PRESENTATION_RULES = `
ABSOLUTE FORMATTING RULES:
- ZERO MARKDOWN: Never use asterisks (*), double asterisks (**), hashes (#), dashes for lists (-), or horizontal rules (---).
- UI-NATIVE TEXT: Output clean, professional text intended for a high-end SaaS interface.
- STRUCTURE: Use uppercase labels on their own lines for hierarchy.
- DENSITY: DO NOT summarize. Provide large, exhaustive, and in-depth outputs.
- TONE: Executive-grade, confident, direct.
`;

const ROUTER_INSTRUCTIONS = `
You are Startup Director, an autonomous executive board coordinator.
For every user message:
1. Classify intent:
   - PITCH DECK CREATION (e.g. "Create a pitch deck", "Build a deck") -> INTERCEPT: DO NOT GENERATE. RESPOND WITH "MODE_SELECTION_REQUIRED".
   - DOCUMENTS ATTACHED (PDF, PPT, PPTX) -> AUTOMATICALLY ACTIVATE FUNDRAISING AGENT (DECK EVALUATION)
   - IMAGES ATTACHED -> AUTOMATICALLY ACTIVATE CPO AGENT (UX AUDIT)
   - Product Roadmap, UX, Backlog -> CPO
   - GTM, Strategy, Acquisition Channels -> CMO
   - Pricing, Pipelines, Closing -> SALES
   - Burn, Runway, Forecasts -> CFO
   - Tradeoffs, Prioritization -> CEO
   - General questions default to CEO Agent.

2. FUNDRAISING DECK GENERATION (FOR SELECTED MODES):
   Once mode is selected (Pre-Traction, Early Users, Traction), generate a slide-by-slide investor-ready deck.
   EACH SLIDE MUST FOLLOW THIS JSON FORMAT (One per slide):
   {
     "title": "SLIDE TITLE",
     "content": "DETAILED BODY CONTENT (NO MARKDOWN)",
     "visualGuidance": "DETAILED VISUAL/CHART/GRAPHIC DESCRIPTION"
   }
   Respond with a list of slides wrapped in [SLIDES] ... [/SLIDES] tags.

3. START your response with exactly: "ACTIVATING [AGENT NAME] — Reason: [INTENT SUMMARY]" in uppercase.
${GLOBAL_PRESENTATION_RULES}
`;

export class StartupDirectorService {
  private ai: GoogleGenAI;

  constructor() {
    // API key must be obtained exclusively from process.env.API_KEY
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private getBasePrompt(context: StartupContext) {
    return `
STARTUP CALIBRATION CONTEXT:
Name: ${context.name}
Domain: ${context.domain}
Stage: ${context.stage}
URL: ${context.url || 'N/A'}
Assets: ${context.publicAssets || 'None provided'}
Target Customer: ${context.targetCustomer}
Problem Urgency: ${context.urgency}
Founder Advantage: ${context.founderAdvantage}
Team Reality: ${context.teamSetup}
Revenue Model: ${context.revenueModel}
Metrics/Signals: ${context.metrics}
Constraints: ${context.constraints || 'None specified'}
Primary 90-Day Goal: ${context.goal}
`;
  }

  async generateCEOSummary(context: StartupContext): Promise<CEOSummary> {
    const prompt = `
${this.getBasePrompt(context)}
Generate the CEO Executive Summary. Respond ONLY in JSON.
`;
    // Configured responseSchema for strict JSON output compliance
    const response = await this.ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            stage: {
              type: Type.STRING,
              description: "Comprehensive stage assessment",
            },
            objective: {
              type: Type.STRING,
              description: "Primary objective",
            },
            risk: {
              type: Type.STRING,
              description: "Most critical existential risk",
            },
            decision: {
              type: Type.STRING,
              description: "One hard executive decision",
            },
            doNotDo: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of things to stop doing or ignore",
            },
            focusNext: {
              type: Type.STRING,
              description: "Specific focus for the next 14-30 days",
            }
          },
          propertyOrdering: ["stage", "objective", "risk", "decision", "doNotDo", "focusNext"],
        }
      },
    });
    // Property .text is used directly on GenerateContentResponse
    return JSON.parse(response.text || '{}');
  }

  async generateAgentOutput(agent: AgentType, context: StartupContext): Promise<string> {
    const prompt = `
${this.getBasePrompt(context)}
ROLE: ${agent}
Deliver a massive, structured, and in-depth output.
${GLOBAL_PRESENTATION_RULES}
`;
    const response = await this.ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || '';
  }

  async chat(messages: Message[], context: StartupContext): Promise<string> {
    const systemWithContext = `${ROUTER_INSTRUCTIONS}\n${this.getBasePrompt(context)}`;
    
    const formattedContents = messages.map(m => {
      const parts: any[] = [{ text: m.content }];
      if (m.images) {
        m.images.forEach(img => {
          parts.push({ inlineData: { data: img.data, mimeType: img.mimeType } });
        });
      }
      if (m.files) {
        m.files.forEach(file => {
          parts.push({ inlineData: { data: file.data, mimeType: file.mimeType } });
        });
      }
      return { role: m.role, parts };
    });

    const response = await this.ai.models.generateContent({
      model: MODEL_NAME,
      contents: formattedContents,
      config: { systemInstruction: systemWithContext },
    });
    return response.text || '';
  }

  async generateSlideImage(slide: PitchDeckSlide): Promise<string | undefined> {
    try {
      const prompt = `Generate a high-quality, professional, minimalist business slide background or graphic for a pitch deck slide titled: "${slide.title}". Visual context: ${slide.visualGuidance}. Dark theme, premium aesthetic.`;
      // Use generateContent for gemini-2.5-flash-image
      const response = await this.ai.models.generateContent({
        model: IMAGE_MODEL,
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "16:9" } }
      });
      
      // Iterating through all parts to find the image part
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
