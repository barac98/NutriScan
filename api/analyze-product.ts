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
    const prompt = `
      Ești un expert nutriționist român. Analizează acest produs alimentar.
      Dacă este un cod de bare: "${barcode || ''}", caută-l.
      Dacă este o imagine, analizează produsul alimentar reprezentat (poate fi ambalajul, tabelul nutrițional sau lista de ingrediente) și extrage informațiile despre el.
      Dacă este text de ingrediente: "${ingredientsText || ''}", analizează-l directly.
      
      Te rog să returnezi informațiile în limba română în format JSON:
      {
        "name": "Numele produsului",
        "brand": "Brand-ul",
        "ingredients": "Lista completă de ingrediente",
        "nutrition": {
          "energy": "kcal/100g",
          "fat": "grame",
          "carbs": "grame",
          "protein": "grame",
          "salt": "grame"
        },
        "allergens": ["listă de alergeni detectați"],
        "healthAssessment": "O scurtă explicație de max 2 propoziții dacă e sănătos sau nu și de ce",
        "healthScore": număr de la 0 la 100 (100 = foarte sănătos),
        "origin": "Informații despre originea produsului (dacă sunt disponibile)",
        "sustainability": "Informații despre sustenabilitate sau ambalaj (dacă sunt disponibile)",
        "alternatives": ["2-3 alternative mai sănătoase din aceeași categorie"]
      }
      
      Dacă nu poți găsi informațiile, returnează un obiect cu un câmp "error".
    `;

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
      model: "gemini-3-flash-preview",
      contents: { parts: contents },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            brand: { type: Type.STRING },
            ingredients: { type: Type.STRING },
            nutrition: {
              type: Type.OBJECT,
              properties: {
                energy: { type: Type.STRING },
                fat: { type: Type.STRING },
                carbs: { type: Type.STRING },
                protein: { type: Type.STRING },
                salt: { type: Type.STRING }
              }
            },
            allergens: { type: Type.ARRAY, items: { type: Type.STRING } },
            healthAssessment: { type: Type.STRING },
            healthScore: { type: Type.NUMBER },
            origin: { type: Type.STRING },
            sustainability: { type: Type.STRING },
            alternatives: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      },
    });

    return res.status(200).json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Gemini error:", error);
    return res.status(500).json({ error: "Eroare la analiza produsului." });
  }
}
