import React from 'react';
import { HelpCircle, Award, Flame } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl glass-panel-heavy p-5 border border-white/10 shadow-2xl relative max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close button */}
        <button
          onClick={() => { playClickSound(); onClose(); }}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-lg font-bold"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-100">Règles & Solidarité</h3>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Guide d'entraide de la colocation
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 text-xs text-slate-300 mb-4 leading-relaxed">
          
          {/* Pitch */}
          <div className="bg-gradient-to-r from-violet-950/20 to-indigo-950/20 p-3 rounded-xl border border-violet-900/30">
            <p>
              Bienvenue dans votre colocation ! Quatre colocataires attachants y résident : 
              <strong> Marc, Lisa, Nico et Marie</strong>. 
              Leurs dossiers sont déjà déposés ! Votre objectif est de faire **décroître le compte à rebours de l'État vers 0** pour obtenir leur validation définitive et sécuriser la colocation !
            </p>
          </div>

          {/* Gameplay Loop */}
          <div>
            <h4 className="font-black text-slate-200 mb-1.5 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              1. Gérer les Post-its
            </h4>
            <p className="mb-1">
              Assignez des colocataires aux post-its par **glisser-déposer** ou en **cliquant d'abord sur un coloc puis sur un slot vide (Tap-to-Assign)**.
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                Le temps de résolution dépend des compétences combinées des colocataires assignés.
              </li>
              <li>
                Résoudre un post-it **retire 30 minutes** de démarches au timer de l'État.
              </li>
              <li>
                Résoudre un post-it de type **Droits (⚖️)** retire **90 minutes** !
              </li>
            </ul>
          </div>

          {/* Urgency and Happiness */}
          <div>
            <h4 className="font-black text-slate-200 mb-1.5 flex items-center gap-1">
              <AlertTriangleIcon className="w-3.5 h-3.5 text-orange-500" />
              2. Système d'Urgence & Humeur
            </h4>
            <p className="mb-1">
              Si un post-it n'est pas traité à temps, il passe au statut **Orange (3-6 min)** puis **Rouge (6+ min)** :
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                Les crises orange et rouge infligent des **malus de compétences temporaires** à tous les colocataires sur cette compétence (chiffres en rouge sur leurs profils).
              </li>
              <li>
                Ces crises réduisent le **Bonheur** de la coloc. L'humeur est représentée par un emoji :
                <br />
                😊 **Humeur Radieuse** : Le timer global s'écoule **20% plus vite** vers la victoire !
                <br />
                😐 **Humeur Neutre** : Vitesse d'écoulement normale.
                <br />
                ☹️ **Humeur Triste** : Progression **ralentie de 20%** et apparition des besoins 30% plus rapide.
              </li>
            </ul>
          </div>

          {/* Level Progression */}
          <div>
            <h4 className="font-black text-slate-200 mb-1.5 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              3. Niveaux & Boîte à Outils
            </h4>
            <p>
              Accumulez de la Solidarité (SP) en résolvant les post-its pour gagner de l'XP et **monter de niveau** !
            </p>
            <p className="mt-1">
              Chaque passage au niveau supérieur déclenche une popup de félicitations et vous donne un accès direct à la **Boutique (Boîte à outils 🧰)** pour acquérir des améliorations décisives (coopération, fibre optique, avocat...).
            </p>
          </div>

          {/* Balloons */}
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
            <p className="leading-normal">
              🎈 **Ballons & Boosters** : Cliquez sur les ballons volants pour gagner de la Solidarité (+50) ou activer un boost de vitesse temporaire (Vitesse x2 pendant 10s sur tout le tableau !).
            </p>
          </div>

        </div>

        {/* Footer */}
        <button
          onClick={() => { playClickSound(); onClose(); }}
          className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-xs font-black shadow-md hover:from-violet-500 hover:to-indigo-500 transition-all border border-indigo-400/30"
        >
          C'est compris !
        </button>

      </div>
    </div>
  );
};

// Internal mini icons
const AlertTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);
