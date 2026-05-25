import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import type { Roommate, ResourceType } from '../context/GameContext';
import { Info, CheckCircle2, Award } from 'lucide-react';

interface RoommatesRowProps {
  selectedColocId: string | null;
  onSelectColoc: (id: string | null) => void;
}

export const RoommatesRow: React.FC<RoommatesRowProps> = ({ selectedColocId, onSelectColoc }) => {
  const { roommates, resources, solidarity, secureRoommate, upgrades, unassignColoc } = useGame();
  const [activeModalColoc, setActiveModalColoc] = useState<Roommate | null>(null);

  const hasReunion = upgrades.find((u) => u.id === 'reunionHebdo')?.purchased ? 1 : 0;

  // Helper to check if roommate is securable
  const checkSecurable = (coloc: Roommate) => {
    let cost = 800;
    let res1: ResourceType = 'finance';
    let res2: ResourceType = 'reseau';

    if (coloc.id === 'marc') {
      cost = 1000;
      res1 = 'rebond';
      res2 = 'droits';
    } else if (coloc.id === 'lisa') {
      cost = 800;
      res1 = 'reseau';
      res2 = 'finance';
    } else if (coloc.id === 'nico') {
      cost = 1200;
      res1 = 'sante';
      res2 = 'droits';
    } else if (coloc.id === 'marie') {
      cost = 900;
      res1 = 'reseau';
      res2 = 'sante';
    }

    const hasRes1 = (resources[res1] + hasReunion) >= 15;
    const hasRes2 = (resources[res2] + hasReunion) >= 15;
    const hasSolidarity = solidarity >= cost;

    return {
      isSecurable: hasRes1 && hasRes2 && hasSolidarity,
      cost,
      res1,
      res2,
      hasRes1,
      hasRes2,
      hasSolidarity,
    };
  };

  const handleDragStart = (e: React.DragEvent, colocId: string) => {
    e.dataTransfer.setData('colocId', colocId);
  };
  const resourceLabels: Record<ResourceType, string> = {
    finance: '💶 Finance',
    sante: '💪 Santé',
    reseau: '🧑🤝🧑 Réseau',
    droits: '⚖️ Droits',
    rebond: '🚀 Rebond',
  };

  return (
    <div className="w-full">
      {/* Roommates Avatar Circles Row */}
      <div className="flex justify-between items-center gap-1.5 px-1 py-1 rounded-2xl glass-panel border border-white/5">
        {roommates.map((coloc) => {
          const isSelected = selectedColocId === coloc.id;
          const isWorking = coloc.assignedPostitId !== null;
          const securableInfo = checkSecurable(coloc);

          return (
            <div
              key={coloc.id}
              draggable={!coloc.isSecured}
              onDragStart={(e) => handleDragStart(e, coloc.id)}
              onClick={() => {
                if (coloc.isSecured) {
                  setActiveModalColoc(coloc);
                } else {
                  // Toggle selection for tap-to-assign
                  onSelectColoc(isSelected ? null : coloc.id);
                }
              }}
              className={`flex-1 flex flex-col items-center py-2 px-1 rounded-xl relative cursor-pointer select-none transition-all active:scale-95 duration-200 ${
                coloc.isSecured
                  ? 'bg-emerald-950/20 border border-emerald-500/30'
                  : isSelected
                  ? 'bg-purple-500/20 border-2 border-purple-500 scale-105 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
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
              >
                <Info className="w-3 h-3" />
              </button>

              {/* Avatar Icon */}
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-2xl relative bg-slate-950/60 shadow-inner">
                {coloc.avatar}
                
                {/* Secured Badge */}
                {coloc.isSecured && (
                  <div className="absolute -bottom-1 -right-1 bg-slate-950 rounded-full">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-950" />
                  </div>
                )}

                {/* Working indicator dots */}
                {!coloc.isSecured && isWorking && (
                  <span className="absolute bottom-0 right-0 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                  </span>
                )}

                {/* Securable indicator spark */}
                {!coloc.isSecured && securableInfo.isSecurable && (
                  <span className="absolute -top-1 -left-1 flex h-3 w-3 bg-amber-400 text-[8px] items-center justify-center rounded-full animate-bounce">
                    ✨
                  </span>
                )}
              </div>

              {/* Name */}
              <span className={`text-xs font-bold mt-1.5 leading-none ${coloc.isSecured ? 'text-emerald-400' : 'text-slate-200'}`}>
                {coloc.name}
              </span>
              
              {/* Mini Status Tag */}
              <span className={`text-[8px] mt-1 px-1 rounded-full font-bold opacity-80 leading-none ${
                coloc.isSecured 
                  ? 'text-emerald-400 bg-emerald-950/30' 
                  : isWorking 
                  ? 'text-violet-400 bg-violet-950/30' 
                  : 'text-slate-400 bg-slate-800/40'
              }`}>
                {coloc.isSecured ? 'Sécurisé' : isWorking ? 'Actif' : 'Libre'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Roommate Detail Modal */}
      {activeModalColoc && (() => {
        const info = checkSecurable(activeModalColoc);
        return (
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

              {/* Bio & Dossier name */}
              <p className="text-xs text-slate-300 italic mb-4 bg-slate-900/40 p-2.5 rounded-xl border border-white/5">
                "{activeModalColoc.description}"
              </p>

              {/* Skills */}
              <div className="mb-4">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Compétences</h4>
                <div className="grid grid-cols-5 gap-1 bg-slate-950/40 p-2 rounded-xl border border-white/5">
                  {Object.entries(activeModalColoc.skills).map(([key, val]) => (
                    <div key={key} className="flex flex-col items-center">
                      <span className="text-base">
                        {key === 'finance' ? '💶' : key === 'sante' ? '💪' : key === 'reseau' ? '🧑🤝🧑' : key === 'droits' ? '⚖️' : '🚀'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-300 mt-0.5">+{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dossier status */}
              <div className="mb-5 p-3 rounded-xl border border-dashed border-white/10 bg-slate-900/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black text-amber-400 uppercase">Dossier de Survie</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    activeModalColoc.isSecured 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {activeModalColoc.isSecured ? 'Validé' : 'En attente'}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-100 mb-3">{activeModalColoc.dossierName}</p>
                
                {/* Requirements for submission */}
                {!activeModalColoc.isSecured && (
                  <div className="flex flex-col gap-1.5 text-xs text-slate-300">
                    <div className="flex justify-between items-center">
                      <span>Solidarité requise :</span>
                      <span className={`font-bold ${info.hasSolidarity ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {solidarity}/{info.cost} SP
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>{resourceLabels[info.res1]} requis :</span>
                      <span className={`font-bold ${info.hasRes1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {resources[info.res1] + hasReunion}/15
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>{resourceLabels[info.res2]} requis :</span>
                      <span className={`font-bold ${info.hasRes2 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {resources[info.res2] + hasReunion}/15
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2">
                {!activeModalColoc.isSecured ? (
                  <>
                    {/* Submit Dossier Button */}
                    <button
                      onClick={() => {
                        secureRoommate(activeModalColoc.id);
                        setActiveModalColoc(null);
                      }}
                      disabled={!info.isSecurable}
                      className={`w-full py-2.5 rounded-xl font-extrabold text-sm transition-all flex items-center justify-center gap-1.5 ${
                        info.isSecurable
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-95 animate-pulse'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Déposer le Dossier !</span>
                    </button>

                    {/* Unassign button if active */}
                    {activeModalColoc.assignedPostitId && (
                      <button
                        onClick={() => {
                          unassignColoc(activeModalColoc.id);
                          setActiveModalColoc(null);
                        }}
                        className="w-full py-2 rounded-xl text-xs font-semibold bg-rose-950/30 text-rose-400 border border-rose-900/40 hover:bg-rose-950/50 active:scale-95 transition-all"
                      >
                        Retirer du post-it actuel
                      </button>
                    )}

                    {/* Quick assign action */}
                    <button
                      onClick={() => {
                        onSelectColoc(activeModalColoc.id);
                        setActiveModalColoc(null);
                      }}
                      className="w-full py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all border border-white/5 active:scale-95"
                    >
                      Sélectionner pour assigner (Tap-to-Assign)
                    </button>
                  </>
                ) : (
                  <div className="w-full py-2 rounded-xl bg-emerald-950/20 text-emerald-400 border border-emerald-500/20 flex items-center justify-center gap-1 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Dossier sécurisé ! Bravo.</span>
                  </div>
                )}
                
                <button
                  onClick={() => setActiveModalColoc(null)}
                  className="w-full py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-300"
                >
                  Fermer
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};
