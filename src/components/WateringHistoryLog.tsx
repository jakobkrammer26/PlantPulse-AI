import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Download, 
  Trash2, 
  Droplets, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles, 
  Cpu, 
  User
} from 'lucide-react';
import { WateringLog } from '../types';

interface WateringHistoryLogProps {
  logs: WateringLog[];
  onClearLogs: () => void;
}

export const WateringHistoryLog: React.FC<WateringHistoryLogProps> = ({
  logs,
  onClearLogs,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.plantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.note && log.note.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterType === 'all') return matchesSearch;
    return matchesSearch && log.triggerType === filterType;
  });

  const handleExportCsv = () => {
    const headers = 'ID,Pflanze,Zeitpunkt,Dauer (s),Menge (ml),Auslöser,Status,Notiz\n';
    const rows = logs
      .map(
        (l) =>
          `"${l.id}","${l.plantName}","${l.timestamp}",${l.durationSec},${l.amountMl},"${l.triggerType}","${l.status}","${l.note || ''}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bewässerungs-Protokoll_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'ai_auto':
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      case 'esp32_sensor':
        return <Cpu className="w-4 h-4 text-cyan-400" />;
      case 'manual':
        return <User className="w-4 h-4 text-amber-400" />;
      default:
        return <Droplets className="w-4 h-4 text-blue-400" />;
    }
  };

  const getTriggerLabel = (type: string) => {
    switch (type) {
      case 'ai_auto':
        return 'KI-Automatik';
      case 'esp32_sensor':
        return 'ESP32 Sensor';
      case 'manual':
        return 'Manuell';
      default:
        return 'Zeitplan';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>Erfolgreich</span>
          </span>
        );
      case 'failed_empty_tank':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            <span>Sicherheits-Stopp: Tank Leer</span>
          </span>
        );
      case 'failed_limit_reached':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>Tageslimit Erreicht</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-700 text-slate-300">
            <span>Offline / Fehler</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      
      {/* Header */}
      <div className="p-6 bg-slate-900 border border-emerald-900/50 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
            <History className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Bewässerungsprotokoll & Diagnosedaten</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Vollständige Historie aller manuellen und automatischen Gießimpulse inklusive Sicherheitsereignissen
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCsv}
            disabled={logs.length === 0}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>CSV Export</span>
          </button>
          <button
            onClick={() => {
              if (confirm('Möchtest du das gesamte Protokoll löschen?')) onClearLogs();
            }}
            disabled={logs.length === 0}
            className="flex items-center space-x-2 px-4 py-2.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/60 text-rose-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>Protokoll leeren</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pflanze oder Notiz suchen..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              filterType === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Alle ({logs.length})
          </button>
          <button
            onClick={() => setFilterType('ai_auto')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              filterType === 'ai_auto' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            KI-Automatik
          </button>
          <button
            onClick={() => setFilterType('manual')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              filterType === 'manual' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Manuell
          </button>
        </div>

      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <History className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-sm">Keine Protokolleinträge gefunden.</p>
            <p className="text-xs text-slate-500">
              Sobald Pflanzen manuell oder per KI gegossen werden, erscheinen hier alle Diagnose-Einträge.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Zeitpunkt</th>
                  <th className="px-4 py-3">Pflanze</th>
                  <th className="px-4 py-3">Auslöser</th>
                  <th className="px-4 py-3">Dauer / Menge</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Anmerkung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('de-DE')}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-white whitespace-nowrap">
                      {log.plantName}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        {getTriggerIcon(log.triggerType)}
                        <span className="font-semibold">{getTriggerLabel(log.triggerType)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-cyan-300 whitespace-nowrap">
                      {log.durationSec}s (~{log.amountMl} ml)
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getStatusBadge(log.status)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">
                      {log.note || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
