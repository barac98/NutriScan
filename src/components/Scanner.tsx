import { useEffect, useRef } from "react";
import { Html5QrcodeScanner, Html5QrcodeScannerState } from "html5-qrcode";
import { X, Upload, Camera } from "lucide-react";
import { motion } from "motion/react";
import { haptics } from "../lib/haptics";

interface ScannerProps {
  onScan: (barcode: string) => void;
  onImageCapture: (file: File) => void;
  onClose: () => void;
}

export default function Scanner({ onScan, onImageCapture, onClose }: ScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    haptics.playClick();
    
    scannerRef.current = new Html5QrcodeScanner(
      "barcode-reader",
      { 
        fps: 15, 
        qrbox: (width, height) => {
          const size = Math.min(width, height) * 0.7;
          return { width: size, height: size };
        },
        videoConstraints: {
          facingMode: "environment"
        }
      },
      false
    );

    const handleSuccess = (decodedText: string) => {
      haptics.vibrate([10, 30]);
      haptics.playScanSuccess();
      onScan(decodedText);
    };

    scannerRef.current.render(handleSuccess, (err) => {
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
    haptics.playSelect();
    const file = e.target.files?.[0];
    if (!file) return;
    onImageCapture(file);
  };

  const handleCloseTap = () => {
    haptics.playClick();
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 220 }}
      className="fixed inset-0 z-50 bg-[#0f1115] flex flex-col pb-safe"
    >
      {/* Styles to beautify html5-qrcode output dynamically */}
      <style>{`
        #barcode-reader {
          border: none !important;
          background: transparent !important;
        }
        #barcode-reader video {
          border-radius: 20px;
          object-fit: cover !important;
        }
        #barcode-reader img {
          display: none !important; /* Hide ugly instructions */
        }
        /* Style standard action buttons inside html5-qrcode */
        #barcode-reader button, 
        #barcode-reader__dashboard button,
        #barcode-reader__camera_permission_button {
          background-color: #10b981 !important;
          color: #0f1115 !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          font-size: 11px !important;
          padding: 10px 20px !important;
          border-radius: 12px !important;
          border: none !important;
          cursor: pointer !important;
          transition: all 0.2s ease-in-out !important;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.2) !important;
        }
        #barcode-reader button:active {
          transform: scale(0.96) !important;
        }
        #barcode-reader select {
          background-color: #1c1f26 !important;
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 8px !important;
          padding: 8px 12px !important;
          font-size: 12px !important;
          margin: 10px 0 !important;
          outline: none !important;
        }
      `}</style>

      {/* Header with notch dragging visual indicator */}
      <div className="flex flex-col items-center bg-[#1c1f26]/80 backdrop-blur-md border-b border-white/5 px-4 pt-2 pb-4">
        <div className="w-12 h-1.5 bg-white/20 rounded-full mb-3" />
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <Camera className="text-emerald-400 w-5 h-5 animate-pulse" />
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Scaner Cameră</h2>
          </div>
          <button 
            onClick={handleCloseTap} 
            className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors active:scale-90"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 flex flex-col gap-6 max-w-md mx-auto w-full justify-center">
        {/* Dynamic camera view container with scan reticle and animations */}
        <div className="relative aspect-square card-elegant bg-[#12141c]/50 overflow-hidden flex items-center justify-center p-0 border-white/10 shadow-2xl">
          <div id="barcode-reader" className="w-full h-full relative"></div>
          
          {/* Laser scanning overlay line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-[scan_2.5s_infinite_ease-in-out] pointer-events-none z-10" />

          {/* Keyframe defined inside inline animation styles below */}
          <style>{`
            @keyframes scan {
              0% { top: 4%; }
              50% { top: 94%; }
              100% { top: 4%; }
            }
          `}</style>
          
          {/* Transparent high-tech corner borders with precise pixel alignment */}
          <div className="absolute inset-4 border-2 border-transparent pointer-events-none rounded-xl z-20">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-md" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-md" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-md" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-md" />
          </div>
        </div>

        <div className="text-center text-slate-400 leading-relaxed max-w-[280px] mx-auto text-[11px] font-bold uppercase tracking-widest px-2">
          Centrați codul de bare în vizor pentru scanare automată rapidă
        </div>

        {/* Upload Action Trigger */}
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
            className="w-full btn-elegant-outline py-4 text-xs uppercase tracking-widest cursor-pointer flex items-center justify-center gap-2 border border-white/10 active:scale-95 bg-[#1c1f26] text-white font-black"
          >
            <Upload size={16} className="text-emerald-400" /> Sau încarcă o imagine
          </label>
        </div>
      </div>
    </motion.div>
  );
}

