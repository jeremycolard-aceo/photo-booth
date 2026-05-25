import React from 'react';
import { useGame } from '../context/GameContext';
import { Sparkles, Check } from 'lucide-react';

interface UpgradesShopProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradesShop: React.FC<UpgradesShopProps> = ({ isOpen, onClose }) => {
  const { upgrades, solidarity, buyUpgrade, resetGame } = useGame();

  if (!isOpen) return null;

  const handleReset = () => {
    if (window.confirm('Voulez-vous vraiment réinitialiser entièrement la colocation ?')) {
      resetGame();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl glass-panel-heavy p-5 border border-white/10 shadow-2xl relative max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-lg font-bold"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-100">Boutique de Solidarité</h3>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Améliorez le quotidien de la colocation
            </p>
          </div>
        </div>

        {/* Wallet Display */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950/60 rounded-xl border border-violet-500/20 mb-4 shadow-inner">
          <span className="text-xs font-bold text-slate-300">Votre Solde de Solidarité :</span>
          <span className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-purple-300 to-pink-300">
            🤝 {solidarity} SP
          </span>
        </div>

        {/* Upgrades Scrollable Area */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 mb-2">
          {upgrades.map((upgrade) => {
            const canAfford = solidarity >= upgrade.cost;
            
            return (
              <div
                key={upgrade.id}
                className={`flex gap-3 p-3 rounded-xl border transition-all duration-200 ${
                  upgrade.purchased
                    ? 'bg-emerald-950/10 border-emerald-500/20 text-slate-300'
                    : 'bg-slate-900/40 border-white/5 hover:border-slate-800'
                }`}
              >
                {/* Upgrade Icon Avatar */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-slate-950/60 shadow-inner ${
                  upgrade.purchased ? 'border border-emerald-500/20' : 'border border-white/5'
                }`}>
                  {upgrade.icon}
                </div>

                {/* Details & Button */}
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="text-xs font-black text-slate-100 truncate">
                      {upgrade.name}
                    </h4>
                    
                    {/* Cost / Status tag */}
                    {upgrade.purchased ? (
                      <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 leading-none">
                        <Check className="w-2.5 h-2.5" /> Acheté
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-yellow-400 bg-yellow-950/20 px-2 py-0.5 rounded-full border border-yellow-500/20 leading-none flex-shrink-0">
                        {upgrade.cost} SP
                      </span>
                    )}
                  </div>
                  
                  <p className="text-[10px] text-slate-400 font-medium leading-normal mt-1 mb-2">
                    {upgrade.description}
                  </p>

                  {/* Purchase Button */}
                  {!upgrade.purchased && (
                    <button
                      onClick={() => buyUpgrade(upgrade.id)}
                      disabled={!canAfford}
                      className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all ${
                        canAfford
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md active:scale-95 border border-indigo-400/30'
                          : 'bg-slate-850 text-slate-500 cursor-not-allowed border border-white/5'
                      }`}
                    >
                      {canAfford ? 'Acheter l\'amélioration' : `Solde insuffisant (Manque ${upgrade.cost - solidarity} SP)`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Buttons */}
        <div className="flex flex-col gap-2 mt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 border border-white/5 text-slate-300 hover:text-slate-200 rounded-xl text-xs font-black transition-all"
          >
            Retour au Tableau
          </button>
          
          <button
            onClick={handleReset}
            className="w-full py-1.5 bg-rose-950/15 hover:bg-rose-950/30 border border-rose-900/30 text-rose-400 rounded-xl text-[10px] font-bold transition-all"
          >
            ⚠️ Réinitialiser la Coloc (Reset)
          </button>
        </div>

      </div>
    </div>
  );
};
