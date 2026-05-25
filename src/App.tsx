import React, { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { StatsBar } from './components/StatsBar';
import { RoommatesRow } from './components/RoommateCard';
import { PostitCard } from './components/PostitCard';
import { UpgradesShop } from './components/UpgradesShop';
import { HelpModal } from './components/HelpModal';
import { NewsFeed } from './components/NewsFeed';
import { HelpCircle, RefreshCw, SlidersHorizontal, Lock, CheckCircle } from 'lucide-react';
import { playClickSound } from './utils/audio';

const AppInner: React.FC = () => {
  const {
    postits,
    stateTimer,
    balloons,
    clickBalloon,
    victory,
    resetGame,
    upgrades,
    spawnPostit,
    solidarity,
    level,
    levelUpPending,
    setLevelUpPending
  } = useGame();

  const [selectedColocId, setSelectedColocId] = useState<string | null>(null);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'urgency' | 'type'>('default');

  const isXL = upgrades.find((u) => u.id === 'tableauXL')?.purchased;

  // Format the global state validation countdown (reaches 0 = victory!)
  const formatStateTimer = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const minutes = Math.floor(mins % 60);
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  };

  // Sort post-its (filterType removed to simplify)
  const getProcessedPostits = () => {
    let list = [...postits];

    // Sort (if Tableau XL purchased)
    if (isXL) {
      if (sortBy === 'urgency') {
        const priority = { rouge: 3, orange: 2, jaune: 1 };
        list.sort((a, b) => priority[b.urgency] - priority[a.urgency]);
      } else if (sortBy === 'type') {
        list.sort((a, b) => a.type.localeCompare(b.type));
      }
    }

    return list;
  };

  const processedPostits = getProcessedPostits();

  // Color of eviction bar based on time left (reaches 0 = victory!)
  const getTimerColorClass = (mins: number) => {
    if (mins > 720) return 'from-indigo-500/10 to-violet-500/10 border-indigo-500/20 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.15)]';
    if (mins > 360) return 'from-purple-500/15 to-pink-500/15 border-purple-500/20 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]';
    return 'from-rose-500/25 to-pink-600/25 border-rose-500/40 text-rose-300 animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.3)] font-black';
  };

  const handleOpenShop = () => {
    playClickSound();
    setIsShopOpen(true);
  };

  const handleOpenHelp = () => {
    playClickSound();
    setIsHelpOpen(true);
  };

  const handleReset = () => {
    playClickSound();
    if (window.confirm('Voulez-vous vraiment réinitialiser la colocation ?')) {
      resetGame();
    }
  };

  return (
    <div className="w-full h-screen max-h-screen overflow-hidden flex flex-col bg-slate-950 text-slate-100 p-3 sm:p-4 select-none relative">
      
      {/* BACKGROUND DECORATIONS */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* 1. HEADER (5% height) */}
      <header className="flex items-center justify-between gap-3 mb-2 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xl">🏠</span>
          <h1 className="text-sm font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-purple-300 to-pink-300">
            Coloc Solidaire
          </h1>
        </div>

        {/* News Feed Banner */}
        <div className="flex-1 max-w-md hidden xs:block">
          <NewsFeed />
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleOpenHelp}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-white/5 text-slate-400 hover:text-slate-200 transition-all active:scale-90"
            title="Règles du jeu"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-white/5 text-slate-400 hover:text-rose-400 transition-all active:scale-90"
            title="Réinitialiser"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobilized news ticker for small devices */}
      <div className="w-full mb-2 xs:hidden flex-shrink-0">
        <NewsFeed />
      </div>

      {/* 2. STATS BAR (Solidarité, Level, Humeur) */}
      <section className="mb-2 flex-shrink-0">
        <StatsBar />
      </section>

      {/* LOOMING EXTRINSIC DEADLINE (Victory Goal countdown) */}
      <section className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border bg-gradient-to-r ${getTimerColorClass(stateTimer)} mb-2.5 transition-all duration-300 flex-shrink-0`}>
        <div className="flex items-center gap-1.5">
          <span className="text-base animate-bounce">⚖️</span>
          <span className="text-[10px] uppercase font-black tracking-wider opacity-70">
            Délai d'acceptation de l'État
          </span>
        </div>
        <div className="flex items-center gap-1 font-black text-xs">
          <span>Temps restant :</span>
          <span className="text-sm font-black underline tracking-tight">{formatStateTimer(stateTimer)}</span>
        </div>
      </section>

      {/* 3. COLLOCS ROW */}
      <section className="mb-2 flex-shrink-0">
        <RoommatesRow selectedColocId={selectedColocId} onSelectColoc={setSelectedColocId} />
      </section>

      {/* 4. BOARD / ACTIVE POST-ITS (75% height) */}
      <section className="flex-1 flex flex-col bg-slate-900/35 border border-white/5 rounded-2xl p-3 overflow-hidden shadow-inner relative">
        
        {/* Header Board & Sorting Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 mb-3 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
              <span>📋 Résolvez les besoins du tableau</span>
              <span className="text-violet-400">({postits.length}/8)</span>
            </span>

            {/* Manual Spawn Button on mobile */}
            <button
              onClick={() => { playClickSound(); spawnPostit(); }}
              disabled={postits.length >= 8}
              className="sm:hidden text-[9px] font-extrabold px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 border border-white/5 active:scale-95 disabled:opacity-30"
            >
              + Besoin
            </button>
          </div>

          {/* Sorting controls */}
          {isXL ? (
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="flex items-center gap-1 text-slate-400 bg-slate-950/50 px-2 py-0.5 rounded border border-white/5">
                <SlidersHorizontal className="w-3 h-3" />
                <span>Trier :</span>
              </div>
              <button
                onClick={() => { playClickSound(); setSortBy('default'); }}
                className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                  sortBy === 'default' ? 'bg-violet-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Défaut
              </button>
              <button
                onClick={() => { playClickSound(); setSortBy('urgency'); }}
                className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                  sortBy === 'urgency' ? 'bg-violet-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                ⚠️ Urgence
              </button>
              <button
                onClick={() => { playClickSound(); setSortBy('type'); }}
                className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                  sortBy === 'type' ? 'bg-violet-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                📂 Catégorie
              </button>

              {/* Spawn Button */}
              <button
                onClick={() => { playClickSound(); spawnPostit(); }}
                disabled={postits.length >= 8}
                className="hidden sm:block text-[9px] font-extrabold px-2 py-0.5 rounded bg-slate-850 hover:bg-slate-800 text-slate-200 border border-white/5 active:scale-95 disabled:opacity-30 ml-2"
              >
                + Besoin
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full sm:w-auto text-[9px] text-slate-500 italic bg-slate-950/20 px-2.5 py-1 rounded-lg border border-dashed border-white/5">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-600 animate-pulse" />
                Tableau XL requis pour ordonner et débloquer la coopération.
              </span>
              
              <button
                onClick={() => { playClickSound(); spawnPostit(); }}
                disabled={postits.length >= 8}
                className="hidden sm:block text-[9px] font-extrabold px-2 py-0.5 rounded bg-slate-850 hover:bg-slate-800 text-slate-200 border border-white/5 active:scale-95 disabled:opacity-30 ml-2"
              >
                + Besoin
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Board area */}
        <div className="flex-1 overflow-y-auto min-h-0 pb-16">
          {processedPostits.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-900/10 rounded-2xl border border-dashed border-white/5 animate-pulse">
              <span className="text-4xl mb-3">☕</span>
              <h3 className="text-sm font-black text-slate-300">Tout est calme à la maison...</h3>
              <p className="text-[10px] text-slate-400 max-w-xs mt-1 font-semibold leading-relaxed">
                Profitez-en pour vous détendre ou acheter une amélioration dans la boîte à outils. Les besoins reviendront.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 justify-items-center">
              {processedPostits.map((postit) => (
                <PostitCard
                  key={postit.id}
                  postit={postit}
                  selectedColocId={selectedColocId}
                  onSelectColoc={setSelectedColocId}
                />
              ))}
            </div>
          )}
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
            <span className="text-4xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]">
              {balloon.isDoubleSpeed ? '⚡' : '🎈'}
            </span>
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-950 border border-violet-500/40 text-[8px] font-black uppercase text-violet-400 px-1 py-0.5 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {balloon.isDoubleSpeed ? 'BOOST X2' : '+50 SP'}
            </span>
          </div>
        </div>
      ))}

      {/* HIGHLY VISIBLE TOOLBOX SHOP FLOATING BUTTON (🧰) */}
      <button
        onClick={handleOpenShop}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-extrabold text-sm rounded-full shadow-[0_0_20px_rgba(139,92,246,0.6)] border border-violet-400/30 hover:scale-105 active:scale-95 transition-all animate-bounce"
        title="Boîte à Outils & Améliorations"
      >
        <span className="text-xl">🧰</span>
        <span className="hidden sm:inline uppercase tracking-wider">Boutique</span>
      </button>

      {/* MODALS */}
      <UpgradesShop isOpen={isShopOpen} onClose={() => { playClickSound(); setIsShopOpen(false); }} />
      <HelpModal isOpen={isHelpOpen} onClose={() => { playClickSound(); setIsHelpOpen(false); }} />

      {/* LEVEL UP CONGRATULATIONS POPUP */}
      {levelUpPending && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl glass-panel-heavy p-6 border border-yellow-500/30 shadow-[0_0_40px_rgba(234,179,8,0.25)] text-center animate-in fade-in zoom-in-95 duration-300">
            <span className="text-5xl mb-3 block animate-bounce">🎉</span>
            <h2 className="text-2xl font-black text-yellow-400 uppercase tracking-tight mb-2">
              Niveau Supérieur !
            </h2>
            <p className="text-xs text-slate-200 mb-6 leading-relaxed">
              Félicitations ! Vos efforts payent : vous passez au <strong className="text-yellow-400">NIVEAU {level}</strong> ! Votre colocation gagne en entraide et de nouvelles opportunités s'offrent à vous.
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

      {/* VICTORY SCREEN (Triggered when validation countdown reaches 0) */}
      {victory && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-2xl glass-panel-heavy p-6 border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.3)] text-center">
            <span className="text-5xl mb-4 block animate-bounce">🎉</span>
            <h2 className="text-2xl font-black text-emerald-400 uppercase tracking-tight mb-2">
              Coloc Sécurisée !
            </h2>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Victoire ! L'État a officiellement rendu une réponse positive ! Marc, Lisa, Nico et Marie ont vu leurs dossiers validés. Ils sont désormais en sécurité administrative durable. La colocation est un triomphe de solidarité humaine !
            </p>
            <div className="bg-slate-950/50 p-3.5 rounded-xl border border-white/5 text-left text-xs mb-6">
              <h4 className="font-bold text-slate-200 uppercase text-[10px] tracking-wider mb-2">Bilan final :</h4>
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
                <CheckCircle className="w-4 h-4" />
                <span>Niveau final atteint : Niveau {level}</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal mt-1.5">
                Vous avez su faire preuve d'un sens aigu de l'entraide pour lever les barrières bureaucratiques !
              </p>
            </div>
            <button
              onClick={() => { playClickSound(); resetGame(); }}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-emerald-950 active:scale-95 transition-all border border-emerald-400/30"
            >
              Recommencer une nouvelle coloc 🏠
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
