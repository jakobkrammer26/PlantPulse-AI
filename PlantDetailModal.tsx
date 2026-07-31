import React, { useState } from 'react';
import { 
  X, 
  Droplets, 
  Sun, 
  Sparkles, 
  Zap, 
  Trash2, 
  ShieldCheck, 
  Save, 
  Sliders, 
  Info,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { Plant, ESP32State } from '../types';

interface PlantDetailModalProps {
  plant: Plant | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePlant: (updatedPlant: Plant) => void;
  onDeletePlant: (plantId: string) => void;
  esp32State: ESP32State;
  onWaterTrigger: (plant: Plant, durationSec: number) => Promise<void>;
}

export const PlantDetailModal: React.FC<PlantDetailModalProps> = ({
  plant,
  isOpen,
  onClose,
  onUpdatePlant,
  onDeletePlant,
  esp32State,
  onWaterTrigger,
}) => {
  if (!isOpen || !plant) return null;

  const [name, setName] = useState(plant.name);
  const [targetMoisture, setTargetMoisture] = useState(plant.targetMoisturePercent);
  const [customDuration, setCustomDuration] = useState(plant.recommendedWateringDurationSec);
  const [channelPin, setChannelPin] = useState(plant.channelPin);
  const [autoWatering, setAutoWatering] = useState(plant.autoWateringEnabled);
  const [notes, setNotes] = useState(plant.notes || '');
  const [isSavedMsg, setIsSavedMsg] = useState(false);

  const handleSave = () => {
    const updated: Plant = {
      ...plant,
      name,
      targetMoisturePercent: targetMoisture,
      recommendedWateringDurationSec: customDuration,
      recommendedWaterAmountMl: customDuration * 30, // 30ml/sec average
      channelPin,
      autoWateringEnabled: autoWatering,
      notes,
    };
    onUpdatePlant(updated);
    setIsSavedMsg(true);
    setTimeout(() => setIsSavedMsg(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-emerald-900/50 rounded-2xl shadow-2xl overflow-hidden my-8 text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700/60">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Pflanzen-Profil & KI-Konfiguration</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Top Banner with Image + General Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 aspect-square rounded-2xl overflow-hidden border border-slate-700 relative">
              <img
                src={plant.imageUrl}
                alt={plant.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 backdrop-blur p-2 rounded-xl text-[11px] text-center border border-slate-800">
                <span className="font-semibold text-emerald-300 block">{plant.species}</span>
                <span className="text-slate-400 italic block">{plant.botanicalName}</span>
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Pflanzenname (Anzeige)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 block mb-0.5">Wasserbedarf Kategorie</span>
                  <span className="font-semibold text-emerald-300">{plant.waterNeedLevel}</span>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 block mb-0.5">Lichtbedarf</span>
                  <span className="font-semibold text-amber-300 truncate block">{plant.sunlightRequirement}</span>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 block mb-0.5">Zielfeuchte-Zone</span>
                  <span className="font-semibold text-cyan-300">{plant.idealMoistureRange.min}% - {plant.idealMoistureRange.max}%</span>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 block mb-0.5">Empf. Intervall</span>
                  <span className="font-semibold text-white">Alle {plant.wateringFrequencyDays} Tage</span>
                </div>
              </div>
            </div>
          </div>

          {/* ESP32 & Automatic Control Config */}
          <div className="p-5 bg-slate-950/80 rounded-2xl border border-emerald-900/50 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Smart-Home Bewässerungseinstellungen (ESP32)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Target Moisture Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-300">Ziel-Bodenfeuchtigkeit</span>
                  <span className="font-bold text-emerald-400">{targetMoisture}%</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={85}
                  value={targetMoisture}
                  onChange={(e) => setTargetMoisture(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">
                  Sinkt die Feuchtigkeit unter diesen Schwellenwert, schaltet der ESP32 die Pumpe.
                </p>
              </div>

              {/* Pump Duration Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-300">Pumpen-Laufzeit pro Gießvorgang</span>
                  <span className="font-bold text-cyan-400">{customDuration} Sek. (~{customDuration * 30} ml)</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={20}
                  value={customDuration}
                  onChange={(e) => setCustomDuration(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">
                  Dauer der Relais-Aktivierung in Sekunden (ESP32 Sicherheits-Limit max. 20s).
                </p>
              </div>

              {/* GPIO Pin Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ESP32 Relais-Pin (GPIO)
                </label>
                <select
                  value={channelPin}
                  onChange={(e) => setChannelPin(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value={26}>Kanal 1 - GPIO 26</option>
                  <option value={27}>Kanal 2 - GPIO 27</option>
                  <option value={14}>Kanal 3 - GPIO 14</option>
                  <option value={12}>Kanal 4 - GPIO 12</option>
                </select>
              </div>

              {/* Auto Water Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">KI-Automatisierung</span>
                  <span className="text-[10px] text-slate-400">Sensorbasierte automatische Bewässerung</span>
                </div>
                <button
                  onClick={() => setAutoWatering(!autoWatering)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoWatering ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoWatering ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

            </div>
          </div>

          {/* Care Tips */}
          <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 space-y-2">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Botanische Pflegetipps:
            </h4>
            <ul className="space-y-1 text-xs text-slate-300">
              {plant.careTips.map((tip, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Notes field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Notizen & Standort</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="z.B. Umtopfen im Frühjahr geplant..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => {
                if (confirm(`Pflanze "${plant.name}" wirklich löschen?`)) {
                  onDeletePlant(plant.id);
                  onClose();
                }
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-950/80 border border-rose-900/60 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Pflanze entfernen</span>
            </button>

            <div className="flex items-center space-x-3">
              {isSavedMsg && (
                <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1 animate-fade-in">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Gespeichert!</span>
                </span>
              )}
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Änderungen Speichern</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
