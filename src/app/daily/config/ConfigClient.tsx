'use client';

import React, { useState, useTransition } from 'react';
import { toggleUserConfig } from '../actions';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

type ConfigItem = {
    battle_id: string;
    difficulty: string;
    battle_name: string;
    is_active: boolean;
};

export default function ConfigClient({ initialConfigs }: { initialConfigs: ConfigItem[] }) {
    const router = useRouter();
    const [configs, setConfigs] = useState<ConfigItem[]>(initialConfigs);
    const [isPending, startTransition] = useTransition();
    const [selectedBattleId, setSelectedBattleId] = useState<string>('');

    // アクティブなリストと非アクティブなリストに分割
    const activeConfigs = configs.filter(c => c.is_active);
    const availableConfigs = configs.filter(c => !c.is_active);

    const handleAdd = () => {
        if (!selectedBattleId) return;
        
        // Optimistic UI update
        const updated = configs.map(c => 
            c.battle_id === selectedBattleId ? { ...c, is_active: true } : c
        );
        setConfigs(updated);
        setSelectedBattleId('');

        startTransition(async () => {
            const res = await toggleUserConfig(selectedBattleId, true);
            if (!res.success) {
                // revert on failure
                setConfigs(configs);
                alert('追加に失敗しました。');
            }
        });
    };

    const handleRemove = (battleId: string) => {
        // Optimistic UI update
        const updated = configs.map(c => 
            c.battle_id === battleId ? { ...c, is_active: false } : c
        );
        setConfigs(updated);

        startTransition(async () => {
            const res = await toggleUserConfig(battleId, false);
            if (!res.success) {
                // revert on failure
                setConfigs(configs);
                alert('削除に失敗しました。');
            }
        });
    };

    return (
        <div className="max-w-2xl mx-auto w-full p-6 space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => router.push('/daily')}
                    className="p-2 border border-slate-200 rounded-full hover:bg-slate-50 transition text-slate-500"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-3xl font-black text-[#00a1e9] tracking-tight">日課カスタマイズ</h1>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 space-y-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 mb-2">日課を追加</h2>
                    <div className="flex gap-2">
                        <select 
                            value={selectedBattleId}
                            onChange={(e) => setSelectedBattleId(e.target.value)}
                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00a1e9]/50 text-slate-800 font-medium"
                        >
                            <option value="">マルチバトルを選択...</option>
                            {availableConfigs.map(c => (
                                <option key={c.battle_id} value={c.battle_id}>
                                    [{c.difficulty}] {c.battle_name}
                                </option>
                            ))}
                        </select>
                        <button 
                            onClick={handleAdd}
                            disabled={!selectedBattleId || isPending}
                            className="bg-[#00a1e9] hover:bg-[#008bc5] disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition"
                        >
                            <Plus size={20} />
                            追加
                        </button>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-between">
                        <span>現在の日課リスト</span>
                        <span className="bg-blue-100 text-[#00a1e9] text-sm px-3 py-1 rounded-full">{activeConfigs.length} 件</span>
                    </h2>
                    
                    <div className="space-y-3">
                        {activeConfigs.length === 0 ? (
                            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <p className="text-slate-500 font-medium">日課が設定されていません</p>
                            </div>
                        ) : (
                            activeConfigs.map(c => (
                                <div key={c.battle_id} className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-xl hover:shadow-md transition">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-[#00a1e9] mb-1">{c.difficulty}</span>
                                        <span className="font-bold text-slate-800">{c.battle_name}</span>
                                    </div>
                                    <button 
                                        onClick={() => handleRemove(c.battle_id)}
                                        disabled={isPending}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                        title="リストから外す"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            
            {/* Background Decorative Elements */}
            <div className="fixed top-1/4 left-10 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none -z-10" />
            <div className="fixed bottom-1/4 right-10 w-64 h-64 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none -z-10" />
        </div>
    );
}
