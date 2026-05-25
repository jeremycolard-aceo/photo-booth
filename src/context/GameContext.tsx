import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { playAssignSound, playCompleteSound, playBalloonSound, playLevelUpSound, playClickSound } from '../utils/audio';

// --- Types ---

export type ResourceType = 'finance' | 'sante' | 'reseau' | 'droits' | 'rebond';

export interface Roommate {
  id: string;
  name: string;
  age: number;
  avatar: string;
  role: string;
  description: string;
  dossierName: string;
  skills: {
    finance: number;
    sante: number;
    reseau: number;
    droits: number;
    rebond: number;
  };
  assignedPostitId: string | null;
}

export interface Postit {
  id: string;
  title: string;
  type: ResourceType;
  icon: string;
  colorClass: string;
  progress: number; // 0 to 300
  elapsedTime: number; // in seconds
  urgency: 'jaune' | 'orange' | 'rouge';
  assignedColocs: string[]; // roommate IDs
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  purchased: boolean;
}

export interface LogEntry {
  id: string;
  time: string;
  text: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'bonus';
}

export interface GameContextType {
  roommates: Roommate[];
  postits: (Postit | null)[]; // Fixed 6-slot list
  solidarity: number;
  level: number;
  xp: number;
  xpNeeded: number;
  levelUpPending: boolean;
  setLevelUpPending: (pending: boolean) => void;
  upgrades: Upgrade[];
  stateTimer: number;
  logs: LogEntry[];
  happiness: number;
  balloons: { id: string; x: number; isDoubleSpeed: boolean }[];
  doubleSpeedRemaining: number;
  victory: boolean;
  spawnPostit: () => void;
  assignColoc: (colocId: string, postitId: string) => void;
  unassignColoc: (colocId: string) => void;
  buyUpgrade: (id: string) => void;
  clickBalloon: (id: string) => void;
  addLog: (text: string, type?: LogEntry['type']) => void;
  resetGame: () => void;
  swapPostits: (fromIndex: number, toIndex: number) => void;
  getColocSkillsDynamic: (coloc: Roommate) => {
    finance: number;
    sante: number;
    reseau: number;
    droits: number;
    rebond: number;
    bonuses: Record<ResourceType, boolean>;
    maluses: Record<ResourceType, boolean>;
  };
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// --- Game Data Defaults (Reduced to 3 roommates) ---

const INITIAL_ROOMMATES: Roommate[] = [
  {
    id: 'marc',
    name: 'Marc',
    age: 45,
    avatar: '🧔',
    role: 'L\'Exilé Courageux',
    description: 'Marc, 45 ans. Ancien chef cuisinier ayant fui son pays en crise. Courageux et digne, il passe ses nuits à étudier le français tout en aidant bénévolement à la banque alimentaire du quartier.',
    dossierName: 'Dossier de régularisation administrative',
    skills: { finance: 1, sante: 3, reseau: 2, droits: 1, rebond: 5 },
    assignedPostitId: null,
  },
  {
    id: 'lisa',
    name: 'Lisa',
    age: 22,
    avatar: '👩',
    role: 'L\'Étudiante Solaire',
    description: 'Lisa, 22 ans. Étudiante en sociologie originaire d\'une famille modeste. Elle cumule la livraison de repas à vélo, le baby-sitting et le tutorat. Épuisée mais rayonnante de sociabilité, elle rêve de monter une coopérative d\'entraide étudiante.',
    dossierName: 'Bourse d\'étude échelon 7',
    skills: { finance: 1, sante: 2, reseau: 5, droits: 3, rebond: 4 },
    assignedPostitId: null,
  },
  {
    id: 'nico',
    name: 'Nico',
    age: 34,
    avatar: '👨',
    role: 'L\'Ex-Juriste Résilient',
    description: 'Nico, 34 ans. Ancien juriste d\'affaires devenu tétraplégique suite à un accident de sport. Expert des rouages administratifs et doté d\'un humour pince-sans-rire, il consacre son temps libre à conseiller juridiquement les familles précaires du quartier.',
    dossierName: 'Reconnaissance Invalidité (AAH)',
    skills: { finance: 3, sante: 1, droits: 5, reseau: 4, rebond: 2 },
    assignedPostitId: null,
  },
];

const UPGRADES_LIST: Upgrade[] = [
  {
    id: 'tableauXL',
    name: 'Tableau XL',
    description: 'Débloque un 2ème slot de colocataire par post-it.',
    cost: 150,
    icon: '📋',
    purchased: false,
  },
  {
    id: 'reunionHebdo',
    name: 'Réunion Hebdomadaire',
    description: '+1 permanent à toutes les jauges de compétences des colocs.',
    cost: 300,
    icon: '🤝',
    purchased: false,
  },
  {
    id: 'fibreOptique',
    name: 'Fibre Optique',
    description: 'Réduit le temps de traitement des post-its de 10% (travail requis: 270 au lieu de 300).',
    cost: 250,
    icon: '⚡',
    purchased: false,
  },
  {
    id: 'avocatBenevole',
    name: 'Avocat Bénévole',
    description: 'Accélère l\'obtention des papiers : le timer global s\'écoule 15% plus vite vers la victoire !',
    cost: 400,
    icon: '⚖️',
    purchased: false,
  },
  {
    id: 'caisseCommune',
    name: 'Caisse Commune',
    description: 'Augmente tous les gains de Solidarité de 20%.',
    cost: 200,
    icon: '💰',
    purchased: false,
  },
  {
    id: 'bouilloireNeuve',
    name: 'Bouilloire Neuve',
    description: 'Réduit de moitié le malus de bonheur infligé par les post-its en rouge.',
    cost: 180,
    icon: '🫖',
    purchased: false,
  },
];

const POSTITS_POOL: { title: string; type: ResourceType; icon: string }[] = [
  // Finance
  { title: 'Loyer en retard', type: 'finance', icon: '💶' },
  { title: 'Facture EDF', type: 'finance', icon: '💶' },
  { title: 'Réparation chauffe-eau', type: 'finance', icon: '💶' },
  { title: 'Pass Navigo', type: 'finance', icon: '💶' },
  { title: 'Courses de la semaine', type: 'finance', icon: '💶' },
  { title: 'Taxe poubelle', type: 'finance', icon: '💶' },
  // Santé
  { title: 'Grippe saisonnière', type: 'sante', icon: '💪' },
  { title: 'Rdv dentiste', type: 'sante', icon: '💪' },
  { title: 'Burn-out collectif', type: 'sante', icon: '💪' },
  { title: 'Panne de chauffage', type: 'sante', icon: '💪' },
  { title: 'Sommeil perturbé', type: 'sante', icon: '💪' },
  { title: 'Kiné Nico', type: 'sante', icon: '💪' },
  // Réseau (🤝)
  { title: 'Voisin bruyant', type: 'reseau', icon: '🤝' },
  { title: 'Besoin d\'écoute', type: 'reseau', icon: '🤝' },
  { title: 'Solitude', type: 'reseau', icon: '🤝' },
  { title: 'Organiser un repas', type: 'reseau', icon: '🤝' },
  { title: 'Conflit vaisselle', type: 'reseau', icon: '🤝' },
  { title: 'Perte de clés', type: 'reseau', icon: '🤝' },
  // Droits
  { title: 'Courrier CAF', type: 'droits', icon: '⚖️' },
  { title: 'Déclaration impôts', type: 'droits', icon: '⚖️' },
  { title: 'Renouvellement mutuelle', type: 'droits', icon: '⚖️' },
  { title: 'Dossier APL', type: 'droits', icon: '⚖️' },
  { title: 'Amende indue', type: 'droits', icon: '⚖️' },
  { title: 'Contrat de bail', type: 'droits', icon: '⚖️' },
  // Rebond
  { title: 'Refaire CV Marc', type: 'rebond', icon: '🚀' },
  { title: 'Inscription stage', type: 'rebond', icon: '🚀' },
  { title: 'Moral en baisse', type: 'rebond', icon: '🚀' },
  { title: 'Panne de vélo', type: 'rebond', icon: '🚀' },
  { title: 'Trouver une asso', type: 'rebond', icon: '🚀' },
  { title: 'Lettre de motivation', type: 'rebond', icon: '🚀' },
];

const RANDOM_NEWS = [
  { text: 'Marc a ramené des pâtisseries orientales pour tout le monde ! 🥐', bonus: 'happiness', value: 20, type: 'bonus' as const },
  { text: 'L\'ascenseur est encore en panne... Nico peste dans l\'escalier. 🛗', bonus: 'resource', target: 'sante' as const, value: -1, type: 'warning' as const },
  { text: 'La CAF a "perdu" un document... Un grand classique administratif. 📄', bonus: 'resource', target: 'droits' as const, value: -1, type: 'error' as const },
  { text: 'Lisa a eu un brillant 18/20 à son examen d\'économie ! 🎓', bonus: 'solidarity', value: 40, type: 'success' as const },
  { text: 'Nico a découvert un raccourci super accessible pour aller à la mairie.', bonus: 'time', value: 45, type: 'success' as const },
];

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- Game State Hooks ---
  const [roommates, setRoommates] = useState<Roommate[]>(INITIAL_ROOMMATES);
  // Fixed size 6 array representing corkboard post-it slots
  const [postits, setPostits] = useState<(Postit | null)[]>([null, null, null, null, null, null]);
  const [solidarity, setSolidarity] = useState<number>(50); // Wallet
  const [level, setLevel] = useState<number>(1);
  const [xp, setXp] = useState<number>(0);
  const [levelUpPending, setLevelUpPending] = useState<boolean>(false);
  const [upgrades, setUpgrades] = useState<Upgrade[]>(UPGRADES_LIST);
  const [stateTimer, setStateTimer] = useState<number>(2880); // Countdown in mins
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [balloons, setBalloons] = useState<{ id: string; x: number; isDoubleSpeed: boolean }[]>([]);
  const [doubleSpeedRemaining, setDoubleSpeedRemaining] = useState<number>(0);
  const [victory, setVictory] = useState<boolean>(false);

