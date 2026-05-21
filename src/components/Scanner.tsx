import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from "@zxing/library";
import { X, Camera, RefreshCw, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";
import { haptics } from "../lib/haptics";

interface ScannerProps {
  onScan: (barcode: string) => void;
  onImageCapture?: (file: File) => void;
  onClose: () => void;
}

export default function Scanner({ onScan, onClose }: ScannerProps) {
  const [cameraStatus, setCameraStatus] = useState<"loading" | "active" | "error">("loading");
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState<number>(0);
  
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Safeguard state to verify scanning stability and eliminate camera noise glitches
  const lastScannedCodeRef = useRef<string | null>(null);
  const consecutiveCountRef = useRef<number>(0);

  const startScanning = async (deviceId: string | null) => {
    try {
      setCameraStatus("loading");
      
      // Clean up previous reader instances and any active camera tracks perfectly
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }

      // Configure precise hints mapping to only decode retail barcodes (EAN-13, EAN-8, UPC-A, UPC-E)
      const hints = new Map();
      const formats = [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E
      ];
      hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);

      const reader = new BrowserMultiFormatReader(hints);
      codeReaderRef.current = reader;

      // Start continuous stream decoding on our native video element
      await reader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            const code = result.getText();
            // Standard food barcodes contain only numeric digits (0-9) and are of length 6 to 14
            if (code && /^\d+$/.test(code) && code.length >= 6 && code.length <= 14) {
              if (lastScannedCodeRef.current === code) {
                consecutiveCountRef.current += 1;
              } else {
                lastScannedCodeRef.current = code;
                consecutiveCountRef.current = 1;
              }

              // Require 2 consecutive frames reading the identical barcode to trigger (prevents any temporary frame misreading)
              if (consecutiveCountRef.current >= 2) {
                haptics.vibrate([15, 30]);
                haptics.playScanSuccess();
                onScan(code);
                // Clear state
                lastScannedCodeRef.current = null;
                consecutiveCountRef.current = 0;
              }
            }
          }
          // Silent framing feedback (ignore standard frame decoding failures)
        }
      );

      setCameraStatus("active");
    } catch (err) {
      console.error("Camera startup crashed or was rejected:", err);
      setCameraStatus("error");
    }
  };

  useEffect(() => {
    haptics.playClick();
    
    const initAndQueryCameras = async () => {
      try {
        const tempReader = new BrowserMultiFormatReader();
        const devices = await tempReader.listVideoInputDevices();
        
        if (devices && devices.length > 0) {
          const videoDevices = devices.map(d => ({
            id: d.deviceId,
            label: d.label || `Cameră ${d.deviceId.substring(0, 4)}`
          }));
          setCameras(videoDevices);
          
          // Hunt precisely for standard environmental back camera label keys
          const backCamIdx = videoDevices.findIndex(d => {
            const label = d.label.toLowerCase();
            return label.includes("back") || 
                   label.includes("rear") || 
                   label.includes("environment") ||
                   label.includes("spate") || 
                   label.includes("secundar") || 
                   label.includes("principala") ||
                   label.includes("0,5x") ||
                   label.includes("1x");
          });
          
          const targetIndex = backCamIdx !== -1 ? backCamIdx : 0;
          setCurrentCameraIndex(targetIndex);
          await startScanning(videoDevices[targetIndex].id);
        } else {
          // Default browser fallback constraint directly (null lets the browser choose)
          await startScanning(null);
        }
      } catch (err) {
        console.warn("Could not query devices lists, using direct fallback...", err);
        // Direct stream request fallback ignoring label queries
        await startScanning(null);
      }
    };

    initAndQueryCameras();

    // Secure memory leak cleanup on unmount
    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);

  const handleToggleCamera = async () => {
    if (cameras.length <= 1) return;
    haptics.playSelect();
    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);
    await startScanning(cameras[nextIndex].id);
  };

  const handleCloseTap = () => {
    haptics.playClick();
    onClose();
  };

  const handleRetryPermission = async () => {
    haptics.playClick();
    await startScanning(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 220 }}
      className="fixed inset-0 z-50 bg-[#0f1115] flex flex-col pb-safe"
    >
      {/* Header Grid */}
      <div className="flex flex-col items-center bg-[#1c1f26]/80 backdrop-blur-md border-b border-white/5 px-4 pt-2 pb-4">
        <div className="w-12 h-1.5 bg-white/20 rounded-full mb-3" />
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <Camera className="text-emerald-400 w-5 h-5 animate-pulse" />
            <h2 className="text-sm font-black text-white uppercase tracking-widest leading-none">Instant Barcode</h2>
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
        {/* Dynamic camera preview container box */}
        <div className="relative aspect-[4/3] card-elegant bg-[#12141c]/80 overflow-hidden flex items-center justify-center p-0 border border-white/10 shadow-2xl rounded-[32px]">
          
          {/* Pure native HTML5 Video output element */}
          <video 
            ref={videoRef}
            className="w-full h-full object-cover rounded-[24px]"
            playsInline
            muted
            autoPlay
          />

          {/* Camera Scanning Loading Grid Spinner */}
          {cameraStatus === "loading" && (
            <div className="absolute inset-0 z-20 bg-[#12141c] flex flex-col items-center justify-center gap-3">
              <RefreshCw className="text-emerald-400 w-10 h-10 animate-spin" />
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest animate-pulse">Conectare Cameră...</p>
            </div>
          )}

          {/* Access denied Error HUD overlay state */}
          {cameraStatus === "error" && (
            <div className="absolute inset-0 z-20 bg-[#151212]/95 p-6 flex flex-col items-center justify-center text-center gap-4">
              <AlertTriangle className="text-rose-400 w-12 h-12 animate-bounce" />
              <div>
                <h4 className="text-sm font-black uppercase tracking-widest text-white">Acces Cameră Respins</h4>
                <p className="text-slate-500 text-xs mt-2 leading-relaxed px-4">
                  Aplicația necesită acces la cameră pentru a citi codul de bare. Activați permisiunile în setările browserului.
                </p>
              </div>
              <button 
                onClick={handleRetryPermission}
                className="btn-elegant-outline py-3 px-6 mt-2 text-[10px] font-black uppercase tracking-widest border border-rose-500/10 text-rose-400 active:scale-95 bg-rose-500/5 hover:bg-rose-500/10 transition-all rounded-xl"
              >
                Reîncearcă Activarea
              </button>
            </div>
          )}

          {/* Futuristic high-contrast transparent tracking corners representing rectangular EAN barcode region */}
          <div className="absolute left-[7.5%] right-[7.5%] top-[27.5%] bottom-[27.5%] border border-emerald-500/10 rounded-2xl z-20 pointer-events-none bg-emerald-500/[0.02] shadow-[0_0_15px_rgba(16,185,129,0.03)]">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
            
            {/* Laser scanning high-tech visual overlay (only active when camera is live) */}
            {cameraStatus === "active" && (
              <>
                <div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-[scan_2.0s_infinite_ease-in-out] pointer-events-none z-10" />
                
                <style>{`
                  @keyframes scan {
                    0% { top: 6%; }
                    50% { top: 94%; }
                    100% { top: 6%; }
                  }
                `}</style>
              </>
            )}
          </div>
        </div>

        {/* Dynamic camera swap action when multi-cameras list is discovered */}
        {cameras.length > 1 && (
          <div className="flex justify-center -mt-2">
            <button 
              onClick={handleToggleCamera}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-emerald-400 transition-all bg-[#1c1f26]/60 border border-white/5 py-2.5 px-4 rounded-xl active:scale-95 cursor-pointer"
            >
              <RefreshCw size={14} className="text-emerald-400" /> Schimbă Camera ({currentCameraIndex + 1}/{cameras.length})
            </button>
          </div>
        )}

        <div className="text-center text-slate-400 leading-relaxed max-w-[280px] mx-auto text-[11px] font-bold uppercase tracking-widest px-2">
          Centrați codul de bare în vizor pentru scanare automată rapidă
        </div>
      </div>
    </motion.div>
  );
}
