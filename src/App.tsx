import { useState, useEffect } from "react";
import { 
  Scan, History as HistoryIcon, ShoppingCart, 
  Settings as SettingsIcon, LogIn, LogOut, Plus, Trash2, 
  User as UserIcon, Star, MessageSquare, Upload 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut 
} from "firebase/auth";
import { 
  collection, addDoc, query, where, orderBy, onSnapshot, 
  deleteDoc, doc, updateDoc, serverTimestamp, setDoc 
} from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import { Product, HistoryItem, ShoppingItem } from "./types";
import Scanner from "./components/Scanner";
import ProductDetail from "./components/ProductDetail";
import { processAndEnhanceImage } from "./lib/imageProcessor";
import { haptics } from "./lib/haptics";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"scan" | "history" | "list" | "settings">("scan");
  const [showScanner, setShowScanner] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [imageWarning, setImageWarning] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanMode, setScanMode] = useState<"camera" | "upload">("camera");

  const handleTabChange = (tab: "scan" | "history" | "list" | "settings") => {
    haptics.playSelect();
    setActiveTab(tab);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Listen to Firestore
  useEffect(() => {
    if (!user) {
      setHistory([]);
      setShoppingList([]);
      return;
    }

    const historyQuery = query(
      collection(db, "histories"),
      where("userId", "==", user.uid),
      orderBy("scannedAt", "desc")
    );
    const unsubHistory = onSnapshot(historyQuery, (snap) => {
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() } as HistoryItem)));
    });

    const listQuery = query(
      collection(db, "shoppingLists"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsubList = onSnapshot(listQuery, (snap) => {
      setShoppingList(snap.docs.map(d => ({ id: d.id, ...d.data() } as ShoppingItem)));
    });

    return () => {
      unsubHistory();
      unsubList();
    };
  }, [user]);

  const login = () => {
    haptics.playClick();
    signInWithPopup(auth, new GoogleAuthProvider());
  };
  const logout = () => {
    haptics.playClick();
    signOut(auth);
    handleTabChange("scan");
  };

  const analyzeProduct = async (data: { barcode?: string; image?: string }) => {
    setAnalyzing(true);
    setShowScanner(false);
    try {
      const res = await fetch("/api/analyze-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      
      setCurrentProduct(result);
      
      // Save to history if logged in
      if (user) {
        await addDoc(collection(db, "histories"), {
          userId: user.uid,
          barcode: result.barcode || data.barcode || "N/A",
          productName: result.name,
          healthScore: result.healthScore,
          scannedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      alert("A apărut o eroare la analiza produsului. Te rugăm să încerci din nou.");
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCapturedFile = async (file: File) => {
    setAnalyzing(true);
    setShowScanner(false);
    try {
      const enhanced = await processAndEnhanceImage(file);
      if (enhanced.isBlurry) {
        setImageWarning("Imaginea are claritate scăzută. Am aplicat filtre automate de contrast și de contur, dar recomandăm o imagine mai stabilă și focalizată.");
      } else {
        setImageWarning(null);
      }
      await analyzeProduct({ image: enhanced.base64 });
    } catch (err) {
      console.error("Error processing file:", err);
      alert("Nu s-a putut procesa imaginea. Te rugăm să încerci din nou.");
      setAnalyzing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleCapturedFile(file);
  };

  const addToShoppingList = async (name: string, barcode?: string) => {
    if (!user) {
      alert("Te rugăm să te autentifici pentru a folosi lista de cumpărături.");
      return;
    }
    await addDoc(collection(db, "shoppingLists"), {
      userId: user.uid,
      name,
      barcode: barcode || null,
      checked: false,
      createdAt: new Date().toISOString()
    });
  };

  const toggleShopItem = async (id: string, checked: boolean) => {
    haptics.playSelect();
    await updateDoc(doc(db, "shoppingLists", id), { checked: !checked });
  };

  const deleteShopItem = async (id: string) => {
    haptics.playClick();
    await deleteDoc(doc(db, "shoppingLists", id));
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0f1115] text-center">
        <div className="space-y-6">
          <div className="w-16 h-16 border-4 border-white/5 border-t-emerald-500 rounded-full animate-spin mx-auto mr-4" />
          <p className="text-sm font-bold uppercase tracking-widest text-slate-400">NutriScan RO</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1115] pb-24 max-w-md mx-auto relative overflow-x-hidden border-x border-white/5">
      {/* Header */}
      <header className="p-6 bg-[#1c1f26]/50 backdrop-blur-md sticky top-0 z-40 border-b border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Scan className="text-[#0f1115] w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">NutriScan<span className="text-emerald-400">RO</span></h1>
        </div>
        {user ? (
          <img src={user.photoURL || ""} className="w-8 h-8 rounded-full border border-white/10" />
        ) : (
          <button onClick={login} className="p-2 bg-white/5 rounded-lg border border-white/10 text-white hover:bg-white/10 transition-colors">
            <LogIn size={18} />
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="min-h-screen">
        <AnimatePresence mode="wait">
          {activeTab === "scan" && (
            <motion.div 
              key="scan"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 space-y-6"
            >
              {/* Blurry Contrast Warning Alert */}
              {imageWarning && (
                <div className="card-elegant bg-yellow-500/10 border-yellow-500/20 p-4 flex items-start gap-3 relative text-yellow-500 text-xs font-semibold relative">
                  <span className="text-base leading-none">⚠️</span>
                  <div className="flex-1 pr-6 leading-relaxed">
                    {imageWarning}
                  </div>
                  <button 
                    onClick={() => setImageWarning(null)} 
                    className="absolute top-3 right-3 text-yellow-500/50 hover:text-yellow-400 font-bold text-sm cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Promo Banner */}
              <div className="card-elegant bg-emerald-500/10 border-emerald-500/20 p-5 flex items-center gap-4">
                <div className="bg-emerald-500/20 p-3 rounded-2xl">
                   <div className="text-3xl">🌿</div>
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Viață Sănătoasă</h3>
                  <p className="text-xs text-emerald-400/80 font-medium leading-tight">Analizează alimentele într-o secundă.</p>
                </div>
              </div>

              {/* Main Actions Wrapper Container */}
              <div className="space-y-6">
                {/* Segmented Mode Selector Switch */}
                <div className="flex bg-[#1c1f26]/60 p-1 rounded-2xl border border-white/5 shadow-inner">
                <button
                  onClick={() => {
                    haptics.playSelect();
                    setScanMode("camera");
                  }}
                  className={`flex-1 py-3 text-center text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer ${
                    scanMode === "camera"
                      ? "bg-emerald-500 text-[#0f1115] shadow-lg shadow-emerald-500/10"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  📸 Scanare Cameră
                </button>
                <button
                  onClick={() => {
                    haptics.playSelect();
                    setScanMode("upload");
                  }}
                  className={`flex-1 py-3 text-center text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer ${
                    scanMode === "upload"
                      ? "bg-emerald-500 text-[#0f1115] shadow-lg shadow-emerald-500/10"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  🖼️ Încarcă Imagine
                </button>
              </div>

              {/* Dynamic Scan Mode Screen Content */}
              {scanMode === "camera" ? (
                <div className="space-y-4">
                  <div className="card-elegant bg-gradient-to-b from-[#1c1f26]/60 to-[#0f1115] p-6 text-center border border-white/5 space-y-6 rounded-[28px]">
                    <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                      <div className="absolute inset-0 border border-emerald-500/20 rounded-full animate-ping [animation-duration:3s]" />
                      <div className="absolute inset-4 border border-emerald-500/35 rounded-full animate-pulse [animation-duration:2s]" />
                      <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.12)]">
                        <Scan size={32} className="text-emerald-400 stroke-[2] animate-pulse" />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-black uppercase tracking-widest text-white leading-none">Scaner Cod de Bare</h4>
                      <p className="text-[11px] text-slate-400 leading-normal max-w-[260px] mx-auto">
                        Apropiați produsul de cameră. Codul va fi recunoscut automat și verificat pe Open Food Facts.
                      </p>
                    </div>

                    <button 
                      onClick={() => {
                        haptics.playClick();
                        setShowScanner(true);
                      }}
                      className="w-full btn-elegant py-4 text-xs font-black uppercase tracking-widest active:scale-98 shadow-md shadow-emerald-500/10 cursor-pointer"
                    >
                      Pornește Scanarea Live
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="hidden" 
                      id="image-file-upload" 
                    />
                    <label 
                      htmlFor="image-file-upload"
                      className="group block card-elegant bg-gradient-to-b from-[#1c1f26]/60 to-[#0f1115] text-center border border-dashed border-white/10 hover:border-emerald-500/30 hover:bg-[#1a1d24]/60 p-7 rounded-[28px] cursor-pointer transition-all active:scale-[0.99] space-y-5"
                    >
                      <div className="w-16 h-16 bg-emerald-500/5 rounded-full flex items-center justify-center border border-emerald-500/15 group-hover:scale-105 transition-all mx-auto shadow-sm">
                        <Upload size={24} className="text-emerald-400 group-hover:translate-y-[-2px] transition-transform" />
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="text-xs font-black uppercase tracking-widest text-white">Analizator Foto</h4>
                        <p className="text-[11px] text-slate-400 leading-normal max-w-[240px] mx-auto">
                          Selectați o imagine clară a ambalajului sau a tabelului nutrițional pentru detectare cu Gemini AI.
                        </p>
                      </div>

                      <div className="inline-block py-2 px-5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 text-[9px] font-black uppercase tracking-widest transition-all group-hover:bg-emerald-500/20">
                        Caută din Galerie
                      </div>
                    </label>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                   <div className="card-elegant bg-[#1c1f26] p-4 text-center">
                      <div className="text-xl mb-1 text-emerald-400">🥗</div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nutriție</p>
                   </div>
                   <div className="card-elegant bg-[#1c1f26] p-4 text-center">
                      <div className="text-xl mb-1 text-sky-400">🌍</div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sustenabil</p>
                   </div>
                </div>
              </div>

              {/* Tips Section */}
              <div className="space-y-3">
                <h3 className="font-bold text-white text-xs uppercase tracking-widest pl-1">Sfaturi Rapide</h3>
                <div className="card-elegant py-4 border-l-4 border-l-emerald-500">
                  <p className="text-xs font-medium text-slate-300">📌 Verifică zahărul adăugat chiar și în produsele "naturale".</p>
                </div>
                <div className="card-elegant py-4 border-l-4 border-l-emerald-500">
                  <p className="text-xs font-medium text-slate-300">📌 Caută ingrediente precum ulei de palmier pentru sustenabilitate.</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div 
               key="history"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="p-6 space-y-4"
            >
              <h2 className="text-lg font-bold text-white uppercase tracking-widest pl-1">Istoric Recente</h2>
              {!user && (
                <div className="card-elegant bg-rose-500/5 border-rose-500/10 p-10 text-center space-y-4">
                   <p className="text-sm font-medium text-slate-400">Loghează-te pentru a păstra istoricul tău.</p>
                   <button onClick={login} className="btn-elegant w-full py-3">Autentificare</button>
                </div>
              )}
              {user && history.length === 0 && (
                <div className="text-center py-16 opacity-30">
                   <HistoryIcon size={48} className="mx-auto mb-4" />
                   <p className="text-xs font-bold uppercase tracking-widest">Nici o scanare încă</p>
                </div>
              )}
              {history.map((item) => (
                <div key={item.id} className="card-elegant bg-[#1c1f26] p-4 flex items-center justify-between group cursor-pointer hover:bg-white/5 transition-colors">
                  <div className="flex-1 overflow-hidden pr-4">
                    <h4 className="font-bold text-sm text-white truncate">{item.productName}</h4>
                    <p className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-tighter">
                      {new Date(item.scannedAt).toLocaleDateString()} • {item.barcode}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center font-bold text-xs ${item.healthScore > 70 ? 'text-emerald-400 bg-emerald-500/10' : 'text-yellow-400 bg-yellow-500/10'}`}>
                    {item.healthScore}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === "list" && (
            <motion.div 
               key="list"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="p-6 space-y-4"
            >
              <h2 className="text-lg font-bold text-white uppercase tracking-widest pl-1">Listă Cumpărături</h2>
              {!user && (
                <div className="card-elegant bg-rose-500/5 border-rose-500/10 p-10 text-center space-y-4">
                   <p className="text-sm font-medium text-slate-400">Autentifică-te pentru lista de cumpărături.</p>
                   <button onClick={login} className="btn-elegant w-full py-3">Autentificare</button>
                </div>
              )}
              
              {user && (
                <div className="space-y-3">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const input = form.elements.namedItem("itemName") as HTMLInputElement;
                      if (input && input.value.trim()) {
                        haptics.playClick();
                        addToShoppingList(input.value.trim());
                        input.value = '';
                      }
                    }}
                    className="flex gap-2"
                  >
                    <div className="flex-1">
                      <input 
                        name="itemName"
                        type="text" 
                        required
                        placeholder="Adaugă articol în listă..." 
                        className="input-elegant py-3 px-4 text-xs h-12 border border-white/10"
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-[#0f1115] hover:bg-emerald-400 active:scale-95 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                    >
                      <Plus size={18} className="stroke-[3]" />
                    </button>
                  </form>

                  <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                    {shoppingList.map((item) => (
                      <div key={item.id} className={`card-elegant p-4 flex items-center justify-between transition-opacity ${item.checked ? 'bg-[#0f1115] opacity-40' : 'bg-[#1c1f26]'}`}>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => toggleShopItem(item.id, item.checked)}
                            className={`w-5 h-5 rounded-md border border-white/10 flex items-center justify-center transition-all ${item.checked ? 'bg-emerald-500 border-emerald-500' : 'bg-white/5 hover:bg-white/10'}`}
                          >
                            {item.checked && <div className="w-2 h-2 bg-[#0f1115] rounded-xs" />}
                          </button>
                          <p className={`text-sm font-medium ${item.checked ? 'line-through' : 'text-slate-200'}`}>{item.name}</p>
                        </div>
                        <button onClick={() => deleteShopItem(item.id)} className="text-rose-500/60 hover:text-rose-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {shoppingList.length === 0 && (
                      <div className="text-center py-12 opacity-30">
                        <ShoppingCart size={40} className="mx-auto mb-3" />
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Lista este goală</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div 
               key="settings"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="p-6 space-y-6"
            >
              <h2 className="text-lg font-bold text-white uppercase tracking-widest pl-1">Profil & Setări</h2>
              
              {user ? (
                <div className="space-y-6">
                  <div className="card-elegant flex items-center gap-4 bg-gradient-to-br from-[#1c1f26] to-[#0f1115]">
                    <img src={user.photoURL || ""} className="w-14 h-14 rounded-2xl border border-white/10 shadow-lg" />
                    <div>
                      <h4 className="font-bold text-white">{user.displayName}</h4>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-tight">{user.email}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-bold text-white text-[10px] uppercase tracking-widest pl-1 text-slate-500">Informații Aplicație</h5>
                    <div className="card-elegant py-4 space-y-2">
                       <div className="flex justify-between text-xs font-medium">
                         <span className="text-slate-500">Versiune</span>
                         <span className="text-slate-300">1.0.0 PRO</span>
                       </div>
                       <div className="flex justify-between text-xs font-medium">
                         <span className="text-slate-500">Limba</span>
                         <span className="text-slate-300">Română</span>
                       </div>
                    </div>
                  </div>

                  <button onClick={logout} className="w-full btn-elegant-outline py-4 text-xs uppercase tracking-widest text-rose-400 hover:text-rose-300">
                    <LogOut size={16} /> Deconectare
                  </button>
                </div>
              ) : (
                <div className="card-elegant bg-emerald-500/5 border-emerald-500/10 p-10 text-center space-y-6">
                   <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                     <UserIcon className="text-emerald-400" size={32} />
                   </div>
                   <p className="text-sm font-medium text-slate-300">Fă-ți un cont pentru a salva scanările și lista de cumpărături.</p>
                   <button onClick={login} className="btn-elegant w-full py-4 text-xs uppercase tracking-widest">Conectare Google</button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Analyzing Overlay */}
      <AnimatePresence>
        {analyzing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#0f1115] flex flex-col items-center justify-center p-12 text-center"
          >
            <div className="w-16 h-16 border-2 border-white/5 border-t-emerald-500 rounded-full animate-spin mb-8" />
            <div className="text-5xl mb-6">👁️</div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-tight mb-2">Se Analizează...</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Gemini AI verifică profilul de sănătate</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Components Modals */}
      <AnimatePresence>
        {showScanner && (
          <Scanner 
            onScan={(code) => analyzeProduct({ barcode: code })} 
            onImageCapture={handleCapturedFile}
            onClose={() => setShowScanner(false)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {currentProduct && (
          <ProductDetail 
            product={currentProduct} 
            onClose={() => setCurrentProduct(null)}
            onAddToShoppingList={addToShoppingList}
          />
        )}
      </AnimatePresence>

      {/* Nav Bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[#1c1f26]/90 backdrop-blur-2xl border-t border-white/10 flex justify-around pt-3 pb-6 px-4 z-40 rounded-t-[24px] shadow-[0_-12px_30px_rgba(0,0,0,0.4)]">
        <NavButton active={activeTab === "scan"} onClick={() => handleTabChange("scan")} icon={<Scan size={20} />} label="Scan" />
        <NavButton active={activeTab === "history"} onClick={() => handleTabChange("history")} icon={<HistoryIcon size={20} />} label="Istoric" />
        <NavButton active={activeTab === "list"} onClick={() => handleTabChange("list")} icon={<ShoppingCart size={20} />} label="Listă" />
        <NavButton active={activeTab === "settings"} onClick={() => handleTabChange("settings")} icon={<SettingsIcon size={20} />} label="Profil" />
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 transition-all outline-none ${active ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
    >
      <div className={`p-1.5 rounded-lg transition-transform ${active ? 'scale-110' : ''}`}>
        {icon}
      </div>
      <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
      {active && <div className="w-1 h-1 bg-emerald-400 rounded-full" />}
    </button>
  );
}
