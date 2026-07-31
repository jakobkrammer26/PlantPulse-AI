import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Droplets, 
  Sun, 
  Loader2, 
  Zap, 
  Leaf, 
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { Plant, PlantIdentificationResult } from '../types';

interface PlantScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlantAdded: (newPlant: Plant) => void;
}

const SAMPLE_PLANT_IMAGES = [
  {
    name: 'Monstera Deliciosa',
    url: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Basilikum',
    url: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Sansevieria Bogenhanf',
    url: 'https://images.unsplash.com/photo-1593482892290-f54927ae1bf6?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Orchidee (Phalaenopsis)',
    url: 'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=600&q=80',
  }
];

export const PlantScannerModal: React.FC<PlantScannerModalProps> = ({
  isOpen,
  onClose,
  onPlantAdded,
}) => {
  const [activeMode, setActiveMode] = useState<'upload' | 'camera'>('upload');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<PlantIdentificationResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Form states for saving
  const [customName, setCustomName] = useState<string>('');
  const [assignedPin, setAssignedPin] = useState<number>(26);
  const [esp32Ip, setEsp32Ip] = useState<string>('192.168.1.105');
  const [userNotes, setUserNotes] = useState<string>('');

  // Camera video ref
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setSelectedImage(null);
    setScanResult(null);
    setScanError(null);
    setIsScanning(false);
    setCustomName('');
    setUserNotes('');
  };

  const startCamera = async () => {
    setCameraError(null);
    setActiveMode('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.error('Kamera-Zugriff fehlgeschlagen:', err);
      setCameraError('Kamera konnte nicht gestartet werden. Bitte erlaube den Kamera-Zugriff oder lade ein Foto hoch.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setSelectedImage(dataUrl);
      stopCamera();
      setActiveMode('upload');
      runAiIdentification(dataUrl);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setSelectedImage(result);
        runAiIdentification(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSampleSelect = async (imageUrl: string, sampleName?: string) => {
    try {
      setIsScanning(true);
      setScanError(null);
      setScanResult(null);

      const resp = await fetch(imageUrl);
      if (!resp.ok) {
        throw new Error(`Bild konnte nicht geladen werden (${resp.status})`);
      }
      
      const contentType = resp.headers.get('content-type') || '';
      const blob = await resp.blob();

      if (!blob.type.startsWith('image/') && !contentType.startsWith('image/')) {
        throw new Error('Empfangenes Dateiformat ist kein gültiges Bild.');
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setSelectedImage(base64data);
        runAiIdentification(base64data);
      };
      reader.readAsDataURL(blob);
    } catch (e: any) {
      console.warn("Musterbild-Download fehlgeschlagen, erstelle Canvas-Ersatzbild:", e);
      // Fallback: Generate a clean image canvas with the plant label for Gemini Vision analysis
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Gradient background
        const grad = ctx.createLinearGradient(0, 0, 600, 600);
        grad.addColorStop(0, '#064e3b');
        grad.addColorStop(1, '#022c22');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 600, 600);

        // Draw leaf silhouette
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(300, 260, 140, 0, Math.PI * 2);
        ctx.fill();

        // Text label for Gemini
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(sampleName || 'Zimmerpflanze', 300, 480);

        const generatedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setSelectedImage(generatedDataUrl);
        runAiIdentification(generatedDataUrl);
      } else {
        setIsScanning(false);
        setScanError('Musterbild konnte nicht geladen werden. Bitte verwende ein eigenes Foto oder die Kamera.');
      }
    }
  };

  const runAiIdentification = async (base64Image: string) => {
    setIsScanning(true);
    setScanError(null);
    setScanResult(null);

    try {
      const res = await fetch('/api/identify-plant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Image,
          userNotes,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setScanResult(data.data);
        setCustomName(data.data.species);
      } else {
        throw new Error(data.error || 'Erkennung fehlgeschlagen.');
      }
    } catch (err: any) {
      console.error('Erkennungsfehler:', err);
      setScanError(
        err.message || 'Die Gemini KI konnte die Pflanze nicht eindeutig analysieren. Versuche ein anderes Foto.'
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleSavePlant = () => {
    if (!scanResult || !selectedImage) return;

    const newPlant: Plant = {
      id: `plant-${Date.now()}`,
      name: customName || scanResult.species,
      species: scanResult.species,
      botanicalName: scanResult.botanicalName,
      imageUrl: selectedImage,
      waterNeedLevel: scanResult.waterNeedLevel,
      recommendedWateringDurationSec: scanResult.recommendedWateringDurationSec,
      recommendedWaterAmountMl: scanResult.recommendedWaterAmountMl,
      wateringFrequencyDays: scanResult.wateringFrequencyDays,
      idealMoistureRange: scanResult.idealMoistureRange,
      sunlightRequirement: scanResult.sunlightRequirement,
      careTips: scanResult.careTips,
      healthStatus: scanResult.healthStatus,
      diseaseOrWarning: scanResult.diseaseOrWarning,
      description: scanResult.description,
      soilMoisturePercent: 35, // default initial moisture
      targetMoisturePercent: Math.round((scanResult.idealMoistureRange.min + scanResult.idealMoistureRange.max) / 2),
      esp32Ip: esp32Ip || '192.168.1.105',
      channelPin: assignedPin,
      autoWateringEnabled: true,
      lastWatered: new Date().toISOString(),
      notes: userNotes,
    };

    onPlantAdded(newPlant);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-emerald-900/50 rounded-2xl shadow-2xl overflow-hidden my-8 text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700/60">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            <h2 className="text-lg font-bold text-white">KI-Pflanzenerkennung (Gemini Vision)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Top Mode Selection */}
          {!scanResult && (
            <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700">
              <button
                onClick={() => {
                  stopCamera();
                  setActiveMode('upload');
                }}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeMode === 'upload'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Foto hochladen</span>
              </button>
              <button
                onClick={startCamera}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeMode === 'camera'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Live Kamera</span>
              </button>
            </div>
          )}

          {/* Area 1: Camera View */}
          {activeMode === 'camera' && !scanResult && (
            <div className="space-y-4">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-emerald-900/50 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {!isCameraActive && !cameraError && (
                  <div className="flex flex-col items-center space-y-2 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                    <p className="text-sm">Starte Kamera-Stream...</p>
                  </div>
                )}
                {cameraError && (
                  <div className="p-4 text-center text-rose-300 bg-rose-950/80 rounded-xl m-4 border border-rose-800">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-rose-400" />
                    <p className="text-sm font-medium">{cameraError}</p>
                  </div>
                )}

                {/* Grid Overlay */}
                {isCameraActive && (
                  <div className="absolute inset-0 pointer-events-none border-2 border-emerald-500/20 rounded-2xl grid grid-cols-3 grid-rows-3">
                    <div className="border-r border-b border-emerald-500/10"></div>
                    <div className="border-r border-b border-emerald-500/10"></div>
                    <div className="border-b border-emerald-500/10"></div>
                  </div>
                )}
              </div>

              {isCameraActive && (
                <button
                  onClick={captureCameraPhoto}
                  className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all"
                >
                  <Camera className="w-5 h-5" />
                  <span>Pflanze jetzt fotografieren & analysieren</span>
                </button>
              )}
            </div>
          )}

          {/* Area 2: File Upload / Drag & Drop */}
          {activeMode === 'upload' && !scanResult && !isScanning && (
            <div className="space-y-4">
              <label className="relative flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-emerald-700/60 rounded-2xl cursor-pointer bg-slate-950/50 hover:bg-slate-800/40 hover:border-emerald-500 transition-all group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                  <div className="p-3 bg-emerald-950/80 rounded-full border border-emerald-800 group-hover:scale-110 transition-transform mb-3">
                    <Upload className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className="mb-1 text-sm font-medium text-slate-200">
                    <span className="font-semibold text-emerald-400">Klicke zum Hochladen</span> oder schiebe ein Foto hierher
                  </p>
                  <p className="text-xs text-slate-400">JPG, PNG, WEBP (Max. 10MB)</p>
                </div>
              </label>

              {/* Sample Plant Selector for Quick Demo */}
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                  Oder wähle ein Beispiel-Musterbild:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SAMPLE_PLANT_IMAGES.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSampleSelect(sample.url, sample.name)}
                      className="group relative rounded-xl overflow-hidden border border-slate-700/80 hover:border-emerald-500 aspect-video transition-all text-left"
                    >
                      <img
                        src={sample.url}
                        alt={sample.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent p-2 flex items-end">
                        <span className="text-xs font-semibold text-white drop-shadow">
                          {sample.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Area 3: Scanning AI Loading state */}
          {isScanning && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Radar pulse animation */}
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                <div className="absolute inset-2 rounded-full border-2 border-emerald-400/40 animate-spin" />
                {selectedImage && (
                  <img
                    src={selectedImage}
                    alt="Pflanze preview"
                    className="w-24 h-24 rounded-full object-cover border-2 border-emerald-400 shadow-xl"
                  />
                )}
                <div className="absolute bottom-0 right-0 bg-amber-400 text-slate-950 p-1.5 rounded-full shadow">
                  <Sparkles className="w-5 h-5 animate-spin" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white flex items-center justify-center space-x-2">
                  <span>Gemini KI analysiert deine Pflanze...</span>
                </h3>
                <p className="text-xs text-emerald-400/90 mt-1 max-w-md mx-auto">
                  Bestimme Spezies, Wasserbedarf, Lichtansprüche & optimale ESP32-Gießdauer...
                </p>
              </div>
            </div>
          )}

          {/* Area 4: Scan Error message */}
          {scanError && !isScanning && (
            <div className="p-4 bg-rose-950/80 border border-rose-800/80 rounded-2xl text-rose-200 flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-rose-100">Erkennung fehlgeschlagen</h4>
                <p className="text-xs mt-1">{scanError}</p>
                <button
                  onClick={resetState}
                  className="mt-3 text-xs font-bold bg-rose-900/80 hover:bg-rose-800 text-rose-100 px-3 py-1.5 rounded-lg border border-rose-700 transition-colors"
                >
                  Erneut versuchen
                </button>
              </div>
            </div>
          )}

          {/* Area 5: AI Identification Result View */}
          {scanResult && selectedImage && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Success Badge Banner */}
              <div className="flex items-center justify-between p-4 bg-emerald-950/60 border border-emerald-800/60 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                      Erfolgreich erkannt ({scanResult.confidence}% Sicherheit)
                    </span>
                    <h3 className="text-xl font-bold text-white">{scanResult.species}</h3>
                    <p className="text-xs text-slate-400 italic">{scanResult.botanicalName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold rounded-lg">
                    {scanResult.waterNeedLevel}er Wasserbedarf
                  </span>
                </div>
              </div>

              {/* Plant Image + Key Specs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Image */}
                <div className="md:col-span-1 rounded-2xl overflow-hidden border border-slate-700/80 aspect-square">
                  <img
                    src={selectedImage}
                    alt={scanResult.species}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Specs */}
                <div className="md:col-span-2 grid grid-cols-2 gap-3 text-xs">
                  
                  <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                    <div className="flex items-center space-x-2 text-cyan-400 mb-1">
                      <Droplets className="w-4 h-4" />
                      <span className="font-semibold text-slate-300">Empf. Gießdauer (ESP32)</span>
                    </div>
                    <p className="text-lg font-bold text-white">
                      {scanResult.recommendedWateringDurationSec} Sek.
                      <span className="text-xs text-slate-400 font-normal ml-1">
                        (~{scanResult.recommendedWaterAmountMl} ml)
                      </span>
                    </p>
                  </div>

                  <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                    <div className="flex items-center space-x-2 text-amber-400 mb-1">
                      <Sun className="w-4 h-4" />
                      <span className="font-semibold text-slate-300">Lichtbedarf</span>
                    </div>
                    <p className="text-sm font-semibold text-white truncate">
                      {scanResult.sunlightRequirement}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                    <div className="flex items-center space-x-2 text-emerald-400 mb-1">
                      <Zap className="w-4 h-4" />
                      <span className="font-semibold text-slate-300">Gieß-Intervall</span>
                    </div>
                    <p className="text-sm font-semibold text-white">
                      Alle {scanResult.wateringFrequencyDays} Tage
                    </p>
                  </div>

                  <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                    <div className="flex items-center space-x-2 text-teal-400 mb-1">
                      <Leaf className="w-4 h-4" />
                      <span className="font-semibold text-slate-300">Ziel-Feuchtezone</span>
                    </div>
                    <p className="text-sm font-semibold text-white">
                      {scanResult.idealMoistureRange.min}% - {scanResult.idealMoistureRange.max}% Bodenfeuchte
                    </p>
                  </div>

                  <div className="col-span-2 p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                    <span className="font-semibold text-slate-300 block mb-1">Zustandsbewertung</span>
                    <span className="inline-block px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-medium">
                      {scanResult.healthStatus}
                    </span>
                    {scanResult.diseaseOrWarning && (
                      <p className="text-xs text-amber-300 mt-1">
                        ⚠️ Hinweis: {scanResult.diseaseOrWarning}
                      </p>
                    )}
                  </div>

                </div>
              </div>

              {/* Care Tips */}
              <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                  Pflegetipps der Gemini KI:
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {scanResult.careTips.map((tip, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Configuration Form before adding */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-emerald-900/50 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span>Smart-Home & ESP32 Zuordnung</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Eigener Name der Pflanze
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="z.B. Wohnzimmer Monstera"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      ESP32 IP-Adresse
                    </label>
                    <input
                      type="text"
                      value={esp32Ip}
                      onChange={(e) => setEsp32Ip(e.target.value)}
                      placeholder="192.168.1.105"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Relais/Pumpen GPIO Pin
                    </label>
                    <select
                      value={assignedPin}
                      onChange={(e) => setAssignedPin(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value={26}>Kanal 1 (GPIO 26)</option>
                      <option value={27}>Kanal 2 (GPIO 27)</option>
                      <option value={14}>Kanal 3 (GPIO 14)</option>
                      <option value={12}>Kanal 4 (GPIO 12)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Optionale Anmerkung
                    </label>
                    <input
                      type="text"
                      value={userNotes}
                      onChange={(e) => setUserNotes(e.target.value)}
                      placeholder="z.B. Am Südfenster platziert"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  onClick={resetState}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Anderes Foto scannen
                </button>
                <button
                  onClick={handleSavePlant}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/50 transition-all flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Pflanze speichern & verknüpfen</span>
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
