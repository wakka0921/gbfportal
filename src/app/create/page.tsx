"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MASTER_MATERIALS, GOAL_TEMPLATES } from '@/lib/masterData';
import { mockDB } from '@/lib/db';
import { ChevronLeft, Plus, Save, Trash2 } from 'lucide-react';
import { Material } from '@/types';

function CreateGoal() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pwParam = searchParams.get('pw') || '';

    const [masterMaterials, setMasterMaterials] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);

    useEffect(() => {
        setMasterMaterials(mockDB.getMasterMaterials());
        setTemplates(mockDB.getTemplates());
    }, []);

    const [title, setTitle] = useState('');
    const [password, setPassword] = useState(pwParam);
    const [selectedMaterials, setSelectedMaterials] = useState<Partial<Material>[]>([]);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleTemplateSelect = (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setTitle(template.title);
            setSelectedMaterials(template.materials.map((m: any) => ({
                id: Math.random().toString(),
                name: m.name,
                target: m.target,
                current: 0
            })));
        }
    };

    const addMaterialField = () => {
        setSelectedMaterials([...selectedMaterials, { id: Math.random().toString(), name: '', current: 0, target: 0 }]);
    };

    const removeMaterialField = (id: string) => {
        setSelectedMaterials(selectedMaterials.filter(m => m.id !== id));
    };

    const handleMaterialSelect = (index: number, name: string) => {
        const master = MASTER_MATERIALS.find(m => m.name === name);
        const updated = [...selectedMaterials];
        updated[index] = {
            ...updated[index],
            name,
            target: master?.defaultTarget || 0,
            current: updated[index].current || 0
        };
        setSelectedMaterials(updated);
    };

    const handleSave = () => {
        if (!title || !password || selectedMaterials.length === 0) {
            setError('すべての項目を入力してください。');
            return;
        }

        if (password.length !== 4) {
            setError('パスワードは4桁で入力してください。');
            return;
        }

        // If pwParam is present, we are adding to an existing set of goals, so skip duplicate check
        if (!pwParam && mockDB.checkPasswordExists(password)) {
            setError('このパスワードは既に使用されています。別のパスワードを設定してください。');
            return;
        }

        const newGoal = {
            id: Math.random().toString(36).substr(2, 9),
            title,
            password,
            materials: selectedMaterials.map(m => ({
                id: m.id || Math.random().toString(),
                name: m.name || '',
                current: m.current || 0,
                target: m.target || 0,
                startDate: new Date().toISOString(),
                endDate: new Date().toISOString(),
            }))
        };

        mockDB.saveGoal(newGoal);
        setShowSuccess(true);
        setTimeout(() => {
            router.push(`/goals/${newGoal.id}`);
        }, 2000);
    };

    if (showSuccess) {
        return (
            <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6 transition-opacity duration-500">
                <div className="text-center space-y-4 animate-in fade-in duration-700">
                    <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Save size={40} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">登録が完了しました！</h1>
                    <p className="text-slate-500">詳細画面へ移動しています...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 p-6 md:p-12">
            <div className="max-w-2xl mx-auto space-y-8">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
                    <ChevronLeft size={20} />
                    戻る
                </button>

                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">新規目標の登録</h1>
                        <p className="text-slate-500">収集したい素材と目標数を設定してください。</p>
                    </div>
                </header>

                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">目標テンプレートから選択</label>
                        <select
                            onChange={(e) => handleTemplateSelect(e.target.value)}
                            className="w-full text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                        >
                            <option value="">テンプレートを選択（自動入力）</option>
                            {templates.map(t => (
                                <option key={t.id} value={t.id}>{t.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="border-t border-slate-100 pt-6 space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">目標タイトル</label>
                            <input
                                type="text"
                                placeholder="例: 十天衆 限界超越 七星剣"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">管理用パスワード (英数字4桁)</label>
                            <input
                                type="text"
                                maxLength={4}
                                placeholder="例: a1b2"
                                value={password}
                                readOnly={!!pwParam}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all font-mono ${pwParam ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-slate-700">必要素材リスト</label>
                            <button
                                onClick={addMaterialField}
                                className="text-blue-600 hover:text-blue-700 text-sm font-bold flex items-center gap-1"
                            >
                                <Plus size={16} />
                                素材を追加
                            </button>
                        </div>

                        <div className="space-y-3">
                            {selectedMaterials.map((m, index) => (
                                <div key={m.id} className="flex gap-3 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="flex-1 space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-slate-400">素材名</label>
                                        <select
                                            value={m.name}
                                            onChange={(e) => handleMaterialSelect(index, e.target.value)}
                                            className="w-full bg-white text-slate-700 border border-slate-200 rounded-lg px-2 py-2 text-sm focus:border-blue-400 outline-none"
                                        >
                                            <option value="">選択してください</option>
                                            {masterMaterials.map(mm => (
                                                <option key={mm.id} value={mm.name}>{mm.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-24 space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-slate-400">必要数</label>
                                        <input
                                            type="number"
                                            value={m.target}
                                            onChange={(e) => {
                                                const updated = [...selectedMaterials];
                                                updated[index].target = parseInt(e.target.value) || 0;
                                                setSelectedMaterials(updated);
                                            }}
                                            className="w-full bg-white text-slate-700 border border-slate-200 rounded-lg px-2 py-2 text-sm text-center"
                                        />
                                    </div>
                                    <button onClick={() => removeMaterialField(m.id!)} className="p-2 text-slate-300 hover:text-red-500 transition-colors mb-0.5">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

                    <button
                        onClick={handleSave}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
                    >
                        <Save size={20} />
                        この内容で目標を登録する
                    </button>
                </div>
            </div>
        </main>
    );
}

export default function CreateGoalPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">読み込み中...</div>}>
            <CreateGoal />
        </Suspense>
    );
}
