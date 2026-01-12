
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, Scan, AlertTriangle, Users } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { Enrollment } from '../types';

interface CameraViewProps {
  enrollments: Enrollment[];
  onDetected: (name: string) => void;
  setIsProcessing: (val: boolean) => void;
}

const CameraView: React.FC<CameraViewProps> = ({ enrollments, onDetected, setIsProcessing }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const [activeDetection, setActiveDetection] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 1280, height: 720 } 
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
      setError(null);
    } catch (err) {
      setError("Unable to access camera. Please ensure permissions are granted.");
      console.error(err);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const getBase64Data = (dataUrl: string) => {
    if (!dataUrl || !dataUrl.includes(',')) return null;
    return dataUrl.split(',')[1];
  };

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return null;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    return getBase64Data(canvas.toDataURL('image/jpeg', 0.8));
  }, []);

  const runRecognition = useCallback(async () => {
    if (enrollments.length === 0) return;
    if (Date.now() - lastScanTime < 4000) return;

    const frameBase64 = captureFrame();
    if (!frameBase64) return;

    setIsProcessing(true);
    setLastScanTime(Date.now());

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const parts: any[] = [
        { text: "Current Frame to check:" },
        { inlineData: { mimeType: 'image/jpeg', data: frameBase64 } },
        { text: "Reference Gallery of enrolled users:" }
      ];

      // Add each enrollment as separate text and image parts with safety checks
      enrollments.forEach(e => {
        const enrollmentBase64 = getBase64Data(e.photoBase64);
        if (enrollmentBase64) {
          parts.push({ text: `User: ${e.name}` });
          parts.push({ inlineData: { mimeType: 'image/jpeg', data: enrollmentBase64 } });
        }
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts }],
        config: {
          systemInstruction: "You are a professional face recognition system. Your task is to identify if the person in the 'Current Frame' matches any person in the 'Reference Gallery'. Analyze facial features meticulously. Return a list of matches with the exact name and a confidence score between 0 and 1.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matches: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    confidence: { type: Type.NUMBER }
                  },
                  required: ["name", "confidence"]
                }
              }
            },
            required: ["matches"]
          },
          temperature: 0.1
        }
      });

      const responseText = response.text;
      if (responseText) {
        const result = JSON.parse(responseText);
        if (result.matches && result.matches.length > 0) {
          result.matches.forEach((match: any) => {
            const exists = enrollments.some(e => e.name.trim().toLowerCase() === match.name.trim().toLowerCase());
            if (exists && match.confidence > 0.7) {
              onDetected(match.name);
              setActiveDetection(match.name);
              setTimeout(() => setActiveDetection(null), 3000);
            }
          });
        }
      }
    } catch (err) {
      console.error("AI Recognition failed:", err);
    } finally {
      setIsProcessing(false);
    }
  }, [enrollments, lastScanTime, captureFrame, onDetected, setIsProcessing]);

  useEffect(() => {
    const interval = setInterval(runRecognition, 3000);
    return () => clearInterval(interval);
  }, [runRecognition]);

  return (
    <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-white aspect-video group">
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
          <p className="text-lg font-medium">{error}</p>
          <button 
            onClick={startCamera}
            className="mt-4 px-6 py-2 bg-indigo-600 rounded-full hover:bg-indigo-700 transition"
          >
            Retry Camera
          </button>
        </div>
      ) : (
        <>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover scale-x-[-1]"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black/40 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold border border-white/20">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span>LIVE SCANNING</span>
          </div>

          <div className="absolute top-4 right-4 flex items-center space-x-2 bg-black/40 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold border border-white/20">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>{enrollments.length} Enrolled</span>
          </div>

          {activeDetection && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center space-x-3 animate-bounce z-10">
              <Scan className="w-5 h-5" />
              <div className="text-sm font-bold">
                MATCH FOUND: <span className="uppercase">{activeDetection}</span>
              </div>
            </div>
          )}

          <div className="absolute inset-x-20 inset-y-12 border-2 border-indigo-400/30 rounded-3xl pointer-events-none">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-lg"></div>
            
            <div className="absolute inset-x-0 h-0.5 bg-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-[scan_3s_ease-in-out_infinite]"></div>
          </div>
        </>
      )}

      <style>{`
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0; }
          10%, 90% { opacity: 1; }
          50% { top: 100%; }
        }
      `}</style>
    </div>
  );
};

export default CameraView;
