import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import type { Roommate, ResourceType } from '../context/GameContext';
import { Info, Award, Clock } from 'lucide-react';

interface RoommatesRowProps {
  selectedColocId: string | null;
  onSelectColoc: (id: string | null) => void;
}

export const RoommatesRow: React.FC<RoommatesRowProps> = ({ selectedColocId, onSelectColoc }) => {
  const { roommates, stateTimer, getColocSkillsDynamic, assignColoc } = useGame();
  const [activeModalColoc, setActiveModalColoc] = useState<Roommate | null>(null);
  const [touchColocId, setTouchColocId] = useState<string | null>(null);

  // Format global timer (same for everyone)
  const formatTimer = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const minutes = Math.floor(mins % 60);
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  };

  const handleDragStart = (e: React.DragEvent, colocId: string) => {
    e.dataTransfer.setData('colocId', colocId);
  };

  const handleTouchStart = (colocId: string) => {
    setTouchColocId(colocId);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchColocId) return;
    const touch = e.changedTouches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    
    // Find elements under touch coordinate
    let el = document.elementFromPoint(x, y);
    let postitId: string | null = null;
    while (el) {
      const id = el.getAttribute('data-postit-id');
      if (id) {
        postitId = id;
        break;
      }
      el = el.parentElement;
    }

    if (postitId) {
      assignColoc(touchColocId, postitId);
    }
    setTouchColocId(null);
  };

  // Skill labels metadata for roomie skills line
  const skillMetadata: { key: ResourceType; icon: string }[] = [
    { key: 'finance', icon: '💶' },
    { key: 'sante', icon: '💪' },
    { key: 'reseau', icon: '🤝' }, // Handshake emoji requested
    { key: 'droits', icon: '⚖️' },
    { key: 'rebond', icon: '🚀' },
  ];

  return (
    <div className="w-full">
      {/* Roommates Row Grid */}
      <div className="grid grid-cols-3 gap-1.5 px-1 py-1 rounded-2xl glass-panel border border-white/5">
        {roommates.map((coloc) => {
          const isSelected = selectedColocId === coloc.id;
          const isWorking = coloc.assignedPostitId !== null;
          const isBeingTouched = touchColocId === coloc.id;
          
          // Get dynamic skills affected by active crises (malus) or weekly meetings (bonus)
          const dynamicStats = getColocSkillsDynamic(coloc);

          return (
            <div
              key={coloc.id}
              draggable="true"
              onDragStart={(e) => handleDragStart(e, coloc.id)}
              onTouchStart={() => handleTouchStart(coloc.id)}
              onTouchEnd={handleTouchEnd}
              onClick={() => {
                // Toggle selection for tap-to-assign
                onSelectColoc(isSelected ? null : coloc.id);
              }}
              className={`flex flex-col items-center py-2 px-0.5 rounded-xl relative cursor-pointer select-none transition-all duration-200 active:scale-95 ${
                isSelected || isBeingTouched
                  ? 'bg-purple-500/25 border-2 border-purple-500 scale-105 shadow-[0_0_15px_rgba(168,85,247,0.4)] z-10 animate-pulse'
                  : isWorking
                  ? 'bg-slate-900/40 border border-slate-700/50'
                  : 'bg-slate-900/80 border border-white/5 hover:border-slate-700'
              }`}
            >
              {/* Profile Details Trigger (i) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveModalColoc(coloc);
                }}
                className="absolute top-1 right-1 p-0.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                title="Détails du profil"
              >
                <Info className="w-3 h-3" />
              </button>

              {/* Avatar Icon */}
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-2xl relative bg-slate-950/60 shadow-inner">
                {coloc.avatar}
                
                {/* Working indicator dots */}
                {isWorking && (
                  <span className="absolute bottom-0 right-0 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                  </span>
                )}
              </div>

              {/* Name */}
              <span className="text-xs font-bold mt-1 leading-none text-slate-200">
                {coloc.name}
              </span>
              
              {/* COMPRESSED STATS DISPLAY DIRECTLY ON CARD */}
              {/* Layout: 1💶2💪3🤝1⚖️5🚀 */}
              <div className="flex items-center gap-0.5 text-[8.5px] font-black tracking-tighter mt-1.5 leading-none max-w-full overflow-hidden select-none bg-slate-950/40 px-1 py-0.5 rounded-md border border-white/5">
                {skillMetadata.map((meta) => {
                  const val = dynamicStats[meta.key];
                  const hasBonus = dynamicStats.bonuses[meta.key];
                  const hasMalus = dynamicStats.maluses[meta.key];

                  let colorClass = 'text-slate-300';
                  if (hasMalus) colorClass = 'text-rose-400 font-extrabold animate-pulse';
                  else if (hasBonus) colorClass = 'text-emerald-400 font-extrabold';

                  return (
                    <span key={meta.key} className="flex items-center gap-0.5" title={`${meta.key}: ${val}`}>
                      <span className={colorClass}>{val}</span>
                      <span className="leading-none opacity-90">{meta.icon}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Roommate Detail Modal (SIMPLIFIED) */}
      {activeModalColoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl glass-panel-heavy p-5 border border-white/10 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Close button */}
            <button
              onClick={() => setActiveModalColoc(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-lg font-bold"
            >
              ✕
            </button>

            {/* Header */}
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-4xl shadow-md">
                {activeModalColoc.avatar}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xl font-black text-slate-100">{activeModalColoc.name}</h3>
                  <span className="text-xs text-slate-400">({activeModalColoc.age} ans)</span>
                </div>
                <span className="text-xs text-violet-400 font-bold">{activeModalColoc.role}</span>
              </div>
            </div>

            {/* Bio (ENRICHED) */}
            <div className="mb-4 bg-slate-900/60 p-3.5 rounded-xl border border-white/5 shadow-inner">
              <p className="text-xs text-slate-200 leading-relaxed font-semibold">
                {activeModalColoc.description}
              </p>
            </div>

            {/* Dossier status (Dossier déjà déposé) */}
            <div className="mb-4 p-3 rounded-xl border border-dashed border-white/10 bg-slate-900/30 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Dossier de Survie</span>
                <span className="text-xs font-bold text-slate-200">Déposé : {activeModalColoc.dossierName}</span>
              </div>
            </div>

            {/* Global validation timer (Same for everyone) */}
            <div className="mb-5 p-3 rounded-xl border border-white/5 bg-slate-950/40 flex items-center gap-2">
              <Clock className="w-5 h-5 text-violet-400 flex-shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Échéance administrative</span>
                <span className="text-xs font-bold text-slate-100">
                  Validation de l'État dans : <span className="text-violet-400 underline font-black">{formatTimer(stateTimer)}</span>
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setActiveModalColoc(null)}
                className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95"
              >
                Retourner à la Coloc
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
