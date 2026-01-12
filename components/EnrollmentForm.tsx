
import React, { useState, useRef, useEffect } from 'react';
import { UserPlus, Camera, Check, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface EnrollmentFormProps {
  onEnroll: (name: string, photo: string) => void;
}

const EnrollmentForm: React.FC<EnrollmentFormProps> = ({ onEnroll }) => {
  const [name, setName] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Effect to attach stream whenever isCapturing toggles and video element becomes available
  useEffect(() => {
    if (isCapturing && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCapturing]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      streamRef.current = stream;
      setIsCapturing(true); // This triggers the render of the video element
    } catch (err) {
      setCameraError("Camera access denied or not found. Please check browser permissions.");
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        // Match canvas to actual video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Handle mirror effect for capture
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const data = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedPhoto(data);
        stopCamera();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && capturedPhoto) {
      setIsSuccess(true);
      // Short delay so user sees the success state
      setTimeout(() => {
        onEnroll(name, capturedPhoto);
        setName('');
        setCapturedPhoto(null);
        setIsSuccess(false);
      }, 1500);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-300">
        <div className="bg-green-100 p-6 rounded-full">
          <CheckCircle2 className="w-16 h-16 text-green-600 animate-bounce" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800">Enrollment Successful!</h3>
        <p className="text-gray-500">Redirecting to scanning dashboard...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-indigo-100 p-2 rounded-lg">
          <UserPlus className="w-5 h-5 text-indigo-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-800">Enroll New Person</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-gray-50"
            placeholder="Enter student or employee name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Registration Photo</label>
          <div className="relative aspect-video bg-slate-100 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 group">
            {isCapturing ? (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-4">
                  <button 
                    type="button"
                    onClick={capturePhoto}
                    className="bg-indigo-600 text-white p-4 rounded-full shadow-xl hover:bg-indigo-700 transition transform hover:scale-105 active:scale-95"
                  >
                    <Camera className="w-8 h-8" />
                  </button>
                  <button 
                    type="button"
                    onClick={stopCamera}
                    className="bg-white/20 backdrop-blur-md text-white p-4 rounded-full hover:bg-white/30 transition"
                  >
                    <RefreshCw className="w-6 h-6" />
                  </button>
                </div>
              </>
            ) : capturedPhoto ? (
              <div className="relative w-full h-full">
                <img src={capturedPhoto} className="w-full h-full object-cover" alt="Captured" />
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button 
                    type="button"
                    onClick={() => { setCapturedPhoto(null); startCamera(); }}
                    className="bg-white/90 hover:bg-white p-2.5 rounded-full text-indigo-600 shadow-lg transition transform hover:rotate-180 duration-500"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 p-6 text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Camera className="w-8 h-8 text-slate-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-600">No Photo Captured</p>
                  <p className="text-xs text-slate-400">Please provide a clear front-facing photo</p>
                </div>
                <button 
                  type="button"
                  onClick={startCamera}
                  className="px-8 py-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition shadow-lg font-bold text-sm"
                >
                  Start Camera
                </button>
                {cameraError && (
                  <div className="flex items-center space-x-2 text-red-500 mt-2">
                    <AlertCircle className="w-4 h-4" />
                    <p className="text-xs font-medium">{cameraError}</p>
                  </div>
                )}
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>

        <button
          type="submit"
          disabled={!name || !capturedPhoto}
          className="w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition shadow-lg transform active:scale-[0.98]"
        >
          <Check className="w-5 h-5" />
          <span>Save & Enroll</span>
        </button>
      </form>
    </div>
  );
};

export default EnrollmentForm;
