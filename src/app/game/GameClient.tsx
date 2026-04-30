'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Coins, Sword, Shield, Play, Settings, Menu, X, Skull,
    ChevronRight, ArrowUpRight, Clock, Star, Zap, Ticket,
    RefreshCw, Package, Database, Info, LogOut,
    TrendingUp, ShoppingCart, Trophy, ArrowRight, Lock, Sparkles
} from 'lucide-react';

import {
    RARITIES,
    Rarity,
    RARITY_CONFIG,
    WEAPON_POOL,
    ARMOR_POOL,
    FACILITIES,
    EQUIPMENT,
    TITLES
} from './gameData';

import { 
    getCurrentUser, 
    updateGameScore, 
    getGameRanking, 
    consumeDailyTicket, 
    deleteGameScore,
    saveGameData,
    getGameData
} from '@/lib/actions';

// --- Helper Functions ---

// Probability Table based on Gacha Level
const getGachaWeights = (level: number): Record<Rarity, number> => {
    const base = { ...RARITY_CONFIG };
    const weights = {} as Record<Rarity, number>;

    RARITIES.forEach((r, idx) => {
        const config = base[r];
        // As level increases, higher rarities get weight boosts
        const bonus = Math.pow(1.5, level - 1) * (idx > 4 ? idx - 4 : 0.1);
        weights[r] = config.baseWeight + bonus;
    });

    return weights;
};

interface GachaItem {
    id: string;
    name: string;
    type: 'weapon' | 'armor';
    rarity: Rarity;
    level: number;
    unlimit: number;
    atk: number;
    def: number;
    hp: number;
}

// --- Helper Functions ---

const formatNumber = (num: number) => {
    const floorNum = Math.floor(num);
    if (floorNum < 10000) return floorNum.toLocaleString('ja-JP') + ' 円';

    const units = [
        { value: 1e16, unit: '京' },
        { value: 1e12, unit: '兆' },
        { value: 1e8, unit: '億' },
        { value: 1e4, unit: '万' },
    ];

    for (const { value, unit } of units) {
        if (floorNum >= value) {
            const main = Math.floor(floorNum / value);
            const remainder = floorNum % value;
            if (remainder === 0) return main.toLocaleString('ja-JP') + ' ' + unit + ' 円';
            return (floorNum / value).toFixed(2) + ' ' + unit + ' 円';
        }
    }
    return floorNum.toLocaleString('ja-JP') + ' 円';
};

// HP / non-currency numbers (no 円 suffix)
const formatHP = (num: number) => {
    const floorNum = Math.floor(num);
    if (floorNum < 10000) return floorNum.toLocaleString('ja-JP');
    const units = [
        { value: 1e16, unit: '京' },
        { value: 1e12, unit: '兆' },
        { value: 1e8, unit: '億' },
        { value: 1e4, unit: '万' },
    ];
    for (const { value, unit } of units) {
        if (floorNum >= value) {
            const remainder = floorNum % value;
            if (remainder === 0) return Math.floor(floorNum / value).toLocaleString('ja-JP') + ' ' + unit;
            return (floorNum / value).toFixed(2) + ' ' + unit;
        }
    }
    return floorNum.toLocaleString('ja-JP');
};

