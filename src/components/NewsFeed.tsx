import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import type { LogEntry } from '../context/GameContext';
import { Radio, History, ClipboardList } from 'lucide-react';

export const NewsFeed: React.FC = () => {
  const { logs } = useGame();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const latestLog = logs[0] || { text: 'La colocation s\'organise au calme... ☕', type: 'info' };

  const getLogColorClass = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-emerald-400 font-bold';
      case 'warning': return 'text-orange-400 font-bold';
      case 'error': return 'text-rose-400 font-extrabold animate-pulse';
      case 'bonus': return 'text-violet-400 font-extrabold';
      default: return 'text-slate-300';
    }
  };

  const getHistoryColorClass = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'border-l-4 border-emerald-500 bg-emerald-950/10 text-emerald-300';
      case 'warning': return 'border-l-4 border-orange-500 bg-orange-950/10 text-orange-300';
      case 'error': return 'border-l-4 border-rose-500 bg-rose-950/10 text-rose-300';
      case 'bonus': return 'border-l-4 border-violet-500 bg-violet-950/10 text-violet-300';
      default: return 'border-l-4 border-slate-500 bg-slate-900/40 text-slate-300';
    }
  };

  return (
    <div className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl glass-panel border border-white/5 relative overflow-hidden">
      {/* Red Glowing Banner Edge for breaking news style */}
      <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-rose-500 to-violet-500 animate-pulse" />

      {/* Breaking News Tag */}
      <div className="flex items-center gap-1 flex-shrink-0 text-rose-500 font-extrabold text-[10px] uppercase tracking-wider bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
        <Radio className="w-3.5 h-3.5 animate-pulse" />
        <span className="hidden sm:inline">Flash Info</span>
      </div>

      {/* Ticker Text container */}
      <div className="flex-1 overflow-hidden relative h-5 flex items-center">
        <div className="w-full truncate text-[11px] font-semibold text-left select-none pl-1">
          <span className={getLogColorClass(latestLog.type)}>
            {latestLog.text}
          </span>
        </div>
      </div>

      {/* History log trigger */}
      <button
        onClick={() => setIsHistoryOpen(true)}
        className="flex-shrink-0 p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-400 hover:text-slate-200 active:scale-95 transition-all"
        title="Historique des événements"
      >
        <History className="w-3.5 h-3.5" />
      </button>

      {/* Event History Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl glass-panel-heavy p-5 border border-white/10 shadow-2xl relative max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            {/* Close */}
            <button
              onClick={() => setIsHistoryOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-lg font-bold"
            >
              ✕
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="w-5 h-5 text-violet-400" />
              <div>
                <h3 className="text-lg font-black text-slate-100">Journal de la Coloc</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Historique des 50 derniers événements
                </p>
              </div>
            </div>

            {/* Logs List */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 mb-4">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-slate-500 font-bold text-xs italic">
                  Aucun événement enregistré pour le moment...
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2.5 rounded-xl border border-white/5 text-xs flex flex-col gap-0.5 leading-relaxed ${getHistoryColorClass(log.type)}`}
                  >
                    <span className="text-[9px] font-black opacity-60 leading-none">
                      [ {log.time} ]
                    </span>
                    <span className="font-semibold">{log.text}</span>
                  </div>
                ))
              )}
            </div>

            {/* Close button */}
            <button
              onClick={() => setIsHistoryOpen(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 border border-white/5 text-slate-300 hover:text-slate-200 rounded-xl text-xs font-black transition-all"
            >
              Fermer le Journal
            </button>

          </div>
        </div>
      )}
    </div>
  );
};
