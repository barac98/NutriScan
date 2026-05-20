import { Product } from "../types";
import { 
  CheckCircle, AlertTriangle, XCircle, Info, Leaf, MapPin, 
  ArrowRight, MessageSquare, Star 
} from "lucide-react";
import { motion } from "motion/react";

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
  onAddToShoppingList: (name: string, barcode?: string) => void;
}

export default function ProductDetail({ product, onClose, onAddToShoppingList }: ProductDetailProps) {
  const allergens = product?.allergens || [];
  const alternatives = product?.alternatives || [];
  const nutrition = product?.nutrition || {};

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 40) return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
    return "text-rose-400 bg-rose-500/10 border-rose-500/20";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 70) return <CheckCircle size={32} />;
    if (score >= 40) return <AlertTriangle size={32} />;
    return <XCircle size={32} />;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-[60] bg-[#0f1115] overflow-auto pb-24"
    >
      <div className="sticky top-0 z-10 bg-[#1c1f26]/90 backdrop-blur-xl p-4 flex justify-between items-center border-b border-white/5">
        <div className="flex-1 overflow-hidden">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded">Analiză Produs</span>
          <h2 className="text-xl font-bold text-white truncate mt-1">{product.name}</h2>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
          <XCircle size={28} />
        </button>
      </div>

      <div className="p-6 space-y-6 max-w-md mx-auto">
        {/* Header / Score */}
        <div className={`card-elegant flex items-center justify-between gap-4 ${getScoreColor(product.healthScore)}`}>
          <div className="flex-1">
            <h3 className="text-3xl font-bold">{product.healthScore}<span className="text-sm opacity-50 ml-1">/100</span></h3>
            <p className="font-bold uppercase tracking-widest text-[10px] mt-1 opacity-70">{product.brand}</p>
          </div>
          {getScoreIcon(product.healthScore)}
        </div>

        {/* Assessment */}
        <div className="card-elegant space-y-3">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-sky-400" />
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Evaluare Nutrițională</h4>
          </div>
          <p className="text-sm font-medium text-slate-300 leading-relaxed italic">
            "{product.healthAssessment}"
          </p>
        </div>

        {/* Nutrition Grid */}
        <div className="bg-[#1c1f26] rounded-2xl p-4 border border-white/5 space-y-4">
           <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Profil Nutrițional / 100g</p>
           <div className="grid grid-cols-3 gap-4 text-center">
             {Object.entries(nutrition).map(([key, value]) => (
               <div key={key} className="space-y-1">
                 <span className="block text-[9px] font-bold uppercase text-slate-500">{key}</span>
                 <span className="block font-bold text-white text-sm">{value || "-"}</span>
               </div>
             ))}
           </div>
        </div>

        {/* Ingredients List */}
        {product.ingredients && (
          <div className="card-elegant space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Listă Ingrediente</h4>
            <div className="flex flex-wrap gap-1.5">
              {product.ingredients.split(/,\s*/).map((ing, i) => ing.trim() && (
                <span key={i} className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-lg text-xs font-medium text-slate-300">
                  {ing.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Allergens */}
        {allergens.length > 0 && (
          <div className="card-elegant bg-rose-500/5 border-rose-500/10">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-rose-400" />
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-rose-400">Alergeni Detectați</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {allergens.map((all) => (
                <span key={all} className="px-2 py-1 bg-rose-500/20 border border-rose-500/20 rounded-md text-[10px] font-bold uppercase text-rose-200">
                  {all}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Origin & Sustainability */}
        <div className="grid grid-cols-1 gap-4">
          <div className="card-elegant flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-orange-400" />
              <span className="text-xs font-medium text-slate-400">Origine:</span>
            </div>
            <p className="text-xs font-bold text-white">{product.origin || "RO / Argeș"}</p>
          </div>
          <div className="card-elegant bg-sky-500/5 border-sky-500/10 flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Leaf size={18} className="text-sky-400" />
              <span className="text-xs font-medium text-slate-400">Ecomatic:</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-sky-100">{product.sustainability || "Ambalaj Reciclabil"}</p>
              <span className="text-[8px] bg-sky-500 text-white px-1.5 rounded-full font-bold">ECO-4</span>
            </div>
          </div>
        </div>

        {/* Alternatives */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 pl-2">Alternative Premium</h4>
          {alternatives.map((alt) => (
            <div key={alt} className="card-elegant bg-white/5 border-white/5 py-3 px-4 flex items-center justify-between group hover:bg-white/10 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg" />
                <p className="text-sm font-semibold text-white">{alt}</p>
              </div>
              <button 
                onClick={() => onAddToShoppingList(alt)}
                className="p-2 text-emerald-400"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Reviews Section */}
        <div className="card-elegant space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-slate-500" />
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Recenzii (4.2★)</h4>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} className="text-yellow-500 transition-transform">
                <Star size={18} fill={star <= 4 ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
          <textarea 
            placeholder="Lasă un gând despre acest produs..."
            className="input-elegant text-xs h-20 bg-[#0f1115]"
          />
          <button className="w-full btn-elegant-outline border-emerald-500/20 text-emerald-400 text-[10px] uppercase tracking-widest py-3">Trimite Recenzia</button>
        </div>

        <button 
          onClick={() => onAddToShoppingList(product.name, product.barcode)}
          className="w-full btn-elegant py-4 text-sm mt-4 shadow-emerald-500/20 shadow-lg"
        >
          Adaugă în Lista de Cumpărături
        </button>
      </div>
    </motion.div>
  );
}