  const lastSpawnRef = useRef<number>(0);
  const lastBalloonRef = useRef<number>(0);
  const lastNewsRef = useRef<number>(0);

  const xpNeeded = level * 300;

  // Add a log entry helper
  const addLog = useCallback((text: string, type: LogEntry['type'] = 'info') => {
    const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [
      { id: Math.random().toString(), time: timeStr, text, type },
      ...prev.slice(0, 49),
    ]);
  }, []);

  // Compute dynamic skills of a roommate
  const getColocSkillsDynamic = useCallback((coloc: Roommate) => {
    const hasReunion = upgrades.find((u) => u.id === 'reunionHebdo')?.purchased;
    const skills = { ...coloc.skills };
    const bonuses = { finance: false, sante: false, reseau: false, droits: false, rebond: false };
    const maluses = { finance: false, sante: false, reseau: false, droits: false, rebond: false };

    const activePostits = postits.filter((p): p is Postit => p !== null);

    (Object.keys(skills) as ResourceType[]).forEach((type) => {
      if (hasReunion) {
        skills[type] += 1;
        bonuses[type] = true;
      }

      const orangeCount = activePostits.filter((p) => p.type === type && p.urgency === 'orange').length;
      const redCount = activePostits.filter((p) => p.type === type && p.urgency === 'rouge').length;
      
      const malusSum = (orangeCount * 1) + (redCount * 2);
      if (malusSum > 0) {
        skills[type] = Math.max(1, skills[type] - malusSum);
        maluses[type] = true;
        bonuses[type] = false;
      }
    });

    return {
      ...skills,
      bonuses,
      maluses,
    };
  }, [upgrades, postits]);

  // Calculate Happiness
  const activePostits = postits.filter((p): p is Postit => p !== null);
  const orangeCount = activePostits.filter((p) => p.urgency === 'orange').length;
  const redCount = activePostits.filter((p) => p.urgency === 'rouge').length;
  const hasBouilloire = upgrades.find((u) => u.id === 'bouilloireNeuve')?.purchased;
  
  const happinessMultiplierForRed = hasBouilloire ? 10 : 20;
  const calculatedHappiness = Math.max(0, 100 - (orangeCount * 10) - (redCount * happinessMultiplierForRed));

  // Initialize Game from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('coloc_sociale_save_v3');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setRoommates(data.roommates || INITIAL_ROOMMATES);
        setPostits(data.postits || [null, null, null, null, null, null]);
        setSolidarity(data.solidarity ?? 50);
        setLevel(data.level ?? 1);
        setXp(data.xp ?? 0);
        setLevelUpPending(data.levelUpPending ?? false);
        setUpgrades(data.upgrades || UPGRADES_LIST);
        setStateTimer(data.stateTimer ?? 2880);
        setLogs(data.logs || []);
        setDoubleSpeedRemaining(data.doubleSpeedRemaining ?? 0);
        setVictory(data.victory ?? false);
        addLog('Coloc chargée avec succès ! Bienvenue à la maison. 🏠', 'success');
      } catch (e) {
        console.error('Failed to load save', e);
        resetGame();
      }
    } else {
      addLog('Début de l\'aventure en colocation ! Réduisez le timer global de l\'État pour valider tous les dossiers administratifs !', 'info');
      spawnInitialPostits();
    }
  }, []);

  // Save game periodically
  useEffect(() => {
    if (!victory) {
      const dataToSave = {
        roommates,
        postits,
        solidarity,
        level,
        xp,
        levelUpPending,
        upgrades,
        stateTimer,
        logs,
        doubleSpeedRemaining,
        victory,
      };
      localStorage.setItem('coloc_sociale_save_v3', JSON.stringify(dataToSave));
    }
  }, [roommates, postits, solidarity, level, xp, levelUpPending, upgrades, stateTimer, logs, doubleSpeedRemaining, victory]);

  // Helper: Reset Game
  const resetGame = () => {
    setRoommates(INITIAL_ROOMMATES.map(r => ({ ...r })));
    setPostits([null, null, null, null, null, null]);
    setSolidarity(50);
    setLevel(1);
    setXp(0);
    setLevelUpPending(false);
    setUpgrades(UPGRADES_LIST.map(u => ({ ...u })));
    setStateTimer(2880);
    setLogs([]);
    setBalloons([]);
    setDoubleSpeedRemaining(0);
    setVictory(false);
    localStorage.removeItem('coloc_sociale_save_v3');
    setTimeout(() => {
      spawnInitialPostits();
      addLog('Aventure réinitialisée ! Nouvelle coloc ouverte.', 'info');
    }, 100);
  };

  const spawnInitialPostits = () => {
    const list: (Postit | null)[] = [null, null, null, null, null, null];
    const rotations = ['rotate-coloc-1', 'rotate-coloc-2', 'rotate-coloc-3', 'rotate-coloc-4'];
    
    for (let i = 0; i < 5; i++) {
      const randomIndex = Math.floor(Math.random() * POSTITS_POOL.length);
      const item = POSTITS_POOL[randomIndex];
      const randomRotation = rotations[Math.floor(Math.random() * rotations.length)];
      
      list[i] = {
        id: `postit-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
        title: item.title,
        type: item.type,
        icon: item.icon,
        colorClass: `postit-jaune ${randomRotation} glow-yellow`,
        progress: 0,
        elapsedTime: 0,
        urgency: 'jaune',
        assignedColocs: [],
      };
    }
    setPostits(list);
  };

  const swapPostits = useCallback((fromIndex: number, toIndex: number) => {
    setPostits((prev) => {
      const next = [...prev];
      const temp = next[fromIndex];
      next[fromIndex] = next[toIndex];
      next[toIndex] = temp;
      return next;
    });
  }, []);

  // Helper: Spawn a single random post-it into the first empty slot
  const spawnPostit = useCallback(() => {
    // Check if there is an empty slot
    const emptyIndex = postits.findIndex((p) => p === null);
    if (emptyIndex === -1) return; // Slots are full!

    const randomIndex = Math.floor(Math.random() * POSTITS_POOL.length);
    const item = POSTITS_POOL[randomIndex];
    
    const rotations = ['rotate-coloc-1', 'rotate-coloc-2', 'rotate-coloc-3', 'rotate-coloc-4'];
    const randomRotation = rotations[Math.floor(Math.random() * rotations.length)];

    const newPostit: Postit = {
      id: `postit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: item.title,
      type: item.type,
      icon: item.icon,
      colorClass: `postit-jaune ${randomRotation} glow-yellow`,
      progress: 0,
      elapsedTime: 0,
      urgency: 'jaune',
      assignedColocs: [],
    };

    setPostits((prev) => {
      const next = [...prev];
      const idx = next.findIndex(p => p === null);
      if (idx !== -1) {
        next[idx] = newPostit;
      }
      return next;
    });

    addLog(`Nouveau post-it : "${item.title}" !`, 'info');
  }, [postits, addLog]);

  // Drag and Drop assignment logic
  const assignColoc = useCallback((colocId: string, postitId: string) => {
    const roommate = roommates.find((r) => r.id === colocId);
    if (!roommate) return;

    playAssignSound();
    const previousPostitId = roommate.assignedPostitId;

    setPostits((prevPostits) => {
      // Create a copy of the fixed-size array
      const nextPostits = [...prevPostits];

      // Find target postit in slots
      const targetIndex = nextPostits.findIndex((p) => p !== null && p.id === postitId);
      if (targetIndex === -1) return prevPostits;

      const target = nextPostits[targetIndex]!;
      const isXL = upgrades.find((u) => u.id === 'tableauXL')?.purchased;
      const capacity = isXL ? 2 : 1;

      if (target.assignedColocs.includes(colocId)) return prevPostits;

      if (target.assignedColocs.length >= capacity) {
        if (capacity === 1) {
          // Swap logic
          const kickedColocId = target.assignedColocs[0];
          setRoommates((prevColocs) =>
            prevColocs.map((c) =>
              c.id === kickedColocId
                ? { ...c, assignedPostitId: null }
                : c.id === colocId
                ? { ...c, assignedPostitId: postitId }
                : c
            )
          );
          
          return nextPostits.map((p) => {
            if (p === null) return null;
            if (p.id === postitId) {
              return { ...p, assignedColocs: [colocId] };
            }
            if (previousPostitId && p.id === previousPostitId) {
              return { ...p, assignedColocs: p.assignedColocs.filter((c) => c !== colocId) };
            }
            return p;
          });
        } else {
          return prevPostits;
        }
      }

      setRoommates((prevColocs) =>
        prevColocs.map((c) => {
          if (c.id === colocId) {
            return { ...c, assignedPostitId: postitId };
          }
          if (previousPostitId && c.assignedPostitId === previousPostitId && c.id === colocId) {
            return { ...c, assignedPostitId: postitId };
          }
          return c;
        })
      );

      return nextPostits.map((p) => {
        if (p === null) return null;
        if (previousPostitId && p.id === previousPostitId) {
          return { ...p, assignedColocs: p.assignedColocs.filter((c) => c !== colocId) };
        }
        if (p.id === postitId) {
          return { ...p, assignedColocs: [...p.assignedColocs, colocId] };
        }
        return p;
      });
    });
  }, [roommates, upgrades]);

  const unassignColoc = useCallback((colocId: string) => {
    playAssignSound();
    setRoommates((prev) =>
      prev.map((c) => (c.id === colocId ? { ...c, assignedPostitId: null } : c))
    );
    setPostits((prev) =>
      prev.map((p) => {
        if (p === null) return null;
        return {
          ...p,
          assignedColocs: p.assignedColocs.filter((id) => id !== colocId),
        };
      })
    );
  }, []);

  // Shop / Upgrades Purchase logic
  const buyUpgrade = (id: string) => {
    const upgradeIndex = upgrades.findIndex((u) => u.id === id);
    if (upgradeIndex === -1) return;
    const upgrade = upgrades[upgradeIndex];
    if (upgrade.purchased) return;

    if (solidarity >= upgrade.cost) {
      playClickSound();
      setSolidarity((prev) => prev - upgrade.cost);
      setUpgrades((prev) =>
        prev.map((u) => (u.id === id ? { ...u, purchased: true } : u))
      );

      addLog(`Amélioration débloquée : "${upgrade.name}" (${upgrade.icon}) ! 🛠️`, 'success');
      confetti({ particleCount: 30, spread: 40 });
    } else {
      addLog(`Pas assez de Solidarité pour acheter "${upgrade.name}".`, 'error');
    }
  };

  // Flying Balloons logic
  const clickBalloon = (id: string) => {
    const balloon = balloons.find((b) => b.id === id);
    if (!balloon) return;

    playBalloonSound();
    setBalloons((prev) => prev.filter((b) => b.id !== id));

    const isDouble = balloon.isDoubleSpeed;
    if (isDouble) {
      setDoubleSpeedRemaining((prev) => prev + 10);
      addLog('🎈 Ballon éclaté ! Boost de Vitesse x2 pendant 10s activé ! ⚡', 'bonus');
    } else {
      const hasCaisse = upgrades.find((u) => u.id === 'caisseCommune')?.purchased;
      const amount = hasCaisse ? 60 : 50;
      
      setSolidarity((prev) => prev + amount);
      setXp((prev) => prev + amount);
      
      addLog(`🎈 Ballon éclaté ! +${amount} Solidarité & XP gagnés ! 💰`, 'bonus');
    }
    
    confetti({ particleCount: 15, colors: ['#f43f5e', '#38bdf8', '#fbbf24'] });
  };

  // Level Progression Handler
  useEffect(() => {
    if (xp >= xpNeeded && !victory) {
      setLevel((l) => {
        const nextL = l + 1;
        playLevelUpSound();
        setLevelUpPending(true);
        addLog(`🎉 PASSAGE AU NIVEAU ${nextL} ! Félicitations ! Votre colocation s'épanouit.`, 'success');
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.7 } });
        return nextL;
      });
    }
  }, [xp, xpNeeded, victory, addLog]);

  // Tick Core Engine
  useEffect(() => {
    if (victory) return;

    const timer = setInterval(() => {
      const now = Date.now();

      // --- 1. Eviction timer calculations ---
      const baseTickMinutes = calculatedHappiness > 70 ? 1.2 : calculatedHappiness >= 40 ? 1.0 : 0.5;
      const hasAvocat = upgrades.find((u) => u.id === 'avocatBenevole')?.purchased;
      const speedMultiplier = hasAvocat ? 1.15 : 1.0;
      const elapsedGameMins = baseTickMinutes * speedMultiplier;

      setStateTimer((prev) => {
        const next = prev - elapsedGameMins;
        if (next <= 0) {
          setVictory(true);
          confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
          return 0;
        }
        return next;
      });

      // --- 2. Update double speed booster ---
      setDoubleSpeedRemaining((prev) => Math.max(0, prev - 1));

      // --- 3. Process Active Post-its Progress & Timers ---
      setPostits((prevPostits) => {
        // Iterate over 6 slots preserving indexes, set completed to null
        return prevPostits.map((postit) => {
          if (postit === null) return null;

          const newElapsedTime = postit.elapsedTime + 1;
          let newUrgency = postit.urgency;
          let newColorClass = postit.colorClass;

          const rotClass = postit.colorClass.split(' ').find(c => c.startsWith('rotate-coloc-')) || 'rotate-coloc-1';

          if (newElapsedTime > 360) {
            newUrgency = 'rouge';
            newColorClass = `postit-rouge ${rotClass} glow-red`;
          } else if (newElapsedTime > 180) {
            newUrgency = 'orange';
            newColorClass = `postit-orange ${rotClass} glow-orange`;
          } else {
            newUrgency = 'jaune';
            newColorClass = `postit-jaune ${rotClass} glow-yellow`;
          }

          const speedPenalty = calculatedHappiness < 40 ? 0.8 : 1.0;
          const doubleSpeedMultiplier = doubleSpeedRemaining > 0 ? 2 : 1;

          let sumSkills = 0;
          postit.assignedColocs.forEach((colocId) => {
            const coloc = roommates.find((c) => c.id === colocId);
            if (coloc) {
              const dynamicStats = getColocSkillsDynamic(coloc);
              sumSkills += dynamicStats[postit.type];
            }
          });

          const hasFibre = upgrades.find((u) => u.id === 'fibreOptique')?.purchased;
          const maxProgress = hasFibre ? 270 : 300;

          let nextProgress = postit.progress;
          if (sumSkills > 0) {
            nextProgress += sumSkills * speedPenalty * doubleSpeedMultiplier;
          }

          if (nextProgress >= maxProgress) {
            // Post-it is RESOLVED!
            playCompleteSound();
            
            const hasCaisse = upgrades.find((u) => u.id === 'caisseCommune')?.purchased;
            const reward = Math.round((hasCaisse ? 60 : 50));
            
            setSolidarity((s) => s + reward);
            setXp((x) => x + reward);

            const subtractMins = postit.type === 'droits' ? 90 : 30;
            setStateTimer((t) => Math.max(0, t - subtractMins));

            // Release roommates from this specific postit
            setRoommates((colocs) =>
              colocs.map((c) =>
                postit.assignedColocs.includes(c.id) ? { ...c, assignedPostitId: null } : c
              )
            );

            addLog(`Besoin résolu : "${postit.title}" ! -${subtractMins} min de démarches et +${reward} SP 🤝`, 'success');
            return null; // Empty this slot!
          } else {
            return {
              ...postit,
              elapsedTime: newElapsedTime,
              urgency: newUrgency,
              colorClass: newColorClass,
              progress: nextProgress,
            };
          }
        });
      });

      // --- 4. Spawn logic ---
      const currentSpawnDelay = calculatedHappiness < 40 ? 30 : 45;
      const currentSecs = Math.floor(now / 1000);
      if (lastSpawnRef.current === 0) {
        lastSpawnRef.current = currentSecs;
      }

      if (currentSecs - lastSpawnRef.current >= currentSpawnDelay) {
        spawnPostit();
        lastSpawnRef.current = currentSecs;
      }

      // --- 5. Balloon Spawner ---
      if (lastBalloonRef.current === 0) {
        lastBalloonRef.current = currentSecs;
      }
      if (currentSecs - lastBalloonRef.current >= 30) {
        const balloonId = `balloon-${now}`;
        const randomX = Math.floor(Math.random() * 70) + 15;
        const isDoubleSpeed = Math.random() > 0.6;
        
        setBalloons((prev) => [...prev, { id: balloonId, x: randomX, isDoubleSpeed }]);
        lastBalloonRef.current = currentSecs;

        setTimeout(() => {
          setBalloons((prev) => prev.filter((b) => b.id !== balloonId));
        }, 12000);
      }

      // --- 6. Random News events ---
      if (lastNewsRef.current === 0) {
        lastNewsRef.current = currentSecs;
      }
      if (currentSecs - lastNewsRef.current >= 40) {
        const randomNewsItem = RANDOM_NEWS[Math.floor(Math.random() * RANDOM_NEWS.length)];
        
        if (randomNewsItem.bonus === 'happiness') {
          setSolidarity((s) => s + 20);
          setXp((x) => x + 20);
        } else if (randomNewsItem.bonus === 'solidarity') {
          setSolidarity((s) => s + randomNewsItem.value);
          setXp((x) => x + randomNewsItem.value);
        } else if (randomNewsItem.bonus === 'time') {
          setStateTimer((t) => Math.max(0, t - randomNewsItem.value));
        }

        addLog(randomNewsItem.text, randomNewsItem.type);
        lastNewsRef.current = currentSecs;
      }

    }, 1000);

    return () => clearInterval(timer);
  }, [postits, roommates, upgrades, calculatedHappiness, doubleSpeedRemaining, victory, spawnPostit, addLog, getColocSkillsDynamic]);

  return (
    <GameContext.Provider
      value={{
        roommates,
        postits,
        solidarity,
        level,
        xp,
        xpNeeded,
        levelUpPending,
        setLevelUpPending,
        upgrades,
        stateTimer,
        logs,
        happiness: calculatedHappiness,
        balloons,
        doubleSpeedRemaining,
        victory,
        spawnPostit,
        assignColoc,
        unassignColoc,
        buyUpgrade,
        clickBalloon,
        addLog,
        resetGame,
        swapPostits,
        getColocSkillsDynamic,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
