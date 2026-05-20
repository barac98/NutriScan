import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export default async function handler(req: any, res: any) {
  // CORS configuration for Vercel if needed, though they are on the same domain usually
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { image, barcode, ingredientsText } = req.body;

  try {
    let prompt = "Analizează acest produs alimentar.";
    if (barcode) {
      prompt += `\nCod de bare: ${barcode}`;
    }
    if (ingredientsText) {
      prompt += `\nText ingrediente: ${ingredientsText}`;
    }

    const contents: any[] = [{ text: prompt }];
    if (image) {
      contents.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: image,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: contents },
      config: {
        systemInstruction: "Ești un expert nutriționist român de elită. Analizezi produse alimentare din imagini, coduri de bare sau text de ingrediente. Răspunsurile tale sunt extrem de concise, scurte și precise, limitate la câteva cuvinte pe fiecare câmp. NU genera eseuri sau texte repetitive. Limba de răspuns este exclusiv Română. Răspunde strict în format JSON.",
        responseMimeType: "application/json",
        maxOutputTokens: 1000,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { 
              type: Type.STRING, 
              description: "Numele scurt al produsului. Maxim 5 cuvinte." 
            },
            brand: { 
              type: Type.STRING, 
              description: "Brandul produsului. Maxim 3 cuvinte. Folosește 'Necunoscut' dacă nu este vizibil." 
            },
            ingredients: { 
              type: Type.STRING, 
              description: "Ingredientele principale separate prin virgulă. Maxim 20 de cuvinte." 
            },
            nutrition: {
              type: Type.OBJECT,
              description: "Informații nutriționale per 100g sau porție.",
              properties: {
                energy: { type: Type.STRING, description: "Valoare energie, ex: 150 kcal. Folosește '-' dacă nu este detaliat." },
                fat: { type: Type.STRING, description: "Cifra + g, ex: 5g. Folosește '-' dacă nu este detaliat." },
                carbs: { type: Type.STRING, description: "Cifra + g, ex: 25g. Folosește '-' dacă nu este detaliat." },
                protein: { type: Type.STRING, description: "Cifra + g, ex: 3g. Folosește '-' dacă nu este detaliat." },
                salt: { type: Type.STRING, description: "Cifra + g, ex: 0.2g. Folosește '-' dacă nu este detaliat." }
              }
            },
            allergens: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Listă scurtă de alergeni prezenți (ex: Lapte, Gluten). Maxim 4 elemente."
            },
            healthAssessment: { 
              type: Type.STRING, 
              description: "O singură frază ultra-scurtă de evaluare. Maxim 15 cuvinte." 
            },
            healthScore: { 
              type: Type.NUMBER, 
              description: "Scor de sănătate de la 0 la 100 (100 fiind cel mai sănătos)." 
            },
            origin: { 
              type: Type.STRING, 
              description: "Țara de origine scurtă. Maxim 3 cuvinte. Folosește 'Necunoscut' dacă nu se identifică." 
            },
            sustainability: { 
              type: Type.STRING, 
              description: "Sustenabilitate sau ambalaj, extrem de scurt. Maxim 8 cuvinte." 
            },
            alternatives: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "2 alternative mai sănătoase din aceeași categorie."
            }
          }
        }
      },
    });

    const responseText = response.text || "{}";
    
    // Multi-layer JSON repair and parsing function
    const parseGeminiResponse = (text: string) => {
      let cleaned = text.trim();
      
      const tryParse = (str: string) => {
        try {
          return JSON.parse(str);
        } catch {
          return null;
        }
      };

      // 1. Direct parse attempt
      let parsed = tryParse(cleaned);
      if (parsed) return parsed;

      // 2. Clear markdown wraps
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.substring(7);
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.substring(3);
      }
      if (cleaned.endsWith("```")) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
      }
      cleaned = cleaned.trim();

      parsed = tryParse(cleaned);
      if (parsed) return parsed;

      // 3. Regex repair process
      let fixed = cleaned;
      
      // A. Fix unquoted keys
      fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
      
      // B. Fix single quoted keys
      fixed = fixed.replace(/([{,]\s*)'([a-zA-Z_][a-zA-Z0-9_]*)'\s*:/g, '$1"$2":');
      
      // C. Fix trailing commas
      fixed = fixed.replace(/,\s*([}\]])/g, '$1');

      parsed = tryParse(fixed);
      if (parsed) return parsed;

      console.warn("All JSON repairs failed. Raw content:", text);
      
      // Safe fallback structure
      return {
        name: "Produs Analizat",
        brand: "Necunoscut",
        ingredients: "Informații indisponibile temporar.",
        nutrition: {
          energy: "-",
          fat: "-",
          carbs: "-",
          protein: "-",
          salt: "-"
        },
        allergens: [],
        healthAssessment: "Nu s-a putut genera evaluarea din cauza unui format nevalid în răspunsul JSON.",
        healthScore: 50,
        origin: "Necunoscut",
        sustainability: "Necunoscut",
        alternatives: []
      };
    };

    return res.status(200).json(parseGeminiResponse(responseText));
  } catch (error: any) {
    console.error("Gemini error:", error);
    return res.status(500).json({ error: "Eroare la analiza produsului." });
  }
}
