import React from 'react';
import { PlantPulseLogo } from './PlantPulseLogo';
import { 
  Sparkles, 
  Cpu, 
  Droplets, 
  History, 
  Code2, 
  AlertTriangle, 
  Wifi, 
  WifiOff,
  Plus
} from 'lucide-react';
import { ESP32State } from '../types';

interface HeaderProps {
  activeTab: 'dashboard' | 'esp32' | 'logs' | 'firmware' | 'calculator';
  setActiveTab: (tab: 'dashboard' | 'esp32' | 'logs' | 'firmware' | 'calculator') => void;
  esp32State: ESP32State;
  onOpenScanner: () => void;
  plantCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  esp32State,
  onOpenScanner,
  plantCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-emerald-900/40 text-slate-100 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Left: Branding */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <PlantPulseLogo className="w-10 h-10 text-emerald-400" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xl tracking-tight text-white font-sans">
                  PlantPulse <span className="text-emerald-400">AI</span>
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  v2.4 Smart-Home
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                KI-Pflanzenerkennung & ESP32 Bewässerungssteuerung
              </p>
            </div>
          </div>

          {/* Center: Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Droplets className="w-4 h-4 text-emerald-300" />
              <span>Pflanzen ({plantCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('esp32')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'esp32'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Cpu className="w-4 h-4 text-emerald-300" />
              <span>ESP32 Hub</span>
              {esp32State.isTankEmpty && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'logs'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <History className="w-4 h-4 text-emerald-300" />
              <span>Protokoll</span>
            </button>

            <button
              onClick={() => setActiveTab('firmware')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'firmware'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Code2 className="w-4 h-4 text-emerald-300" />
              <span>Arduino C++</span>
            </button>
          </nav>

          {/* Right: Actions & ESP32 Quick Status */}
          <div className="flex items-center space-x-3">
            {/* Tank status pill */}
            <div 
              onClick={() => setActiveTab('esp32')}
              className={`cursor-pointer hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                esp32State.isTankEmpty
                  ? 'bg-rose-950/80 text-rose-300 border-rose-600/50 animate-pulse'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:border-emerald-500/40'
              }`}
            >
              {esp32State.isTankEmpty ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Tank Leer!</span>
                </>
              ) : (
                <>
                  <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Tank: {esp32State.tankLevelPercent}%</span>
                </>
              )}
            </div>

            {/* ESP32 Wifi indicator */}
            <div 
              onClick={() => setActiveTab('esp32')}
              className="cursor-pointer flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 border border-slate-700/60"
              title={`Verbunden mit ${esp32State.ipAddress}`}
            >
              {esp32State.isConnected ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300 hidden lg:inline">
                    ESP32 Online
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-rose-300 hidden lg:inline">Offline</span>
                </>
              )}
            </div>

            {/* AI Scanner Button */}
            <button
              onClick={onOpenScanner}
              className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/50 hover:shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-200 animate-spin-slow" />
              <span className="hidden sm:inline">Pflanze scannen</span>
              <Plus className="w-4 h-4 sm:hidden" />
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="md:hidden flex items-center justify-around bg-slate-900 border-t border-slate-800 py-2 px-2 text-xs">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center space-y-1 p-1 ${
            activeTab === 'dashboard' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Droplets className="w-5 h-5" />
          <span>Pflanzen</span>
        </button>
        <button
          onClick={() => setActiveTab('esp32')}
          className={`flex flex-col items-center space-y-1 p-1 relative ${
            activeTab === 'esp32' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Cpu className="w-5 h-5" />
          <span>ESP32</span>
          {esp32State.isTankEmpty && (
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex flex-col items-center space-y-1 p-1 ${
            activeTab === 'logs' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <History className="w-5 h-5" />
          <span>Log</span>
        </button>
        <button
          onClick={() => setActiveTab('firmware')}
          className={`flex flex-col items-center space-y-1 p-1 ${
            activeTab === 'firmware' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Code2 className="w-5 h-5" />
          <span>Code</span>
        </button>
      </div>
    </header>
  );
};
