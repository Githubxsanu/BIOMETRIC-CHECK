
import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw } from 'lucide-react';

interface CameraViewProps {
  onCapture: (base64: string) => void;
  scanning?: boolean;
}

export const CameraView: React.FC<CameraViewProps> = ({ onCapture, scanning = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsActive(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Unable to access camera. Please ensure permissions are granted.");
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        onCapture(base64);
      }
    }
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-cyan-500/30 shadow-2xl shadow-cyan-500/10">
      {isActive ? (
        <>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover grayscale brightness-75 contrast-125"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Scanner Overlays */}
          <div className="absolute inset-0 pointer-events-none">
            <div className={`absolute top-0 left-0 w-full scan-line ${scanning ? 'opacity-100' : 'opacity-0'}`} />
            <div className="absolute inset-0 border-2 border-cyan-500/20 m-4 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-dashed border-cyan-400/40 rounded-full animate-pulse flex items-center justify-center">
                <div className="w-4 h-4 bg-cyan-500 rounded-full" />
              </div>
            </div>
            {/* Corners */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400 m-8" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400 m-8" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400 m-8" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400 m-8" />
          </div>

          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
            <button 
              onClick={captureFrame}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-full font-bold flex items-center transition-all group active:scale-95"
            >
              <Camera className="mr-2 group-hover:animate-bounce" size={20} />
              IDENTIFY / CAPTURE
            </button>
            <button 
              onClick={startCamera}
              className="bg-slate-800/80 hover:bg-slate-700 p-2 rounded-full text-cyan-400 border border-cyan-500/20"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-cyan-500 p-4 text-center">
          {error ? (
            <p className="text-red-400">{error}</p>
          ) : (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mb-4" />
          )}
          <p>Initializing Secure Optical Link...</p>
        </div>
      )}
    </div>
  );
};
