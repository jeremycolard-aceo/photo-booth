import React from 'react';
import { useGame } from '../context/GameContext';
import { Heart, Trophy, Clock } from 'lucide-react';

export const StatsBar: React.FC = () => {
  const { solidarity, level, xp, xpNeeded, happiness, stateTimer, doubleSpeedRemaining } = useGame();

  const pctXP = Math.min(100, (xp / xpNeeded) * 100);

  const getHumourEmoji = (val: number) => {
    if (val > 70) return '😊';
    if (val >= 40) return '😐';
    return '☹️';
  };

  const getHumourGlow = (val: number) => {
    if (val > 70) return 'shadow-[0_0_10px_rgba(34,197,94,0.25)] border-emerald-500/20';
    if (val >= 40) return 'shadow-[0_0_10px_rgba(234,179,8,0.15)] border-amber-500/20';
    return 'shadow-[0_0_12px_rgba(239,68,68,0.35)] border-rose-500/30 animate-pulse';
  };

  // Format global state timer
  const formatStateTimer = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const minutes = Math.floor(mins % 60);
    return `${hours}h${minutes.toString().padStart(2, '0')}`;
  };

  const getTimerColorClass = (mins: number) => {
    if (mins > 720) return 'text-indigo-400 font-bold';
    if (mins > 360) return 'text-purple-400 font-bold';
    return 'text-rose-400 font-black animate-pulse';
  };

  return (
    <div className="w-full flex items-center justify-between gap-1.5 xs:gap-2 px-2 py-1.5 rounded-xl glass-panel border border-white/5 select-none text-slate-100 overflow-hidden">
      
      {/* 1. Solidarity (❤️ Heart + Amount) */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse flex-shrink-0" />
        <span className="text-xs font-black tracking-tight">{solidarity}</span>
      </div>

      {/* 2. Level & XP Progress Bar (Extremely Compact) */}
      <div className="flex-1 flex items-center gap-1 bg-slate-950/45 px-1.5 py-0.5 rounded-md border border-white/5 min-w-0">
        <Trophy className="w-3 h-3 text-yellow-400 flex-shrink-0" />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex justify-between items-center text-[7.5px] font-black text-slate-400 leading-none mb-0.5">
            <span>N.{level}</span>
            <span className="truncate">{Math.round(xp)}/{xpNeeded}</span>
          </div>
          <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${pctXP}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Timer global (⏰ countdown) */}
      <div className="flex items-center gap-0.5 flex-shrink-0 bg-slate-950/20 px-1.5 py-0.5 rounded-md border border-white/5">
        <Clock className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
        <span className={`text-[10px] tracking-tight leading-none ${getTimerColorClass(stateTimer)}`}>
          {formatStateTimer(stateTimer)}
        </span>
      </div>

      {/* 4. Happiness Humor Emoji (only 😊, 😐, ☹️) */}
      <div className={`flex items-center justify-center w-7 h-7 rounded-full text-lg bg-slate-950/60 border ${getHumourGlow(happiness)} transition-all duration-300 flex-shrink-0 relative`}>
        {getHumourEmoji(happiness)}
        
        {doubleSpeedRemaining > 0 && (
          <span className="absolute -top-1 -right-1 bg-yellow-500 text-slate-950 text-[6px] font-black px-0.5 rounded-full animate-bounce">
            ⚡
          </span>
        )}
      </div>

    </div>
  );
};
