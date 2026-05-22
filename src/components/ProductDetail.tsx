import { Product, UserPreferences } from "../types";
import { 
  CheckCircle, AlertTriangle, XCircle, Info, Leaf, MapPin, 
  ArrowRight, MessageSquare, Star, Plus, Check, Sparkles
} from "lucide-react";
import { motion } from "motion/react";
import { haptics } from "../lib/haptics";
import { useState } from "react";
import { checkDietaryConflicts } from "../lib/dietHelper";
import { extractAdditives } from "../lib/additiveHelper";

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
  onAddToShoppingList: (name: string, barcode?: string) => void;
  userPreferences?: UserPreferences;
}

export default function ProductDetail({ product, onClose, onAddToShoppingList, userPreferences }: ProductDetailProps) {
  const [userRating, setUserRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>("");
  const [isAdded, setIsAdded] = useState<boolean>(false);
  const [addedAlts, setAddedAlts] = useState<Record<string, boolean>>({});

  const allergens = product?.allergens || [];
  const alternatives = product?.alternatives || [];
  const nutrition = product?.nutrition || {};

  const conflicts = userPreferences ? checkDietaryConflicts(product, userPreferences) : [];
  const detectedAdditives = extractAdditives(product.ingredients || "");

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 40) return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
    return "text-rose-400 bg-rose-500/10 border-rose-500/20";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 70) return <CheckCircle size={32} className="text-emerald-400" />;
    if (score >= 40) return <AlertTriangle size={32} className="text-yellow-400" />;
    return <XCircle size={32} className="text-rose-500" />;
  };

  const handleCloseTap = () => {
    haptics.playClick();
    onClose();
  };

  const handleAddProductToList = () => {
    haptics.playScanSuccess();
    onAddToShoppingList(product.name, product.barcode);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  const handleAddAltToList = (altName: string) => {
    haptics.playSelect();
    onAddToShoppingList(altName);
    setAddedAlts(prev => ({ ...prev, [altName]: true }));
    setTimeout(() => {
      setAddedAlts(prev => ({ ...prev, [altName]: false }));
    }, 2000);
  };

  const handleStarTap = (ratingValue: number) => {
    haptics.playSelect();
    setUserRating(ratingValue);
  };

  const handleSubmitReview = () => {
    if (!userRating && !reviewText.trim()) return;
    haptics.playScanSuccess();
    alert("Vă mulțumim! Recenzia dumneavoastră a fost înregistrată offline.");
    setReviewText("");
    setUserRating(0);
  };

  return (
    <motion.div 
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 220 }}
      className="fixed inset-x-0 bottom-0 top-12 z-[60] bg-[#0f1115] rounded-t-[32px] border-t border-white/10 overflow-hidden flex flex-col max-w-md mx-auto shadow-[0_-12px_40px_rgba(0,0,0,0.6)]"
    >
      {/* Top Drag Indicator Area */}
      <div className="flex flex-col items-center bg-[#1c1f26]/80 backdrop-blur-md px-4 pt-2 pb-3">
        <div className="w-12 h-1.5 bg-white/20 rounded-full mb-2 cursor-pointer" onClick={handleCloseTap} />
        <div className="flex justify-between items-center w-full">
          <div className="flex-1 overflow-hidden pr-2">
            <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md">
              <Sparkles size={10} /> Profil de Sănătate
            </span>
            <h2 className="text-lg font-black text-white truncate mt-1.5 leading-tight">{product.name}</h2>
          </div>
          <button 
            onClick={handleCloseTap} 
            className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90"
          >
            <XCircle size={22} />
          </button>
        </div>
      </div>

      {/* Main Sheet Scroller */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-28 custom-scrollbar">
        {/* Score Header */}
        <div className={`card-elegant flex items-center justify-between gap-4 p-5 ${getScoreColor(product.healthScore)}`}>
          <div className="flex-1">
            <h3 className="text-3xl font-black flex items-baseline leading-none">
              {product.healthScore}
              <span className="text-xs font-bold opacity-60 ml-1">/100</span>
            </h3>
            <p className="font-bold uppercase tracking-widest text-[9px] mt-1.5 opacity-90 text-white leading-none">
              {product.brand || "Marcă selectă"}
            </p>
          </div>
          {getScoreIcon(product.healthScore)}
        </div>

        {/* Diet & Allergen Conflicts Alert */}
        {conflicts.length > 0 && (
          <div className="card-elegant bg-rose-500/10 border-rose-500/30 p-5 space-y-3 shadow-[0_0_20px_rgba(239,68,68,0.15)] animate-pulse">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-rose-400 w-5 h-5 animate-bounce" />
              <h4 className="text-xs font-black uppercase text-rose-400 tracking-wider">Atenție! Conflict Profil</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-semibold">
              Acest aliment conține ingrediente incompatibile cu preferințele sau alergiile tale active:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {conflicts.map((conflict, i) => (
                <span 
                  key={i} 
                  className="px-2.5 py-1.5 bg-rose-500/25 border border-rose-500/30 rounded-xl text-[10px] font-black uppercase text-rose-200 flex items-center gap-1.5"
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                  {conflict.name} (<span className="text-rose-300 font-bold italic">{conflict.matchedKeyword}</span>)
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Assessment Statement card */}
        <div className="card-elegant space-y-3 p-5">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-sky-400" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">Evaluare Nutrițională Expertă</h4>
          </div>
          <p className="text-xs font-semibold text-slate-300 leading-relaxed italic pr-1">
            "{product.healthAssessment}"
          </p>
        </div>

        {/* Macro profile / 100g */}
        <div className="bg-[#1c1f26] rounded-[24px] p-5 border border-white/5 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">Profil Nutrițional / 100g</p>
          <div className="grid grid-cols-5 gap-1.5 text-center pt-2">
            {Object.entries(nutrition).map(([key, value]) => {
              const RomanianLabels: Record<string, string> = {
                energy: "calorii",
                fat: "grăsimi",
                carbs: "carbohidrați",
                protein: "proteine",
                salt: "sare"
              };

              return (
                <div key={key} className="bg-white/5 rounded-xl py-3 px-1 border border-white/5">
                  <span className="block text-[8px] font-black uppercase text-slate-500 leading-none truncate select-none">
                    {RomanianLabels[key] || key}
                  </span>
                  <span className="block font-bold text-white text-xs mt-1.5 truncate">
                    {value || "-"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ingredients Tags list */}
        {product.ingredients && (
          <div className="card-elegant space-y-3 p-5">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">Ingrediente Identificate</h4>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {product.ingredients.split(/,\s*/).map((ing, i) => ing.trim() && (
                <span 
                  key={i} 
                  className="px-2.5 py-1.5 bg-white/5 border border-white/5 rounded-xl text-xs font-semibold text-slate-300"
                >
                  {ing.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Food Additives Analyser & Toxicity Alerts (E-uri) */}
        <div className="card-elegant space-y-4 p-5 relative overflow-hidden border border-white/5 bg-[#1c1f26]/80">
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-lg">🧪</span>
              <div className="text-left">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#a0aec0] leading-none">Analizator de E-uri</h4>
                <p className="text-xs font-bold text-white mt-1 leading-none">Aditivi & Toxicitate</p>
              </div>
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${
              detectedAdditives.length === 0
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : detectedAdditives.some(a => a.danger === "high")
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
            }`}>
              {detectedAdditives.length === 0 
                ? "Produs Curat" 
                : `${detectedAdditives.length} Detectați`
              }
            </span>
          </div>

          {detectedAdditives.length === 0 ? (
            <div className="flex gap-3 items-start py-1">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs flex-shrink-0 font-bold">
                ✓
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-200 leading-tight">Zero aditivi periculoși monitorizați</p>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Acest produs nu conține conservanți nocivi, îndulcitori de sinteză cunoscuți sau potențiatori neurotoxici din baza noastră de date.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <p className="text-[10px] text-slate-400 leading-normal font-medium">
                Următorii aditivi alimentari au fost detectați în lista de ingrediente:
              </p>
              <div className="space-y-2.5">
                {detectedAdditives.map((additive) => {
                  const isHigh = additive.danger === "high";
                  const isMedium = additive.danger === "medium";
                  const badgeColor = isHigh 
                    ? "bg-rose-500/20 border-rose-500/35 text-rose-400" 
                    : isMedium 
                      ? "bg-yellow-500/20 border-yellow-500/35 text-yellow-400" 
                      : "bg-emerald-500/20 border-emerald-500/35 text-emerald-400";
                  
                  const rowBorder = isHigh 
                    ? "border-rose-500/15 bg-rose-500/[0.02]" 
                    : isMedium 
                      ? "border-yellow-500/15 bg-yellow-500/[0.02]" 
                      : "border-emerald-500/15 bg-emerald-500/[0.02]";

                  return (
                    <div 
                      key={additive.code} 
                      className={`p-3 rounded-2xl border ${rowBorder} space-y-1.5 transition-all`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border rounded-md ${badgeColor}`}>
                            {additive.code}
                          </span>
                          <span className="text-xs font-black text-white leading-none">{additive.name}</span>
                        </div>
                        <span className={`text-[9.5px] font-black uppercase tracking-widest ${
                          isHigh ? "text-rose-400" : isMedium ? "text-yellow-400" : "text-emerald-400"
                        }`}>
                          {isHigh ? "De Evitat" : isMedium ? "Precauție" : "Sigur"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-normal font-medium">
                        {additive.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Warnings: Allergens */}
        {allergens.length > 0 && (
          <div className="card-elegant bg-rose-500/5 border-rose-500/10 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-400 animate-pulse" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-400 leading-none">Alergeni Alertați</h4>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {allergens.map((all) => (
                <span key={all} className="px-2.5 py-1.5 bg-rose-500/20 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase text-rose-200">
                  {all}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Location Origin & Sustainability ECO values */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card-elegant p-4 space-y-2 flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-orange-400" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">Origine</span>
            </div>
            <p className="text-xs font-bold text-white truncate">{product.origin || "Informație locală"}</p>
          </div>
          
          <div className="card-elegant bg-emerald-500/5 border-emerald-500/10 p-4 space-y-2 flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <Leaf size={16} className="text-emerald-400" />
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider leading-none">Sustenabilitate</span>
            </div>
            <p className="text-xs font-bold text-white truncate">{product.sustainability || "Ambalaj standard"}</p>
          </div>
        </div>

        {/* Healthier organic Alternative list items */}
        {alternatives.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1 leading-none">Alternative Excelente</h4>
            <div className="space-y-2 pt-1">
              {alternatives.map((alt) => {
                const added = !!addedAlts[alt];
                return (
                  <div 
                    key={alt} 
                    className="card-elegant bg-white/5 border-white/5 p-4 flex items-center justify-between hover:bg-white/10 active:scale-[0.99] transition-all cursor-pointer"
                    onClick={() => handleAddAltToList(alt)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 text-sm">
                        🌿
                      </div>
                      <p className="text-xs font-bold text-white pr-2 truncate max-w-[200px]">{alt}</p>
                    </div>
                    <button 
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        added 
                        ? "bg-emerald-500 text-[#0f1115]" 
                        : "bg-white/5 border border-white/10 text-emerald-400 hover:text-emerald-300"
                      }`}
                    >
                      {added ? <Check size={14} className="stroke-[3]" /> : <Plus size={14} />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Direct Ratings / User Sentiment Feedback */}
        <div className="card-elegant space-y-4 p-5">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-slate-400" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">Opinia Comunității</h4>
          </div>
          
          <div className="flex items-center gap-1.5 py-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button 
                key={star} 
                onClick={() => handleStarTap(star)}
                className="text-yellow-500 focus:outline-none focus:ring-0 active:scale-125 transition-transform p-1 -m-1"
              >
                <Star size={24} fill={star <= userRating ? "currentColor" : "none"} />
              </button>
            ))}
            <span className="text-slate-500 text-xs font-bold ml-2">({userRating > 0 ? `${userRating}.0` : "Fără notă"})</span>
          </div>

          <textarea 
            placeholder="Scrieți o opinie despre acest aliment..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            className="input-elegant text-xs h-20 bg-[#0f1115] p-3 text-slate-200"
          />
          <button 
            onClick={handleSubmitReview}
            disabled={!userRating && !reviewText.trim()}
            className="w-full btn-elegant-outline border-emerald-500/20 text-emerald-400 text-[10px] uppercase tracking-widest py-3 font-black disabled:opacity-30 disabled:pointer-events-none"
          >
            Trimitere Opinie
          </button>
        </div>
      </div>

      {/* Primary bottom button absolute container with blurred ambient backdrop */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#0f1115] via-[#0f1115]/95 to-transparent p-6 pt-10 border-t border-white/5">
        <button 
          onClick={handleAddProductToList}
          className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 select-none shadow-lg transition-all active:scale-95 ${
            isAdded
            ? "bg-slate-700 text-emerald-400 border border-emerald-500/20 shadow-none"
            : "bg-emerald-500 text-[#0f1115] hover:bg-emerald-400 shadow-emerald-500/15"
          }`}
        >
          {isAdded ? (
            <>
              <Check size={16} className="stroke-[3]" /> Adăugat în listă
            </>
          ) : (
            <>
              Adăugă în Listă
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
