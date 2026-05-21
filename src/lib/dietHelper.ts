import { Product, UserPreferences } from "../types";

export interface DietaryConflict {
  type: "diet" | "allergen";
  name: string;
  matchedKeyword: string;
}

/**
 * Analyzes a scanned product's ingredients and allergens to find matching conflicts with user dietary choices.
 * Searches with full English & Romanian localization vocabulary to ensure high accuracy.
 */
export function checkDietaryConflicts(product: Product, prefs: UserPreferences): DietaryConflict[] {
  const conflicts: DietaryConflict[] = [];
  if (!prefs) return conflicts;
  
  const ingredientsLower = (product.ingredients || "").toLowerCase();
  const allergensLower = (product.allergens || []).map(a => a.toLowerCase());
  
  // Custom helper to locate the presence of keywords in any form
  const containsAny = (keywords: string[]): string | null => {
    // 1. Search ingredients text
    for (const kw of keywords) {
      if (ingredientsLower.includes(kw)) {
        return kw;
      }
    }
    // 2. Search allergens array lists
    for (const kw of keywords) {
      for (const rawAllergent of allergensLower) {
        if (rawAllergent.includes(kw)) {
          return rawAllergent;
        }
      }
    }
    return null;
  };

  // Check Diets
  if (prefs.diets?.includes("lactose-free")) {
    const kw = containsAny(["lapte", "milk", "zer", "unt", "smântână", "smantana", "cazeină", "cazeina", "unt", "lactose", "lactoză", "brânză", "branza", "cașcaval", "cascaval", "iaurt", "whey", "butter", "cheese", "cream"]);
    if (kw) {
      conflicts.push({ type: "diet", name: "Fără Lactoză", matchedKeyword: kw });
    }
  }
  
  if (prefs.diets?.includes("gluten-free")) {
    const kw = containsAny(["gluten", "grâu", "grau", "secară", "secara", "orz", "ovăz", "ovaz", "făină", "faina", "grâușor", "wheat", "rye", "barley", "oats", "flour"]);
    if (kw) {
      conflicts.push({ type: "diet", name: "Fără Gluten", matchedKeyword: kw });
    }
  }

  if (prefs.diets?.includes("palm-oil-free")) {
    const kw = containsAny(["ulei de palmier", "palmier", "palmitat", "palm oil", "palm kernel"]);
    if (kw) {
      conflicts.push({ type: "diet", name: "Fără Ulei de Palmier", matchedKeyword: kw });
    }
  }

  if (prefs.diets?.includes("vegetarian")) {
    const kw = containsAny(["porc", "pui", "vită", "vita", "carne", "pește", "peste", "pasăre", "pasare", "melci", "scoici", "bacon", "șuncă", "sunca", "crenvurști", "crenvursti", "parizer", "salam", "cârnat", "carnat", "gelatină", "gelatina", "slănină", "slanina", "os", "oase", "meat", "pork", "beef", "chicken", "lard", "gelatine", "fish", "ham"]);
    if (kw) {
      conflicts.push({ type: "diet", name: "Vegetarian", matchedKeyword: kw });
    }
  }

  if (prefs.diets?.includes("vegan")) {
    const kw = containsAny([
      "porc", "pui", "vită", "vita", "carne", "pește", "peste", "pasăre", "pasare", "bacon", "șuncă", "sunca", "salam", "gelatină", "gelatina", "slănină", "slanina", "meat", "pork", "beef", "chicken", "lard", "gelatine", "fish", "ham",
      "lapte", "milk", "zer", "unt", "smântână", "smantana", "cazeină", "cazeina", "unt", "lactose", "lactoză", "brânză", "branza", "cașcaval", "cascaval", "iaurt", "whey", "butter", "cheese", "cream",
      "ou", "ouă", "oua", "egg", "eggs", "albuș", "albus", "gălbenuș", "galbenus",
      "miere", "honey"
    ]);
    if (kw) {
      conflicts.push({ type: "diet", name: "Vegan", matchedKeyword: kw });
    }
  }

  // Check Allergens
  if (prefs.allergens?.includes("peanuts")) {
    const kw = containsAny(["arahide", "alune", "peanut", "peanuts", "arachide", "arachis"]);
    if (kw) {
      conflicts.push({ type: "allergen", name: "Arahide / Alune", matchedKeyword: kw });
    }
  }

  if (prefs.allergens?.includes("nuts")) {
    const kw = containsAny(["nuci", "nucă", "nuca", "caju", "migdale", "fistic", "macadamia", "pecan", "almond", "cashew", "pistachio", "hazelnut", "walnut", "hazelnuts", "walnuts"]);
    if (kw) {
      conflicts.push({ type: "allergen", name: "Nuci (Migdale, Caju, etc.)", matchedKeyword: kw });
    }
  }

  if (prefs.allergens?.includes("soy")) {
    const kw = containsAny(["soia", "soy", "lecitină din soia", "lecitina din soia", "soya", "lecithin"]);
    if (kw) {
      conflicts.push({ type: "allergen", name: "Soia", matchedKeyword: kw });
    }
  }

  if (prefs.allergens?.includes("milk")) {
    const kw = containsAny(["lapte", "milk", "zer", "whey", "cazeină", "cazeina", "unt", "lactoză", "lactose", "butter", "cheese", "smântână", "smantana"]);
    if (kw) {
      conflicts.push({ type: "allergen", name: "Lapte", matchedKeyword: kw });
    }
  }

  if (prefs.allergens?.includes("eggs")) {
    const kw = containsAny(["ou", "ouă", "oua", "egg", "eggs", "albuș", "albus", "gălbenuș", "galbenus", "ovalbumină", "ovalbumina"]);
    if (kw) {
      conflicts.push({ type: "allergen", name: "Ouă", matchedKeyword: kw });
    }
  }

  if (prefs.allergens?.includes("gluten")) {
    const kw = containsAny(["gluten", "grâu", "grau", "secară", "secara", "orz", "ovăz", "ovaz", "făină", "faina", "wheat", "barley", "rye", "oats"]);
    if (kw) {
      conflicts.push({ type: "allergen", name: "Gluten", matchedKeyword: kw });
    }
  }

  if (prefs.allergens?.includes("sulfites")) {
    const kw = containsAny(["sulfit", "sulfiți", "sulfiti", "anidridă sulfuroasă", "anidrida sulfuroasa", "conservant", "sulfite", "sulfites", "preservative", "e220", "e221", "e222", "e223", "e224", "e228"]);
    if (kw) {
      conflicts.push({ type: "allergen", name: "Sulfiți / Conservanți", matchedKeyword: kw });
    }
  }

  return conflicts;
}
