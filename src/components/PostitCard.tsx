import React from 'react';
import { useGame } from '../context/GameContext';
import type { Postit } from '../context/GameContext';
import { UserPlus, X } from 'lucide-react';

interface PostitCardProps {
  postit: Postit;
  selectedColocId: string | null;
  onSelectColoc: (id: string | null) => void;
}

export const PostitCard: React.FC<PostitCardProps> = ({ postit, selectedColocId, onSelectColoc }) => {
  const { roommates, assignColoc, unassignColoc, upgrades, doubleSpeedRemaining, happiness, getColocSkillsDynamic } = useGame();

  const isXL = upgrades.find((u) => u.id === 'tableauXL')?.purchased;
  const hasFibre = upgrades.find((u) => u.id === 'fibreOptique')?.purchased;
  
  const targetProgress = hasFibre ? 270 : 300;
  const pct = Math.min(100, (postit.progress / targetProgress) * 100);

  // Assigned colocs
  const assignedRoommates = roommates.filter((r) => postit.assignedColocs.includes(r.id));

  // Compute speed multiplier
  const speedPenalty = happiness < 40 ? 0.8 : 1.0;
  const doubleSpeedMultiplier = doubleSpeedRemaining > 0 ? 2 : 1;
  
  let sumSkills = 0;
  assignedRoommates.forEach((r) => {
    // Use dynamic stats affected by active bonuses/maluses
    const dynamicStats = getColocSkillsDynamic(r);
    sumSkills += dynamicStats[postit.type];
  });

  const effectiveSpeed = sumSkills * speedPenalty * doubleSpeedMultiplier;

  // Drag-and-drop
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

  // Tap-to-assign slot
  const handleSlotClick = () => {
    if (selectedColocId) {
      assignColoc(selectedColocId, postit.id);
      onSelectColoc(null);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={selectedColocId ? handleSlotClick : undefined}
      className={`postit-paper ${postit.colorClass} select-none relative ${
        selectedColocId 
          ? 'ring-2 ring-purple-600/50 scale-102 cursor-pointer shadow-lg' 
          : ''
      }`}
    >
      {/* 1. Title (Large, Gochi/Caveat handwritten look) */}
      <div className="w-full text-center mt-1">
        <h3 className="text-xl font-bold tracking-wide leading-tight line-clamp-2 px-1 select-none">
          {postit.title}
        </h3>
      </div>

      {/* 2. Roommates avatars assigned (Max 2 if Tableau XL) */}
      <div className="flex justify-center items-center gap-3 my-2">
        {/* Slot 1 */}
        {assignedRoommates[0] ? (
          <div className="w-9 h-9 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-xl relative group shadow-inner">
            {assignedRoommates[0].avatar}
            {/* Unassign button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                unassignColoc(assignedRoommates[0].id);
              }}
              className="absolute -top-1.5 -right-1.5 bg-black/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        ) : (
          <div
            onClick={handleSlotClick}
            className={`w-9 h-9 rounded-full border-2 border-dashed border-black/20 flex items-center justify-center cursor-pointer hover:bg-black/5 ${
              selectedColocId ? 'animate-pulse bg-purple-500/10 border-purple-800/40' : ''
            }`}
          >
            <UserPlus className="w-4 h-4 opacity-50" />
          </div>
        )}

        {/* Slot 2 (Tableau XL) */}
        {isXL ? (
          assignedRoommates[1] ? (
            <div className="w-9 h-9 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-xl relative group shadow-inner">
              {assignedRoommates[1].avatar}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  unassignColoc(assignedRoommates[1].id);
                }}
                className="absolute -top-1.5 -right-1.5 bg-black/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ) : (
            <div
              onClick={handleSlotClick}
              className={`w-9 h-9 rounded-full border-2 border-dashed border-black/20 flex items-center justify-center cursor-pointer hover:bg-black/5 ${
                selectedColocId ? 'animate-pulse bg-purple-500/10 border-purple-800/40' : ''
              }`}
            >
              <UserPlus className="w-4 h-4 opacity-50" />
            </div>
          )
        ) : null}
      </div>

      {/* Footer block containing bar and speed */}
      <div className="w-full mt-auto">
        {/* 3. Progress Bar: fine marker/pencil horizontal line without numbers */}
        <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden border border-black/5 relative mb-1.5">
          <div
            className="h-full bg-slate-900 rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* 4. Speed Multiplier (ex: X4 or X7) */}
        <div className="flex justify-between items-center text-xs font-bold px-1 select-none">
          <span className="text-[10px] opacity-60">
            {postit.type === 'finance' ? '💶' : postit.type === 'sante' ? '💪' : postit.type === 'reseau' ? '🤝' : postit.type === 'droits' ? '⚖️' : '🚀'}
          </span>
          <span className="bg-black/10 px-2 py-0.5 rounded-md font-extrabold shadow-sm">
            {effectiveSpeed > 0 ? `x${effectiveSpeed.toFixed(0)}` : 'x0'}
          </span>
        </div>
      </div>

    </div>
  );
};
