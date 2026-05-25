import React from 'react';
import { useGame } from '../context/GameContext';
import type { Postit, ResourceType } from '../context/GameContext';
import { UserPlus, X, AlertTriangle, Clock } from 'lucide-react';

interface PostitCardProps {
  postit: Postit;
  selectedColocId: string | null;
  onSelectColoc: (id: string | null) => void;
}

export const PostitCard: React.FC<PostitCardProps> = ({ postit, selectedColocId, onSelectColoc }) => {
  const { roommates, assignColoc, unassignColoc, upgrades, doubleSpeedRemaining, happiness } = useGame();

  const isXL = upgrades.find((u) => u.id === 'tableauXL')?.purchased;
  const hasFibre = upgrades.find((u) => u.id === 'fibreOptique')?.purchased;
  
  const targetProgress = hasFibre ? 270 : 300;
  const pct = Math.min(100, (postit.progress / targetProgress) * 100);

  // Get roommates assigned to this postit
  const assignedRoommates = roommates.filter((r) => postit.assignedColocs.includes(r.id));

  // Resource type names & styles
  const resourceNames: Record<ResourceType, string> = {
    finance: 'Finance',
    sante: 'Santé',
    reseau: 'Réseau',
    droits: 'Droits',
    rebond: 'Rebond',
  };

  // Calculate sum of skills for this postit
  let sumSkills = 0;
  assignedRoommates.forEach((r) => {
    sumSkills += r.skills[postit.type];
  });

  // Calculate time remaining in seconds
  const speedPenalty = happiness < 50 ? 0.8 : 1.0;
  const doubleSpeedMultiplier = doubleSpeedRemaining > 0 ? 2 : 1;
  const effectiveSpeed = sumSkills * speedPenalty * doubleSpeedMultiplier;
  
  const workRemaining = targetProgress - postit.progress;
  const secondsRemaining = effectiveSpeed > 0 ? Math.ceil(workRemaining / effectiveSpeed) : null;

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const colocId = e.dataTransfer.getData('colocId');
    if (colocId) {
      assignColoc(colocId, postit.id);
    }
  };

  // Tap-to-assign slot handler
  const handleSlotClick = () => {
    if (selectedColocId) {
      assignColoc(selectedColocId, postit.id);
      onSelectColoc(null); // Clear selection
    }
  };

  // Format elapsed time (mm:ss)
  const formatElapsedTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Get urgency tag class
  const getUrgencyBadge = (urgency: Postit['urgency']) => {
    switch (urgency) {
      case 'jaune':
        return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      case 'orange':
        return 'bg-orange-500/10 text-orange-400 border border-orange-500/20 animate-pulse';
      case 'rouge':
        return 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse font-extrabold';
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative flex flex-col p-3 rounded-2xl bg-gradient-to-br border shadow-lg transition-all duration-300 ${postit.colorClass} ${
        selectedColocId 
          ? 'hover:border-purple-400/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)] ring-2 ring-purple-500/20 ring-offset-2 ring-offset-slate-950 cursor-pointer' 
          : ''
      }`}
      onClick={selectedColocId ? handleSlotClick : undefined}
    >
      {/* Upper line: Icon, Title, Urgency Badge */}
      <div className="flex items-start justify-between gap-1 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xl flex-shrink-0" role="img" aria-label={postit.type}>
            {postit.icon}
          </span>
          <div className="flex flex-col min-w-0">
            <h4 className="text-xs font-bold text-slate-100 truncate leading-tight">
              {postit.title}
            </h4>
            <span className="text-[9px] text-slate-400 font-semibold leading-none">
              {resourceNames[postit.type]}
            </span>
          </div>
        </div>

        {/* Urgency Badge */}
        <span className={`text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold leading-none ${getUrgencyBadge(postit.urgency)}`}>
          {postit.urgency}
        </span>
      </div>

      {/* Progress Section */}
      <div className="mb-3">
        <div className="flex justify-between items-center text-[9px] text-slate-400 font-semibold mb-1">
          <span className="flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />
            {formatElapsedTime(postit.elapsedTime)}
          </span>
          <span>
            {Math.round(pct)}% ({Math.round(postit.progress)}/{targetProgress})
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-950/80 rounded-full overflow-hidden border border-white/5 relative">
          <div
            className={`h-full rounded-full transition-all duration-300 bg-gradient-to-r ${
              postit.urgency === 'rouge'
                ? 'from-rose-500 to-pink-500'
                : postit.urgency === 'orange'
                ? 'from-orange-400 to-amber-500'
                : 'from-amber-400 to-yellow-400'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Processing Info (Time remaining & speed) */}
      <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 mb-3 bg-slate-950/30 px-2 py-1 rounded-lg border border-white/5">
        <span>Vitesse: +{effectiveSpeed.toFixed(1)}/s</span>
        <span>
          {secondsRemaining !== null ? (
            <span className="text-violet-400">Reste: {secondsRemaining}s</span>
          ) : (
            <span className="text-amber-400 flex items-center gap-0.5">
              <AlertTriangle className="w-2.5 h-2.5 text-amber-500" /> Assigner
            </span>
          )}
        </span>
      </div>

      {/* Assignment Slots */}
      <div className="flex items-center gap-1.5 mt-auto">
        {/* Slot 1 */}
        {assignedRoommates[0] ? (
          <div className="flex-1 flex items-center justify-between bg-slate-900/90 border border-white/10 px-2 py-1 rounded-xl relative select-none">
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-base">{assignedRoommates[0].avatar}</span>
              <span className="text-[10px] font-bold text-slate-200 truncate">{assignedRoommates[0].name}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                unassignColoc(assignedRoommates[0].id);
              }}
              className="p-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        ) : (
          <div
            onClick={handleSlotClick}
            className={`flex-1 py-1 px-2 border-2 border-dashed rounded-xl flex items-center justify-center gap-1 transition-colors duration-200 ${
              selectedColocId 
                ? 'border-purple-500/50 bg-purple-950/10 text-purple-400 hover:bg-purple-950/20 animate-pulse cursor-pointer' 
                : 'border-white/10 text-slate-500'
            }`}
          >
            <UserPlus className="w-3 h-3" />
            <span className="text-[9px] font-bold">Slot Coloc</span>
          </div>
        )}

        {/* Slot 2 (Requires Tableau XL Upgrade) */}
        {isXL ? (
          assignedRoommates[1] ? (
            <div className="flex-1 flex items-center justify-between bg-slate-900/90 border border-white/10 px-2 py-1 rounded-xl relative select-none">
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-base">{assignedRoommates[1].avatar}</span>
                <span className="text-[10px] font-bold text-slate-200 truncate">{assignedRoommates[1].name}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  unassignColoc(assignedRoommates[1].id);
                }}
                className="p-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ) : (
            <div
              onClick={handleSlotClick}
              className={`flex-1 py-1 px-2 border-2 border-dashed rounded-xl flex items-center justify-center gap-1 transition-colors duration-200 ${
                selectedColocId 
                  ? 'border-purple-500/50 bg-purple-950/10 text-purple-400 hover:bg-purple-950/20 animate-pulse cursor-pointer' 
                  : 'border-white/10 text-slate-500'
              }`}
            >
              <UserPlus className="w-3 h-3" />
              <span className="text-[9px] font-bold">Slot Coloc</span>
            </div>
          )
        ) : (
          <div className="flex-1 py-1 px-2 border border-dashed border-white/5 bg-slate-950/20 rounded-xl flex items-center justify-center text-[8px] font-semibold text-slate-600">
            🔒 Tableau XL
          </div>
        )}
      </div>
    </div>
  );
};
