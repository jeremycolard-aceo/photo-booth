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
  assignedColocs: string[]; // roomate IDs
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
  postits: Postit[];
  solidarity: number;
  level: number;
  xp: number;
  xpNeeded: number;
  levelUpPending: boolean;
  setLevelUpPending: (pending: boolean) => void;
  upgrades: Upgrade[];
  stateTimer: number; // in simulated minutes (starts at 48 hours = 2880 mins, decreases to 0 = victory)
  logs: LogEntry[];
  happiness: number;
  balloons: { id: string; x: number; isDoubleSpeed: boolean }[];
  doubleSpeedRemaining: number; // in seconds
  victory: boolean;
  spawnPostit: () => void;
  assignColoc: (colocId: string, postitId: string) => void;
  unassignColoc: (colocId: string) => void;
  buyUpgrade: (id: string) => void;
  clickBalloon: (id: string) => void;
  addLog: (text: string, type?: LogEntry['type']) => void;
  resetGame: () => void;
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

// --- Game Data Defaults ---

const INITIAL_ROOMMATES: Roommate[] = [
  {
    id: 'marc',
    name: 'Marc',
    age: 45,
    avatar: '👨',
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
    avatar: '👩🎓',
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
    avatar: '👨🦽',
    role: 'L\'Ex-Juriste Résilient',
    description: 'Nico, 34 ans. Ancien juriste d\'affaires devenu tétraplégique suite à un accident de sport. Expert des rouages administratifs et doté d\'un humour pince-sans-rire, il consacre son temps libre à conseiller juridiquement les familles précaires du quartier.',
    dossierName: 'Reconnaissance Invalidité (AAH)',
    skills: { finance: 3, sante: 1, droits: 5, reseau: 4, rebond: 2 },
    assignedPostitId: null,
  },
  {
    id: 'marie',
    name: 'Marie',
    age: 70,
    avatar: '👵',
    role: 'La Mémoire du Quartier',
    description: 'Marie, 70 ans. Ancienne institutrice retraitée et veuve. Sans famille proche mais débordante d\'énergie, elle connaît l\'histoire de chaque habitant de la rue et prépare de célèbres gouters d\'accueil pour tous les nouveaux arrivants.',
    dossierName: 'Logement social adapté (Senior)',
    skills: { finance: 4, sante: 3, reseau: 5, droits: 2, rebond: 1 },
    assignedPostitId: null,
  },
];