export default function GameClient() {
    // --- Player State ---
    const [coins, setCoins] = useState(0);
    const [level, setLevel] = useState(1);
    const [exp, setExp] = useState(0);
    const [dungeonTranscendence, setDungeonTranscendence] = useState(0);
    const [productionTranscendence, setProductionTranscendence] = useState(0);
    const [stats, setStats] = useState({
        maxHp: 10,
        hp: 10,
        atk: 5,
        def: 5,
        luck: 5
    });

    const [clickPower, setClickPower] = useState(1);
    const [cps, setCps] = useState(0);
    const [facilityCounts, setFacilityCounts] = useState<Record<number, number>>({});
    const [equipmentUnlocked, setEquipmentUnlocked] = useState<Record<number, boolean>>({});

    // --- Dungeon State ---
    const [stage, setStage] = useState(1);
    const [enemyIndex, setEnemyIndex] = useState(1); // 1-20
    const [enemy, setEnemy] = useState({
        name: 'Hollow Vessel',
        hp: 10,
        maxHp: 10,
        atk: 2,
        def: 3,
        isBoss: false
    });

    const [isBossPending, setIsBossPending] = useState(false);
    const [bossChallenging, setBossChallenging] = useState(false);
    const [battleLogs, setBattleLogs] = useState<{ msg: string, type: 'player' | 'enemy' | 'system' }[]>([]);
    const [activeTab, setActiveTab] = useState<'facility' | 'equipment' | 'stats' | 'gacha' | 'inventory' | 'ranking'>('facility');
    const [inventory, setInventory] = useState<GachaItem[]>([]);
    const [elements, setElements] = useState({ weapon: 0, armor: 0 });
    const [gachaLevel, setGachaLevel] = useState(1);
    const [gachaExp, setGachaExp] = useState(0);
    const [gachaResult, setGachaResult] = useState<GachaItem | null>(null);
    const [equippedWeaponId, setEquippedWeaponId] = useState<string | null>(null);
    const [equippedArmorId, setEquippedArmorId] = useState<string | null>(null);
    const [showDebug, setShowDebug] = useState(false);
    const [isBossDefeated, setIsBossDefeated] = useState(false);
    const [showMobDefeatPopup, setShowMobDefeatPopup] = useState(false);
    const [currentUser, setCurrentUser] = useState<{ id: string, username: string, daily_tickets: number } | null>(null);
    const [ranking, setRanking] = useState<{ username: string, max_stage: number, transcendence_count: number }[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [showBossWarning, setShowBossWarning] = useState(false);
    const [autoSellThreshold, setAutoSellThreshold] = useState<Rarity | 'None'>('None');
    const [mobileTab, setMobileTab] = useState<'clicker' | 'dungeon' | 'upgrades'>('dungeon');
    const [isSyncing, setIsSyncing] = useState(false);

    // --- Derived State (Multipliers) ---
    const dungeonTransMult = 1 + dungeonTranscendence * 0.5;
    const prodTransMult = 1 + productionTranscendence * 0.5;

    const [equipPopup, setEquipPopup] = useState<{
        item: GachaItem;
        before: { atk: number; def: number; hp: number };
        after: { atk: number; def: number; hp: number };
    } | null>(null);

    // --- Data Persistence ---
    const SAVE_KEY = 'gbf_portal_game_save_v1';

    // Initialization: Load user and game data
    useEffect(() => {
        const initGame = async () => {
            // 1. Fetch User
            const user = await getCurrentUser();
            setCurrentUser(user);

            // 2. Determine source of save data
            let savedDataStr = localStorage.getItem(SAVE_KEY);
            
            if (user) {
                try {
                    const serverDataStr = await getGameData();
                    if (serverDataStr) {
                        // If server data exists, it takes precedence for cross-device sync
                        // (Alternatively, we could compare timestamps, but server is generally 'truth')
                        savedDataStr = serverDataStr;
                        console.log('Loaded save data from server.');
                    }
                } catch (e) {
                    console.error('Failed to load save data from server', e);
                }
            }

            // 3. Apply save data
            if (savedDataStr) {
                try {
                    const data = JSON.parse(savedDataStr);
                    if (data.coins !== undefined) setCoins(data.coins);
                    if (data.level !== undefined) setLevel(data.level);
                    if (data.exp !== undefined) setExp(data.exp);
                    if (data.dungeonTranscendence !== undefined) setDungeonTranscendence(data.dungeonTranscendence);
                    if (data.productionTranscendence !== undefined) setProductionTranscendence(data.productionTranscendence);
                    if (data.transcendence !== undefined && data.dungeonTranscendence === undefined) {
                        setDungeonTranscendence(data.transcendence);
                    }
                    if (data.stats !== undefined) setStats(data.stats);
                    if (data.facilityCounts !== undefined) setFacilityCounts(data.facilityCounts);
                    if (data.equipmentUnlocked !== undefined) setEquipmentUnlocked(data.equipmentUnlocked);
                    if (data.stage !== undefined) setStage(data.stage);
                    if (data.enemyIndex !== undefined) setEnemyIndex(data.enemyIndex);
                    if (data.inventory !== undefined) setInventory(data.inventory);
                    if (data.elements !== undefined) setElements(data.elements);
                    if (data.gachaLevel !== undefined) setGachaLevel(data.gachaLevel);
                    if (data.gachaExp !== undefined) setGachaExp(data.gachaExp);
                    if (data.equippedWeaponId !== undefined) setEquippedWeaponId(data.equippedWeaponId);
                    if (data.equippedArmorId !== undefined) setEquippedArmorId(data.equippedArmorId);
                    if (data.isBossPending !== undefined) setIsBossPending(data.isBossPending);
                    if (data.showBossWarning !== undefined) setShowBossWarning(data.showBossWarning);
                    if (data.autoSellThreshold !== undefined) setAutoSellThreshold(data.autoSellThreshold);

                    // Calculate Offline Earnings
                    if (data.lastSaveTime) {
                        const elapsedSeconds = Math.floor((Date.now() - data.lastSaveTime) / 1000);
                        if (elapsedSeconds > 60) {
                            let savedCps = 0;
                            if (data.facilityCounts) {
                                FACILITIES.forEach(f => {
                                    const count = data.facilityCounts[f.id] || 0;
                                    savedCps += f.baseCps * count;
                                });
                            }
                            const prodTransMult = 1 + (data.productionTranscendence || 0) * 0.5;
                            const offlineEarnings = Math.floor(elapsedSeconds * (savedCps / 2) * prodTransMult);

                            if (offlineEarnings > 0) {
                                setCoins(prev => (data.coins || 0) + offlineEarnings);
                                setTimeout(() => {
                                    addLog(`おかえりなさい！不在の間に ${formatNumber(offlineEarnings)} を獲得しました。（経過: ${Math.floor(elapsedSeconds / 60)} 分）`, 'system');
                                }, 1000);
                            }
                        }
                    }
                    addLog('セーブデータを読み込みました。', 'system');
                } catch (e) {
                    console.error('Failed to parse save data', e);
                }
            }
            setIsLoaded(true);
        };

        initGame();
    }, []);

    // Save data whenever relevant state changes
    useEffect(() => {
        if (!isLoaded) return;

        const dataToSave = {
            coins, level, exp, dungeonTranscendence, productionTranscendence, stats,
            facilityCounts, equipmentUnlocked, stage,
            enemyIndex, inventory, elements,
            gachaLevel, gachaExp,
            equippedWeaponId, equippedArmorId,
            isBossPending, showBossWarning, autoSellThreshold,
            lastSaveTime: Date.now()
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(dataToSave));
    }, [
        isLoaded, coins, level, exp, dungeonTranscendence, productionTranscendence, stats,
        facilityCounts, equipmentUnlocked, stage,
        enemyIndex, inventory, elements,
        gachaLevel, gachaExp,
        equippedWeaponId, equippedArmorId,
        isBossPending, showBossWarning, autoSellThreshold
    ]);

    // Sync ranking data and game save to server (Debounced and Periodic)
    useEffect(() => {
        if (!isLoaded || !currentUser) return;
        
        const syncToServer = async () => {
            try {
                // 1. Sync Score (Ranking)
                await updateGameScore(stage, dungeonTranscendence);

                // 2. Sync Full Save Data
                const dataToSave = {
                    coins, level, exp, dungeonTranscendence, productionTranscendence, stats,
                    facilityCounts, equipmentUnlocked, stage,
                    enemyIndex, inventory, elements,
                    gachaLevel, gachaExp,
                    equippedWeaponId, equippedArmorId,
                    isBossPending, showBossWarning, autoSellThreshold,
                    lastSaveTime: Date.now()
                };
                await saveGameData(JSON.stringify(dataToSave));
                
                console.log('Synced game data to server.');
            } catch (e) {
                console.error("Failed to sync to server", e);
            }
        };

        // Trigger sync on important changes, but debounce it
        // Note: 'coins' and 'exp' are intentionally excluded from the dependency array 
        // to prevent the timer from being reset every second by idle income.
        const timer = setTimeout(syncToServer, 10000); // 10 second debounce
        return () => clearTimeout(timer);
    }, [
        isLoaded, currentUser, stage, dungeonTranscendence, level, productionTranscendence, stats,
        facilityCounts, equipmentUnlocked, enemyIndex, inventory, elements,
        gachaLevel, gachaExp, equippedWeaponId, equippedArmorId,
        isBossPending, showBossWarning, autoSellThreshold
    ]);

    // Periodic Sync (Every 60 seconds) to ensure coins/exp are eventually saved
    useEffect(() => {
        if (!isLoaded || !currentUser) return;

        const interval = setInterval(async () => {
            const dataToSave = {
                coins, level, exp, dungeonTranscendence, productionTranscendence, stats,
                facilityCounts, equipmentUnlocked, stage,
                enemyIndex, inventory, elements,
                gachaLevel, gachaExp,
                equippedWeaponId, equippedArmorId,
                isBossPending, showBossWarning, autoSellThreshold,
                lastSaveTime: Date.now()
            };
            await saveGameData(JSON.stringify(dataToSave));
            console.log('Periodic sync to server completed.');
        }, 60000);

        return () => clearInterval(interval);
    }, [
        isLoaded, currentUser, coins, level, exp, stage, dungeonTranscendence, productionTranscendence, stats,
        facilityCounts, equipmentUnlocked, enemyIndex, inventory, elements,
        gachaLevel, gachaExp, equippedWeaponId, equippedArmorId,
        isBossPending, showBossWarning, autoSellThreshold
    ]);

    // Fetch ranking data separately when tab is active
    const fetchRanking = async () => {
        const data = await getGameRanking();
        setRanking(data as any);
    };

    useEffect(() => {
        if (activeTab === 'stats') {
            fetchRanking();
        }
    }, [activeTab]);

    // --- Helper Logic ---
    const getNextExp = (lv: number) => Math.floor(100 * Math.pow(lv, 2.5));
    const getGachaLevelUpExp = (lv: number) => Math.floor(1000 * Math.pow(lv, 1.5));

    const equippedWeapon = inventory.find(i => i.id === equippedWeaponId);
    const equippedArmor = inventory.find(i => i.id === equippedArmorId);

    // Calculate Bonus Stats from Equipped Items
    const getGachaBonuses = useCallback(() => {
        const weapon = inventory.find(i => i.id === equippedWeaponId);
        const summon = inventory.find(i => i.id === equippedArmorId);

        const calc = (item: GachaItem | undefined, stat: 'atk' | 'def' | 'hp') => {
            if (!item) return 0;
            const base = item[stat] || 0;
            return base + Math.floor(base * (item.level - 1) * 0.1);
        };

        return {
            atk: calc(weapon, 'atk') + calc(summon, 'atk'),
            def: calc(weapon, 'def') + calc(summon, 'def'),
            hp: calc(weapon, 'hp') + calc(summon, 'hp')
        };
    }, [inventory, equippedWeaponId, equippedArmorId]);

    const handleEquip = (id: string) => {
        const item = inventory.find(i => i.id === id);
        if (!item) return;

        // Calculate before stats
        const beforeBonuses = getGachaBonuses();
        const beforeAtk = Math.floor((stats.atk + beforeBonuses.atk) * dungeonTransMult);
        const beforeDef = Math.floor((stats.def + beforeBonuses.def) * dungeonTransMult);
        const beforeHp = Math.floor((stats.maxHp + beforeBonuses.hp) * dungeonTransMult);

        // Apply equip
        if (item.type === 'weapon') setEquippedWeaponId(id);
        else setEquippedArmorId(id);

        // Calculate after stats (simulate the new bonuses)
        const calcStat = (it: GachaItem | undefined, stat: 'atk' | 'def' | 'hp') => {
            if (!it) return 0;
            const base = it[stat] || 0;
            return base + Math.floor(base * (it.level - 1) * 0.1);
        };
        const newWeapon = item.type === 'weapon' ? item : inventory.find(i => i.id === equippedWeaponId);
        const newArmor = item.type === 'armor' ? item : inventory.find(i => i.id === equippedArmorId);
        const afterBonuses = {
            atk: calcStat(newWeapon, 'atk') + calcStat(newArmor, 'atk'),
            def: calcStat(newWeapon, 'def') + calcStat(newArmor, 'def'),
            hp: calcStat(newWeapon, 'hp') + calcStat(newArmor, 'hp'),
        };
        const afterAtk = Math.floor((stats.atk + afterBonuses.atk) * dungeonTransMult);
        const afterDef = Math.floor((stats.def + afterBonuses.def) * dungeonTransMult);
        const afterHp = Math.floor((stats.maxHp + afterBonuses.hp) * dungeonTransMult);

        setEquipPopup({
            item,
            before: { atk: beforeAtk, def: beforeDef, hp: beforeHp },
            after: { atk: afterAtk, def: afterDef, hp: afterHp },
        });
        addLog(`${item.name} を装備しました。`, 'system');
    };

    // Weighted Gacha Pull
    const handleUseTicket = async () => {
        if (!currentUser || currentUser.daily_tickets <= 0) return;

        const res = await consumeDailyTicket();
        if (res.success) {
            setCurrentUser(prev => prev ? { ...prev, daily_tickets: prev.daily_tickets - 1 } : null);

            const rand = Math.random() * 100;
            let rarity: Rarity = 'N';
            if (rand < 1) rarity = 'HR';
            else if (rand < 5) rarity = 'R';
            else if (rand < 40) rarity = 'UC';
            else rarity = 'N';

            const type = Math.random() > 0.5 ? 'weapon' : 'armor';
            const pool = type === 'weapon' ? WEAPON_POOL[rarity] : ARMOR_POOL[rarity];
            const name = pool[Math.floor(Math.random() * pool.length)];

            const newItem: GachaItem = {
                id: Math.random().toString(36).substr(2, 9),
                name,
                type,
                rarity,
                level: 1,
                unlimit: 0,
                atk: type === 'weapon' ? (RARITIES.indexOf(rarity) + 1) * 2 : 0,
                def: type === 'armor' ? (RARITIES.indexOf(rarity) + 1) * 2 : 0,
                hp: (RARITIES.indexOf(rarity) + 1) * 5
            };

            setInventory(prev => [...prev, newItem]);
            setGachaResult(newItem);
            addLog(`【チケット】日課チケットを使用して ${newItem.name} (${rarity}) を入手しました！`, 'system');
        }
    };

    const handleGacha = () => {
        const COST = 500 * gachaLevel; // Scaling cost
        if (coins < COST) return;
        setCoins(prev => prev - COST);

        const weights = getGachaWeights(gachaLevel);
        const totalWeight = Object.values(weights).reduce((acc, w) => acc + w, 0);

        let rand = Math.random() * totalWeight;
        let selectedRarity: Rarity = 'N';

        for (const r of RARITIES) {
            const w = weights[r];
            if (rand < w) {
                selectedRarity = r;
                break;
            }
            rand -= w;
        }

        const type = Math.random() > 0.5 ? 'weapon' : 'armor';
        const namePool = type === 'weapon' ? WEAPON_POOL[selectedRarity] : ARMOR_POOL[selectedRarity];
        const name = namePool[Math.floor(Math.random() * namePool.length)];

        // Base Stat Calculation with Variance
        const rarityIdx = RARITIES.indexOf(selectedRarity) + 1;
        const basePower = rarityIdx * 10 * Math.pow(1.2, gachaLevel - 1);

        // Specialize stats: Weapons = ATK focus, Armor = DEF focus
        // Also add 0.8x to 1.2x variance
        const getVariance = () => 0.8 + Math.random() * 0.4;

        let finalAtk = Math.floor(basePower * getVariance());
        let finalDef = Math.floor(basePower * getVariance());
        let finalHp = Math.floor(basePower * getVariance() * 2);

        if (type === 'weapon') {
            finalAtk = Math.floor(finalAtk * 1.5);
            finalDef = Math.floor(finalDef * 0.5);
            finalHp = Math.floor(finalHp * 0.8);
        } else {
            finalAtk = Math.floor(finalAtk * 0.5);
            finalDef = Math.floor(finalDef * 1.5);
            finalHp = Math.floor(finalHp * 2.0);
        }

        const newItem: GachaItem = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            type,
            rarity: selectedRarity,
            level: 1,
            unlimit: 0,
            atk: finalAtk,
            def: finalDef,
            hp: finalHp
        };

        // Auto-sell logic
        const thresholdIdx = autoSellThreshold === 'None' ? -1 : RARITIES.indexOf(autoSellThreshold);
        const currentIdx = RARITIES.indexOf(selectedRarity);

        if (currentIdx <= thresholdIdx) {
            const reward = (currentIdx + 1) * 5;
            setElements(prev => ({
                ...prev,
                [type]: prev[type] + reward
            }));
            addLog(`[自動売却] ${newItem.name} (${selectedRarity}) を売却し素材 ${reward} 個を獲得しました。`, 'system');
        } else {
            setInventory(prev => [...prev, newItem]);
            if (type === 'weapon' && !equippedWeaponId) setEquippedWeaponId(newItem.id);
            if (type === 'armor' && !equippedArmorId) setEquippedArmorId(newItem.id);
        }

        setGachaResult(newItem);

        setGachaExp(prev => {
            const next = prev + 10;
            if (next >= getGachaLevelUpExp(gachaLevel)) {
                setGachaLevel(l => l + 1);
                addLog(`ガチャレベルが ${gachaLevel + 1} に上がった！`, 'system');
                return 0;
            }
            return next;
        });
    };

    const buyGachaLevel = () => {
        const cost = Math.floor(1000 * Math.pow(3, gachaLevel - 1)); // Increased scaling factor
        if (coins < cost) return;
        setCoins(prev => prev - cost);
        setGachaLevel(prev => prev + 1);
        setGachaExp(0);
        addLog(`ガチャレベルを ${gachaLevel + 1} にアップグレードしました！`, 'system');
    };

    const handleManualSave = async () => {
        if (!currentUser) return;
        
        setIsSyncing(true);
        try {
            const dataToSave = {
                coins, level, exp, dungeonTranscendence, productionTranscendence, stats,
                facilityCounts, equipmentUnlocked, stage,
                enemyIndex, inventory, elements,
                gachaLevel, gachaExp,
                equippedWeaponId, equippedArmorId,
                isBossPending, showBossWarning, autoSellThreshold,
                lastSaveTime: Date.now()
            };
            const res = await saveGameData(JSON.stringify(dataToSave));
            if (res.success) {
                addLog('クラウド保存が完了しました。', 'system');
            }
        } catch (e) {
            console.error("Manual save failed", e);
        } finally {
            setIsSyncing(false);
        }
    };

    const resetGameData = async () => {
        if (confirm('全てのゲームデータを削除して最初からやり直しますか？ランキングの記録も削除されます。\nこの操作は取り消せません。')) {
            setIsLoaded(false);
            localStorage.removeItem(SAVE_KEY);
            // Delete ranking data from server as well
            try {
                await deleteGameScore();
            } catch (e) {
                console.error("Failed to delete ranking data", e);
            }
            window.location.reload();
        }
    };

    const handleSellItem = (id: string) => {
        const item = inventory.find(i => i.id === id);
        if (!item) return;
        const reward = (RARITIES.indexOf(item.rarity) + 1) * 5;
        setElements(prev => ({
            ...prev,
            [item.type]: prev[item.type] + reward
        }));
        if (id === equippedWeaponId) setEquippedWeaponId(null);
        if (id === equippedArmorId) setEquippedArmorId(null);
        setInventory(prev => prev.filter(i => i.id !== id));
    };

    const handleLevelUp = (id: string) => {
        const item = inventory.find(i => i.id === id);
        if (!item) return;
        const config = RARITY_CONFIG[item.rarity];
        if (item.level >= config.maxLevel) return;

        const cost = Math.floor((RARITIES.indexOf(item.rarity) + 1) * 10 * Math.pow(1.2, item.level));
        if (elements[item.type] < cost) return;

        setElements(prev => ({ ...prev, [item.type]: prev[item.type] - cost }));
        setInventory(prev => prev.map(i => i.id === id ? { ...i, level: i.level + 1 } : i));
    };

    const handleMaxLevelUp = (id: string) => {
        const item = inventory.find(i => i.id === id);
        if (!item) return;
        const config = RARITY_CONFIG[item.rarity];
        if (item.level >= config.maxLevel) return;

        let currentLevel = item.level;
        let totalCost = 0;
        let levelsToAdd = 0;

        while (currentLevel + levelsToAdd < config.maxLevel) {
            const cost = Math.floor((RARITIES.indexOf(item.rarity) + 1) * 10 * Math.pow(1.2, currentLevel + levelsToAdd));
            if (elements[item.type] >= totalCost + cost) {
                totalCost += cost;
                levelsToAdd++;
            } else {
                break;
            }
        }

        if (levelsToAdd > 0) {
            setElements(prev => ({ ...prev, [item.type]: prev[item.type] - totalCost }));
            setInventory(prev => prev.map(i => i.id === id ? { ...i, level: i.level + levelsToAdd } : i));
            addLog(`${item.name} を一括強化 (${levelsToAdd} Lv UP!)`, 'system');
        }
    };

    const handleUnlimit = (id: string) => {
        const item = inventory.find(i => i.id === id);
        if (!item) return;
        const config = RARITY_CONFIG[item.rarity];
        if (item.level < config.maxLevel) return;

        const cost = 100 * (item.unlimit + 1);
        if (elements[item.type] < cost) return;

        setElements(prev => ({ ...prev, [item.type]: prev[item.type] - cost }));
        setInventory(prev => prev.map(i => i.id === id ? {
            ...i,
            level: 1,
            unlimit: i.unlimit + 1,
            atk: i.atk + 20,
            def: i.def + 20
        } : i));
    };

    const bonuses = getGachaBonuses();
    const totalAtk = Math.floor((stats.atk + bonuses.atk) * dungeonTransMult);
    const totalDef = Math.floor((stats.def + bonuses.def) * dungeonTransMult);
    const totalMaxHp = Math.floor((stats.maxHp + bonuses.hp) * dungeonTransMult);

    const generateEnemy = useCallback((s: number, idx: number, challengeBoss: boolean = false) => {
        const isBoss = idx >= 20 && challengeBoss;
        const section = Math.floor((s - 1) / 10);
        const stageInSection = (s - 1) % 10;

        // Base Stat Calculation
        let baseHp = 10;
        let baseAtk = 2;
        let baseDef = 3;

        // Section Multiplier
        const sectionMult = Math.pow(2.5, section);
        // Stage Multiplier
        const stageMult = Math.pow(1.7, stageInSection);

        let finalHp = baseHp * sectionMult * stageMult;
        let finalAtk = baseAtk * sectionMult * stageMult;
        let finalDef = baseDef * sectionMult * stageMult;

        if (isBoss) {
            finalHp *= 3;
            finalAtk *= 3;
            finalDef *= 3;
        } else if (idx >= 20) {
            // Normal enemy at index 20+ (after retreat) is slightly stronger than index 19
            // But stats remain constant even if index increases further
            finalHp *= 1.2;
            finalAtk *= 1.1;
        }

        return {
            name: isBoss ? `第 ${s} 層的守護者` : `彷徨う魂 ${s}-${idx}`,
            hp: Math.floor(finalHp),
            maxHp: Math.floor(finalHp),
            atk: Math.floor(finalAtk),
            def: Math.floor(finalDef),
            isBoss
        };
    }, []);

    // --- Effects ---

    // Initial Enemy Load — only regenerate on stage/enemyIndex change (NOT bossChallenging)
    // Boss challenge is handled explicitly in handleBossChallenge via setEnemy
    useEffect(() => {
        if (!bossChallenging) {
            setEnemy(generateEnemy(stage, enemyIndex, false));
        }
    }, [stage, enemyIndex, generateEnemy]);

    // Level Up Check
    useEffect(() => {
        const nextExp = getNextExp(level);
        if (exp >= nextExp && level < 100) {
            setLevel(prev => prev + 1);
            setExp(prev => prev - nextExp);

            // Stats Gain: 1-3
            const gain = () => Math.floor(Math.random() * 3) + 1;
            setStats(prev => ({
                maxHp: prev.maxHp + gain() * 5,
                hp: prev.maxHp + gain() * 5, // Heal to full on level up
                atk: prev.atk + gain(),
                def: prev.def + gain(),
                luck: prev.luck + gain()
            }));
            addLog(`LEVEL UP! Now Level ${level + 1}`, 'system');
        }
    }, [exp, level]);

    const addLog = (msg: string, type: 'player' | 'enemy' | 'system') => {
        setBattleLogs(prev => [{ msg, type }, ...prev].slice(0, 10)); // Increased log history
    };

    // --- Idle Production Logic ---

    // Calculate Click Power
    useEffect(() => {
        let maxMult = 1;
        EQUIPMENT.forEach(e => {
            if (equipmentUnlocked[e.id]) {
                maxMult = Math.max(maxMult, e.multiplier);
            }
        });
        setClickPower(maxMult);
    }, [equipmentUnlocked]);

    // Calculate CPS
    useEffect(() => {
        let totalCps = 0;
        FACILITIES.forEach(f => {
            const count = facilityCounts[f.id] || 0;
            totalCps += f.baseCps * count;
        });

        // Apply equipment multipliers if any (currently clickPower is used for manual, let's keep it simple for now or add CPS multipliers)
        setCps(totalCps);
    }, [facilityCounts]);

    // Add coins from CPS every second
    useEffect(() => {
        const timer = setInterval(() => {
            if (cps > 0) {
                // Apply production transcendence multiplier to CPS
                setCoins(prev => prev + (cps * prodTransMult));
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [cps, prodTransMult]);

    // Battle Loop (1s)
    useEffect(() => {
        const timer = setInterval(() => {
            if (isBossPending && !bossChallenging && showBossWarning) return;
            if (enemy.hp <= 0) return;
            if (stats.hp <= 0) return;

            const randRange = () => (Math.floor(Math.random() * 5) + 8) / 10; // 0.8 to 1.2

            // Player Attacks using totalAtk
            const pDamage = Math.max(1, Math.floor(totalAtk * randRange() - enemy.def * randRange()));

            setEnemy(prev => {
                const nextHp = Math.max(0, prev.hp - pDamage);
                return { ...prev, hp: nextHp };
            });
            addLog(`${pDamage} のダメージを与えた。`, 'player');

            // Enemy Counter
            setTimeout(() => {
                if (enemy.hp > pDamage) {
                    const eDamage = Math.max(1, Math.floor(enemy.atk * randRange() - totalDef * randRange()));
                    setStats(s => {
                        const nextHp = Math.max(0, s.hp - eDamage);
                        if (nextHp === 0 && s.hp > 0) {
                            setTimeout(handlePlayerDefeat, 10);
                        }
                        return { ...s, hp: nextHp };
                    });
                    addLog(`${enemy.name} から ${eDamage} のダメージを受けた！`, 'enemy');
                }
            }, 500);

        }, 1000);
        return () => clearInterval(timer);
    }, [enemy, stats, totalAtk, totalDef, bossChallenging, isBossPending, isBossDefeated, showBossWarning]);

    // Handle Enemy Death (Decoupled from Battle Loop)
    useEffect(() => {
        if (enemy.hp <= 0 && !isBossDefeated) {
            handleEnemyDefeat(enemy.isBoss);
        }
    }, [enemy.hp]);

    const handleEnemyDefeat = (isBoss: boolean) => {
        const rewardExp = isBoss ? stage * 500 : stage * 25;

        setExp(prev => prev + rewardExp);
        addLog(`${enemy.name} を討伐！ +${rewardExp} exp.`, 'system');

        // Auto-heal on victory
        setStats(prev => ({ ...prev, hp: totalMaxHp }));

        if (isBoss) {
            addLog(`【第 ${stage} 層 クリア！】`, 'system');
            setStage(prev => prev + 1);
            setEnemyIndex(1);
            setIsBossPending(false);
            setBossChallenging(false);
            setShowBossWarning(false);
        } else {
            if (enemyIndex >= 19 && !isBossPending) {
                setIsBossPending(true);
                setShowBossWarning(true);
                addLog(`第 ${stage} 層の守護者が出現しました。`, 'system');
            }
            setEnemyIndex(prev => prev + 1);
        }
    };

    const handlePlayerDefeat = () => {
        setStats(prev => ({ ...prev, hp: totalMaxHp }));

        if (enemy.isBoss) {
            setIsBossDefeated(true);
            setBossChallenging(false);
            addLog(`ボスに敗北... 戦略を立て直しましょう。`, 'system');
        } else {
            setShowMobDefeatPopup(true);
            setTimeout(() => setShowMobDefeatPopup(false), 2000);
            // Reset current enemy HP to full and retry immediately
            setEnemy(prev => ({ ...prev, hp: prev.maxHp }));
            addLog(`敗北しましたが、その場で再戦します。`, 'system');
        }
    };

    const handleDefeatChoice = (choice: 'retry' | 'retreat') => {
        setIsBossDefeated(false);
        if (choice === 'retry') {
            handleBossChallenge();
        } else {
            // Keep isBossPending true so the player retains the right to challenge the boss
            setBossChallenging(false);
            setShowBossWarning(false);
            // Reset enemy to a normal monster so combat continues
            setEnemy(generateEnemy(stage, enemyIndex, false));
            addLog(`フィールドに戻り修行を開始します。ボスへの挑戦権は保持されています。`, 'system');
        }
    };

    const handleBossChallenge = () => {
        // Reset enemy to boss immediately to ensure HP is full
        const boss = generateEnemy(stage, 20, true);
        setEnemy(boss);
        setBossChallenging(true);
        addLog(`エリアボス「${boss.name}」が出現！`, 'system');
    };

    const handleBossRetreat = () => {
        // Keep isBossPending true — the player retains the right to challenge the boss
        setBossChallenging(false);
        setShowBossWarning(false);
        // Reset enemy to a normal monster so combat continues
        setEnemy(generateEnemy(stage, enemyIndex, false));
        addLog(`守護者への挑戦を保留しました。フィールドで修行を続けます。`, 'system');
    };

    const handleManualClick = () => {
        setCoins(prev => prev + (clickPower * prodTransMult));
    };

    const resetCombatProgress = () => {
        setLevel(1);
        setExp(0);
        setStage(1);
        setEnemyIndex(1);
        setEquipmentUnlocked({});
        setStats({
            maxHp: 10,
            hp: 10,
            atk: 5,
            def: 5,
            luck: 5
        });
        setIsBossPending(false);
        setBossChallenging(false);
        setBattleLogs([]);
    };

    const resetProductionProgress = () => {
        setCoins(0);
        setFacilityCounts({});
    };

    const handleDungeonTranscendence = () => {
        if (level < 100) return;
        if (!confirm('【ダンジョン転生】を実行しますか？\nレベル、装備、ダンジョン進行度がリセットされますが、戦闘能力にボーナスを得られます。\n（所持金と施設は維持されます）')) return;

        setDungeonTranscendence(prev => prev + 1);
        resetCombatProgress();
        addLog(`【ダンジョン転生】第 ${dungeonTranscendence + 1} の人生が始まりました。`, 'system');
    };

    const handleProductionTranscendence = () => {
        if (coins < 200000000) return;
        if (!confirm('【生産転生チケット】を使用しますか？\n所持金、施設がリセットされますが、生産能力（CPS、クリック）にボーナスを得られます。\n（レベルと装備は維持されます）')) return;

        setProductionTranscendence(prev => prev + 1);
        resetProductionProgress();
        addLog(`【生産転生】第 ${productionTranscendence + 1} の人生が始まりました。`, 'system');
    };

    const buyFacility = (id: number) => {
        const f = FACILITIES.find(f => f.id === id)!;
        const count = facilityCounts[id] || 0;
        const price = f.basePrice * Math.pow(1.15, count);

        if (coins >= price) {
            setCoins(prev => prev - price);
            setFacilityCounts(prev => ({ ...prev, [id]: count + 1 }));
        }
    };

    const buyEquipment = (id: number) => {
        const e = EQUIPMENT.find(e => e.id === id)!;
        if (coins >= e.basePrice && !equipmentUnlocked[id]) {
            setCoins(prev => prev - e.basePrice);
            setEquipmentUnlocked(prev => ({ ...prev, [id]: true }));
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/20 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 min-h-screen lg:h-screen lg:overflow-hidden pb-16 lg:pb-0">
                {/* --- LEFT COLUMN: RESOURCES (Sidebar) --- */}
                <div className={`lg:col-span-3 border-b lg:border-b-0 lg:border-r border-slate-800/50 bg-slate-950/40 backdrop-blur-xl p-3 flex-col items-center justify-between lg:h-full lg:overflow-y-auto custom-scrollbar ${mobileTab === 'clicker' ? 'flex' : 'hidden lg:flex'}`}>
                    <div className="w-full space-y-3">
                        <header
                            className="p-4 border-b border-slate-900 flex flex-col gap-3 relative overflow-hidden bg-slate-900/20 backdrop-blur-sm cursor-pointer select-none"
                            onClick={() => currentUser?.username === 'debug' && setShowDebug(prev => !prev)}
                        >
                            <div className="flex justify-between items-center">
                                <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">資源管理センター</h2>
                                <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-bold rounded-md uppercase tracking-widest">Active</span>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Current Title</p>
                                <p className="text-xl font-black text-white italic tracking-tighter truncate">
                                    {[...TITLES].reverse().find(t => dungeonTranscendence >= t.threshold)?.name || '未知の旅人'}
                                    {dungeonTranscendence > 10 && <span className="ml-2 text-xs text-blue-400 not-italic">+{dungeonTranscendence - 10}</span>}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-800/50">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Level</p>
                                    <p className="text-lg font-black text-white italic leading-none">Lv.{level}</p>
                                </div>
                                <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-800/50">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Transcend</p>
                                    <p className="text-lg font-black text-blue-500 italic leading-none">{dungeonTranscendence}</p>
                                </div>
                            </div>
                        </header>

                        {/* Main Stats Card */}
                        <div className="p-4 space-y-4">
                            <div className="bg-slate-900/50 rounded-3xl p-5 border border-slate-800 shadow-2xl space-y-4 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Coins size={60} />
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">現在の所持金</span>
                                    <div className="flex items-center gap-2">
                                        <Coins className="text-yellow-500" size={20} />
                                        <span className="text-3xl font-black text-white tabular-nums">{formatNumber(coins)}</span>
                                    </div>
                                </div>
                                <div className="pt-3 border-t border-slate-800/50 flex justify-between items-end">
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">自動生産</span>
                                        <div className="flex items-center gap-2 text-emerald-400">
                                            <TrendingUp size={14} />
                                            <span className="text-lg font-bold">{formatNumber(cps)} <span className="text-[10px]">/秒</span></span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="relative flex flex-col items-center gap-6 py-6">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleManualClick}
                            className="relative w-36 h-36 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-[0_0_50px_-12px_rgba(245,158,11,0.5)] flex items-center justify-center group"
                        >
                            <div className="absolute inset-0 rounded-full border-4 border-white/10 group-hover:border-white/20 transition-colors" />
                            <div className="absolute inset-2 rounded-full border border-white/5 animate-spin-slow" />
                            <Coins size={48} className="text-white group-hover:rotate-12 transition-transform duration-300" />
                        </motion.button>
                        <div className="text-center space-y-0.5">
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">手動生産力</p>
                            <p className="text-xl font-black text-white">+{formatNumber(Math.floor(clickPower * prodTransMult))}</p>
                            <p className="text-[9px] text-amber-600/60 font-bold">1クリックあたり</p>
                        </div>
                    </div>
                </div>

                {/* --- CENTER COLUMN: DUNGEON --- */}
                <div className={`lg:col-span-5 flex-col relative overflow-hidden bg-gradient-to-b from-slate-950 to-[#0c1222] min-h-[500px] lg:h-full ${mobileTab === 'dungeon' ? 'flex' : 'hidden lg:flex'}`}>
                    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

                    <header className="p-4 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl border transition-colors ${enemy.isBoss ? 'bg-red-500/20 border-red-500/30 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-blue-500/20 border-blue-500/30 text-blue-500'}`}>
                                {enemy.isBoss ? <Skull size={20} /> : <Play size={20} />}
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white tracking-tight">ステージ {stage}</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">討伐数: {enemyIndex}{enemyIndex < 20 ? '/20' : ''}</p>
                            </div>
                        </div>

                        {level >= 100 && (
                            <motion.button
                                onClick={handleDungeonTranscendence}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{
                                    scale: [1, 1.05, 1],
                                    opacity: 1
                                }}
                                transition={{
                                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                                }}
                                className="absolute left-1/2 -translate-x-1/2 px-8 py-3 rounded-2xl font-black text-[12px] text-white uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(37,99,235,0.4)] border border-blue-400/30 z-20 whitespace-nowrap bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 bg-[length:200%_auto] animate-gradient-x"
                            >
                                <div className="flex items-center gap-2">
                                    <Zap size={16} className="text-blue-200 fill-blue-200/20" />
                                    <span>ダンジョン転生</span>
                                </div>
                            </motion.button>
                        )}

                        {isBossPending && !bossChallenging && (
                            <motion.button
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                onClick={handleBossChallenge}
                                className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-900/40 animate-bounce"
                            >
                                ボスに挑戦する
                            </motion.button>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => window.dispatchEvent(new Event('openGameMenu'))}
                            className="lg:hidden p-2 bg-slate-800/80 backdrop-blur-md text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl border border-slate-700/50 shadow-md transition-colors"
                            aria-label="メニューを開く"
                        >
                            <Menu size={20} />
                        </button>
                    </header>

                    {/* Player Dashboard (Moved from sidebar) */}
                    <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/50 relative z-20">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Stats & Progress */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest leading-none mb-1.5">Player Vitality</span>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-black text-white italic tracking-tighter tabular-nums leading-none drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">{formatHP(stats.hp)}</span>
                                            <span className="text-xs font-bold text-slate-500 tracking-tight leading-none">/ {formatHP(totalMaxHp)}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        <div className="flex gap-1.5">
                                            <div className="bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800 text-[9px] font-black text-red-400 flex items-center gap-1.5 shadow-lg">
                                                <Sword size={10} /> {totalAtk}
                                            </div>
                                            <div className="bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800 text-[9px] font-black text-blue-400 flex items-center gap-1.5 shadow-lg">
                                                <Shield size={10} /> {totalDef}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Lv.{level}</span>
                                            <span className="text-[10px] font-bold text-indigo-400 leading-none">{Math.floor((exp / getNextExp(level)) * 100)}%</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1 h-1.5">
                                    <div className="flex-[3] bg-slate-900 rounded-full overflow-hidden p-[1px]">
                                        <motion.div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)] rounded-full" animate={{ width: `${(stats.hp / totalMaxHp) * 100}%` }} />
                                    </div>
                                    <div className="flex-1 bg-slate-900 rounded-full overflow-hidden p-[1px]">
                                        <motion.div className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] rounded-full" animate={{ width: `${(exp / getNextExp(level)) * 100}%` }} />
                                    </div>
                                </div>
                            </div>

                            {/* Equipment info */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className={`flex items-center gap-2 p-1.5 rounded-xl border transition-all ${equippedWeapon ? 'bg-blue-500/5 border-blue-500/20' : 'bg-slate-900/20 border-slate-800/30'}`}>
                                    <div className={`p-1 rounded-lg ${equippedWeapon ? 'text-blue-400 bg-blue-500/20' : 'text-slate-600 bg-slate-900'}`}><Sword size={10} /></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-black text-white truncate leading-none mb-0.5">{equippedWeapon?.name || '未装備'}</p>
                                        {equippedWeapon && <p className="text-[7px] font-bold text-blue-500/80 uppercase leading-none">{equippedWeapon.rarity} LV.{equippedWeapon.level}</p>}
                                    </div>
                                </div>
                                <div className={`flex items-center gap-2 p-1.5 rounded-xl border transition-all ${equippedArmor ? 'bg-purple-500/5 border-purple-500/20' : 'bg-slate-900/20 border-slate-800/30'}`}>
                                    <div className={`p-1 rounded-lg ${equippedArmor ? 'text-purple-400 bg-purple-500/20' : 'text-slate-600 bg-slate-900'}`}><Sparkles size={10} /></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-black text-white truncate leading-none mb-0.5">{equippedArmor?.name || '未装備'}</p>
                                        {equippedArmor && <p className="text-[7px] font-bold text-purple-500/80 uppercase leading-none">{equippedArmor.rarity} LV.{equippedArmor.level}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-4 relative z-10">
                        {/* Boss Alert Overlay */}
                        <AnimatePresence>
                            {isBossPending && !bossChallenging && showBossWarning && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-50 hidden lg:flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm"
                                >
                                    <motion.div
                                        initial={{ scale: 0.8, y: 20 }}
                                        animate={{ scale: 1, y: 0 }}
                                        className="w-full max-w-sm bg-slate-900 border-2 border-red-500 rounded-3xl p-8 text-center space-y-6 shadow-[0_0_50px_rgba(239,68,68,0.3)]"
                                    >
                                        <div className="inline-flex p-4 bg-red-500/20 rounded-full text-red-500 animate-pulse">
                                            <Skull size={48} />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-3xl font-black text-white tracking-tighter">WARNING</h3>
                                            <p className="text-sm font-bold text-slate-400">第 {stage} 層の守護者が出現しました。</p>
                                        </div>
                                        <div className="space-y-3">
                                            <button
                                                onClick={handleBossChallenge}
                                                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-lg uppercase tracking-widest shadow-xl shadow-red-900/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                ボスに挑戦する
                                            </button>
                                            <button
                                                onClick={handleBossRetreat}
                                                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] border border-slate-700"
                                            >
                                                フィールドに戻る
                                            </button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Boss Defeat Overlay */}
                        <AnimatePresence>
                            {isBossDefeated && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 z-[60] flex items-center justify-center p-6 bg-red-950/90 backdrop-blur-md"
                                >
                                    <motion.div
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: 1 }}
                                        className="w-full max-w-sm bg-slate-900 border-2 border-red-600 rounded-3xl p-8 text-center space-y-6"
                                    >
                                        <div className="text-red-500 flex flex-col items-center gap-2">
                                            <Skull size={64} />
                                            <h3 className="text-4xl font-black italic tracking-tighter">DEFEATED</h3>
                                        </div>
                                        <p className="text-slate-400 text-sm font-bold">守護者の前に力尽きました...</p>
                                        <div className="space-y-3">
                                            <button
                                                onClick={() => handleDefeatChoice('retry')}
                                                className="w-full py-4 bg-white text-black rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-slate-200 transition-colors"
                                            >
                                                再挑戦する
                                            </button>
                                            <button
                                                onClick={() => handleDefeatChoice('retreat')}
                                                className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-slate-700 transition-colors"
                                            >
                                                退却して修行する
                                            </button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Mob Defeat Overlay (Auto-dismiss) */}
                        <AnimatePresence>
                            {showMobDefeatPopup && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-[60] flex items-center justify-center p-6 bg-red-950/80 backdrop-blur-sm pointer-events-none"
                                >
                                    <motion.div
                                        initial={{ scale: 0.8, y: 20 }}
                                        animate={{ scale: 1, y: 0 }}
                                        exit={{ scale: 1.1, opacity: 0 }}
                                        className="w-full max-w-sm text-center space-y-4"
                                    >
                                        <div className="text-red-500 flex flex-col items-center gap-2">
                                            <Skull size={80} className="animate-pulse" />
                                            <h3 className="text-5xl font-black italic tracking-tighter drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]">DEFEATED</h3>
                                        </div>
                                        <p className="text-slate-200 text-base font-black uppercase tracking-[0.3em] opacity-80">修行に戻ります...</p>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Battle Area */}
                        <div className="relative w-full max-w-[240px] aspect-square flex items-center justify-center">
                            <div className={`absolute w-40 h-40 blur-[60px] rounded-full transition-colors duration-1000 ${enemy.isBoss ? 'bg-red-600/20' : 'bg-blue-600/10'}`} />

                            <AnimatePresence mode='wait'>
                                <motion.div
                                    key={`${stage}-${enemyIndex}`}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.1 }}
                                    className={`relative flex flex-col items-center gap-1.5 ${enemy.isBoss ? 'scale-105' : ''}`}
                                >
                                    <div className={`p-3.5 rounded-3xl bg-slate-900 border-2 ${enemy.isBoss ? 'border-red-500/50 shadow-[0_0_25px_rgba(239,68,68,0.3)]' : 'border-blue-500/30'} flex items-center justify-center`}>
                                        {enemy.isBoss ? <Skull size={70} className="text-red-500" /> : <Skull size={70} className="text-slate-400 opacity-50" />}
                                    </div>
                                    <div className="text-center">
                                        <p className={`text-[8px] font-black uppercase tracking-[0.2em] mb-0.5 ${enemy.isBoss ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}>
                                            {enemy.isBoss ? '警告: 強力な個体' : `通常個体`}
                                        </p>
                                        <h3 className="text-base font-black text-white">{enemy.name}</h3>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Enemy HP Bar */}
                        <div className="w-full max-w-sm space-y-1.5">
                            <div className="flex justify-between items-end text-[8px] font-black uppercase tracking-widest px-2">
                                <span className="text-slate-500">敵のHP</span>
                                <span className="text-white">{formatHP(enemy.hp)} / {formatHP(enemy.maxHp)}</span>
                            </div>
                            <div className="h-2 w-full bg-slate-900 rounded-full border border-slate-800 overflow-hidden shadow-inner">
                                <motion.div
                                    className={`h-full ${enemy.isBoss ? 'bg-gradient-to-r from-red-600 to-orange-500' : 'bg-gradient-to-r from-blue-600 to-indigo-500'}`}
                                    animate={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Battle Logs */}
                        <div className="w-full max-w-sm bg-slate-950/80 rounded-2xl border border-slate-800/50 p-2 h-24 overflow-hidden flex flex-col-reverse gap-1 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                            {battleLogs.map((log, i) => (
                                <div key={i} className={`text-[10px] font-black tracking-wide leading-tight ${log.type === 'player' ? 'text-blue-400' :
                                    log.type === 'enemy' ? 'text-red-400' :
                                        'text-amber-400 italic'
                                    }`}>
                                    {log.type === 'system' ? '◆ ' : ''}{log.msg}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: UPGRADES --- */}
                <div className={`lg:col-span-4 border-l border-slate-800/50 bg-slate-950/40 backdrop-blur-xl flex-col h-full overflow-hidden relative ${mobileTab === 'upgrades' ? 'flex' : 'hidden lg:flex'}`}>
                    {/* Equip Result Popup */}
                    <AnimatePresence>
                        {equipPopup && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setEquipPopup(null)}
                                className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/85 backdrop-blur-sm"
                            >
                                <motion.div
                                    initial={{ scale: 0.85, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    exit={{ scale: 0.9, y: 10 }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full max-w-xs bg-slate-900 border-2 border-blue-500/50 rounded-3xl p-6 text-center space-y-5 shadow-[0_0_40px_rgba(59,130,246,0.2)]"
                                >
                                    <div className="space-y-2">
                                        <div className="inline-flex p-3 bg-blue-500/20 rounded-full text-blue-400">
                                            {equipPopup.item.type === 'weapon' ? <Sword size={32} /> : <Shield size={32} />}
                                        </div>
                                        <h4 className="text-lg font-black text-white tracking-tight">装備完了！</h4>
                                        <p className={`text-sm font-black ${RARITY_CONFIG[equipPopup.item.rarity].color}`}>
                                            [{equipPopup.item.rarity}] {equipPopup.item.name}
                                        </p>
                                    </div>

                                    <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-3">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ステータス変化</p>
                                        {([
                                            { label: 'ATK', key: 'atk' as const, icon: <Sword size={14} />, color: 'text-red-400' },
                                            { label: 'DEF', key: 'def' as const, icon: <Shield size={14} />, color: 'text-blue-400' },
                                            { label: 'HP', key: 'hp' as const, icon: <Sparkles size={14} />, color: 'text-emerald-400' },
                                        ]).map(stat => {
                                            const diff = equipPopup.after[stat.key] - equipPopup.before[stat.key];
                                            return (
                                                <div key={stat.key} className="flex items-center justify-between text-sm">
                                                    <div className={`flex items-center gap-2 ${stat.color} opacity-70`}>
                                                        {stat.icon}
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{stat.label}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-slate-500 font-bold text-xs">{equipPopup.before[stat.key]}</span>
                                                        <ArrowRight size={12} className="text-slate-600" />
                                                        <span className="text-white font-black text-xs">{equipPopup.after[stat.key]}</span>
                                                        {diff !== 0 && (
                                                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${diff > 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                                                                {diff > 0 ? `+${diff}` : diff}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={() => setEquipPopup(null)}
                                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        閉じる
                                    </button>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <header className="p-4 border-b border-slate-800/50 flex items-center justify-between gap-2">
                        <div className="grid grid-cols-6 gap-1 p-1 bg-slate-900 rounded-xl flex-1">
                            {[
                                { id: 'facility', label: '施設', icon: ShoppingCart },
                                { id: 'equipment', label: 'クリック強化', icon: Zap },
                                { id: 'gacha', label: 'ガチャ', icon: Trophy },
                                { id: 'inventory', label: '装備', icon: Sword },
                                { id: 'stats', label: '詳細', icon: TrendingUp },
                                { id: 'ranking', label: 'ランキング', icon: Star }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id as any);
                                        if (tab.id === 'ranking') fetchRanking();
                                    }}
                                    className={`px-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all flex flex-col items-center justify-center gap-1 ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    <tab.icon size={12} />
                                    <span className="truncate w-full text-center">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => { if (currentUser?.username === 'debug') setShowDebug(!showDebug); }}
                            className={`hidden lg:block p-2 rounded-lg transition-colors ${showDebug ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
                        >
                            <Settings size={16} />
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {activeTab === 'facility' && (
                            <div className="space-y-3">
                                {/* Production Transcendence Ticket */}
                                {(facilityCounts[8] >= 1 || coins >= 100000000) && (
                                    <button
                                        onClick={handleProductionTranscendence}
                                        disabled={coins < 200000000}
                                        className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between group overflow-hidden relative ${coins >= 200000000 ? 'bg-gradient-to-br from-amber-500/20 to-amber-900/40 border-amber-500/50 hover:border-amber-400' : 'bg-slate-900/50 border-slate-800 opacity-60'}`}
                                    >
                                        <div className="flex items-center gap-3 relative z-10">
                                            <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400">
                                                <Ticket size={24} />
                                            </div>
                                            <div className="text-left">
                                                <h4 className="text-xs font-black text-white uppercase tracking-wider">生産転生チケット</h4>
                                                <p className="text-[10px] font-bold text-amber-500/80">生産能力を永続的に +50%</p>
                                            </div>
                                        </div>
                                        <div className="text-right relative z-10">
                                            <p className="text-[10px] font-black text-white mb-1">{formatNumber(200000000)}</p>
                                            <span className="text-[8px] font-black px-2 py-1 bg-amber-500 text-black rounded uppercase tracking-widest">購入 & 転生</span>
                                        </div>
                                        {/* Background effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                    </button>
                                )}

                                {FACILITIES.filter(f => {
                                    const highestPurchasedId = FACILITIES.reduce((max, fac) => (facilityCounts[fac.id] || 0) > 0 ? Math.max(max, fac.id) : max, -1);
                                    return f.id <= highestPurchasedId + 1 || coins >= f.basePrice;
                                }).map(f => {
                                    const count = facilityCounts[f.id] || 0;
                                    const price = f.basePrice * Math.pow(1.15, count);
                                    const canAfford = coins >= price;
                                    return (
                                        <button
                                            key={f.id}
                                            onClick={() => buyFacility(f.id)}
                                            disabled={!canAfford}
                                            className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${canAfford ? 'bg-slate-900/50 border-slate-800 hover:border-blue-500/50 hover:bg-slate-900' : 'bg-slate-950/50 border-slate-900 opacity-60'}`}
                                        >
                                            <div className="space-y-0.5">
                                                <h4 className="text-xs font-black text-white">{f.name} <span className="text-blue-400 ml-1">Lv.{count}</span></h4>
                                                <p className="text-[10px] font-bold text-slate-500">生産力: +{formatNumber(f.baseCps)}/秒</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-yellow-500 font-black text-xs bg-yellow-500/5 px-2 py-1 rounded-lg border border-yellow-500/10">
                                                <Coins size={12} /> {formatNumber(price)}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {activeTab === 'equipment' && (
                            <div className="space-y-3">
                                {EQUIPMENT.filter(e => {
                                    const highestUnlockedId = EQUIPMENT.reduce((max, eq) => equipmentUnlocked[eq.id] ? Math.max(max, eq.id) : max, -1);
                                    return e.id <= highestUnlockedId + 1 || coins >= e.basePrice;
                                }).map(e => {
                                    const isUnlocked = equipmentUnlocked[e.id];
                                    const canAfford = coins >= e.basePrice;
                                    return (
                                        <button
                                            key={e.id}
                                            onClick={() => buyEquipment(e.id)}
                                            disabled={isUnlocked || !canAfford}
                                            className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${isUnlocked ? 'bg-indigo-500/10 border-indigo-500/30 opacity-100' : canAfford ? 'bg-slate-900/50 border-slate-800 hover:border-blue-500/50 hover:bg-slate-900' : 'bg-slate-950/50 border-slate-900 opacity-60'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2.5 rounded-xl ${isUnlocked ? 'bg-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-slate-800 text-slate-500'}`}>
                                                    <Sword size={16} />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <h4 className="text-xs font-black text-white">{e.name}</h4>
                                                    <p className="text-[10px] font-bold text-slate-500">クリック倍率: x{e.multiplier}</p>
                                                </div>
                                            </div>
                                            {isUnlocked ? (
                                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">所持済</span>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-yellow-500 font-black text-xs bg-yellow-500/5 px-2 py-1 rounded-lg border border-yellow-500/10">
                                                    <Coins size={12} /> {formatNumber(e.basePrice)}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {activeTab === 'gacha' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                {/* Auto Sell Settings */}
                                <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Settings size={14} className="text-slate-400" />
                                            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">自動売却設定</h4>
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-500">指定レア度以下を素材に変換</p>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(['None', ...RARITIES] as const).map(r => (
                                            <button
                                                key={r}
                                                onClick={() => setAutoSellThreshold(r)}
                                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all border ${autoSellThreshold === r
                                                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg'
                                                    : 'bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-700'
                                                    }`}
                                            >
                                                {r === 'None' ? 'なし' : r}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ガチャレベル</p>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-2xl font-black text-white">Lv.{gachaLevel}</h3>
                                                <span className="text-[10px] font-bold text-blue-400 px-2 py-0.5 bg-blue-500/10 rounded-full border border-blue-500/20">
                                                    {gachaLevel < 5 ? '木箱' : gachaLevel < 10 ? '銀箱' : gachaLevel < 20 ? '金箱' : '魔法の箱'}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={buyGachaLevel}
                                            className="bg-amber-500/10 border border-amber-500/30 text-amber-500 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all"
                                        >
                                            LvUP: {formatNumber(Math.floor(1000 * Math.pow(3, gachaLevel - 1)))}
                                        </button>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase">
                                            <span>熟練度</span>
                                            <span>{gachaExp} / {getGachaLevelUpExp(gachaLevel)}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500" style={{ width: `${(gachaExp / getGachaLevelUpExp(gachaLevel)) * 100}%` }} />
                                        </div>
                                    </div>

                                    {/* Probability Table */}
                                    <div className="pt-2 border-t border-slate-800 space-y-2">
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-center">現在の排出確率</p>
                                        <div className="grid grid-cols-5 gap-1.5">
                                            {(() => {
                                                const weights = getGachaWeights(gachaLevel);
                                                const total = Object.values(weights).reduce((a, b) => a + b, 0);
                                                return RARITIES.slice(0, 10).map(r => (
                                                    <div key={r} className="text-center p-1 bg-slate-950/50 rounded border border-slate-800/50">
                                                        <p className={`text-[8px] font-black ${RARITY_CONFIG[r].color}`}>{r}</p>
                                                        <p className="text-[7px] font-bold text-slate-400">{(weights[r] / total * 100).toFixed(1)}%</p>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                {/* Daily Ticket Gacha Section */}
                                <div className="bg-slate-900/50 p-5 rounded-2xl border border-blue-500/30 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                                <Ticket size={16} />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-white uppercase tracking-widest">日課チケットガチャ</h4>
                                                <p className="text-[9px] font-bold text-slate-500">日課で集めたチケットで回せます</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">所持枚数</p>
                                            <p className="text-lg font-black text-white">{currentUser?.daily_tickets || 0} <span className="text-[10px] text-slate-500">枚</span></p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-1.5 py-2 border-y border-slate-800/50">
                                        {[
                                            { r: 'N', p: '60.0%' },
                                            { r: 'UC', p: '35.0%' },
                                            { r: 'R', p: '4.0%' },
                                            { r: 'HR', p: '1.0%' }
                                        ].map(item => (
                                            <div key={item.r} className="text-center p-1 bg-slate-950/50 rounded border border-slate-800/50">
                                                <p className={`text-[8px] font-black ${RARITY_CONFIG[item.r as Rarity].color}`}>{item.r}</p>
                                                <p className="text-[7px] font-bold text-slate-400">{item.p}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <motion.button
                                        whileHover={currentUser && currentUser.daily_tickets > 0 ? { scale: 1.02 } : {}}
                                        whileTap={currentUser && currentUser.daily_tickets > 0 ? { scale: 0.98 } : {}}
                                        onClick={handleUseTicket}
                                        disabled={!currentUser || currentUser.daily_tickets <= 0}
                                        className="w-full py-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl font-black text-white shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 disabled:opacity-40 disabled:grayscale transition-all"
                                    >
                                        <Ticket size={14} />
                                        <span className="text-sm uppercase tracking-widest">チケットで引く (1枚消費)</span>
                                    </motion.button>
                                </div>

                                <div className="flex flex-col items-center gap-4">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleGacha}
                                        disabled={coins < 500 * Math.pow(1.5, gachaLevel - 1)}
                                        className="w-full py-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl font-black text-white shadow-lg shadow-orange-900/20 flex flex-col items-center gap-1 disabled:opacity-50 disabled:grayscale"
                                    >
                                        <span className="text-lg uppercase tracking-[0.2em]">通常ガチャを回す</span>
                                        <span className="text-[10px] opacity-80 flex items-center gap-1"><Coins size={10} /> {formatNumber(500 * Math.pow(1.5, gachaLevel - 1))} コイン</span>
                                    </motion.button>

                                    {gachaResult && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`p-4 rounded-xl border-2 ${RARITY_CONFIG[gachaResult.rarity].color.replace('text-', 'border-')}/30 bg-slate-900 w-full text-center shadow-2xl`}
                                        >
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${RARITY_CONFIG[gachaResult.rarity].color}`}>
                                                {gachaResult.rarity} 獲得！
                                            </p>
                                            <h4 className="text-lg font-black text-white">{gachaResult.name}</h4>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'inventory' && (
                            <div className="space-y-3 animate-in fade-in">
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 flex items-center gap-3 shadow-lg shadow-blue-500/5">
                                        <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                                            <Sword size={16} />
                                        </div>
                                        <div className="leading-tight">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">武器エレメント</p>
                                            <p className="text-lg font-black text-white tracking-tighter tabular-nums">{formatNumber(elements.weapon).replace(' 円', '')}</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 flex items-center gap-3 shadow-lg shadow-purple-500/5">
                                        <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                                            <Sparkles size={16} />
                                        </div>
                                        <div className="leading-tight">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">召喚石エレメント</p>
                                            <p className="text-lg font-black text-white tracking-tighter tabular-nums">{formatNumber(elements.armor).replace(' 円', '')}</p>
                                        </div>
                                    </div>
                                </div>

                                {inventory.length === 0 ? (
                                    <div className="text-center py-12 opacity-30">
                                        <Lock className="mx-auto mb-2" size={24} />
                                        <p className="text-xs font-bold uppercase tracking-widest">所持品なし</p>
                                    </div>
                                ) : inventory.map(item => {
                                    const config = RARITY_CONFIG[item.rarity];
                                    const levelUpCost = Math.floor((RARITIES.indexOf(item.rarity) + 1) * 10 * Math.pow(1.2, item.level));
                                    const isMaxLevel = item.level >= config.maxLevel;
                                    const isEquipped = item.id === equippedWeaponId || item.id === equippedArmorId;

                                    return (
                                        <div key={item.id} className={`bg-slate-900/40 border rounded-xl p-3 space-y-3 transition-colors ${isEquipped ? 'border-blue-500/50 bg-blue-500/5' : 'border-slate-800'}`}>
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2">
                                                    <div className={`p-2 rounded-lg bg-slate-950 border border-slate-800 ${config.color}`}>
                                                        {item.type === 'weapon' ? <Sword size={14} /> : <Sparkles size={14} />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border border-current ${config.color} bg-slate-950`}>
                                                                {item.rarity}
                                                            </span>
                                                            <h4 className="text-[11px] font-black text-white">{item.name}</h4>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-slate-400">
                                                            Lv.{item.level} / {config.maxLevel}
                                                            {item.unlimit > 0 && <span className="text-cyan-400 ml-1">★{item.unlimit}</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {isEquipped ? (
                                                        <span className="text-[9px] font-black text-blue-400 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20 uppercase tracking-widest">装備中</span>
                                                    ) : (
                                                        <button onClick={() => handleEquip(item.id)} className="text-[9px] font-black text-white bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded uppercase tracking-widest transition-colors">装備</button>
                                                    )}
                                                    <button onClick={() => handleSellItem(item.id)} className="text-[9px] font-black text-slate-500 hover:text-red-400 uppercase tracking-widest">売却</button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-1 text-[9px] font-bold">
                                                <div className="text-blue-400">ATK: +{item.atk + Math.floor(item.atk * (item.level - 1) * 0.1)}</div>
                                                <div className="text-emerald-400">DEF: +{item.def + Math.floor(item.def * (item.level - 1) * 0.1)}</div>
                                                <div className="text-cyan-400">HP: +{item.hp + Math.floor(item.hp * (item.level - 1) * 0.1)}</div>
                                            </div>

                                            <div className="flex gap-2 pt-1">
                                                <button
                                                    onClick={() => handleLevelUp(item.id)}
                                                    disabled={isMaxLevel || elements[item.type] < levelUpCost}
                                                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1"
                                                >
                                                    {isMaxLevel ? 'MAX' : `強化 (${levelUpCost})`}
                                                </button>
                                                {!isMaxLevel && (
                                                    <button
                                                        onClick={() => handleMaxLevelUp(item.id)}
                                                        disabled={elements[item.type] < levelUpCost}
                                                        className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg text-[9px] font-black uppercase tracking-widest"
                                                        title="一括強化"
                                                    >
                                                        一括
                                                    </button>
                                                )}
                                                {isMaxLevel && (
                                                    <button
                                                        onClick={() => handleUnlimit(item.id)}
                                                        disabled={elements[item.type] < 100 * (item.unlimit + 1)}
                                                        className="flex-1 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-[9px] font-black uppercase tracking-widest"
                                                    >
                                                        上限解放 ({100 * (item.unlimit + 1)})
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {activeTab === 'stats' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                {/* User Info & Cloud Sync */}
                                <div className="bg-slate-900/60 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                                <Database size={24} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ログイン中のユーザー</p>
                                                <h3 className="text-xl font-black text-white">{currentUser?.username || 'ゲストユーザー'}</h3>
                                            </div>
                                        </div>
                                        {currentUser && (
                                            <button 
                                                onClick={handleManualSave}
                                                disabled={isSyncing}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isSyncing ? 'bg-slate-800 text-slate-500' : 'bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white'}`}
                                            >
                                                <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                                                {isSyncing ? '保存中...' : 'クラウド保存'}
                                            </button>
                                        )}
                                    </div>
                                    {!currentUser && (
                                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                            <p className="text-[9px] font-bold text-amber-500 leading-relaxed">
                                                ※ ログインしていないため、データはブラウザにのみ保存されます。端末をまたいで同期するにはログインが必要です。
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Character Overview Card */}
                                <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">現在の称号</p>
                                            <h3 className="text-3xl font-black text-white tracking-tighter italic">
                                                {[...TITLES].reverse().find(t => dungeonTranscendence >= t.threshold)?.name || '未知の旅人'}
                                                {dungeonTranscendence > 10 && <span className="ml-2 text-lg text-blue-400 not-italic">+{dungeonTranscendence - 10}</span>}
                                            </h3>
                                        </div>
                                        <div className="text-right flex flex-col gap-2">
                                            <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 shadow-inner">
                                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-tighter">ダンジョン転生回数</p>
                                                <p className="text-sm font-black text-blue-400">{dungeonTranscendence}</p>
                                            </div>
                                            <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 shadow-inner">
                                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-tighter">生産転生回数</p>
                                                <p className="text-sm font-black text-amber-500">{productionTranscendence}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                                            <p className="text-[10px] font-black text-slate-500 uppercase mb-1">現在のレベル</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-black text-white">Lv.{level}</span>
                                                <span className="text-xs font-bold text-slate-500">/ 100</span>
                                            </div>
                                        </div>
                                        <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 flex flex-col justify-center">
                                            <p className="text-[10px] font-black text-slate-500 uppercase mb-1">転生ボーナス</p>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[8px] font-bold text-slate-500 uppercase">Dungeon</span>
                                                    <span className="text-sm font-black text-blue-400">+{dungeonTranscendence * 50}%</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[8px] font-bold text-slate-500 uppercase">Production</span>
                                                    <span className="text-sm font-black text-amber-500">+{productionTranscendence * 50}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <span>NEXT LEVEL EXP</span>
                                            <span>{formatNumber(exp)} / {formatNumber(getNextExp(level))}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]" style={{ width: `${(exp / getNextExp(level)) * 100}%` }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Stats Breakdown */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] px-2">ステータス詳細分析</h4>

                                    <div className="space-y-3">
                                        {/* Attack Power */}
                                        <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-red-500/10 rounded-lg text-red-500"><Sword size={20} /></div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase">攻撃力 (ATK)</p>
                                                    <p className="text-xs font-bold text-slate-400">({stats.atk} + {bonuses.atk}) × {dungeonTransMult.toFixed(1)}x</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-white italic tracking-tighter">{totalAtk}</p>
                                            </div>
                                        </div>

                                        {/* Defense Power */}
                                        <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Shield size={20} /></div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase">防御力 (DEF)</p>
                                                    <p className="text-xs font-bold text-slate-400">({stats.def} + {bonuses.def}) × {dungeonTransMult.toFixed(1)}x</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-white italic tracking-tighter">{totalDef}</p>
                                            </div>
                                        </div>

                                        {/* Max HP */}
                                        <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><Zap size={20} /></div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase">最大体力 (HP)</p>
                                                    <p className="text-xs font-bold text-slate-400">({stats.maxHp} + {bonuses.hp}) × {dungeonTransMult.toFixed(1)}x</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-white italic tracking-tighter">{totalMaxHp}</p>
                                            </div>
                                        </div>

                                        {/* Production Power */}
                                        <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500"><Coins size={20} /></div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-500 uppercase">コイン生産力 (CPS)</p>
                                                        <p className="text-xs font-bold text-slate-400">基礎 {formatNumber(cps)} × 転生倍率 {prodTransMult.toFixed(1)}x</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-black text-amber-500 italic tracking-tighter">
                                                        {formatNumber(cps * prodTransMult)}/s
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] px-2">現在の装備補正合計</h4>
                                    <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900/40 p-5 rounded-3xl border border-indigo-500/20 grid grid-cols-3 gap-4">
                                        <div className="text-center space-y-1">
                                            <p className="text-[10px] font-black text-slate-500 uppercase">ATK Bonus</p>
                                            <p className="text-xl font-black text-blue-400">+{bonuses.atk}</p>
                                        </div>
                                        <div className="text-center space-y-1 border-x border-slate-800">
                                            <p className="text-[10px] font-black text-slate-500 uppercase">DEF Bonus</p>
                                            <p className="text-xl font-black text-emerald-400">+{bonuses.def}</p>
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="text-[10px] font-black text-slate-500 uppercase">HP Bonus</p>
                                            <p className="text-xl font-black text-cyan-400">+{bonuses.hp}</p>
                                        </div>
                                    </div>
                                    <div className="px-4 py-2 bg-slate-900/50 rounded-xl border border-slate-800">
                                        <div className="flex justify-between items-center text-[10px] font-bold">
                                            <span className="text-slate-500">装備中:</span>
                                            <span className="text-white">
                                                {inventory.find(i => i.id === equippedWeaponId)?.name || '未装備'} / {inventory.find(i => i.id === equippedArmorId)?.name || '未装備'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Debug Panel (Toggled by Settings icon) */}
                                {showDebug && (
                                    <div className="bg-slate-900/50 p-4 rounded-2xl border border-red-500/40 space-y-3 animate-in zoom-in-95 mt-3">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                                                <Zap size={10} /> デバッグパネル
                                            </h4>
                                            <button onClick={() => setShowDebug(false)} className="text-[8px] text-slate-500 hover:text-white font-black">HIDE</button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-bold text-slate-500 uppercase">所持金</p>
                                                <input
                                                    type="number"
                                                    value={coins}
                                                    onChange={(e) => setCoins(Number(e.target.value))}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-black text-yellow-500"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-bold text-slate-500 uppercase">ステージ</p>
                                                <input
                                                    type="number"
                                                    value={stage}
                                                    onChange={(e) => setStage(Number(e.target.value))}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-black text-blue-400"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-bold text-slate-500 uppercase">レベル</p>
                                                <input
                                                    type="number"
                                                    value={level}
                                                    onChange={(e) => {
                                                        const newLv = Math.min(100, Math.max(1, Number(e.target.value)));
                                                        setLevel(newLv);
                                                        setStats(prev => ({
                                                            ...prev,
                                                            maxHp: 10 + newLv * 10,
                                                            hp: 10 + newLv * 10,
                                                            atk: 5 + newLv * 2,
                                                            def: 5 + newLv * 2
                                                        }));
                                                    }}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-black text-emerald-400"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-bold text-slate-500 uppercase">LUCK</p>
                                                <input
                                                    type="number"
                                                    value={stats.luck}
                                                    onChange={(e) => setStats(prev => ({ ...prev, luck: Number(e.target.value) }))}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-black text-purple-400"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-bold text-slate-500 uppercase">武器素材</p>
                                                <input
                                                    type="number"
                                                    value={elements.weapon}
                                                    onChange={(e) => setElements(prev => ({ ...prev, weapon: Number(e.target.value) }))}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-black text-blue-300"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-bold text-slate-500 uppercase">防具素材</p>
                                                <input
                                                    type="number"
                                                    value={elements.armor}
                                                    onChange={(e) => setElements(prev => ({ ...prev, armor: Number(e.target.value) }))}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-black text-emerald-300"
                                                />
                                            </div>
                                            <button
                                                onClick={() => setStats(prev => ({ ...prev, hp: prev.maxHp }))}
                                                className="col-span-2 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[9px] font-black text-white uppercase tracking-widest"
                                            >
                                                HP全回復
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm('ガチャレベルを 1 にリセットしますか？')) {
                                                        setGachaLevel(1);
                                                        setGachaExp(0);
                                                    }
                                                }}
                                                className="col-span-2 py-1.5 bg-red-900/20 hover:bg-red-900/30 border border-red-500/30 rounded text-[9px] font-black text-red-400 uppercase tracking-widest"
                                            >
                                                ガチャレベルリセット
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'ranking' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                            <Trophy size={20} className="text-amber-500" /> 世界ランキング
                                        </h4>
                                        <button onClick={fetchRanking} className="p-2 text-slate-500 hover:text-blue-400 transition-colors">
                                            <RefreshCw size={16} className={activeTab === 'ranking' ? 'animate-spin-slow' : ''} />
                                        </button>
                                    </div>

                                    <div className="overflow-hidden rounded-2xl border border-slate-800">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-slate-950/50">
                                                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase">順位</th>
                                                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase">プレイヤー</th>
                                                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase text-right">実績</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800/30">
                                                {ranking.map((player, idx) => (
                                                    <tr key={idx} className={`group ${player.username === currentUser?.username ? 'bg-blue-500/10' : ''}`}>
                                                        <td className="px-4 py-3">
                                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-amber-500 text-slate-950' :
                                                                    idx === 1 ? 'bg-slate-300 text-slate-950' :
                                                                        idx === 2 ? 'bg-amber-700 text-white' :
                                                                            'bg-slate-800 text-slate-500'
                                                                }`}>
                                                                {idx + 1}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">{player.username}</span>
                                                            {player.username === currentUser?.username && (
                                                                <span className="ml-2 text-[8px] font-black text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded uppercase">You</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-xs font-black text-white italic">転生 {player.transcendence_count} 回</span>
                                                                <span className="text-[9px] font-bold text-slate-500">Stage {player.max_stage}</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {ranking.length === 0 && (
                                                    <tr>
                                                        <td colSpan={3} className="px-4 py-12 text-center text-xs font-bold text-slate-600 italic">
                                                            ランキングデータ読み込み中...
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4">
                                        <p className="text-[10px] font-bold text-blue-400 leading-relaxed">
                                            ※ ランキングはステージクリア時および転生時に自動的に更新されます。
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-slate-950/80 border-t border-slate-800/50 space-y-3">
                        {/* System Settings */}
                        <div className="pt-2 border-t border-slate-800">
                            <button
                                onClick={resetGameData}
                                className="w-full py-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                            >
                                ゲームデータを削除する
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Global Mobile Elements (Boss Popup & Floating Clicker) */}
            <div className="lg:hidden">
                {/* Mobile Floating Clicker (Only on Dungeon Tab) */}
                {mobileTab === 'dungeon' && (
                    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[45] pointer-events-auto">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleManualClick}
                            className="relative w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-[0_0_30px_-5px_rgba(245,158,11,0.5)] flex items-center justify-center group border-2 border-amber-300/50"
                        >
                            <div className="absolute inset-0 rounded-full border-2 border-white/10 group-hover:border-white/20 transition-colors" />
                            <div className="absolute inset-1.5 rounded-full border border-white/5 animate-spin-slow" />
                            <Coins size={36} className="text-white group-hover:rotate-12 transition-transform duration-300" />
                            <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg border border-red-400/50">
                                +{formatNumber(Math.floor(clickPower * prodTransMult))}
                            </div>
                        </motion.button>
                    </div>
                )}

                {/* Mobile Boss Alert Overlay */}
                <AnimatePresence>
                    {isBossPending && !bossChallenging && showBossWarning && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ scale: 0.8, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                className="w-full max-w-sm bg-slate-900 border-2 border-red-500 rounded-3xl p-8 text-center space-y-6 shadow-[0_0_50px_rgba(239,68,68,0.3)]"
                            >
                                <div className="inline-flex p-4 bg-red-500/20 rounded-full text-red-500 animate-pulse">
                                    <Skull size={48} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-black text-white tracking-tighter">WARNING</h3>
                                    <p className="text-sm font-bold text-slate-400">第 {stage} 層の守護者が出現しました。</p>
                                </div>
                                <div className="space-y-3">
                                    <button
                                        onClick={handleBossChallenge}
                                        className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-lg uppercase tracking-widest shadow-xl shadow-red-900/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        ボスに挑戦する
                                    </button>
                                    <button
                                        onClick={handleBossRetreat}
                                        className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] border border-slate-700"
                                    >
                                        フィールドに戻る
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-950 border-t border-slate-800 z-50 flex items-center justify-around px-2 pb-safe">
                <button 
                    onClick={() => setMobileTab('clicker')} 
                    className={`flex-1 flex flex-col items-center gap-1 py-2 ${mobileTab === 'clicker' ? 'text-amber-500' : 'text-slate-500'}`}
                >
                    <Coins size={20} />
                    <span className="text-[10px] font-bold">資源</span>
                </button>
                <button 
                    onClick={() => setMobileTab('dungeon')} 
                    className={`flex-1 flex flex-col items-center gap-1 py-2 ${mobileTab === 'dungeon' ? 'text-blue-500' : 'text-slate-500'}`}
                >
                    <Sword size={20} />
                    <span className="text-[10px] font-bold">戦闘</span>
                </button>
                <button 
                    onClick={() => setMobileTab('upgrades')} 
                    className={`flex-1 flex flex-col items-center gap-1 py-2 ${mobileTab === 'upgrades' ? 'text-purple-500' : 'text-slate-500'}`}
                >
                    <Settings size={20} />
                    <span className="text-[10px] font-bold">強化</span>
                </button>
            </div>

            {/* Custom Styles */}
            <style jsx global>{`
                .animate-spin-slow {
                    animation: spin 8s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes gradient-x {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-gradient-x {
                    animation: gradient-x 3s ease infinite;
                }
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}

// Missing icons for the code above
function CheckCircle2({ size, className }: { size: number, className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}
