import React from 'react';
import { useGame } from '../context/GameContext';
import { Heart, Trophy } from 'lucide-react';

export const StatsBar: React.FC = () => {
  const { solidarity, level, xp, xpNeeded, happiness, doubleSpeedRemaining } = useGame();

  const pctXP = Math.min(100, (xp / xpNeeded) * 100);

  const getHumourEmoji = (val: number) => {
    if (val > 70) return '😊';
    if (val >= 40) return '😐';
    return '☹️';
  };

  const getHumourGlow = (val: number) => {
    if (val > 70) return 'shadow-[0_0_12px_rgba(34,197,94,0.3)] border-emerald-500/20';
    if (val >= 40) return 'shadow-[0_0_12px_rgba(234,179,8,0.2)] border-amber-500/20';
    return 'shadow-[0_0_15px_rgba(239,68,68,0.4)] border-rose-500/30 animate-pulse';
  };

  return (
    <div className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl glass-panel border border-white/5 select-none">
      
      {/* 1. Solidarity (❤️ Heart + Amount) */}
      <div className="flex items-center gap-2">
        <Heart className="w-6 h-6 text-rose-500 fill-rose-500 animate-pulse flex-shrink-0" />
        <div className="flex flex-col">
          <span className="text-[10px] text-rose-300/60 uppercase font-black tracking-wider leading-none">Solidarité</span>
          <span className="text-lg font-black text-slate-100 leading-tight">
            {solidarity}
          </span>
        </div>
      </div>

      {/* 2. Level & XP Progress Bar */}
      <div className="flex-1 max-w-xs flex items-center gap-2 bg-slate-950/40 border border-white/5 px-2.5 py-1 rounded-lg">
        <Trophy className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center text-[9px] font-black text-slate-400 leading-none mb-0.5">
            <span>NIVEAU {level}</span>
            <span>{Math.round(xp)}/{xpNeeded} XP</span>
          </div>
          {/* XP Bar */}
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5 relative">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${pctXP}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Happiness Humor Emoji (only 😊, 😐, ☹️) */}
      <div className={`flex items-center justify-center w-9 h-9 rounded-full text-2xl bg-slate-950/60 border ${getHumourGlow(happiness)} transition-all duration-300 flex-shrink-0 relative`}>
        {getHumourEmoji(happiness)}
        
        {/* Double speed active tiny tag */}
        {doubleSpeedRemaining > 0 && (
          <span className="absolute -top-1 -right-1 bg-yellow-500 text-slate-950 text-[7px] font-black px-1 rounded-full animate-bounce">
            ⚡
          </span>
        )}
      </div>

    </div>
  );
};
