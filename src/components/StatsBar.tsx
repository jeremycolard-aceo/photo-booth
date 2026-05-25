import React from 'react';
import { useGame } from '../context/GameContext';
import type { ResourceType } from '../context/GameContext';
import { Sparkles, Heart } from 'lucide-react';

interface StatsBarProps {
  onOpenShop: () => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({ onOpenShop }) => {
  const { solidarity, resources, happiness, upgrades, doubleSpeedRemaining } = useGame();

  const hasReunion = upgrades.find((u) => u.id === 'reunionHebdo')?.purchased;

  const resourceMetadata: Record<ResourceType, { label: string; icon: string; color: string; border: string }> = {
    finance: { label: 'Finances', icon: '💶', color: 'bg-emerald-500', border: 'border-emerald-500/20' },
    sante: { label: 'Santé', icon: '💪', color: 'bg-rose-500', border: 'border-rose-500/20' },
    reseau: { label: 'Réseau', icon: '🧑🤝🧑', color: 'bg-indigo-500', border: 'border-indigo-500/20' },
    droits: { label: 'Droits', icon: '⚖️', color: 'bg-amber-500', border: 'border-amber-500/20' },
    rebond: { label: 'Rebond', icon: '🚀', color: 'bg-sky-500', border: 'border-sky-500/20' },
  };

  const getHappinessColor = (val: number) => {
    if (val > 70) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (val > 40) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  const getHappinessSmiley = (val: number) => {
    if (val > 80) return '😁 Super';
    if (val > 60) return '🙂 Correct';
    if (val > 40) return '😐 Tendu';
    if (val > 20) return '😟 Fatigué';
    return '😭 Crise';
  };

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Upper row: Solidarity and Happiness */}
      <div className="flex items-center justify-between gap-2">
        {/* Solidarity Counter */}
        <div className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl glass-panel border border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
          <div className="flex items-center gap-1.5">
            <span className="text-xl">🤝</span>
            <div className="flex flex-col">
              <span className="text-[10px] text-violet-300/60 uppercase font-bold tracking-wider leading-none">Solidarité</span>
              <span className="text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-purple-300 to-pink-300 leading-tight">
                {solidarity} SP
              </span>
            </div>
          </div>
          <button
            onClick={onOpenShop}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-indigo-950/50 hover:shadow-indigo-500/20 transition-all border border-indigo-400/30 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Shop</span>
          </button>
        </div>

        {/* Happiness status */}
        <div className={`flex-1 flex items-center justify-between px-3 py-2 rounded-xl border ${getHappinessColor(happiness)} transition-all`}>
          <div className="flex items-center gap-1.5">
            <Heart className={`w-5 h-5 ${happiness > 40 ? 'animate-pulse' : 'animate-bounce'} fill-current`} />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-wider leading-none opacity-60">Bonheur Coloc</span>
              <span className="text-sm font-extrabold leading-tight">
                {happiness}% <span className="text-[10px] font-medium opacity-80">({getHappinessSmiley(happiness)})</span>
              </span>
            </div>
          </div>
          {doubleSpeedRemaining > 0 && (
            <div className="flex items-center gap-0.5 bg-yellow-500 text-slate-950 font-extrabold text-[9px] px-1.5 py-0.5 rounded-full animate-bounce">
              ⚡ x2 ({doubleSpeedRemaining}s)
            </div>
          )}
        </div>
      </div>

      {/* Resource Jauges Grid */}
      <div className="grid grid-cols-5 gap-1.5">
        {(Object.keys(resourceMetadata) as ResourceType[]).map((key) => {
          const meta = resourceMetadata[key];
          const baseVal = resources[key];
          // Reunion Hebdo adds constant +1
          const displayVal = baseVal + (hasReunion ? 1 : 0);
          const percentage = (displayVal / 20) * 100;

          return (
            <div
              key={key}
              className={`flex flex-col items-center p-1.5 rounded-xl glass-card border ${meta.border}`}
            >
              <div className="flex items-center gap-0.5 justify-center mb-0.5">
                <span className="text-base leading-none">{meta.icon}</span>
              </div>
              <span className="text-[9px] text-slate-400 font-semibold truncate max-w-full leading-none mb-1">
                {meta.label}
              </span>
              
              {/* Progress bar container */}
              <div className="w-full h-2.5 bg-slate-900/60 rounded-full overflow-hidden border border-white/5 relative">
                <div
                  className={`h-full ${meta.color} transition-all duration-500 rounded-full`}
                  style={{ width: `${Math.min(100, percentage)}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-slate-200 mt-1 leading-none">
                {displayVal}/20
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
