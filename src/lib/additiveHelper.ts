export interface FoodAdditive {
  code: string;
  name: string;
  danger: "low" | "medium" | "high";
  description: string;
  keywords: string[];
}

export const ADDITIVES_DATABASE: FoodAdditive[] = [
  {
    code: "E120",
    name: "Cochonilă / Carmin",
    danger: "high",
    description: "Colorant roșu natural obținut din insecte zdrobite. Poate provoca reacții alergice severe, astm, urticarie și hiperactivitate la copii.",
    keywords: ["carmin", "cochonila", "cochineal", "acid carminic", "e120", "e-120"]
  },
  {
    code: "E250",
    name: "Nitrit de sodiu",
    danger: "high",
    description: "Conservant utilizat intensiv în mezeluri pentru mentinerea culorii roz și prevenirea botulismului. În stomac se poate transforma în nitrosamine carcinogene.",
    keywords: ["nitrit de sodiu", "sodium nitrite", "e250", "e-250"]
  },
  {
    code: "E251",
    name: "Nitrat de sodiu",
    danger: "high",
    description: "Conservant pentru produse din carne. Are riscuri similare cu E250, fiind asociat cu generarea de compuși periculoși la digestie și afecțiuni tiroidiene.",
    keywords: ["nitrat de sodiu", "sodium nitrate", "e251", "e-251"]
  },
  {
    code: "E621",
    name: "Glutamat monosodic (MSG)",
    danger: "high",
    description: "Potențiator de gust extrem de comun. Poate cauza dureri de cap intense, palpitații cardiace (numit 'sindromul restaurantului chinezesc') și are potențial neurotoxic.",
    keywords: ["glutamat monosodic", "monosodium glutamate", "msg", "glutamat de sodiu", "m.s.g.", "potentiator de aroma", "potentiator de gust", "e621", "e-621"]
  },
  {
    code: "E951",
    name: "Aspartam",
    danger: "high",
    description: "Îndulcitor artificial foarte răspândit în băuturi carbogazoase dietetice. Este clasificat ca 'posibil cancerigen pentru oameni' de către OMS și poate favoriza migrene.",
    keywords: ["aspartam", "aspartame", "e951", "e-951"]
  },
  {
    code: "E950",
    name: "Acesulfam de potasiu",
    danger: "medium",
    description: "Îndulcitor de sinteză mult mai dulce decât zahărul folosit în produse necarbogazoase. Sursa unor dezbateri privind efectul perturbator asupra florei microbiene.",
    keywords: ["acesulfam", "acesulfame", "acesulfam-k", "e950", "e-950"]
  },
  {
    code: "E330",
    name: "Acid citric",
    danger: "low",
    description: "Regulator natural de aciditate și conservant extras din citrice. Este sigur pentru consum, însă în concentrații exagerate poate ataca smalțul dinților.",
    keywords: ["acid citric", "citric acid", "sare de lamaie", "e330", "e-330"]
  },
  {
    code: "E300",
    name: "Acid ascorbic (Vitamina C)",
    danger: "low",
    description: "Antioxidant natural extrem de sigur, adăugat pentru a proteja culoarea și valoarea nutrițională a alimentelor.",
    keywords: ["acid ascorbic", "vitamina c", "ascorbic acid", "e300", "e-300"]
  },
  {
    code: "E322",
    name: "Lecitină",
    danger: "low",
    description: "Emulgator natural excelent extras din gălbenuș de ou, soia sau floarea-soarelui. Este sigur și chiar util pentru funcția hepatică și cerebrală.",
    keywords: ["lecitina", "lecithins", "lecitine", "e322", "e-322", "lecitina de soia", "lecitina din floarea soarelui"]
  },
  {
    code: "E415",
    name: "Gumă Xanthan",
    danger: "low",
    description: "Agent natural de îngroșare generat prin fermentația bacteriană a glucidelor. Sigur, dar poate balona sau avea efect laxativ retras în doze uriașe.",
    keywords: ["guma xanthan", "xanthan gum", "guma de xantan", "e415", "e-415"]
  },
  {
    code: "E412",
    name: "Gumă Guar",
    danger: "medium",
    description: "Agent de texturare extras dintr-o plantă leguminoasă. Sigur în general, dar poate produce gaze intestinale sau balonări la persoanele cu colon iritabil.",
    keywords: ["guma guar", "guar gum", "e412", "e-412"]
  },
  {
    code: "E102",
    name: "Tartrazină",
    danger: "high",
    description: "Colorant galben sintetic extrem de dăunător. Asociat cu reacții adverse la astmatici, probleme de atenție, hiperactivitate la copii și mâncărimi.",
    keywords: ["tartrazina", "tartrazine", "e102", "e-102", "galben tartrazina"]
  },
  {
    code: "E133",
    name: "Albastru strălucitor FCF",
    danger: "high",
    description: "Colorant sintetic obținut chimic din hidrocarburi. Poate declanșa alergii, rinită sau probleme de piele și este restricționat în anumite țări.",
    keywords: ["albastru stralucitor", "brilliant blue", "e133", "e-133"]
  },
  {
    code: "E202",
    name: "Sorbat de potasiu",
    danger: "low",
    description: "Conservant utilizat pe scară largă împotriva mucegaiurilor și drojdiilor. Se descompune natural în organism și este considerat extrem de sigur.",
    keywords: ["sorbat de potasiu", "potassium sorbate", "sorbat", "e202", "e-202"]
  },
  {
    code: "E211",
    name: "Benzoat de sodiu",
    danger: "high",
    description: "Conservant chimic des întâlnit în băuturi carbogazoase și sosuri. În prezența vitaminei C (acid ascorbic), poate forma benzen, un compus cancerigen puternic.",
    keywords: ["benzoat de sodiu", "sodium benzoate", "benzoat", "e211", "e-211"]
  },
  {
    code: "E440",
    name: "Pectină",
    danger: "low",
    description: "Agent natural de gelificare extras direct din mere sau citrice. Extrem de sigură, pectină reprezintă o fibră alimentară binefăcătoare pentru digestie.",
    keywords: ["pectina", "pectine", "pectin", "e440", "e-440"]
  },
  {
    code: "E500",
    name: "Carbonat de sodiu (Bicarbonat)",
    danger: "low",
    description: "Inocuitate totală. Agent de afânare, reglare a acidității și dospire (bicarbonat de sodiu standard). Complet sigur.",
    keywords: ["carbonat de sodiu", "bicarbonat", "bicarbonat de sodiu", "sodium carbonate", "e500", "e-500"]
  },
  {
    code: "E471",
    name: "Mono- și digliceride ale acizilor grași",
    danger: "low",
    description: "Emulgatori universali utilizați în patiserie și înghețate. Sunt lipide complet sigure, asimilate de organism exact ca grăsimile alimentare comune.",
    keywords: ["mono- si digliceride", "mono- si digliceridele", "mono- și digliceridele", "e471", "e-471"]
  }
];

export function extractAdditives(ingredients: string): FoodAdditive[] {
  if (!ingredients) return [];
  const lowerIngredients = ingredients.toLowerCase();
  const matched: FoodAdditive[] = [];

  for (const additive of ADDITIVES_DATABASE) {
    const isMatched = additive.keywords.some(keyword => {
      // Find term with boundary checks or word fragments since ingredients fields can be poorly spaced in databases
      const escaped = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b|${escaped}`, "i");
      return regex.test(lowerIngredients);
    });

    if (isMatched && !matched.some(m => m.code === additive.code)) {
      matched.push(additive);
    }
  }

  return matched;
}