const UPGRADES_LIST: Upgrade[] = [
  {
    id: 'tableauXL',
    name: 'Tableau XL',
    description: 'Débloque un 2ème slot de colocataire par post-it et le tri avancé.',
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
  // Réseau (🤝 replaced)
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
  { text: 'Marc a ramené des pâtisseries orientales pour tout le monde ! 🥐', bonus: 'happiness', value: 10, type: 'bonus' as const },
  { text: 'L\'ascenseur est encore en panne... Nico peste dans l\'escalier. 🛗', bonus: 'resource', target: 'sante' as const, value: -1, type: 'warning' as const },
  { text: 'La CAF a "perdu" un document... Un grand classique administratif. 📄', bonus: 'resource', target: 'droits' as const, value: -1, type: 'error' as const },
  { text: 'Lisa a eu un brillant 18/20 à son examen d\'économie ! 🎓', bonus: 'solidarity', value: 40, type: 'success' as const },
  { text: 'Nico a découvert un raccourci super accessible pour aller à la mairie.', bonus: 'time', value: 45, type: 'success' as const },
  { text: 'Marie a partagé ses célèbres crêpes avec les voisins du troisième. 🥞', bonus: 'resource', target: 'reseau' as const, value: 1, type: 'success' as const },
  { text: 'Une fuite d\'eau suspecte apparaît dans la salle de bain... 💧', bonus: 'resource', target: 'finance' as const, value: -1, type: 'warning' as const },
];

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- Game State Hooks ---
  const [roommates, setRoommates] = useState<Roommate[]>(INITIAL_ROOMMATES);
  const [postits, setPostits] = useState<Postit[]>([]);
  const [solidarity, setSolidarity] = useState<number>(50); // Wallet
  const [level, setLevel] = useState<number>(1);
  const [xp, setXp] = useState<number>(0);
  const [levelUpPending, setLevelUpPending] = useState<boolean>(false);
  const [upgrades, setUpgrades] = useState<Upgrade[]>(UPGRADES_LIST);
  const [stateTimer, setStateTimer] = useState<number>(2880); // Countdown to 0 (Starts at 48h = 2880 mins)
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [balloons, setBalloons] = useState<{ id: string; x: number; isDoubleSpeed: boolean }[]>([]);
  const [doubleSpeedRemaining, setDoubleSpeedRemaining] = useState<number>(0);
  const [victory, setVictory] = useState<boolean>(false);

  // Time tracking references
  const lastSpawnRef = useRef<number>(0);
  const lastBalloonRef = useRef<number>(0);
  const lastNewsRef = useRef<number>(0);

  const xpNeeded = level * 300;

  // Add a log entry helper
  const addLog = useCallback((text: string, type: LogEntry['type'] = 'info') => {
    const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [
      { id: Math.random().toString(), time: timeStr, text, type },
      ...prev.slice(0, 49), // Keep last 50 logs
    ]);
  }, []);

  // Compute dynamic skills of a roommate based on bonuses/maluses
  const getColocSkillsDynamic = useCallback((coloc: Roommate) => {
    const hasReunion = upgrades.find((u) => u.id === 'reunionHebdo')?.purchased;
    const skills = { ...coloc.skills };
    const bonuses = { finance: false, sante: false, reseau: false, droits: false, rebond: false };
    const maluses = { finance: false, sante: false, reseau: false, droits: false, rebond: false };

    (Object.keys(skills) as ResourceType[]).forEach((type) => {
      // 1. Apply upgrade bonus
      if (hasReunion) {
        skills[type] += 1;
        bonuses[type] = true;
      }

      // 2. Apply active post-it maluses
      // Count active post-its of this type that are in orange or red state
      const orangeCount = postits.filter((p) => p.type === type && p.urgency === 'orange').length;
      const redCount = postits.filter((p) => p.type === type && p.urgency === 'rouge').length;
      
      const malusSum = (orangeCount * 1) + (redCount * 2);
      if (malusSum > 0) {
        skills[type] = Math.max(1, skills[type] - malusSum); // always keep at least 1
        maluses[type] = true;
        // In case they overlap, let malus override bonus visually
        bonuses[type] = false;
      }
    });

    return {
      finance: skills.finance,
      sante: skills.sante,
      reseau: skills.reseau,
      droits: skills.droits,
      rebond: skills.rebond,
      bonuses,
      maluses,
    };
  }, [upgrades, postits]);

  // Calculate Happiness
  const orangeCount = postits.filter((p) => p.urgency === 'orange').length;
  const redCount = postits.filter((p) => p.urgency === 'rouge').length;
  const hasBouilloire = upgrades.find((u) => u.id === 'bouilloireNeuve')?.purchased;
  
  // Base Happiness starts at 100
  // Orange = -10, Red = -20 (or -10 if Bouilloire Neuve)
  const happinessMultiplierForRed = hasBouilloire ? 10 : 20;
  const calculatedHappiness = Math.max(0, 100 - (orangeCount * 10) - (redCount * happinessMultiplierForRed));

  // Initialize Game from LocalStorage if available
  useEffect(() => {
    const saved = localStorage.getItem('coloc_sociale_save_v2');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setRoommates(data.roommates || INITIAL_ROOMMATES);
        setPostits(data.postits || []);
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
      localStorage.setItem('coloc_sociale_save_v2', JSON.stringify(dataToSave));
    }
  }, [roommates, postits, solidarity, level, xp, levelUpPending, upgrades, stateTimer, logs, doubleSpeedRemaining, victory]);

  // Helper: Reset Game
  const resetGame = () => {
    setRoommates(INITIAL_ROOMMATES.map(r => ({ ...r })));
    setPostits([]);
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
    localStorage.removeItem('coloc_sociale_save_v2');
    setTimeout(() => {
      spawnInitialPostits();
      addLog('Aventure réinitialisée ! Nouvelle coloc ouverte.', 'info');
    }, 100);
  };

  const spawnInitialPostits = () => {
    const list: Postit[] = [];
    const pool1 = POSTITS_POOL.find(p => p.type === 'finance')!;
    const pool2 = POSTITS_POOL.find(p => p.type === 'reseau')!;
    
    list.push({
      id: `postit-${Date.now()}-1`,
      title: pool1.title,
      type: pool1.type,
      icon: pool1.icon,
      colorClass: 'postit-jaune rotate-coloc-1 glow-yellow',
      progress: 0,
      elapsedTime: 0,
      urgency: 'jaune',
      assignedColocs: [],
    });
    
    list.push({
      id: `postit-${Date.now()}-2`,
      title: pool2.title,
      type: pool2.type,
      icon: pool2.icon,
      colorClass: 'postit-jaune rotate-coloc-2 glow-yellow',
      progress: 0,
      elapsedTime: 0,
      urgency: 'jaune',
      assignedColocs: [],
    });
    setPostits(list);
  };

  // Helper: Spawn a single random post-it
  const spawnPostit = useCallback(() => {
    if (postits.length >= 8) return;

    const randomIndex = Math.floor(Math.random() * POSTITS_POOL.length);
    const item = POSTITS_POOL[randomIndex];
    
    // Choose a random small rotation class to give dynamic real post-it feel
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

    setPostits((prev) => [...prev, newPostit]);
    addLog(`Nouveau post-it : "${item.title}" !`, 'info');
  }, [postits.length, addLog]);

  // Drag and Drop assignment logic
  const assignColoc = useCallback((colocId: string, postitId: string) => {
    const roommate = roommates.find((r) => r.id === colocId);
    if (!roommate) return;

    // Play assignment sound!
    playAssignSound();

    const previousPostitId = roommate.assignedPostitId;

    setPostits((prevPostits) => {
      const target = prevPostits.find((p) => p.id === postitId);
      if (!target) return prevPostits;

      const isXL = upgrades.find((u) => u.id === 'tableauXL')?.purchased;
      const capacity = isXL ? 2 : 1;

      if (target.assignedColocs.includes(colocId)) return prevPostits;

      if (target.assignedColocs.length >= capacity) {
        if (capacity === 1) {
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
          
          return prevPostits.map((p) => {
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

      return prevPostits.map((p) => {
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
    playAssignSound(); // subtle plop when unassigning too
    setRoommates((prev) =>
      prev.map((c) => (c.id === colocId ? { ...c, assignedPostitId: null } : c))
    );
    setPostits((prev) =>
      prev.map((p) => ({
        ...p,
        assignedColocs: p.assignedColocs.filter((id) => id !== colocId),
      }))
    );
  }, []);

  // Shop / Upgrades Purchase logic
  const buyUpgrade = (id: string) => {
    const upgradeIndex = upgrades.findIndex((u) => u.id === id);
    if (upgradeIndex === -1) return;
    const upgrade = upgrades[upgradeIndex];
    if (upgrade.purchased) return;

    if (solidarity >= upgrade.cost) {
      playClickSound(); // retro chime/click
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

    // Pop sound!
    playBalloonSound();

    setBalloons((prev) => prev.filter((b) => b.id !== id));

    const isDouble = balloon.isDoubleSpeed;
    if (isDouble) {
      setDoubleSpeedRemaining((prev) => prev + 10);
      addLog('🎈 Ballon éclaté ! Boost de Vitesse x2 pendant 10s activé ! ⚡', 'bonus');
    } else {
      const hasCaisse = upgrades.find((u) => u.id === 'caisseCommune')?.purchased;
      const amount = hasCaisse ? 60 : 50;
      
      // Update solidarity and XP!
      setSolidarity((prev) => prev + amount);
      setXp((prev) => prev + amount);
      
      addLog(`🎈 Ballon éclaté ! +${amount} Solidarité & XP gagnés ! 💰`, 'bonus');
    }
    
    confetti({ particleCount: 15, colors: ['#f43f5e', '#38bdf8', '#fbbf24'] });
  };

  // Level Progression Handler
  useEffect(() => {
    if (xp >= xpNeeded && !victory) {
      // Level Up!
      setLevel((l) => {
        const nextL = l + 1;
        playLevelUpSound(); // play gorgeous fanfare arpeggio!
        setLevelUpPending(true); // show Congratulations shop pop-up!
        addLog(`🎉 PASSAGE AU NIVEAU ${nextL} ! Félicitations ! Votre colocation s'épanouit.`, 'success');
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.7 } });
        return nextL;
      });
    }
  }, [xp, xpNeeded, victory, addLog]);

  // Tick Core Engine: Runs every 1 second
  useEffect(() => {
    if (victory) return;

    const timer = setInterval(() => {
      const now = Date.now();

      // --- 1. Eviction timer calculations ---
      // Starts at 2880 mins (48h). Goal is to bring it to 0 (validation/victory).
      // Eviction speed depends on Coloc Happiness:
      // Happy (calculatedHappiness > 70) => decreases by 1.2 game minutes per second.
      // Neutral (40-70) => decreases by 1.0 game minutes per second.
      // Sad (<40) => decreases by 0.5 game minutes per second.
      const baseTickMinutes = calculatedHappiness > 70 ? 1.2 : calculatedHappiness >= 40 ? 1.0 : 0.5;
      
      // Upgrade Avocat Bénévole speeds up validation time by 15%
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

      // --- 2. Update double speed booster countdown ---
      setDoubleSpeedRemaining((prev) => Math.max(0, prev - 1));

      // --- 3. Process Active Post-its Progress & Timers ---
      setPostits((prevPostits) => {
        const unresolved: Postit[] = [];

        for (const postit of prevPostits) {
          const newElapsedTime = postit.elapsedTime + 1;
          
          let newUrgency = postit.urgency;
          let newColorClass = postit.colorClass;

          // Urgency visual transitions (pastels paper rotation preserved)
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

          // Calculate collective skills processing power
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
            playCompleteSound(); // retro chime!
            
            // Calculate Solidarity & XP gains (+50 base, +20% if Caisse Commune)
            const hasCaisse = upgrades.find((u) => u.id === 'caisseCommune')?.purchased;
            const reward = Math.round((hasCaisse ? 60 : 50));
            
            setSolidarity((s) => s + reward);
            setXp((x) => x + reward); // XP matches Solidarity gains!

            // INVERTED TIMER REWARD:
            // Completing a post-it SUBTRACTS time from the global validation counter (brings us closer to validation/victory!).
            // Standard completed: subtracts 30 game minutes.
            // Droits (⚖️) completed: subtracts 90 game minutes! (accelerates paperwork).
            const subtractMins = postit.type === 'droits' ? 90 : 30;
            setStateTimer((t) => Math.max(0, t - subtractMins));

            // Release roommates
            setRoommates((colocs) =>
              colocs.map((c) =>
                postit.assignedColocs.includes(c.id) ? { ...c, assignedPostitId: null } : c
              )
            );

            addLog(`Besoin résolu : "${postit.title}" ! -${subtractMins} min de démarches et +${reward} SP 🤝`, 'success');
          } else {
            unresolved.push({
              ...postit,
              elapsedTime: newElapsedTime,
              urgency: newUrgency,
              colorClass: newColorClass,
              progress: nextProgress,
            });
          }
        }

        return unresolved;
      });

      // --- 4. Spawn logic ---
      // If happiness is ☹️ (<40), post-its spawn 30% faster (approx. every 30s instead of 45s)
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

      // --- 6. Random News Feed Events ---
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
          // Accelerate state validation: subtracts time!
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
