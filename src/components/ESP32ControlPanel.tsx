import React, { useState } from 'react';
import { 
  Cpu, 
  Wifi, 
  WifiOff, 
  Droplets, 
  AlertTriangle, 
  ShieldCheck, 
  RefreshCw, 
  Play, 
  Sliders, 
  CheckCircle2, 
  Activity, 
  Gauge, 
  Settings,
  Lock,
  Unlock,
  Radio
} from 'lucide-react';
import { ESP32State } from '../types';

interface ESP32ControlPanelProps {
  esp32State: ESP32State;
  onUpdateESP32State: (newState: Partial<ESP32State>) => void;
  onTestPing: (ip: string) => Promise<boolean>;
  onManualPumpTrigger: (durationSec: number) => Promise<void>;
}

export const ESP32ControlPanel: React.FC<ESP32ControlPanelProps> = ({
  esp32State,
  onUpdateESP32State,
  onTestPing,
  onManualPumpTrigger,
}) => {
  const [ipInput, setIpInput] = useState<string>(esp32State.ipAddress);
  const [isPingTesting, setIsPingTesting] = useState<boolean>(false);
  const [pingResult, setPingResult] = useState<string | null>(null);
  const [manualDuration, setManualDuration] = useState<number>(5);
  const [isPumpRunning, setIsPumpRunning] = useState<boolean>(false);

  const fetchLiveStatus = async (targetIp: string) => {
    setIsPingTesting(true);
    setPingResult(null);
    try {
      const res = await fetch(`/api/esp32/status?ip=${encodeURIComponent(targetIp)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setPingResult(`✓ Verbunden mit ESP32 (${targetIp})! Status: ${json.data.status || 'online'}`);
        onUpdateESP32State({
          ipAddress: targetIp,
          isConnected: true,
          soilMoisturePercent: json.data.soilMoisturePercent ?? esp32State.soilMoisturePercent,
          isTankEmpty: json.data.isTankEmpty ?? esp32State.isTankEmpty,
          tankLevelPercent: json.data.isTankEmpty ? 0 : (esp32State.tankLevelPercent || 80),
          lastPingTime: new Date().toISOString(),
        });
      } else {
        setPingResult(`⚠️ ESP32 unter ${targetIp} ist offline oder antwortet nicht.`);
        onUpdateESP32State({ ipAddress: targetIp, isConnected: false });
      }
    } catch (err) {
      setPingResult(`⚠️ ESP32 unter ${targetIp} konnte nicht erreicht werden.`);
      onUpdateESP32State({ ipAddress: targetIp, isConnected: false });
    } finally {
      setIsPingTesting(false);
    }
  };

  const handlePing = () => {
    fetchLiveStatus(ipInput);
  };

  const handleTestPump = async () => {
    if (esp32State.isTankEmpty) {
      alert('Trockenlaufschutz aktiv! Der Wassertank ist leer. Bitte zuerst den Tank füllen.');
      return;
    }

    setIsPumpRunning(true);
    try {
      await onManualPumpTrigger(manualDuration);
      // Update local state estimation after pump activation
      onUpdateESP32State({
        soilMoisturePercent: Math.min(100, esp32State.soilMoisturePercent + 8),
        tankLevelPercent: Math.max(0, esp32State.tankLevelPercent - 5),
        isTankEmpty: esp32State.tankLevelPercent - 5 <= 10,
        dailyWateredMl: esp32State.dailyWateredMl + (manualDuration * 30),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsPumpRunning(false), (manualDuration + 0.5) * 1000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      
      {/* Top Banner */}
      <div className="p-6 bg-slate-900 border border-emerald-900/50 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
            <Cpu className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white">ESP32 IoT Steuerzentrale</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                WLAN REST API
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Direkte WLAN-Verbindung zum ESP32 Microcontroller (Statusabfrage, Relais-Steuerung & Schwimmschalter)
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchLiveStatus(ipInput)}
          disabled={isPingTesting}
          className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isPingTesting ? 'animate-spin' : ''}`} />
          <span>Status von ESP32 Abfragen</span>
        </button>
      </div>

      {/* Main Grid: Gauges & Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Gauge 1: Bodenfeuchtigkeit */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Gauge className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">Bodenfeuchte (ADC Pin GPIO 34)</h3>
            </div>
            <span className="text-2xl font-extrabold text-emerald-400">
              {esp32State.soilMoisturePercent}%
            </span>
          </div>

          {/* Visual Dial Bar */}
          <div className="relative w-full h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                esp32State.soilMoisturePercent < 35
                  ? 'bg-amber-500'
                  : esp32State.soilMoisturePercent > 75
                  ? 'bg-cyan-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${esp32State.soilMoisturePercent}%` }}
            />
          </div>

          {/* Status note */}
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Messwert vom ESP32 Sensor</span>
            <span>
              {esp32State.soilMoisturePercent < 35
                ? '⚠️ Bewässerung benötigt'
                : '✓ Erdboden gut feucht'}
            </span>
          </div>
        </div>

        {/* Gauge 2: Wassertank Füllstand & Trockenlaufschutz */}
        <div className={`p-6 border rounded-2xl shadow-xl space-y-4 transition-colors ${
          esp32State.isTankEmpty
            ? 'bg-rose-950/40 border-rose-800/80'
            : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Droplets className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-sm text-white">Wassertank (Schwimmschalter)</h3>
            </div>
            <span className={`text-2xl font-extrabold ${esp32State.isTankEmpty ? 'text-rose-400' : 'text-cyan-400'}`}>
              {esp32State.isTankEmpty ? 'LEER (0%)' : `${esp32State.tankLevelPercent}%`}
            </span>
          </div>

          {/* Tank Level Progress Bar */}
          <div className="relative w-full h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                esp32State.isTankEmpty ? 'bg-rose-500' : 'bg-cyan-500'
              }`}
              style={{ width: esp32State.isTankEmpty ? '5%' : `${esp32State.tankLevelPercent}%` }}
            />
          </div>

          {/* Tank Alert Banner */}
          <div className="flex items-center justify-between text-xs font-semibold">
            {esp32State.isTankEmpty ? (
              <div className="flex items-center space-x-2 text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
                <span>Trockenlaufschutz: Tank Leer! Pumpe gesperrt.</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Tank voll. Pumpe betriebsbereit.</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
            <span className="text-slate-400">Tank-Status manuell anpassen:</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() =>
                  onUpdateESP32State({ tankLevelPercent: 100, isTankEmpty: false })
                }
                className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 rounded-lg border border-emerald-700 font-semibold"
              >
                Voll (100%)
              </button>
              <button
                onClick={() =>
                  onUpdateESP32State({ tankLevelPercent: 0, isTankEmpty: true })
                }
                className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-lg border border-rose-700 font-semibold"
              >
                Leer (0%)
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Network & IP Settings */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center space-x-2">
          <Wifi className="w-4 h-4 text-emerald-400" />
          <span>WLAN & ESP32 Netzwerkadresse</span>
        </h3>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
              placeholder="z.B. 192.168.1.105 oder esp32-plant.local"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <button
            onClick={handlePing}
            disabled={isPingTesting}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-xs font-bold text-slate-200 flex items-center justify-center space-x-2 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isPingTesting ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Ping Testen</span>
          </button>
        </div>

        {pingResult && (
          <p className="text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 p-3 rounded-xl animate-fade-in">
            {pingResult}
          </p>
        )}
      </div>

      {/* Manual Relais Test & Safety Limits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Test Pump Trigger */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center space-x-2">
            <Play className="w-4 h-4 text-cyan-400" />
            <span>Manuelle Relais-Aktivierung (Pumpe Testen)</span>
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Test-Laufzeit:</span>
              <span className="font-bold text-cyan-400">{manualDuration} Sek. (~{manualDuration * 30} ml)</span>
            </div>
            <input
              type="range"
              min={1}
              max={15}
              value={manualDuration}
              onChange={(e) => setManualDuration(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          <button
            onClick={handleTestPump}
            disabled={isPumpRunning || esp32State.isTankEmpty}
            className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg transition-all ${
              esp32State.isTankEmpty
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : isPumpRunning
                ? 'bg-cyan-600 text-white animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <Droplets className="w-4 h-4" />
            <span>
              {isPumpRunning
                ? `Pumpe läuft...`
                : esp32State.isTankEmpty
                ? `Sicherheits-Sperre: Tank Leer`
                : `Pumpe jetzt ${manualDuration}s einschalten`}
            </span>
          </button>
        </div>

        {/* Daily Water Limit Safeguard */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center space-x-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Überschwemmungs-Schutz & Tageslimit</span>
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">Gegossen Heute:</span>
              <span className="font-bold text-amber-400">
                {esp32State.dailyWateredMl} ml / {esp32State.dailyWateringLimitMl} ml
              </span>
            </div>

            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    (esp32State.dailyWateredMl / esp32State.dailyWateringLimitMl) * 100
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-400">
            <span>
              🛡️ Das Tageslimit schützt vor Überwässerung. Wird {esp32State.dailyWateringLimitMl} ml erreicht, blockiert die App weitere automatisierte Impulse für 24h.
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
