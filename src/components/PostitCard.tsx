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

  // Compute dynamic speed multiplier
  const speedPenalty = happiness < 40 ? 0.8 : 1.0;
  const doubleSpeedMultiplier = doubleSpeedRemaining > 0 ? 2 : 1;
  
  let sumSkills = 0;
  assignedRoommates.forEach((r) => {
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
      className={`postit-paper ${postit.colorClass} select-none relative p-2 flex flex-col justify-between ${
        selectedColocId 
          ? 'ring-2 ring-purple-600/50 scale-102 cursor-pointer shadow-lg' 
          : ''
      }`}
    >
      {/* 1. Title (Extremely compact text-sm/text-base Caveat handwriting style) */}
      <div className="w-full text-center mt-0.5">
        <h3 className="text-sm font-black tracking-tight leading-none line-clamp-2 px-0.5 select-none text-slate-900">
          {postit.title}
        </h3>
      </div>

      {/* 2. Roommates avatars assigned (Compact w-7 h-7 circles for mobile!) */}
      <div className="flex justify-center items-center gap-2 my-1">
        {/* Slot 1 */}
        {assignedRoommates[0] ? (
          <div className="w-7 h-7 rounded-full bg-black/15 hover:bg-black/25 flex items-center justify-center text-lg relative group shadow-inner flex-shrink-0">
            {assignedRoommates[0].avatar}
            <button
              onClick={(e) => {
                e.stopPropagation();
                unassignColoc(assignedRoommates[0].id);
              }}
              className="absolute -top-1 -right-1 bg-black/85 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-2 h-2" />
            </button>
          </div>
        ) : (
          <div
            onClick={handleSlotClick}
            className={`w-7 h-7 rounded-full border border-dashed border-black/35 flex items-center justify-center cursor-pointer hover:bg-black/5 flex-shrink-0 ${
              selectedColocId ? 'animate-pulse bg-purple-500/10 border-purple-800/40' : ''
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 opacity-40" />
          </div>
        )}

        {/* Slot 2 (Tableau XL, also w-7 h-7) */}
        {isXL ? (
          assignedRoommates[1] ? (
            <div className="w-7 h-7 rounded-full bg-black/15 hover:bg-black/25 flex items-center justify-center text-lg relative group shadow-inner flex-shrink-0">
              {assignedRoommates[1].avatar}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  unassignColoc(assignedRoommates[1].id);
                }}
                className="absolute -top-1 -right-1 bg-black/85 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-2 h-2" />
              </button>
            </div>
          ) : (
            <div
              onClick={handleSlotClick}
              className={`w-7 h-7 rounded-full border border-dashed border-black/35 flex items-center justify-center cursor-pointer hover:bg-black/5 flex-shrink-0 ${
                selectedColocId ? 'animate-pulse bg-purple-500/10 border-purple-800/40' : ''
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 opacity-40" />
            </div>
          )
        ) : null}
      </div>

      {/* Footer details */}
      <div className="w-full mt-auto">
        {/* 3. Progress Bar (Extremely fine h-1 horizontal marker line) */}
        <div className="w-full h-1 bg-black/15 rounded-full overflow-hidden border border-black/5 relative mb-1">
          <div
            className="h-full bg-slate-900 rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* 4. Multiplier Badge (Compact text-[10px]) */}
        <div className="flex justify-between items-center text-[10px] font-black px-0.5 select-none leading-none">
          <span className="opacity-70 leading-none">
            {postit.type === 'finance' ? '💶' : postit.type === 'sante' ? '💪' : postit.type === 'reseau' ? '🤝' : postit.type === 'droits' ? '⚖️' : '🚀'}
          </span>
          <span className="bg-black/15 px-1 rounded font-black shadow-sm leading-none py-0.5">
            {effectiveSpeed > 0 ? `x${effectiveSpeed.toFixed(0)}` : 'x0'}
          </span>
        </div>
      </div>

    </div>
  );
};
