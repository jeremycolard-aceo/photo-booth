import React, { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import type { ResourceType } from './context/GameContext';
import { StatsBar } from './components/StatsBar';
import { RoommatesRow } from './components/RoommateCard';
import { PostitCard } from './components/PostitCard';
import { UpgradesShop } from './components/UpgradesShop';
import { HelpModal } from './components/HelpModal';
import { NewsFeed } from './components/NewsFeed';
import { HelpCircle, RefreshCw, SlidersHorizontal, Lock, CheckCircle } from 'lucide-react';

const AppInner: React.FC = () => {
  const {
    postits,
    stateTimer,
    happiness,
    balloons,
    clickBalloon,
    victory,
    gameOver,
    resetGame,
    upgrades,
    spawnPostit,
    solidarity
  } = useGame();

  const [selectedColocId, setSelectedColocId] = useState<string | null>(null);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'urgency' | 'type'>('default');
  const [filterType, setFilterType] = useState<ResourceType | 'all'>('all');

  const isXL = upgrades.find((u) => u.id === 'tableauXL')?.purchased;

  // Format the state eviction countdown (starts at 2880 mins = 48h)
  const formatStateTimer = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const minutes = Math.floor(mins % 60);
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  };

  // Sort and filter post-its
  const getProcessedPostits = () => {
    let list = [...postits];

    // Filter
    if (filterType !== 'all') {
      list = list.filter((p) => p.type === filterType);
    }

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

  // Color of eviction bar based on time left
  const getTimerColorClass = (mins: number) => {
    if (mins > 720) return 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-300';
    if (mins > 360) return 'from-orange-500/10 to-amber-500/10 border-orange-500/20 text-amber-300';
    return 'from-rose-500/20 to-red-500/20 border-rose-500/30 text-rose-300 animate-pulse';
  };

  return (
    <div className="w-full h-screen max-h-screen overflow-hidden flex flex-col bg-slate-950 text-slate-100 p-3 sm:p-4 select-none relative">
      
      {/* BACKGROUND EFFECTS */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* 1. HEADER (5% estimated height) */}
      <header className="flex items-center justify-between gap-3 mb-2.5 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xl">🏠</span>
          <h1 className="text-sm font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-purple-300 to-pink-300">
            Coloc Solidaire
          </h1>
        </div>

        {/* News défilantes inside Header */}
        <div className="flex-1 max-w-md hidden xs:block">
          <NewsFeed />
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setIsHelpOpen(true)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-white/5 text-slate-400 hover:text-slate-200 transition-all active:scale-90"
            title="Aide & Règles"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => {
              if (window.confirm('Voulez-vous vraiment réinitialiser la partie ?')) {
                resetGame();
              }
            }}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-white/5 text-slate-400 hover:text-rose-400 transition-all active:scale-90"
            title="Réinitialiser le jeu"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobilized news ticker for small screens */}
      <div className="w-full mb-2.5 xs:hidden flex-shrink-0">
        <NewsFeed />
      </div>

      {/* 2. STATS BAR (5% estimated height) */}
      <section className="mb-2.5 flex-shrink-0">
        <StatsBar onOpenShop={() => setIsShopOpen(true)} />
      </section>

      {/* LOOMING EVICTION COUNTDOWN BAR */}
      <section className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border bg-gradient-to-r ${getTimerColorClass(stateTimer)} mb-2.5 shadow-sm transition-all duration-300 flex-shrink-0`}>
        <div className="flex items-center gap-1.5">
          <span className="text-base animate-pulse">⚖️</span>
          <span className="text-[10px] uppercase font-black tracking-wider opacity-70">
            Échéance administrative globale
          </span>
        </div>
        <div className="flex items-center gap-1 font-black text-xs">
          <span>⏰ Expulsion dans :</span>
          <span className="text-sm font-black underline tracking-tight">{formatStateTimer(stateTimer)}</span>
        </div>
      </section>

      {/* 3. COLLOCS ROW (10% estimated height) */}
      <section className="mb-3 flex-shrink-0">
        <div className="flex justify-between items-center px-1 mb-1">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
            1. Choisissez un colocataire {selectedColocId && '(Tap actif)'}
          </span>
          {selectedColocId && (
            <button
              onClick={() => setSelectedColocId(null)}
              className="text-[9px] font-bold text-rose-400 underline leading-none"
            >
              Annuler sélection
            </button>
          )}
        </div>
        <RoommatesRow selectedColocId={selectedColocId} onSelectColoc={setSelectedColocId} />
      </section>

      {/* 4. BOARD / ACTIVE POST-ITS (75% remaining height) */}
      <section className="flex-1 flex flex-col bg-slate-900/35 border border-white/5 rounded-2xl p-3 overflow-hidden shadow-inner relative">
        
        {/* Header Board & Sorting Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 mb-3 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
              <span>📋 2. Résolvez les besoins du tableau</span>
              <span className="text-violet-400">({postits.length}/8)</span>
            </span>

            {/* Quick manual spawn for faster gameplay testing */}
            <button
              onClick={spawnPostit}
              disabled={postits.length >= 8}
              className="sm:hidden text-[9px] font-extrabold px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 border border-white/5 active:scale-95 disabled:opacity-30"
            >
              + Besoin
            </button>
          </div>

          {/* Sorting / Filter Bar */}
          {isXL ? (
            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              {/* Sort */}
              <div className="flex items-center gap-1 text-slate-400 bg-slate-950/50 px-2 py-0.5 rounded border border-white/5">
                <SlidersHorizontal className="w-3 h-3" />
                <span>Trier :</span>
              </div>
              <button
                onClick={() => setSortBy('default')}
                className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                  sortBy === 'default' ? 'bg-violet-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Défaut
              </button>
              <button
                onClick={() => setSortBy('urgency')}
                className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                  sortBy === 'urgency' ? 'bg-violet-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                ⚠️ Urgence
              </button>
              <button
                onClick={() => setSortBy('type')}
                className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                  sortBy === 'type' ? 'bg-violet-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                📂 Catégorie
              </button>

              {/* Filter */}
              <div className="flex items-center gap-1 text-slate-400 bg-slate-950/50 px-2 py-0.5 rounded border border-white/5 ml-1">
                <span>Filtrer :</span>
              </div>
              <button
                onClick={() => setFilterType('all')}
                className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                  filterType === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setFilterType('finance')}
                className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                  filterType === 'finance' ? 'bg-emerald-600 text-slate-950' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                💶
              </button>
              <button
                onClick={() => setFilterType('sante')}
                className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                  filterType === 'sante' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                💪
              </button>
              <button
                onClick={() => setFilterType('reseau')}
                className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                  filterType === 'reseau' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                🧑🤝🧑
              </button>
              <button
                onClick={() => setFilterType('droits')}
                className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                  filterType === 'droits' ? 'bg-amber-600 text-slate-950' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                ⚖️
              </button>
              <button
                onClick={() => setFilterType('rebond')}
                className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                  filterType === 'rebond' ? 'bg-sky-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                🚀
              </button>

              {/* Spawn Button */}
              <button
                onClick={spawnPostit}
                disabled={postits.length >= 8}
                className="hidden sm:block text-[9px] font-extrabold px-2 py-0.5 rounded bg-slate-850 hover:bg-slate-800 text-slate-200 border border-white/5 active:scale-95 disabled:opacity-30 ml-2"
              >
                + Besoin
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full sm:w-auto text-[9px] text-slate-500 italic bg-slate-950/20 px-2.5 py-1 rounded-lg border border-dashed border-white/5">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-600" />
                Achetez le "Tableau XL" pour trier et débloquer un 2ème slot de coloc !
              </span>
              
              {/* Spawn Button even when locked */}
              <button
                onClick={spawnPostit}
                disabled={postits.length >= 8}
                className="hidden sm:block text-[9px] font-extrabold px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 border border-white/5 active:scale-95 disabled:opacity-30 ml-2"
              >
                + Ajouter un Besoin
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Board area */}
        <div className="flex-1 overflow-y-auto min-h-0 pb-12">
          {processedPostits.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-900/10 rounded-2xl border border-dashed border-white/5 animate-pulse">
              <span className="text-4xl mb-3">☕</span>
              <h3 className="text-sm font-black text-slate-300">Tout est calme à la maison...</h3>
              <p className="text-[10px] text-slate-400 max-w-xs mt-1">
                Les colocs se reposent. Les besoins administratifs et matériels apparaîtront bientôt.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
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

      {/* FLYING BALLOONS LAYER (balloon emojis) */}
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
          <div className={`relative group transition-transform hover:scale-125 duration-150`}>
            {/* Balloon SVG / Emoji */}
            <span className="text-4xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]">
              {balloon.isDoubleSpeed ? '⚡' : '🎈'}
            </span>
            {/* Small interactive label */}
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-950 border border-violet-500/40 text-[8px] font-black uppercase text-violet-400 px-1 py-0.5 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {balloon.isDoubleSpeed ? 'BOOST X2' : '+50 SP'}
            </span>
          </div>
        </div>
      ))}

      {/* MODALS */}
      <UpgradesShop isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* GAME OVER MODAL (Defeat) */}
      {gameOver && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg">
          <div className="w-full max-w-sm rounded-2xl glass-panel-heavy p-6 border border-rose-500/30 shadow-[0_0_50px_rgba(239,68,68,0.3)] text-center animate-in fade-in zoom-in-95 duration-300">
            <span className="text-5xl mb-4 block animate-bounce">⚖️</span>
            <h2 className="text-2xl font-black text-rose-500 uppercase tracking-tight mb-2">
              Expulsion Administrative
            </h2>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Le compte à rebours de l'État a expiré ! L'administration a fermé la colocation. Marc, Lisa, Nico et Marie n'ont pas pu finaliser leurs dossiers de régularisation à temps.
            </p>
            <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5 text-left text-xs mb-6">
              <h4 className="font-bold text-slate-200 uppercase text-[10px] tracking-wider mb-2">Vos Statistiques :</h4>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span>Solidarité accumulée :</span>
                <span className="font-black text-violet-400">{solidarity} SP</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Bonheur moyen :</span>
                <span className="font-black text-pink-400">{happiness}%</span>
              </div>
            </div>
            <button
              onClick={resetGame}
              className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-950 active:scale-95 transition-all border border-rose-400/30"
            >
              Réessayer l'aventure 🤝
            </button>
          </div>
        </div>
      )}

      {/* VICTORY MODAL (Win) */}
      {victory && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg">
          <div className="w-full max-w-sm rounded-2xl glass-panel-heavy p-6 border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.3)] text-center animate-in fade-in zoom-in-95 duration-300">
            <span className="text-5xl mb-4 block animate-bounce">🎉</span>
            <h2 className="text-2xl font-black text-emerald-400 uppercase tracking-tight mb-2">
              Victoire Sociale !
            </h2>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Incroyable ! Vous avez validé avec succès tous les dossiers administratifs ! Marc, Lisa, Nico et Marie sont désormais à l'abri, intégrés et en sécurité. La colocation est sauvée !
            </p>
            <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5 text-left text-xs mb-6">
              <h4 className="font-bold text-slate-200 uppercase text-[10px] tracking-wider mb-2">Bilan de l'aventure :</h4>
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-2">
                <CheckCircle className="w-4 h-4" />
                <span>4 dossiers sécurisés</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Vous avez su faire preuve d'un sens aiguisé de l'entraide et de la solidarité.
              </p>
            </div>
            <button
              onClick={resetGame}
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
