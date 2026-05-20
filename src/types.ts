export interface Product {
  barcode?: string;
  name: string;
  brand: string;
  ingredients: string;
  nutrition: {
    energy?: string;
    fat?: string;
    carbs?: string;
    protein?: string;
    salt?: string;
  };
  allergens: string[];
  healthAssessment: string;
  healthScore: number;
  origin?: string;
  sustainability?: string;
  alternatives: string[];
}

export interface HistoryItem {
  id: string;
  barcode: string;
  productName: string;
  healthScore: number;
  scannedAt: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  barcode?: string;
  checked: boolean;
  createdAt: string;
}

export interface UserPreferences {
  allergens: string[];
}
