import React from 'react';
import { HelpCircle, Award, Flame } from 'lucide-react';

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
          onClick={onClose}
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
            <h3 className="text-lg font-black text-slate-100">Règles & Survie Sociale</h3>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Guide de gestion de colocation sociale
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 text-xs text-slate-300 mb-4">
          
          {/* Pitch */}
          <div className="bg-gradient-to-r from-violet-950/20 to-indigo-950/20 p-3 rounded-xl border border-violet-900/30">
            <p className="leading-relaxed">
              Bienvenue dans votre colocation ! Quatre colocataires en situation de vulnérabilité y cohabitent : 
              <strong> Marc, Lisa, Nico et Marie</strong>. 
              Votre mission est de les aider à s'en sortir en gérant leurs besoins quotidiens sous forme de **Post-its** administratifs, médicaux ou matériels, avant que le **Timer de l'État** n'expire !
            </p>
          </div>

          {/* Gameplay Loop */}
          <div>
            <h4 className="font-black text-slate-200 mb-1.5 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              1. Résoudre les besoins (Post-its)
            </h4>
            <ul className="list-disc pl-4 space-y-1 leading-relaxed">
              <li>
                Assignez des colocataires aux post-its par **Drag-and-Drop** ou en **cliquant d'abord sur un colocataire puis sur un slot vide (Tap-to-Assign)**.
              </li>
              <li>
                Le temps de résolution dépend des compétences combinées des colocataires : 
                <code className="text-violet-400 font-bold bg-slate-900 px-1 py-0.5 rounded ml-1">
                  Temps = 300 / Σ(Compétences)
                </code>
              </li>
              <li>
                Chaque post-it complété rapporte de la **Solidarité (SP)** et augmente les **Ressources Globales** de la colocation.
              </li>
            </ul>
          </div>

          {/* Urgency System */}
          <div>
            <h4 className="font-black text-slate-200 mb-1.5 flex items-center gap-1">
              <AlertTriangleIcon className="w-3.5 h-3.5 text-orange-500" />
              2. Gérer le Système d'Urgence
            </h4>
            <p className="leading-relaxed mb-1">
              Les post-its vieillissent s'ils ne sont pas résolus :
            </p>
            <ul className="list-disc pl-4 space-y-1 leading-relaxed">
              <li>
                <span className="text-yellow-400 font-bold">Jaune (0-3 min)</span> : Tout est calme.
              </li>
              <li>
                <span className="text-orange-400 font-bold">Orange (3-6 min)</span> : La tension monte. Malus de **-1** permanent à la jauge globale de cette ressource toutes les 15s.
              </li>
              <li>
                <span className="text-rose-400 font-bold">Rouge (+6 min)</span> : Crise ! Malus de **-2** permanent toutes les 15s. Les colocataires perdent beaucoup de **Bonheur**.
              </li>
            </ul>
            <p className="leading-relaxed mt-2 text-[10px] text-slate-400 italic">
              💡 Le score de **Bonheur** baisse avec le nombre de post-its Orange et Rouge. Si le bonheur est bas, les post-its apparaissent plus vite et le travail ralentit !
            </p>
          </div>

          {/* Survival / Time */}
          <div>
            <h4 className="font-black text-slate-200 mb-1.5 flex items-center gap-1">
              <ClockIcon className="w-3.5 h-3.5 text-sky-400" />
              3. Le Compte à Rebours de l'État
            </h4>
            <p className="leading-relaxed">
              L'État menace d'expulser la colocation. Le compte à rebours commence à **48 heures de jeu simulées** (environ 48 minutes réelles).
            </p>
            <ul className="list-disc pl-4 space-y-1 leading-relaxed mt-1">
              <li>
                Résoudre des besoins de type **Droits (⚖️)** repousse l'échéance administrative en **rajoutant +1 heure (+60 min)** au timer de l'État !
              </li>
              <li>
                L'amélioration **Avocat Bénévole** ralentit le décompte de l'État.
              </li>
            </ul>
          </div>

          {/* Secure Victory */}
          <div>
            <h4 className="font-black text-slate-200 mb-1.5 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              4. Comment Gagner le Jeu ?
            </h4>
            <p className="leading-relaxed">
              Pour gagner, vous devez **sécuriser les dossiers administratifs des 4 colocataires** avant la fin du temps imparti.
            </p>
            <p className="leading-relaxed mt-1">
              Cliquez sur le bouton **"ℹ️"** d'un colocataire pour voir son dossier de survie et ses critères de validation (SP requis + jauges de ressources à un niveau minimum de 15/20).
            </p>
          </div>

          {/* Balloons */}
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
            <p className="leading-normal">
              🎈 **Ballons Volants** : Toutes les 30 secondes, un ballon s'envole. Cliquez dessus pour obtenir **+50 de Solidarité** ou un **Boost de Vitesse x2 pendant 10 secondes** !
            </p>
          </div>

        </div>

        {/* Footer */}
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-xs font-black shadow-md hover:from-violet-500 hover:to-indigo-500 transition-all border border-indigo-400/30"
        >
          C'est parti !
        </button>

      </div>
    </div>
  );
};

// Internal mini icons
const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

const AlertTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);
