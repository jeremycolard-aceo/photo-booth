import React, { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { StatsBar } from './components/StatsBar';
import { RoommatesRow } from './components/RoommateCard';
import { PostitCard } from './components/PostitCard';
import { UpgradesShop } from './components/UpgradesShop';
import { CheckCircle } from 'lucide-react';
import { playClickSound } from './utils/audio';

const AppInner: React.FC = () => {
  const {
    postits,
    balloons,
    clickBalloon,
    victory,
    resetGame,
    solidarity,
    level,
    levelUpPending,
    setLevelUpPending
  } = useGame();

  const [selectedColocId, setSelectedColocId] = useState<string | null>(null);
  const [isShopOpen, setIsShopOpen] = useState(false);

  const handleOpenShop = () => {
    playClickSound();
    setIsShopOpen(true);
  };

  return (
    <div className="w-full h-screen max-h-screen overflow-hidden flex flex-col bg-slate-950 text-slate-100 p-2 sm:p-3 select-none relative">
      
      {/* BACKGROUND GRAPHIC EFFECTS */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* 1. TOP COMPACT STATUS BAR ( Cœur, XP, Timer, Humeur in a single compact row) */}
      <section className="mb-2 flex-shrink-0">
        <StatsBar />
      </section>

      {/* 2. ROOMMATES ROW (Reduced to 3 roommates column widths, very comfortable on mobile) */}
      <section className="mb-2 flex-shrink-0">
        <RoommatesRow selectedColocId={selectedColocId} onSelectColoc={setSelectedColocId} />
      </section>

      {/* 3. CORKBOARD WITH NATIVE 6 SLOTS (Scroll completely eliminated, strictly fits mobile!) */}
      <section className="flex-1 bg-slate-900/25 border border-white/5 rounded-2xl p-2.5 overflow-hidden shadow-inner relative flex flex-col justify-center">
        
        {/* Corkboard 6-Slot Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 justify-items-center items-center my-auto">
          {postits.map((postit, index) => {
            if (postit !== null) {
              return (
                <PostitCard
                  key={postit.id}
                  postit={postit}
                  selectedColocId={selectedColocId}
                  onSelectColoc={setSelectedColocId}
                />
              );
            } else {
              // Structured corkboard empty slot mockup
              return (
                <div
                  key={`empty-slot-${index}`}
                  className="w-full aspect-square min-h-[165px] max-h-[180px] rounded-2xl border border-dashed border-white/5 bg-slate-900/10 flex flex-col items-center justify-center p-3 select-none"
                >
                  <span className="text-[15px] font-handwritten opacity-10">Coloc vide</span>
                  <span className="text-xl opacity-5 mt-0.5">+</span>
                </div>
              );
            }
          })}
        </div>
      </section>

      {/* FLYING BALLOONS LAYER */}
      {balloons.map((balloon) => (
        <div
          key={balloon.id}
          className="balloon-flying flex items-center justify-center select-none"
          style={{
            left: `${balloon.x}%`,
            '--drift': `${Math.random() * 80 - 40}px`,
            '--rotation': `${Math.random() * 40 - 20}deg`,
          } as React.CSSProperties}
          onClick={() => clickBalloon(balloon.id)}
        >
          <div className="relative group transition-transform hover:scale-125 duration-150">
            <span className="text-4.5xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]">
              {balloon.isDoubleSpeed ? '⚡' : '🎈'}
            </span>
          </div>
        </div>
      ))}

      {/* FLOATING ACTION TOOLBOX SHOP BUTTON (🧰) */}
      <button
        onClick={handleOpenShop}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 px-3.5 py-3 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-extrabold text-sm rounded-full shadow-[0_0_15px_rgba(139,92,246,0.5)] border border-violet-400/30 hover:scale-105 active:scale-95 transition-all animate-bounce"
        title="Ouvrir la boîte à outils"
      >
        <span className="text-lg leading-none">🧰</span>
        <span className="hidden sm:inline uppercase tracking-wider text-xs">Outils</span>
      </button>

      {/* MODALS */}
      <UpgradesShop isOpen={isShopOpen} onClose={() => { playClickSound(); setIsShopOpen(false); }} />

      {/* LEVEL UP CONGRATULATIONS POPUP */}
      {levelUpPending && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl glass-panel-heavy p-6 border border-yellow-500/30 shadow-[0_0_40px_rgba(234,179,8,0.25)] text-center animate-in fade-in zoom-in-95 duration-300">
            <span className="text-5xl mb-3 block animate-bounce">🎉</span>
            <h2 className="text-2xl font-black text-yellow-400 uppercase tracking-tight mb-2">
              Niveau Supérieur !
            </h2>
            <p className="text-xs text-slate-250 mb-6 leading-relaxed">
              Félicitations ! Vos efforts payent : vous passez au <strong className="text-yellow-400">NIVEAU {level}</strong> ! Votre colocation s'épanouit.
            </p>
            <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5 text-left text-xs mb-6">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span>Nouveau Niveau :</span>
                <span className="font-black text-yellow-400">Niveau {level}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Solidarité dispo :</span>
                <span className="font-black text-rose-400">❤️ {solidarity}</span>
              </div>
            </div>
            <button
              onClick={() => {
                playClickSound();
                setLevelUpPending(false);
                setIsShopOpen(true); // Open Upgrades Shop directly
              }}
              className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-yellow-950 active:scale-95 transition-all border border-yellow-400/30 flex items-center justify-center gap-1.5"
            >
              <span>🧰 Ouvrir la Boîte à Outils !</span>
            </button>
          </div>
        </div>
      )}

      {/* VICTORY SCREEN */}
      {victory && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-2xl glass-panel-heavy p-6 border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.3)] text-center">
            <span className="text-5xl mb-4 block animate-bounce">🎉</span>
            <h2 className="text-2xl font-black text-emerald-400 uppercase tracking-tight mb-2">
              Coloc Sécurisée !
            </h2>
            <p className="text-xs text-slate-350 mb-6 leading-relaxed">
              Victoire ! L'État a officiellement validé la colocation ! Marc, Lisa et Nico sont désormais à l'abri durablement. C'est un triomphe de solidarité humaine !
            </p>
            <div className="bg-slate-950/50 p-3.5 rounded-xl border border-white/5 text-left text-xs mb-6">
              <h4 className="font-bold text-slate-200 uppercase text-[10px] tracking-wider mb-2">Bilan final :</h4>
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
                <CheckCircle className="w-4 h-4" />
                <span>Niveau final atteint : Niveau {level}</span>
              </div>
            </div>
            <button
              onClick={() => { playClickSound(); resetGame(); }}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-emerald-950 active:scale-95 transition-all border border-emerald-400/30"
            >
              Recommencer une colocation 🏠
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

const App: React.FC = () => {
  return (
    <GameProvider>
      <AppInner />
    </GameProvider>
  );
};

export default App;
