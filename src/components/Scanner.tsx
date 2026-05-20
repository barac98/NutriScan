import { useEffect, useRef } from "react";
import { Html5QrcodeScanner, Html5QrcodeScannerState } from "html5-qrcode";
import { X, Upload } from "lucide-react";
import { motion } from "motion/react";

interface ScannerProps {
  onScan: (barcode: string) => void;
  onImageCapture: (base64: string) => void;
  onClose: () => void;
}

export default function Scanner({ onScan, onImageCapture, onClose }: ScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "barcode-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );
    scannerRef.current.render(onScan, (err) => {
      // Handle error silently
    });

    return () => {
      if (scannerRef.current) {
        if (scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
          scannerRef.current.clear().catch(console.error);
        }
      }
    };
  }, [onScan]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64 = base64String.split(",")[1];
      onImageCapture(base64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0f1115] flex flex-col"
    >
      <div className="p-4 flex justify-between items-center bg-[#1c1f26]/80 backdrop-blur-md border-b border-white/5">
        <h2 className="text-lg font-bold text-white uppercase tracking-widest pl-2">Scanner</h2>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 flex flex-col gap-6 max-w-md mx-auto w-full justify-center">
        <div className="relative aspect-square card-elegant bg-[#0f1115] overflow-hidden flex items-center justify-center p-0 border-white/10">
          <div id="barcode-reader" className="w-full h-full"></div>
        </div>

        <div className="text-center text-slate-500 font-bold uppercase tracking-widest text-[10px] px-8">
          Încadrează codul de bare în pătrat pentru identificare.
        </div>

        <div className="relative mt-2">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="hidden" 
            id="scanner-file-upload" 
          />
          <label 
            htmlFor="scanner-file-upload"
            className="w-full btn-elegant-outline py-4 text-xs uppercase tracking-widest cursor-pointer flex items-center justify-center gap-2"
          >
            <Upload size={16} /> Sau încarcă o imagine cu produsul
          </label>
        </div>
      </div>
    </motion.div>
  );
}
