import { GoogleGenAI } from "@google/genai";
import { GEMINI_SYSTEM_INSTRUCTION } from '../constants';
import { PolicyAction } from '../types';

// Initialize Gemini Client
const apiKey = process.env.API_KEY || ''; // In a real app, ensure this is set
const ai = new GoogleGenAI({ apiKey });

interface InterpretedPolicy {
  actions: PolicyAction[];
  reasoning: string;
}

export const interpretPolicy = async (inputText: string): Promise<InterpretedPolicy> => {
  if (!apiKey) {
    console.warn("No API Key provided. Returning mock response.");
    return mockPolicyResponse(inputText);
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: inputText,
      config: {
        systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);
    return data as InterpretedPolicy;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return mockPolicyResponse(inputText);
  }
};

export const getAIRecommendations = async (currentMetrics: any): Promise<string> => {
   if (!apiKey) {
    return "Optimize signal timing at Intersection 2-2 to reduce congestion by 15%. Consider congestion pricing on vertical corridors.";
  }

  try {
    const prompt = `Current City Metrics: 
    Congestion: ${currentMetrics.congestionIndex}
    Emissions: ${currentMetrics.emissions}
    
    Recommend 2 short, high-impact policy actions to improve these metrics.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No recommendations available.";
  } catch (e) {
    return "Unable to fetch recommendations.";
  }
}

// Fallback for demo without API Key
const mockPolicyResponse = (text: string): InterpretedPolicy => {
  const lower = text.toLowerCase();
  const actions: PolicyAction[] = [];
  
  if (lower.includes('close') && lower.includes('downtown')) {
    actions.push({
      type: 'close_road',
      target_tag: 'downtown',
      description: 'Close all roads leading to City Center',
      value: 0
    });
  } else if (lower.includes('speed') || lower.includes('limit')) {
    actions.push({
      type: 'modify_speed',
      target_tag: 'all',
      value: 30,
      description: 'Reduce global speed limit to 30'
    });
  } else {
    actions.push({
      type: 'adjust_capacity',
      target_tag: 'downtown',
      value: 0.5,
      description: 'Restrict capacity in city center (generic fallback)'
    });
  }

  return {
    actions,
    reasoning: "Simulating policy interpretation (Mock Mode: Add API Key for full AI)."
  };
};
