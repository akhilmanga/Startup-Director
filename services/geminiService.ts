
import { GoogleGenAI, Type } from "@google/genai";
import { StartupContext, AgentType, Message, CEOSummary, PitchDeckSlide } from "../types";

const MODEL_NAME = 'gemini-3-pro-preview';
const IMAGE_MODEL = 'gemini-2.5-flash-image';

const PRESENTATION_ARTIFACT_INSTRUCTIONS = `
PRESENTATION ARTIFACT GENERATION MODE:
When the user requests a pitch deck or Fundraising Agent is activated for deck creation:
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
   - PITCH DECK CREATION -> ACTIVATE Presentation Artifact Generation.
   - PITCH DECK TWEAKS/MODIFICATIONS -> Update the existing artifact.
   - DOCUMENTS ATTACHED (PDF, PPTX) -> EVALUATE as FUNDRAISING Agent.
   - DEFAULT -> Map to relevant C-Suite agent (CPO, CMO, SALES, CFO, CEO).

2. START your response with exactly: "ACTIVATING [AGENT NAME] — Reason: [INTENT SUMMARY]" in uppercase.
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
      parts: [{ text: m.content }, ...(m.images?.map(i => ({ inlineData: { data: i.data, mimeType: i.mimeType } })) || [])]
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
