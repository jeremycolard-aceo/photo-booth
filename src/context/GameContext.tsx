import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';

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
  isSecured: boolean; // Has their administrative folder been completed?
  skills: {
    finance: number;
    sante: number;
    reseau: number;
    droits: number;
    rebond: number;
  };
  energy: number; // 0 to 100
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
  resources: Record<ResourceType, number>;
  upgrades: Upgrade[];
  stateTimer: number; // in simulated minutes (starts at 48 hours = 2880 mins)
  logs: LogEntry[];
  happiness: number;
  balloons: { id: string; x: number; isDoubleSpeed: boolean }[];
  doubleSpeedRemaining: number; // in seconds
  victory: boolean;
  gameOver: boolean;
  spawnPostit: () => void;
  assignColoc: (colocId: string, postitId: string) => void;
  unassignColoc: (colocId: string) => void;
  buyUpgrade: (id: string) => void;
  secureRoommate: (id: string) => void;
  clickBalloon: (id: string) => void;
  addLog: (text: string, type?: LogEntry['type']) => void;
  resetGame: () => void;
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
    description: 'Attend ses papiers, courageux et travailleur.',
    dossierName: 'Régularisation administrative',
    isSecured: false,
    skills: { finance: 1, sante: 3, reseau: 2, droits: 1, rebond: 5 },
    energy: 100,
    assignedPostitId: null,
  },
  {
    id: 'lisa',
    name: 'Lisa',
    age: 22,
    avatar: '👩🎓',
    role: 'L\'Étudiante Précaire',
    description: 'Cumule 3 jobs, épuisée mais extrêmement sociale.',
    dossierName: 'Bourse d\'étude échelon 7',
    isSecured: false,
    skills: { finance: 1, sante: 2, reseau: 5, droits: 3, rebond: 4 },
    energy: 100,
    assignedPostitId: null,
  },
  {
    id: 'nico',
    name: 'Nico',
    age: 34,
    avatar: '👨🦽',
    role: 'L\'Ex-Juriste Résilient',
    description: 'Ancien juriste en fauteuil roulant suite à un accident.',
    dossierName: 'Reconnaissance Invalidité (AAH)',
    isSecured: false,
    skills: { finance: 3, sante: 1, reseau: 4, droits: 5, rebond: 2 },
    energy: 100,
    assignedPostitId: null,
  },
  {
    id: 'marie',
    name: 'Marie',
    age: 70,
    avatar: '👵',
    role: 'La Mémoire du Quartier',
    description: 'Petite retraite, mais connaît tout le monde dans la rue.',
    dossierName: 'Logement social adapté (Senior)',
    isSecured: false,
    skills: { finance: 4, sante: 3, reseau: 5, droits: 2, rebond: 1 },
    energy: 100,
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
    description: '+1 permanent à toutes les jauges de ressources.',
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
    description: 'Ralentit de 15% le décompte de l\'État et ajoute 5% de temps bonus.',
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
  { title: 'Facture EDF salée', type: 'finance', icon: '💶' },
  { title: 'Panne chauffe-eau', type: 'finance', icon: '💶' },
  { title: 'Recharger Pass Navigo', type: 'finance', icon: '💶' },
  { title: 'Courses collectives', type: 'finance', icon: '💶' },
  { title: 'Taxe poubelles réclamée', type: 'finance', icon: '💶' },
  // Santé
  { title: 'Grippe saisonnière', type: 'sante', icon: '💪' },
  { title: 'Rendez-vous dentiste', type: 'sante', icon: '💪' },
  { title: 'Burn-out collectif', type: 'sante', icon: '💪' },
  { title: 'Panne de chauffage', type: 'sante', icon: '💪' },
  { title: 'Sommeil très perturbé', type: 'sante', icon: '💪' },
  { title: 'Séance Kiné Nico', type: 'sante', icon: '💪' },
  // Réseau
  { title: 'Voisin très bruyant', type: 'reseau', icon: '🧑🤝🧑' },
  { title: 'Gros besoin d\'écoute', type: 'reseau', icon: '🧑🤝🧑' },
  { title: 'Solitude pesante', type: 'reseau', icon: '🧑🤝🧑' },
  { title: 'Organiser un repas', type: 'reseau', icon: '🧑🤝🧑' },
  { title: 'Guerre de la vaisselle', type: 'reseau', icon: '🧑🤝🧑' },
  { title: 'Perte de clés du hall', type: 'reseau', icon: '🧑🤝🧑' },
  // Droits
  { title: 'Courrier CAF mystère', type: 'droits', icon: '⚖️' },
  { title: 'Déclaration d\'impôts', type: 'droits', icon: '⚖️' },
  { title: 'Mutuelle à renouveler', type: 'droits', icon: '⚖️' },
  { title: 'Dossier APL bloqué', type: 'droits', icon: '⚖️' },
  { title: 'Amende indue majorée', type: 'droits', icon: '⚖️' },
  { title: 'Contrat de bail à signer', type: 'droits', icon: '⚖️' },
  // Rebond
  { title: 'Refaire le CV de Marc', type: 'rebond', icon: '🚀' },
  { title: 'Inscription stage pro', type: 'rebond', icon: '🚀' },
  { title: 'Baisse de moral générale', type: 'rebond', icon: '🚀' },
  { title: 'Panne de vélo de Lisa', type: 'rebond', icon: '🚀' },
  { title: 'Trouver une association', type: 'rebond', icon: '🚀' },
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
  const [solidarity, setSolidarity] = useState<number>(50); // Start with 50 solidarity points
  const [resources, setResources] = useState<Record<ResourceType, number>>({
    finance: 10,
    sante: 10,
    reseau: 10,
    droits: 10,
    rebond: 10,
  });
  const [upgrades, setUpgrades] = useState<Upgrade[]>(UPGRADES_LIST);
  const [stateTimer, setStateTimer] = useState<number>(2880); // 48 hours * 60 minutes = 2880 mins
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [balloons, setBalloons] = useState<{ id: string; x: number; isDoubleSpeed: boolean }[]>([]);
  const [doubleSpeedRemaining, setDoubleSpeedRemaining] = useState<number>(0);
  const [victory, setVictory] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);

  // Time tracking references
  const lastSpawnRef = useRef<number>(0);
  const lastBalloonRef = useRef<number>(0);
  const lastNewsRef = useRef<number>(0);

  // Add a log entry helper
  const addLog = useCallback((text: string, type: LogEntry['type'] = 'info') => {
    const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [
      { id: Math.random().toString(), time: timeStr, text, type },
      ...prev.slice(0, 49), // Keep last 50 logs
    ]);
  }, []);

  // Initialize Game from LocalStorage if available
  useEffect(() => {
    const saved = localStorage.getItem('coloc_sociale_save');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setRoommates(data.roommates || INITIAL_ROOMMATES);
        setPostits(data.postits || []);
        setSolidarity(data.solidarity ?? 50);
        setResources(data.resources || { finance: 10, sante: 10, reseau: 10, droits: 10, rebond: 10 });
        setUpgrades(data.upgrades || UPGRADES_LIST);
        setStateTimer(data.stateTimer ?? 2880);
        setLogs(data.logs || []);
        setDoubleSpeedRemaining(data.doubleSpeedRemaining ?? 0);
        setVictory(data.victory ?? false);
        setGameOver(data.gameOver ?? false);
        addLog('Coloc chargée avec succès ! Bienvenue à la maison. 🏠', 'success');
      } catch (e) {
        console.error('Failed to load save', e);
        // Start fresh
        resetGame();
      }
    } else {
      // First log
      addLog('Début de l\'aventure en colocation ! Remplissez les dossiers pour sécuriser Marc, Lisa, Nico et Marie.', 'info');
      // Spawn two initial post-its to start playing
      spawnInitialPostits();
    }
  }, []);

  // Save game periodically
  useEffect(() => {
    if (!victory && !gameOver) {
      const dataToSave = {
        roommates,
        postits,
        solidarity,
        resources,
        upgrades,
        stateTimer,
        logs,
        doubleSpeedRemaining,
        victory,
        gameOver,
      };
      localStorage.setItem('coloc_sociale_save', JSON.stringify(dataToSave));
    }
  }, [roommates, postits, solidarity, resources, upgrades, stateTimer, logs, doubleSpeedRemaining, victory, gameOver]);

  // Calculate Happiness
  const orangeCount = postits.filter((p) => p.urgency === 'orange').length;
  const redCount = postits.filter((p) => p.urgency === 'rouge').length;
  const hasBouilloire = upgrades.find((u) => u.id === 'bouilloireNeuve')?.purchased;
  
  // Base Happiness starts at 100
  // Orange = -10, Red = -20 (or -10 if Bouilloire Neuve)
  const happinessMultiplierForRed = hasBouilloire ? 10 : 20;
  const calculatedHappiness = Math.max(0, 100 - (orangeCount * 10) - (redCount * happinessMultiplierForRed));

  // Helper: Reset Game
  const resetGame = () => {
    setRoommates(INITIAL_ROOMMATES.map(r => ({ ...r })));
    setPostits([]);
    setSolidarity(50);
    setResources({ finance: 10, sante: 10, reseau: 10, droits: 10, rebond: 10 });
    setUpgrades(UPGRADES_LIST.map(u => ({ ...u })));
    setStateTimer(2880);
    setLogs([]);
    setBalloons([]);
    setDoubleSpeedRemaining(0);
    setVictory(false);
    setGameOver(false);
    localStorage.removeItem('coloc_sociale_save');
    setTimeout(() => {
      spawnInitialPostits();
      addLog('Aventure réinitialisée ! Nouvelle coloc ouverte.', 'info');
    }, 100);
  };

  const spawnInitialPostits = () => {
    const list: Postit[] = [];
    // Spawn one Finance and one network postit to begin
    const pool1 = POSTITS_POOL.find(p => p.type === 'finance')!;
    const pool2 = POSTITS_POOL.find(p => p.type === 'reseau')!;
    
    list.push({
      id: `postit-${Date.now()}-1`,
      title: pool1.title,
      type: pool1.type,
      icon: pool1.icon,
      colorClass: 'from-amber-400/20 to-yellow-500/20 border-yellow-500/40 glow-yellow',
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
      colorClass: 'from-amber-400/20 to-yellow-500/20 border-yellow-500/40 glow-yellow',
      progress: 0,
      elapsedTime: 0,
      urgency: 'jaune',
      assignedColocs: [],
    });
    setPostits(list);
  };

  // Helper: Spawn a single random post-it
  const spawnPostit = useCallback(() => {
    // Prevent spawning more than 8 post-its to keep screen clean
    if (postits.length >= 8) return;

    const randomIndex = Math.floor(Math.random() * POSTITS_POOL.length);
    const item = POSTITS_POOL[randomIndex];
    const newPostit: Postit = {
      id: `postit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: item.title,
      type: item.type,
      icon: item.icon,
      colorClass: 'from-amber-400/20 to-yellow-500/20 border-yellow-500/40 glow-yellow',
      progress: 0,
      elapsedTime: 0,
      urgency: 'jaune',
      assignedColocs: [],
    };

    setPostits((prev) => [...prev, newPostit]);
    addLog(`Nouveau besoin apparu : "${item.title}" (${item.icon}) !`, 'info');
  }, [postits.length, addLog]);

  // Helper: Secure Roommate Dossier (Win conditions check)
  const secureRoommate = (id: string) => {
    const roommate = roommates.find((r) => r.id === id);
    if (!roommate || roommate.isSecured) return;

    // Define cost requirements based on roommate
    let cost = 800;
    let res1: ResourceType = 'finance';
    let res2: ResourceType = 'reseau';

    if (id === 'marc') {
      cost = 1000;
      res1 = 'rebond';
      res2 = 'droits';
    } else if (id === 'lisa') {
      cost = 800;
      res1 = 'reseau';
      res2 = 'finance';
    } else if (id === 'nico') {
      cost = 1200;
      res1 = 'sante';
      res2 = 'droits';
    } else if (id === 'marie') {
      cost = 900;
      res1 = 'reseau';
      res2 = 'sante';
    }

    // Check requirements
    const hasReunion = upgrades.find((u) => u.id === 'reunionHebdo')?.purchased ? 1 : 0;
    const currentRes1 = resources[res1] + hasReunion;
    const currentRes2 = resources[res2] + hasReunion;

    if (solidarity >= cost && currentRes1 >= 15 && currentRes2 >= 15) {
      // Deduct solidarity
      setSolidarity((prev) => prev - cost);
      // Mark secured
      setRoommates((prev) =>
        prev.map((r) => {
          if (r.id === id) {
            // Free from post-it if assigned
            if (r.assignedPostitId) {
              unassignColoc(r.id);
            }
            return { ...r, isSecured: true, assignedPostitId: null };
          }
          return r;
        })
      );
      addLog(`🎉 DOSSIER DÉPOSÉ ! ${roommate.name} est officiellement sécurisé(e) ! Bravo !`, 'success');
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });

      // Check if all are secured
      setRoommates((currentRoommates) => {
        const nextRoommates = currentRoommates.map(r => r.id === id ? { ...r, isSecured: true } : r);
        const allSecured = nextRoommates.every((r) => r.isSecured);
        if (allSecured) {
          setVictory(true);
          confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
        }
        return nextRoommates;
      });
    } else {
      addLog(`Impossible de valider le dossier de ${roommate.name}. Vérifiez les ressources requises !`, 'error');
    }
  };

  // Drag and Drop assignment logic
  const assignColoc = useCallback((colocId: string, postitId: string) => {
    const roommate = roommates.find((r) => r.id === colocId);
    if (!roommate || roommate.isSecured) return;

    // Check if roommate is already assigned somewhere else
    const previousPostitId = roommate.assignedPostitId;

    setPostits((prevPostits) => {
      // Find the target postit
      const target = prevPostits.find((p) => p.id === postitId);
      if (!target) return prevPostits;

      // Check capacity: Tableau XL allows 2 colocs, otherwise only 1
      const isXL = upgrades.find((u) => u.id === 'tableauXL')?.purchased;
      const capacity = isXL ? 2 : 1;

      if (target.assignedColocs.includes(colocId)) return prevPostits; // Already assigned here

      if (target.assignedColocs.length >= capacity) {
        // Slot is full! If capacity is 1, let's swap or kick the other out
        if (capacity === 1) {
          const kickedColocId = target.assignedColocs[0];
          // Kick the other coloc out
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
          // Cannot add, fully filled
          return prevPostits;
        }
      }

      // Safe to assign
      setRoommates((prevColocs) =>
        prevColocs.map((c) => {
          if (c.id === colocId) {
            return { ...c, assignedPostitId: postitId };
          }
          // If we kicked them from another postit
          if (previousPostitId && c.assignedPostitId === previousPostitId && c.id === colocId) {
            return { ...c, assignedPostitId: postitId };
          }
          return c;
        })
      );

      return prevPostits.map((p) => {
        // Remove from previous postit
        if (previousPostitId && p.id === previousPostitId) {
          return { ...p, assignedColocs: p.assignedColocs.filter((c) => c !== colocId) };
        }
        // Add to new postit
        if (p.id === postitId) {
          return { ...p, assignedColocs: [...p.assignedColocs, colocId] };
        }
        return p;
      });
    });
  }, [roommates, upgrades]);

  const unassignColoc = useCallback((colocId: string) => {
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
      setSolidarity((prev) => prev - upgrade.cost);
      setUpgrades((prev) =>
        prev.map((u) => (u.id === id ? { ...u, purchased: true } : u))
      );

      addLog(`Boutique : Achat de "${upgrade.name}" (${upgrade.icon}) effectué ! 🛒`, 'success');
      confetti({ particleCount: 30, spread: 40 });

      // Special one-time upgrades triggers
      if (id === 'avocatBenevole') {
        // Instantly add 5% to the State Timer
        setStateTimer((prev) => Math.min(2880, prev + Math.floor(2880 * 0.05)));
        addLog('L\'Avocat Bénévole a repoussé l\'échéance de l\'État ! (+2.4h de délai)', 'bonus');
      }
    } else {
      addLog(`Pas assez de Solidarité pour acheter "${upgrade.name}". Besoin de ${upgrade.cost} 💶.`, 'error');
    }
  };

  // Flying Balloons logic
  const clickBalloon = (id: string) => {
    const balloon = balloons.find((b) => b.id === id);
    if (!balloon) return;

    // Remove balloon
    setBalloons((prev) => prev.filter((b) => b.id !== id));

    // Calculate reward modifier
    const isDouble = balloon.isDoubleSpeed;
    if (isDouble) {
      // Give double speed boost for 10s
      setDoubleSpeedRemaining((prev) => prev + 10);
      addLog('🎈 Ballon éclaté ! Boost de Vitesse x2 pendant 10 secondes activé ! ⚡', 'bonus');
    } else {
      // Give 50 solidarity (+20% if caisseCommune is bought)
      const hasCaisse = upgrades.find((u) => u.id === 'caisseCommune')?.purchased;
      const amount = hasCaisse ? 60 : 50;
      setSolidarity((prev) => prev + amount);
      addLog(`🎈 Ballon éclaté ! +${amount} Solidarité gagnés ! 💰`, 'bonus');
    }
    
    // Play subtle sound / effect
    confetti({ particleCount: 15, colors: ['#f43f5e', '#38bdf8', '#fbbf24'] });
  };

  // Tick Core Engine: Runs every 1 second (1 real tick)
  useEffect(() => {
    if (victory || gameOver) return;

    const timer = setInterval(() => {
      const now = Date.now();

      // --- 1. Decrement state eviction timer ---
      // 1 real second = 1 simulated minute of game time (2880 seconds total)
      // Avocat Bénévole slows down decay by 15%
      const hasAvocat = upgrades.find((u) => u.id === 'avocatBenevole')?.purchased;
      const decayAmount = hasAvocat ? 0.85 : 1;
      
      setStateTimer((prev) => {
        const next = prev - decayAmount;
        if (next <= 0) {
          setGameOver(true);
          return 0;
        }
        return next;
      });

      // --- 2. Update double speed booster countdown ---
      setDoubleSpeedRemaining((prev) => Math.max(0, prev - 1));

      // --- 3. Process Active Post-its Progress & Timers ---
      setPostits((prevPostits) => {
        const unresolved: Postit[] = [];

        // We use a temp array to check completions
        for (const postit of prevPostits) {
          // Increment elapsed time (in seconds)
          const newElapsedTime = postit.elapsedTime + 1;
          
          // Determine Urgency Level
          // 0-3 min (0-180s) : Jaune
          // 3-6 min (180-360s) : Orange
          // +6 min (>360s) : Rouge
          let newUrgency = postit.urgency;
          let newColorClass = postit.colorClass;

          if (newElapsedTime > 360) {
            newUrgency = 'rouge';
            newColorClass = 'from-red-500/20 to-rose-600/20 border-rose-500/40 glow-red';
          } else if (newElapsedTime > 180) {
            newUrgency = 'orange';
            newColorClass = 'from-orange-400/20 to-amber-600/20 border-orange-500/40 glow-orange';
          } else {
            newUrgency = 'jaune';
            newColorClass = 'from-amber-400/20 to-yellow-500/20 border-yellow-500/40 glow-yellow';
          }

          // Compute processing progress:
          // Processing speed = Sum(Roommates skills for this resource)
          // If Happiness < 50%, reduce speed by 20%
          const speedPenalty = calculatedHappiness < 50 ? 0.8 : 1.0;
          const doubleSpeedMultiplier = doubleSpeedRemaining > 0 ? 2 : 1;

          let sumSkills = 0;
          postit.assignedColocs.forEach((colocId) => {
            const coloc = roommates.find((c) => c.id === colocId);
            if (coloc) {
              sumSkills += coloc.skills[postit.type];
            }
          });

          // Work target is 300 base, 270 if Fibre Optique
          const hasFibre = upgrades.find((u) => u.id === 'fibreOptique')?.purchased;
          const maxProgress = hasFibre ? 270 : 300;

          let nextProgress = postit.progress;
          if (sumSkills > 0) {
            nextProgress += sumSkills * speedPenalty * doubleSpeedMultiplier;
          }

          if (nextProgress >= maxProgress) {
            // Post-it is RESOLVED!
            
            // Calculate Solidarity gains (+50 base, +20% if Caisse Commune)
            const hasCaisse = upgrades.find((u) => u.id === 'caisseCommune')?.purchased;
            const solidarityGain = Math.round((hasCaisse ? 60 : 50));
            setSolidarity((s) => s + solidarityGain);

            // Add +1 or +2 to corresponding global resource level (depending on post-it difficulty/urgency)
            // Yellow resolution gives +1, Orange gives +1, Red gives +2 to recover!
            const resourceIncrease = postit.urgency === 'rouge' ? 2 : 1;
            setResources((res) => {
              const currentVal = res[postit.type];
              return {
                ...res,
                [postit.type]: Math.min(20, currentVal + resourceIncrease),
              };
            });

            // If it's a "Droits" ⚖️ post-it, it adds +60 minutes (1 simulated hour) to the State Timer!
            if (postit.type === 'droits') {
              setStateTimer((t) => Math.min(2880, t + 60));
              addLog(`⚖️ Droits résolus ! L'État recule d'une heure. (+60 mins au timer)`, 'success');
            }

            // Release roomates
            setRoommates((colocs) =>
              colocs.map((c) =>
                postit.assignedColocs.includes(c.id) ? { ...c, assignedPostitId: null } : c
              )
            );

            addLog(`Besoin résolu : "${postit.title}" ! +${solidarityGain} Solidarité 🤝`, 'success');
          } else {
            // Keep unresolved
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

      // --- 4. Apply resource penalties for Orange (-1) and Red (-2) post-its ---
      // Every 15 seconds, we apply penalties if post-its are orange/red
      if (Math.floor(now / 1000) % 15 === 0 && postits.length > 0) {
        setResources((prevResources) => {
          const nextResources = { ...prevResources };
          let penalized = false;

          postits.forEach((p) => {
            if (p.urgency === 'orange') {
              nextResources[p.type] = Math.max(0, nextResources[p.type] - 1);
              penalized = true;
            } else if (p.urgency === 'rouge') {
              nextResources[p.type] = Math.max(0, nextResources[p.type] - 2);
              penalized = true;
            }
          });

          if (penalized) {
            addLog(`⚠️ Des post-its non résolus affectent l'équilibre de la maison ! Jauges en baisse.`, 'warning');
          }
          return nextResources;
        });
      }

      // --- 5. Spawn logic ---
      // Base spawn rate: 45 seconds
      // Happiness impact:
      // Happiness < 75%: spawn every 30s
      // Happiness < 50%: spawn every 20s
      const currentSpawnDelay = calculatedHappiness < 50 ? 20 : calculatedHappiness < 75 ? 30 : 45;
      const currentSecs = Math.floor(now / 1000);
      if (lastSpawnRef.current === 0) {
        lastSpawnRef.current = currentSecs;
      }

      if (currentSecs - lastSpawnRef.current >= currentSpawnDelay) {
        spawnPostit();
        lastSpawnRef.current = currentSecs;
      }

      // --- 6. Balloon Spawner ---
      // Every 30 seconds a balloon emoji appears
      if (lastBalloonRef.current === 0) {
        lastBalloonRef.current = currentSecs;
      }
      if (currentSecs - lastBalloonRef.current >= 30) {
        const balloonId = `balloon-${now}`;
        const randomX = Math.floor(Math.random() * 70) + 15; // 15% to 85% width
        const isDoubleSpeed = Math.random() > 0.6; // 40% chance for x2 speed boost balloon
        
        setBalloons((prev) => [...prev, { id: balloonId, x: randomX, isDoubleSpeed }]);
        lastBalloonRef.current = currentSecs;

        // Auto remove balloon after 12s if not clicked (to prevent memory leaks)
        setTimeout(() => {
          setBalloons((prev) => prev.filter((b) => b.id !== balloonId));
        }, 12000);
      }

      // --- 7. Random News Feed Events ---
      // Trigger a news log every 40 seconds
      if (lastNewsRef.current === 0) {
        lastNewsRef.current = currentSecs;
      }
      if (currentSecs - lastNewsRef.current >= 40) {
        const randomNewsItem = RANDOM_NEWS[Math.floor(Math.random() * RANDOM_NEWS.length)];
        
        // Execute the news side-effects
        if (randomNewsItem.bonus === 'happiness') {
          // Add happiness via a temporary buffer if needed, but since it's calculated dynamically,
          // we can give Solidarity or Resource instead, or display a beautiful alert!
          setSolidarity((s) => s + 20);
        } else if (randomNewsItem.bonus === 'resource' && randomNewsItem.target) {
          setResources((res) => ({
            ...res,
            [randomNewsItem.target!]: Math.max(0, Math.min(20, res[randomNewsItem.target!] + randomNewsItem.value)),
          }));
        } else if (randomNewsItem.bonus === 'solidarity') {
          setSolidarity((s) => s + randomNewsItem.value);
        } else if (randomNewsItem.bonus === 'time') {
          setStateTimer((t) => Math.min(2880, t + randomNewsItem.value));
        }

        addLog(randomNewsItem.text, randomNewsItem.type);
        lastNewsRef.current = currentSecs;
      }

    }, 1000);

    return () => clearInterval(timer);
  }, [postits, roommates, upgrades, calculatedHappiness, doubleSpeedRemaining, victory, gameOver, spawnPostit, addLog]);

  return (
    <GameContext.Provider
      value={{
        roommates,
        postits,
        solidarity,
        resources,
        upgrades,
        stateTimer,
        logs,
        happiness: calculatedHappiness,
        balloons,
        doubleSpeedRemaining,
        victory,
        gameOver,
        spawnPostit,
        assignColoc,
        unassignColoc,
        buyUpgrade,
        secureRoommate,
        clickBalloon,
        addLog,
        resetGame,
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
