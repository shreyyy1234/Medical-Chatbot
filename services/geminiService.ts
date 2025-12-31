
import { GoogleGenAI } from "@google/genai";
import { DiabetesInput, HeartInput, AnemiaInput, PredictionResult, Hospital, GeoLocation, MedicalResponse } from "../types";

// Read Vite env (import.meta.env) when running in the browser, otherwise fall back to process.env
const viteEnv = (typeof import.meta !== 'undefined') ? (import.meta as any).env : {};
const USE_LOCAL_SVC = (viteEnv?.VITE_USE_LOCAL_SVC === 'true') || (process.env && process.env.USE_LOCAL_SVC === 'true');
const LOCAL_SVC_URL_BASE = viteEnv?.VITE_LOCAL_SVC_URL || process.env.LOCAL_SVC_URL || 'http://127.0.0.1:8001';

const API_KEY = process.env.API_KEY || '';

if (!API_KEY) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const SYSTEM_INSTRUCTION = `
You are MediBot, a specialized Medical AI.
1. EXPERT TRAINING: You use SFT (Supervised Fine-Tuning) + SVC Logic.
2. TONE: Human-like, warm, empathetic, but extremely CONCISE and SHORT.
3. FORMATTING: 
   - NEVER use long paragraphs. 
   - Use short bullet points.
   - Use simple language.
4. MULTILINGUAL: You MUST output the final response in the User's Selected Language.

MANDATORY JSON OUTPUT STRUCTURE:
You must return a JSON object.
IF the user input is a GREETING, QUESTION about you, or CHIT-CHAT (e.g. "Hi", "Who are you?", "What is your problem?"):
  - set "isMedical": false
  - provide a warm "generalReply" in the target language.
  - Leave other fields null/empty.

IF the user input is a SYMPTOM or MEDICAL CONCERN:
  - set "isMedical": true
  - diagnosis: Short title (e.g., "Common Cold").
  - description: ONE sentence explanation.
  - symptoms: List of 3-4 key symptoms (short).
  - medications: List of 3-4 generic OTC safe meds.
  - diet: List of 3-4 recommended foods.
  - workout: List of 3-4 simple exercises.
  - precautions: List of 3-4 important safety precautions.
  - recommendedSpecialist: The type of doctor to visit (e.g., "General Physician", "Cardiologist").
  - locationQuestion: A polite phrase in the target language asking: "Shall I find the nearest [Specialist] for you?"

IF the user provides a MEDICAL REPORT (PDF/Image):
  - set "isMedical": true
  - diagnosis: "Medical Report Analysis"
  - description: Summary of the report findings and patient status.
  - symptoms: List of IDENTIFIED DEFICIENCIES (e.g., "Low Vitamin D", "Iron Deficiency").
  - medications: List of SUGGESTED SUPPLEMENTS for the deficiencies.
  - diet: Foods to improve the specific deficiencies.
  - workout: Lifestyle tips relevant to the findings.
  - precautions: Key health warnings based on the report.
  - recommendedSpecialist: The specialist relevant to the report findings.
`;

const parseJSONSafely = (text: string): any => {
  try {
    return JSON.parse(text);
  } catch (e) {
    let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstOpen = cleaned.indexOf('{');
    const lastClose = cleaned.lastIndexOf('}');
    if (firstOpen !== -1 && lastClose !== -1) {
      cleaned = cleaned.substring(firstOpen, lastClose + 1);
      try {
        return JSON.parse(cleaned);
      } catch (e2) {
        console.error("Failed to parse extracted JSON:", e2);
        throw e2;
      }
    }
    throw e;
  }
};

