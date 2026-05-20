import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Gemini setup
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.use(express.json({ limit: '10mb' }));

// API: Analyze product from image or text (barcode/ingredients)
app.post("/api/analyze-product", async (req, res) => {
  const { image, barcode, ingredientsText } = req.body;

  try {
    const prompt = `
      Ești un expert nutriționist român. Analizează acest produs alimentar.
      Dacă este un cod de bare: "${barcode}", caută-l.
      Dacă este o imagine, analizează produsul alimentar reprezentat (poate fi ambalajul, tabelul nutrițional sau lista de ingrediente) și extrage informațiile despre el.
      Dacă este text de ingrediente: "${ingredientsText}", analizează-l directly.
      
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

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Gemini error:", error);
    res.status(500).json({ error: "Eroare la analiza produsului." });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
