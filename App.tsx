import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PlantCard } from './components/PlantCard';
import { PlantScannerModal } from './components/PlantScannerModal';
import { PlantDetailModal } from './components/PlantDetailModal';
import { ESP32ControlPanel } from './components/ESP32ControlPanel';
import { ESP32FirmwareGenerator } from './components/ESP32FirmwareGenerator';
import { WateringHistoryLog } from './components/WateringHistoryLog';
import { SmartWateringCalculator } from './components/SmartWateringCalculator';
import { INITIAL_PLANTS } from './data/presetPlants';
import { Plant, ESP32State, WateringLog } from './types';
import { 
  Sparkles, 
  Droplets, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Cpu, 
  Info,
  Sliders,
  HelpCircle
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'esp32' | 'logs' | 'firmware' | 'calculator'>('dashboard');
  
  // App Core State
  const [plants, setPlants] = useState<Plant[]>(() => {
    const saved = localStorage.getItem('plantpulse_plants');
    return saved ? JSON.parse(saved) : INITIAL_PLANTS;
  });

  const [esp32State, setEsp32State] = useState<ESP32State>({
    ipAddress: '192.168.1.105',
    isConnected: true,
    soilMoisturePercent: 42,
    tankLevelPercent: 75,
    isTankEmpty: false,
    isPumpActive: false,
    lastPingTime: new Date().toISOString(),
    firmwareVersion: 'v2.4-ESP32-IoT',
    dailyWateredMl: 180,
    dailyWateringLimitMl: 1000,
    cooldownRemainingSec: 0,
  });

  const [wateringLogs, setWateringLogs] = useState<WateringLog[]>(() => {
    const saved = localStorage.getItem('plantpulse_logs');
    if (saved) return JSON.parse(saved);

    // Initial mock logs
    return [
      {
        id: 'log-1',
        plantId: 'plant-1',
        plantName: 'Monstera im Wohnzimmer',
        timestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
        durationSec: 6,
        amountMl: 180,
        triggerType: 'ai_auto',
        status: 'success',
        note: 'Gemini KI automatische Feuchtigkeits-Regulierung (Bodenfeuchte 38% -> 68%)',
      },
      {
        id: 'log-2',
        plantId: 'plant-2',
        plantName: 'Bogenhanf Büro',
        timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        durationSec: 3,
        amountMl: 90,
        triggerType: 'manual',
        status: 'success',
        note: 'Manuelles Nachgießen via App',
      }
    ];
  });

  // Modal states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedDetailPlant, setSelectedDetailPlant] = useState<Plant | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('plantpulse_plants', JSON.stringify(plants));
  }, [plants]);

  useEffect(() => {
    localStorage.setItem('plantpulse_logs', JSON.stringify(wateringLogs));
  }, [wateringLogs]);

  // Periodic Automated Check Simulation (Auto-water if moisture low & auto-water enabled)
  useEffect(() => {
    const interval = setInterval(() => {
      if (esp32State.isTankEmpty) return;

      plants.forEach((plant) => {
        if (plant.autoWateringEnabled && plant.soilMoisturePercent < plant.idealMoistureRange.min) {
          // Trigger automatic KI watering
          executeWatering(plant, plant.recommendedWateringDurationSec, 'ai_auto', 'Automatische KI-Anpassung: Feuchtigkeit unter Limit');
        }
      });
    }, 45000); // Check every 45s

    return () => clearInterval(interval);
  }, [plants, esp32State.isTankEmpty]);

  // Central execute watering logic
  const executeWatering = async (
    plant: Plant,
    durationSec: number,
    triggerType: 'ai_auto' | 'manual' | 'scheduled' | 'esp32_sensor' = 'manual',
    noteCustom?: string
  ) => {
    if (esp32State.isTankEmpty) {
      // Log safety cutoff
      const failedLog: WateringLog = {
        id: `log-${Date.now()}`,
        plantId: plant.id,
        plantName: plant.name,
        timestamp: new Date().toISOString(),
        durationSec,
        amountMl: 0,
        triggerType,
        status: 'failed_empty_tank',
        note: 'Gießbefehl verweigert: Trockenlaufschutz aktiv (Wassertank leer)',
      };
      setWateringLogs((prev) => [failedLog, ...prev]);
      throw new Error('Wassertank ist leer! Trockenlaufschutz aktiv.');
    }

    if (esp32State.dailyWateredMl >= esp32State.dailyWateringLimitMl) {
      const limitLog: WateringLog = {
        id: `log-${Date.now()}`,
        plantId: plant.id,
        plantName: plant.name,
        timestamp: new Date().toISOString(),
        durationSec,
        amountMl: 0,
        triggerType,
        status: 'failed_limit_reached',
        note: 'Sicherheits-Stopp: Tageslimit für Bewässerung erreicht',
      };
      setWateringLogs((prev) => [limitLog, ...prev]);
      throw new Error('Tageslimit erreicht.');
    }

    // Call REST Backend API
    try {
      await fetch('/api/esp32/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: plant.esp32Ip || esp32State.ipAddress,
          durationSec,
          channelPin: plant.channelPin,
        }),
      });

      const waterAmountMl = durationSec * 30; // ~30ml per second

      // 1. Update plant state
      setPlants((prev) =>
        prev.map((p) => {
          if (p.id === plant.id) {
            const newMoisture = Math.min(95, p.soilMoisturePercent + durationSec * 5);
            return {
              ...p,
              soilMoisturePercent: newMoisture,
              lastWatered: new Date().toISOString(),
            };
          }
          return p;
        })
      );

      // 2. Update ESP32 state
      setEsp32State((prev) => {
        const newTank = Math.max(0, prev.tankLevelPercent - Math.round(durationSec * 1.5));
        return {
          ...prev,
          tankLevelPercent: newTank,
          isTankEmpty: newTank <= 10,
          dailyWateredMl: prev.dailyWateredMl + waterAmountMl,
          soilMoisturePercent: Math.min(100, prev.soilMoisturePercent + durationSec * 3),
        };
      });

      // 3. Add success log
      const successLog: WateringLog = {
        id: `log-${Date.now()}`,
        plantId: plant.id,
        plantName: plant.name,
        timestamp: new Date().toISOString(),
        durationSec,
        amountMl: waterAmountMl,
        triggerType,
        status: 'success',
        note: noteCustom || `Erfolgreiche Bewässerung via Pin GPIO ${plant.channelPin}`,
      };
      setWateringLogs((prev) => [successLog, ...prev]);

    } catch (err: any) {
      console.error('Fehler bei Bewässerung:', err);
      throw err;
    }
  };

  const handleTestPing = async (ip: string) => {
    try {
      const res = await fetch('/api/health');
      return res.ok;
    } catch {
      return false;
    }
  };

  const handleToggleAutoWatering = (plantId: string) => {
    setPlants((prev) =>
      prev.map((p) => (p.id === plantId ? { ...p, autoWateringEnabled: !p.autoWateringEnabled } : p))
    );
  };

  const handlePlantAdded = (newPlant: Plant) => {
    setPlants((prev) => [newPlant, ...prev]);
  };

  const handleUpdatePlant = (updatedPlant: Plant) => {
    setPlants((prev) => prev.map((p) => (p.id === updatedPlant.id ? updatedPlant : p)));
    setSelectedDetailPlant(updatedPlant);
  };

  const handleDeletePlant = (plantId: string) => {
    setPlants((prev) => prev.filter((p) => p.id !== plantId));
  };

  const updateESP32StatePartial = (newState: Partial<ESP32State>) => {
    setEsp32State((prev) => ({ ...prev, ...newState }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Global Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        esp32State={esp32State}
        onOpenScanner={() => setIsScannerOpen(true)}
        plantCount={plants.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Tank Empty Banner warning */}
        {esp32State.isTankEmpty && (
          <div className="p-4 bg-rose-950/90 border-2 border-rose-600 rounded-2xl text-rose-100 flex items-center justify-between shadow-2xl animate-pulse">
            <div className="flex items-center space-x-3">
              <ShieldAlert className="w-8 h-8 text-rose-400 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Trockenlaufschutz Aktiv: Wassertank ist Leer!
                </h3>
                <p className="text-xs text-rose-200 mt-0.5">
                  Alle automatischen und manuellen Gießbefehle sind gesperrt, um die Wasserpumpe vor Beschädigung zu schützen. Bitte Wassertank auffüllen.
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                updateESP32StatePartial({ tankLevelPercent: 100, isTankEmpty: false })
              }
              className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-colors flex-shrink-0"
            >
              Tank als Voll markieren
            </button>
          </div>
        )}

        {/* Tab 1: Dashboard (Pflanzenübersicht) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
                  <span>Deine Smart-Home Pflanzen</span>
                  <span className="text-emerald-400 text-base">({plants.length})</span>
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Gemini KI überwacht Bodenfeuchte und steuert deinen ESP32 Microcontroller im WLAN.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setActiveTab('calculator')}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-2"
                >
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span>Bedarfsrechner</span>
                </button>

                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/50 transition-all flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Neue Pflanze Scannen</span>
                </button>
              </div>
            </div>

            {/* Plants Grid */}
            {plants.length === 0 ? (
              <div className="py-16 text-center bg-slate-900/60 border border-slate-800 rounded-2xl p-8 space-y-4">
                <Droplets className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-lg font-bold text-white">Noch keine Pflanzen hinzugefügt</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Fotografiere eine Pflanze mit deiner Kamera oder wähle ein Beispielfoto. Die Gemini KI bestimmt die Art und richtet die ESP32 Bewässerung ein.
                </p>
                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all"
                >
                  Erste Pflanze scannen
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {plants.map((plant) => (
                  <PlantCard
                    key={plant.id}
                    plant={plant}
                    esp32State={esp32State}
                    onWaterTrigger={(p, duration) =>
                      executeWatering(p, duration, 'manual', 'Manuelle Bewässerung via Dashboard')
                    }
                    onToggleAutoWatering={handleToggleAutoWatering}
                    onOpenDetails={(p) => setSelectedDetailPlant(p)}
                  />
                ))}
              </div>
            )}

          </div>
        )}

        {/* Tab 2: ESP32 Hub */}
        {activeTab === 'esp32' && (
          <ESP32ControlPanel
            esp32State={esp32State}
            onUpdateESP32State={updateESP32StatePartial}
            onTestPing={handleTestPing}
            onManualPumpTrigger={(duration) => {
              if (plants.length > 0) {
                return executeWatering(plants[0], duration, 'esp32_sensor', 'Manual ESP32 Hub Test Trigger');
              }
              return Promise.resolve();
            }}
          />
        )}

        {/* Tab 3: History Log */}
        {activeTab === 'logs' && (
          <WateringHistoryLog
            logs={wateringLogs}
            onClearLogs={() => setWateringLogs([])}
          />
        )}

        {/* Tab 4: Arduino C++ Firmware Generator */}
        {activeTab === 'firmware' && <ESP32FirmwareGenerator />}

        {/* Tab 5: Smart Calculator */}
        {activeTab === 'calculator' && <SmartWateringCalculator />}

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 PlantPulse AI — KI-Automatisierung mit Gemini Vision API & ESP32 Smart-Home</p>
          <div className="flex items-center space-x-4 text-slate-400">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span>Gemini Vision Online</span>
            </span>
            <span>ESP32 REST Ready</span>
          </div>
        </div>
      </footer>

      {/* Camera / AI Scanner Modal */}
      <PlantScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onPlantAdded={handlePlantAdded}
      />

      {/* Plant Details & Edit Modal */}
      <PlantDetailModal
        plant={selectedDetailPlant}
        isOpen={!!selectedDetailPlant}
        onClose={() => setSelectedDetailPlant(null)}
        onUpdatePlant={handleUpdatePlant}
        onDeletePlant={handleDeletePlant}
        esp32State={esp32State}
        onWaterTrigger={(p, duration) =>
          executeWatering(p, duration, 'manual', 'Manuelle Bewässerung via Detailansicht')
        }
      />

    </div>
  );
}
