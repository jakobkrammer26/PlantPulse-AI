import React, { useState } from 'react';
import { 
  Droplets, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Settings2, 
  Clock, 
  Sun, 
  Zap, 
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { Plant, ESP32State } from '../types';

interface PlantCardProps {
  plant: Plant;
  esp32State: ESP32State;
  onWaterTrigger: (plant: Plant, durationSec: number) => Promise<void>;
  onToggleAutoWatering: (plantId: string) => void;
  onOpenDetails: (plant: Plant) => void;
}

export const PlantCard: React.FC<PlantCardProps> = ({
  plant,
  esp32State,
  onWaterTrigger,
  onToggleAutoWatering,
  onOpenDetails,
}) => {
  const [isWatering, setIsWatering] = useState<boolean>(false);
  const [countdownSec, setCountdownSec] = useState<number>(0);
  const [waterStatusMsg, setWaterStatusMsg] = useState<string | null>(null);

  const handleWaterClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (esp32State.isTankEmpty) {
      setWaterStatusMsg('⚠️ Wassertank ist leer! Trockenlaufschutz aktiv.');
      setTimeout(() => setWaterStatusMsg(null), 4000);
      return;
    }

    const duration = plant.recommendedWateringDurationSec || 5;
    setIsWatering(true);
    setCountdownSec(duration);

    // Start local timer animation
    const interval = setInterval(() => {
      setCountdownSec((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      await onWaterTrigger(plant, duration);
      setWaterStatusMsg(`✓ ${duration}s Bewässerung ausgeführt!`);
    } catch (err: any) {
      setWaterStatusMsg('Fehler beim Senden des Gießbefehls.');
    } finally {
      setTimeout(() => {
        setIsWatering(false);
        setWaterStatusMsg(null);
      }, (duration + 1) * 1000);
    }
  };

  // Determine moisture color
  const getMoistureColor = (pct: number, min: number, max: number) => {
    if (pct < min) return 'from-amber-500 to-rose-500 text-rose-400';
    if (pct > max) return 'from-blue-500 to-cyan-400 text-cyan-400';
    return 'from-emerald-500 to-teal-400 text-emerald-400';
  };

  const getMoistureStatusText = (pct: number, min: number, max: number) => {
    if (pct < min) return 'Zu trocken (Nachgießen erforderlich)';
    if (pct > max) return 'Sehr feucht';
    return 'Optimal feucht';
  };

  const lastWateredFormatted = plant.lastWatered
    ? new Date(plant.lastWatered).toLocaleTimeString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Noch nicht gegossen';

  return (
    <div 
      onClick={() => onOpenDetails(plant)}
      className="group relative bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-emerald-950/40 transition-all duration-300 cursor-pointer flex flex-col justify-between"
    >
      
      {/* Top Image + Badges */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-950">
        <img
          src={plant.imageUrl}
          alt={plant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          
          <span className="px-2.5 py-1 bg-slate-950/80 backdrop-blur-md text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center space-x-1">
            <Zap className="w-3 h-3 text-amber-300" />
            <span>Pin {plant.channelPin}</span>
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleAutoWatering(plant.id);
              }}
              title={plant.autoWateringEnabled ? 'Auto-Bewässerung Aktiv' : 'Auto-Bewässerung Inaktiv'}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-md border transition-colors flex items-center space-x-1 ${
                plant.autoWateringEnabled
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-900/80 text-slate-400 border-slate-700/60'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>{plant.autoWateringEnabled ? 'Auto KI' : 'Manuell'}</span>
            </button>
          </div>
        </div>

        {/* Bottom image overlay details */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg font-bold text-white drop-shadow-md leading-snug">
            {plant.name}
          </h3>
          <p className="text-xs text-slate-300 font-medium italic">
            {plant.species}
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
        
        {/* Soil Moisture Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center space-x-1 font-semibold text-slate-300">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span>Bodenfeuchtigkeit</span>
            </span>
            <span className={`font-bold ${getMoistureColor(plant.soilMoisturePercent, plant.idealMoistureRange.min, plant.idealMoistureRange.max)}`}>
              {plant.soilMoisturePercent}%
            </span>
          </div>

          <div className="relative w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            {/* Target Range Highlight Marker */}
            <div 
              className="absolute top-0 bottom-0 bg-emerald-500/20 border-x border-emerald-500/40"
              style={{
                left: `${plant.idealMoistureRange.min}%`,
                width: `${plant.idealMoistureRange.max - plant.idealMoistureRange.min}%`
              }}
            />
            {/* Current Moisture Progress Bar */}
            <div
              className={`h-full bg-gradient-to-r ${getMoistureColor(plant.soilMoisturePercent, plant.idealMoistureRange.min, plant.idealMoistureRange.max)} transition-all duration-700 rounded-full`}
              style={{ width: `${Math.min(100, Math.max(0, plant.soilMoisturePercent))}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Zielzone: {plant.idealMoistureRange.min}%-{plant.idealMoistureRange.max}%</span>
            <span>{getMoistureStatusText(plant.soilMoisturePercent, plant.idealMoistureRange.min, plant.idealMoistureRange.max)}</span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Gieß-Empfehlung</span>
            <span className="font-semibold text-slate-200">{plant.recommendedWateringDurationSec}s (~{plant.recommendedWaterAmountMl}ml)</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Zuletzt gegossen</span>
            <span className="font-semibold text-slate-200">{lastWateredFormatted}</span>
          </div>
        </div>

        {/* Status notification banner if active */}
        {waterStatusMsg && (
          <div className={`p-2 rounded-xl text-xs font-semibold text-center animate-fade-in ${
            waterStatusMsg.includes('⚠️') || waterStatusMsg.includes('Fehler')
              ? 'bg-rose-950/90 text-rose-300 border border-rose-800'
              : 'bg-emerald-950/90 text-emerald-300 border border-emerald-800'
          }`}>
            {waterStatusMsg}
          </div>
        )}

        {/* Water Action Button */}
        <div className="pt-2 border-t border-slate-800 flex items-center space-x-2">
          <button
            disabled={isWatering}
            onClick={handleWaterClick}
            className={`flex-1 flex items-center justify-center space-x-2 font-bold py-2.5 px-4 rounded-xl shadow-lg transition-all text-xs sm:text-sm ${
              isWatering
                ? 'bg-cyan-600 text-white animate-pulse'
                : esp32State.isTankEmpty
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/40 hover:shadow-emerald-500/20 active:scale-95'
            }`}
          >
            {isWatering ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-200" />
                <span>Pumpe läuft... ({countdownSec}s)</span>
              </>
            ) : esp32State.isTankEmpty ? (
              <>
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Tank Leer (Gießen gesperrt)</span>
              </>
            ) : (
              <>
                <Droplets className="w-4 h-4 text-cyan-300" />
                <span>Jetzt {plant.recommendedWateringDurationSec}s gießen</span>
              </>
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(plant);
            }}
            title="Pflanzen-Details & KI-Einstellungen"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
