
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
PITCH DECK AUDIT MODE (HARD OVERRIDE):
When a pitch deck file (PDF or PPTX) is uploaded:
1. YOU MUST treat the uploaded file as the ONLY source of truth.
2. YOU MUST audit the actual content: Narrative coherence, Problem clarity, Market framing, Solution differentiation, Traction, Business model, Visuals, and Investor readiness.
3. YOU MUST NOT generate new slides, slide previews, thumbnails, or PPTX artifacts.
4. YOU MUST NOT invent a different company, brand, or narrative.
5. YOU MUST identify: What works, what is weak, what investors will challenge, and what is missing.
6. YOU MUST NOT assume internal project context if it contradicts the file.
7. YOUR OUTPUT must be textual analysis only.
`;

const PRESENTATION_ARTIFACT_INSTRUCTIONS = `
PRESENTATION ARTIFACT GENERATION MODE:
When the user requests a NEW pitch deck or Fundraising Agent is activated for deck creation (AND NO DECK IS UPLOADED):
1. YOU MUST NOT output text in chat.
2. YOU MUST NOT output JSON or [SLIDES] directly in the visible chat.
3. YOUR MISSION: Generate a structured sequence of slides.
4. Each slide must have a distinct layoutType (Title, Problem, Solution, Market, Traction, BusinessModel, Team, Ask).
5. For Traction and Market slides, provide numeric 'chartData' for visual rendering.
6. Provide specific 'visualGuidance' that describes the composition, icons, and diagrams needed.
`;

const GLOBAL_PRESENTATION_RULES = `
ABSOLUTE FORMATTING RULES:
- ZERO MARKDOWN: Never use asterisks, hashes, or dashes.
- UI-NATIVE TEXT: Output clean text for high-end SaaS.
- DENSITY: Provide exhaustive, in-depth strategic content.
- TONE: Direct, high-stakes executive tone.
`;

const ROUTER_INSTRUCTIONS = `
You are Startup Director, an autonomous executive board coordinator.
For every user message:
1. Classify intent:
   - PITCH DECK ATTACHED (PDF, PPTX) -> ACTIVATE PITCH DECK AUDIT MODE (FUNDRAISING AGENT).
   - NEW PITCH DECK REQUEST (NO ATTACHMENT) -> ACTIVATE Presentation Artifact Generation.
   - PITCH DECK TWEAKS (TO EXISTING ARTIFACT) -> Update the existing artifact.
   - DEFAULT -> Map to relevant C-Suite agent (CPO, CMO, SALES, CFO, CEO).

2. START your response with exactly: "ACTIVATING [AGENT NAME] — Reason: [INTENT SUMMARY]" in uppercase.

3. All agent responses must follow the EXECUTIVE COMMUNICATION STANDARD.
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
Generate a pitch deck based on the latest request.
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
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              visualGuidance: { type: Type.STRING },
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
      const prompt = `Generate a cinematic, minimalist, hyper-professional business graphic for a "${slide.layoutType}" slide in a tech pitch deck. Context: ${slide.title}. Background should be dark, abstract, and premium. No text in the image. 4k high-end SaaS aesthetic.`;
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
