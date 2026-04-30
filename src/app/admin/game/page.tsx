
'use client';

import React, { useState } from 'react';
import { 
    RARITIES, 
    WEAPON_POOL, 
    ARMOR_POOL, 
    FACILITIES, 
    EQUIPMENT 
} from '@/app/game/gameData';
import { updateGameData } from './actions';
import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function GameAdminPage() {
    const [weaponPool, setWeaponPool] = useState(WEAPON_POOL);
    const [armorPool, setArmorPool] = useState(ARMOR_POOL);
    const [facilities, setFacilities] = useState(FACILITIES);
    const [equipment, setEquipment] = useState(EQUIPMENT);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        const res = await updateGameData({
            WEAPON_POOL: weaponPool,
            ARMOR_POOL: armorPool,
            FACILITIES: facilities,
            EQUIPMENT: equipment
        });
        setIsSaving(false);
        if (res.success) {
            alert('ゲームデータを更新しました！');
        } else {
            alert('エラーが発生しました: ' + res.error);
        }
    };

    const addItem = (type: 'weapon' | 'armor', rarity: string) => {
        const pool = type === 'weapon' ? { ...weaponPool } : { ...armorPool };
        (pool as any)[rarity] = [...(pool as any)[rarity], '新規アイテム'];
        if (type === 'weapon') setWeaponPool(pool as any);
        else setArmorPool(pool as any);
    };

    const removeItem = (type: 'weapon' | 'armor', rarity: string, index: number) => {
        const pool = type === 'weapon' ? { ...weaponPool } : { ...armorPool };
        (pool as any)[rarity] = (pool as any)[rarity].filter((_: any, i: number) => i !== index);
        if (type === 'weapon') setWeaponPool(pool as any);
        else setArmorPool(pool as any);
    };

    const updateItem = (type: 'weapon' | 'armor', rarity: string, index: number, value: string) => {
        const pool = type === 'weapon' ? { ...weaponPool } : { ...armorPool };
        (pool as any)[rarity][index] = value;
        if (type === 'weapon') setWeaponPool(pool as any);
        else setArmorPool(pool as any);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="p-2 hover:bg-slate-900 rounded-full transition-colors">
                            <ArrowLeft size={24} />
                        </Link>
                        <h1 className="text-3xl font-black text-white italic tracking-tighter">GAME DATA ADMIN</h1>
                    </div>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
                    >
                        <Save size={20} />
                        {isSaving ? '保存中...' : 'データを保存する'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Weapons Section */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-amber-400">
                            武器リスト (WEAPON_POOL)
                        </h2>
                        {RARITIES.map(rarity => (
                            <div key={rarity} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="font-black text-sm uppercase tracking-widest opacity-50">{rarity}</span>
                                    <button onClick={() => addItem('weapon', rarity)} className="p-1 hover:text-blue-400 transition-colors">
                                        <Plus size={18} />
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {weaponPool[rarity].map((name, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input 
                                                value={name}
                                                onChange={(e) => updateItem('weapon', rarity, i, e.target.value)}
                                                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                            />
                                            <button onClick={() => removeItem('weapon', rarity, i)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Armor Section */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-emerald-400">
                            防具/召喚石リスト (ARMOR_POOL)
                        </h2>
                        {RARITIES.map(rarity => (
                            <div key={rarity} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="font-black text-sm uppercase tracking-widest opacity-50">{rarity}</span>
                                    <button onClick={() => addItem('armor', rarity)} className="p-1 hover:text-blue-400 transition-colors">
                                        <Plus size={18} />
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {armorPool[rarity].map((name, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input 
                                                value={name}
                                                onChange={(e) => updateItem('armor', rarity, i, e.target.value)}
                                                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                            />
                                            <button onClick={() => removeItem('armor', rarity, i)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