export const getGeminiChatResponse = async (
  message: string, 
  targetLanguage: string,
  attachment?: { mimeType: string, data: string }
): Promise<{
  originalLanguage: string;
  englishInput: string;
  structuredResponse: MedicalResponse;
}> => {
  try {
    // Construct parts array
    const parts: any[] = [];
    
    // Add attachment if present (For PDF analysis)
    if (attachment) {
      parts.push({
        inlineData: {
          mimeType: attachment.mimeType,
          data: attachment.data
        }
      });
      parts.push({ text: "Analyze this attached medical report. Identify deficiencies and suggest supplements." });
    }

    parts.push({ text: message || "Analyze the provided document." });

    const prompt = `
      Input Language: Detect automatically.
      Target Output Language: ${targetLanguage}.
      User Message: "${message.replace(/"/g, '\\"')}"

      TASK:
      1. Translate User Message to English.
      2. Analyze if this is a MEDICAL request, REPORT ANALYSIS, or GENERAL conversation.
      3. Generate the appropriate JSON.
      
      RETURN JSON ONLY:
      {
        "originalLanguage": "Detected Language",
        "englishInput": "Translated English Input",
        "structuredResponse": {
            "isMedical": boolean,
            "generalReply": "Reply if not medical (else null)",
            "diagnosis": "Short Title (or null)",
            "description": "One sentence description (or null)",
            "symptoms": ["Symptom/Deficiency 1", "Symptom/Deficiency 2"],
            "medications": ["Med/Supplement 1", "Med/Supplement 2"],
            "diet": ["Food 1", "Food 2"],
            "workout": ["Tip 1", "Tip 2"],
            "precautions": ["Precaution 1", "Precaution 2"],
            "recommendedSpecialist": "Doctor Type",
            "locationQuestion": "Translate: 'Shall I find the nearest hospital?'"
        }
      }
    `;
    
    // Add the prompt text to the parts
    parts.push({ text: prompt });
    
    const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: parts },
        config: {
            systemInstruction: SYSTEM_INSTRUCTION
        }
    });

    const text = result.text || "{}";
    const parsed = parseJSONSafely(text);
    return parsed;

  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return {
        originalLanguage: "Unknown",
        englishInput: "Error",
        structuredResponse: {
            isMedical: false,
            generalReply: "I am having trouble processing that request. Please try again.",
            diagnosis: "Error",
            description: "I could not process that request. Please try again.",
            symptoms: [],
            medications: [],
            diet: [],
            workout: [],
            precautions: [],
            recommendedSpecialist: "General Physician",
            locationQuestion: "Please try again."
        }
    };
  }
};

export const predictDiabetes = async (data: DiabetesInput): Promise<PredictionResult> => {
  // If a local SVC server is configured, call it first. This allows running classical ML
  // models locally (scikit-learn) while keeping the rest of the app unchanged.
  if (USE_LOCAL_SVC) {
    try {
      const LOCAL_SVC_URL = LOCAL_SVC_URL_BASE;
      const res = await fetch(`${LOCAL_SVC_URL}/predict/diabetes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Local SVC error: ${text}`);
      }
      const parsed = await res.json();
      return {
        riskPercentage: parsed.riskPercentage ?? 0,
        diagnosis: parsed.diagnosis || 'Unknown',
        recommendations: parsed.recommendations || [],
        recommendedSpecialist: parsed.recommendedSpecialist || 'Endocrinologist',
        disclaimer: parsed.disclaimer || 'Consult a doctor.'
      };
    } catch (e) {
      console.error('Local SVC diabetes error:', e);
      // fallback to prompt-based LLM prediction below
    }
  }

  const prompt = `
    Act as a trained SVC (Support Vector Classifier) model for Diabetes Prediction.
    Input Data: ${JSON.stringify(data)}
    Logic: High Glucose (>140), High BMI (>30), and Age are strong indicators.
    Return JSON: { "riskPercentage": number, "diagnosis": "string", "recommendations": ["string"], "recommendedSpecialist": "Endocrinologist", "disclaimer": "string" }
  `;
  return runPredictionModel(prompt);
};

export const predictHeartDisease = async (data: HeartInput): Promise<PredictionResult> => {
    if (USE_LOCAL_SVC) {
      try {
        const LOCAL_SVC_URL = LOCAL_SVC_URL_BASE;
        const res = await fetch(`${LOCAL_SVC_URL}/predict/heart`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Local SVC error: ${text}`);
        }
        const parsed = await res.json();
        return {
          riskPercentage: parsed.riskPercentage ?? 0,
          diagnosis: parsed.diagnosis || 'Unknown',
          recommendations: parsed.recommendations || [],
          recommendedSpecialist: parsed.recommendedSpecialist || 'Cardiologist',
          disclaimer: parsed.disclaimer || 'Consult a doctor.'
        };
      } catch (e) {
        console.error('Local SVC heart error:', e);
      }
    }

    const prompt = `
      Act as a trained SVC model for Heart Disease Prediction.
      Input Data: ${JSON.stringify(data)}
      Return JSON: { "riskPercentage": number, "diagnosis": "string", "recommendations": ["string"], "recommendedSpecialist": "Cardiologist", "disclaimer": "string" }
    `;
    return runPredictionModel(prompt);
};

export const predictAnemia = async (data: AnemiaInput): Promise<PredictionResult> => {
    if (USE_LOCAL_SVC) {
      try {
        const LOCAL_SVC_URL = LOCAL_SVC_URL_BASE;
        const res = await fetch(`${LOCAL_SVC_URL}/predict/anemia`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Local SVC error: ${text}`);
        }
        const parsed = await res.json();
        return {
          riskPercentage: parsed.riskPercentage ?? 0,
          diagnosis: parsed.diagnosis || 'Unknown',
          recommendations: parsed.recommendations || [],
          recommendedSpecialist: parsed.recommendedSpecialist || 'Hematologist',
          disclaimer: parsed.disclaimer || 'Consult a doctor.'
        };
      } catch (e) {
        console.error('Local SVC anemia error:', e);
      }
    }

    const prompt = `
      Act as a trained SVC model for Anemia Prediction.
      Input Data: ${JSON.stringify(data)}
      Return JSON: { "riskPercentage": number, "diagnosis": "string", "recommendations": ["string"], "recommendedSpecialist": "Hematologist", "disclaimer": "string" }
    `;
    return runPredictionModel(prompt);
};

