import React, { useState, useEffect } from 'react';
import { Calculator, Sparkles, Droplets, Thermometer, Sun, Layers, HelpCircle, ArrowRight } from 'lucide-react';

export const SmartWateringCalculator: React.FC = () => {
  const [species, setSpecies] = useState('Monstera Deliciosa');
  const [currentMoisture, setCurrentMoisture] = useState(25);
  const [targetMoisture, setTargetMoisture] = useState(65);
  const [potSizeCm, setPotSizeCm] = useState(20);
  const [temperatureC, setTemperatureC] = useState(24);
  const [explanation, setExplanation] = useState<string>('');
  const [resultDuration, setResultDuration] = useState<number>(0);
  const [resultMl, setResultMl] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateSmartAmount = async () => {
    setIsCalculating(true);
    try {
      const res = await fetch('/api/smart-calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          species,
          currentMoisture,
          targetMoisture,
          potSizeCm,
          temperatureC,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setResultDuration(data.data.recommendedDurationSec);
        setResultMl(data.data.recommendedAmountMl);
        setExplanation(data.data.explanation);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    calculateSmartAmount();
  }, [currentMoisture, targetMoisture, potSizeCm, temperatureC, species]);

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      
      {/* Header */}
      <div className="p-6 bg-slate-900 border border-emerald-900/50 rounded-2xl shadow-xl flex items-center space-x-4">
        <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
          <Calculator className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Intelligenter Bedarfsrechner</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Berechne die mathematisch und botanisch exakte Pumpenlaufzeit basierend auf Feuchtigkeits-Defizit, Topfvolumen und Raumklima
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Input Parameters */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Pflanzen- & Umweltfaktoren</span>
          </h3>

          <div className="space-y-4 text-xs">
            
            {/* Species */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Pflanzenart</label>
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Monstera Deliciosa">Monstera Deliciosa (Mittlerer Bedarf)</option>
                <option value="Basilikum">Küchen-Basilikum (Hoher Bedarf)</option>
                <option value="Sansevieria Bogenhanf">Bogenhanf (Sukkulente / Niedriger Bedarf)</option>
                <option value="Ficus Benjamina">Ficus Benjamina (Birkenfeige)</option>
                <option value="Orchidee">Phalaenopsis Orchidee</option>
              </select>
            </div>

            {/* Current Moisture */}
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-300">Aktuelle Bodenfeuchtigkeit:</span>
                <span className="text-rose-400 font-mono font-bold">{currentMoisture}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={60}
                value={currentMoisture}
                onChange={(e) => setCurrentMoisture(Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>

            {/* Target Moisture */}
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-300">Ziel-Bodenfeuchtigkeit:</span>
                <span className="text-emerald-400 font-mono font-bold">{targetMoisture}%</span>
              </div>
              <input
                type="range"
                min={40}
                max={85}
                value={targetMoisture}
                onChange={(e) => setTargetMoisture(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Pot Diameter */}
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-300">Topfdurchmesser (cm):</span>
                <span className="text-amber-400 font-mono font-bold">{potSizeCm} cm</span>
              </div>
              <input
                type="range"
                min={8}
                max={40}
                value={potSizeCm}
                onChange={(e) => setPotSizeCm(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Temperature */}
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-300">Raumtemperatur (°C):</span>
                <span className="text-cyan-400 font-mono font-bold">{temperatureC} °C</span>
              </div>
              <input
                type="range"
                min={15}
                max={35}
                value={temperatureC}
                onChange={(e) => setTemperatureC(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

          </div>
        </div>

        {/* Calculation Output Box */}
        <div className="p-6 bg-slate-900 border border-emerald-900/50 rounded-2xl shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center space-x-2 mb-4">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <span>Berechneter Bewässerungsimpuls</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                <span className="text-xs text-slate-400 block mb-1">Empfohlene Laufzeit</span>
                <span className="text-3xl font-extrabold text-cyan-400 font-mono">
                  {resultDuration} s
                </span>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                <span className="text-xs text-slate-400 block mb-1">Wassermenge</span>
                <span className="text-3xl font-extrabold text-emerald-400 font-mono">
                  ~{resultMl} ml
                </span>
              </div>
            </div>

            <div className="mt-4 p-4 bg-slate-950/80 rounded-2xl border border-emerald-900/40 text-xs text-slate-300 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                <HelpCircle className="w-4 h-4" />
                <span>Formel-Erklärung:</span>
              </div>
              <p className="leading-relaxed text-slate-300">{explanation}</p>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Stand Standard-Micro-Pumpe: 28 ml/s Durchfluss bei 5V</span>
            <span className="text-emerald-400 font-bold">✓ Exakt kalibriert</span>
          </div>

        </div>

      </div>

    </div>
  );
};
