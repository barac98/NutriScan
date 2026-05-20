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
    let openFoodFactsData: any = null;

    if (barcode) {
      try {
        console.log(`Fetching from Open Food Facts for barcode: ${barcode}`);
        // Fetch product information by barcode from open food facts
        const offRes = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`, {
          headers: {
            'User-Agent': 'NutriScanRO - WebApp - Version 1.0.0 (baracsammuel@gmail.com)'
          }
        });
        if (offRes.ok) {
          const offJson: any = await offRes.json();
          if (offJson.status === 1 && offJson.product) {
            openFoodFactsData = offJson.product;
            console.log(`Successfully found product on Open Food Facts: ${offJson.product.product_name || "unnamed"}`);
          }
        }
      } catch (err) {
        console.error("Open Food Facts fetch error:", err);
      }
    }

    let prompt = "Analizează acest produs alimentar.";
    
    if (openFoodFactsData) {
      // Ground Gemini's expert analysis with verified Open Food Facts data
      prompt += `\nAm găsit date oficiale în baza de date Open Food Facts:
- Nume Produs: ${openFoodFactsData.product_name_ro || openFoodFactsData.product_name || 'Necunoscut / Identificat greșit'}
- Brand/Marcă: ${openFoodFactsData.brands || 'Necunoscut'}
- Ingrediente înregistrate: ${openFoodFactsData.ingredients_text_ro || openFoodFactsData.ingredients_text || 'Informații ingrediente nedisponibile direct'}
- Nutriție per 100g/ml:
  * Energie Kcal: ${openFoodFactsData.nutriments?.['energy-kcal_100g'] ?? openFoodFactsData.nutriments?.['energy-kcal'] ?? openFoodFactsData.nutriments?.['energy_100g'] ?? '-'}
  * Grăsimi total: ${openFoodFactsData.nutriments?.fat_100g ?? openFoodFactsData.nutriments?.fat ?? '-'}g
  * Carbohidrați total: ${openFoodFactsData.nutriments?.carbohydrates_100g ?? openFoodFactsData.nutriments?.carbohydrates ?? '-'}g
  * Proteine: ${openFoodFactsData.nutriments?.proteins_100g ?? openFoodFactsData.nutriments?.proteins ?? '-'}g
  * Sare: ${openFoodFactsData.nutriments?.salt_100g ?? openFoodFactsData.nutriments?.salt ?? '-'}g
- Alergeni: ${openFoodFactsData.allergens || openFoodFactsData.allergens_from_ingredients || openFoodFactsData.allergens_tags?.join(', ') || 'Niciunul identificat'}
- Țară Origină/Fabricare: ${openFoodFactsData.origins || openFoodFactsData.countries || 'Necunoscută'}
- Ambalaj/Sustenabilitate: ${openFoodFactsData.packaging || openFoodFactsData.packaging_text || 'Ambalaj nereclamat ca reciclabil'}

Notează acest cod de bare real pentru stocare: ${barcode || 'N/A'}.
Te rog folosește aceste date ultra-sigure de analiză ca bază de pornire certă. Notează că scorul de sănătate (healthScore), evaluarea nutrițională românească (healthAssessment) și alternativele optime (reale, vândute în mod obișnuit în Europa) trebuie calculate de tine profesionist și obiectiv pe baza datelor nutriționale de mai sus.`;
    } else {
      if (barcode) {
        prompt += `\nCod de bare: ${barcode}`;
      }
      if (ingredientsText) {
        prompt += `\nText ingrediente: ${ingredientsText}`;
      }
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
        systemInstruction: "Ești un expert nutriționist român de elită. Analizezi produse alimentare din imagini, coduri de bare sau text de ingrediente. Răspunsurile tale sunt extrem de concise, scurte și precise, limitate la câteva cuvinte pe fiecare câmp. NU genera eseuri sau texte repetitive. Limba de răspuns este exclusiv Română. Răspunde strict în format JSON conform schemei furnizate.",
        responseMimeType: "application/json",
        maxOutputTokens: 2048,
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
              },
              required: ["energy", "fat", "carbs", "protein", "salt"]
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
          },
          required: ["name", "brand", "ingredients", "nutrition", "allergens", "healthAssessment", "healthScore", "origin", "sustainability", "alternatives"]
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

    res.json(parseGeminiResponse(responseText));
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