const runPredictionModel = async (prompt: string): Promise<PredictionResult> => {
    try {
        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        const parsed = parseJSONSafely(result.text || "{}");
        return {
            riskPercentage: parsed.riskPercentage ?? 0,
            diagnosis: parsed.diagnosis || "Unknown",
            recommendations: parsed.recommendations || [],
            recommendedSpecialist: parsed.recommendedSpecialist || "General Physician",
            disclaimer: parsed.disclaimer || "Consult a doctor."
        };
    } catch (e) {
        return { riskPercentage: 0, diagnosis: "Error", recommendations: [], recommendedSpecialist: "Doctor", disclaimer: "Error" };
    }
};

// Internal helper to search specifically for a place category
const searchPlaces = async (location: GeoLocation, category: string, count: number, language: string): Promise<{ places: Hospital[], summary: string }> => {
    const prompt = `
        CURRENT_LOCATION: Latitude ${location.lat}, Longitude ${location.lng}.
        
        TASK: Find the top ${count} ${category} that are STRICTLY NEAREST to the CURRENT_LOCATION.
        
        CRITICAL RULES:
        1. SEARCH RADIUS: Focus on places within 5km if possible.
        2. SORTING: Absolute closest distance first.
        3. QUERY: Use the Google Maps tool with the term "${category}".
        
        OUTPUT TEXT:
        Generate a short text summary listing the names and distances.
        Format: "[Name] is [Distance] km away."
        Translate summary to ${language}.
    `;

    try {
        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleMaps: {} }],
                toolConfig: {
                    retrievalConfig: {
                        latLng: { latitude: location.lat, longitude: location.lng }
                    }
                }
            }
        });

        const candidates = result.candidates;
        const places: Hospital[] = [];
        const resultText = result.text || "";

        if (candidates && candidates[0]?.groundingMetadata?.groundingChunks) {
            const chunks = candidates[0].groundingMetadata.groundingChunks;
            
            for (const chunk of chunks) {
                const c = chunk as any;
                const title = c.maps?.title || c.web?.title;
                const uri = c.maps?.uri || c.web?.uri;

                if (title && uri) {
                    // Extract distance from text response using regex matching the place name
                    let dist = "Nearby";
                    // Regex looks for the Name followed by some text and then a number + km/miles
                    const distanceRegex = new RegExp(`${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*?(\\d+(\\.\\d+)?)\\s*(km|miles|m)`, 'i');
                    const match = resultText.match(distanceRegex);
                    if (match) {
                        dist = `${match[1]} ${match[3]}`;
                    }
                    
                    places.push({
                        name: title,
                        address: "View Map for directions", // Maps grounding doesn't always give full address string in chunks, URI is better
                        distance: dist,
                        phone: "+91 44 2xxx xxxx", 
                        googleMapsUri: uri,
                        type: category.toUpperCase().includes('PHARMACY') ? 'PHARMACY' : 'HOSPITAL',
                    });
                }
            }
        }
        return { places: places.slice(0, count), summary: resultText };

    } catch (error) {
        console.error(`Error searching ${category}:`, error);
        return { places: [], summary: "" };
    }
};

export const findNearbyHospitals = async (location: GeoLocation, language: string = 'English', includePharmacies: boolean = false): Promise<{ hospitals: Hospital[], pharmacies: Hospital[], text: string }> => {
    try {
        // Run hospital search
        const hospitalSearch = searchPlaces(location, "Hospitals", 4, language);
        
        // Run pharmacy search if requested, otherwise resolve to empty
        const pharmacySearch = includePharmacies 
            ? searchPlaces(location, "Pharmacies", 3, language) 
            : Promise.resolve({ places: [], summary: "" });

        const [hospitalRes, pharmacyRes] = await Promise.all([hospitalSearch, pharmacySearch]);

        return {
            hospitals: hospitalRes.places,
            pharmacies: pharmacyRes.places as Hospital[],
            text: hospitalRes.summary + (includePharmacies ? "\n" + pharmacyRes.summary : "")
        };
    } catch (error) {
        console.error("Map Error", error);
        return { hospitals: [], pharmacies: [], text: "Could not fetch location data." };
    }
}
