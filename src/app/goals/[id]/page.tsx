"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import * as actions from '@/lib/actions';
import { ChevronLeft, Save, CheckCircle2, Loader2, Trash2 } from 'lucide-react';

export default function GoalDetail() {
    const router = useRouter();
    const { id } = useParams();
    const [goal, setGoal] = useState<any | null>(null);
    const [tempMaterials, setTempMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const found = await actions.getGoalById(id as string);
            if (found) {
                setGoal(found);
                setTempMaterials(found.materials);
            } else {
                router.push('/tracker');
            }
            setLoading(false);
        };
        fetchData();
    }, [id, router]);

    const handleUpdateProgress = (index: number, current: number) => {
        const updated = [...tempMaterials];
        updated[index] = { ...updated[index], current: Math.max(0, current) };
        setTempMaterials(updated);
    };

    const handleSave = async () => {
        if (!goal || isSaving) return;
        setIsSaving(true);
        const res = await actions.updateGoalProgress(goal.id, tempMaterials.map(m => ({ id: m.id, current: m.current })));
        if (res.success) {
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        }
        setIsSaving(false);
    };

    const handleDelete = async () => {
        if (!goal || !confirm('この目標を削除してもよろしいですか？')) return;
        setIsDeleting(true);
        const res = await actions.deleteGoal(goal.id);
        if (res.success) {
            router.push('/goals');
        } else {
            setIsDeleting(false);
            alert('削除に失敗しました。');
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-500" size={40} />
        </div>
    );

    if (!goal) return null;

    const totalProgress = tempMaterials.length > 0
        ? Math.round(tempMaterials.reduce((acc, m) => acc + (Math.min(1, m.current / m.target) || 0), 0) / tempMaterials.length * 100)
        : 0;

    return (
        <main className="min-h-screen bg-slate-50 p-6 md:p-12 pb-32">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <button onClick={() => router.push('/goals')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
                        <ChevronLeft size={20} />
                        一覧へ戻る
                    </button>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-300 hover:text-red-500 hover:border-red-100 transition-all shadow-sm flex items-center gap-2 group"
                        >
                            <Trash2 size={18} />
                            <span className="text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Delete Goal</span>
                        </button>
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-xs font-bold text-slate-600 tracking-wider uppercase">Active Tracking</span>
                        </div>
                    </div>
                </div>

                <header className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left space-y-2">
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{goal.title}</h1>
                        <p className="text-slate-400 font-medium italic">Progress Overview</p>
                    </div>
                    <div className="relative w-28 h-28 md:w-32 md:h-32 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                            <circle
                                cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent"
                                strokeDasharray={364.42}
                                strokeDashoffset={364.42 * (1 - totalProgress / 100)}
                                className="text-blue-600 transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
                            <span className="text-xl md:text-2xl font-black text-slate-800 leading-none">{totalProgress}%</span>
                            <span className="text-[9px] md:text-[10px] uppercase font-bold text-slate-400 mt-1">Total</span>
                        </div>
                    </div>
                </header>

                <section className="grid gap-6">
                    {tempMaterials.map((m, index) => {
                        const progress = Math.min(100, Math.round((m.current / m.target) * 100)) || 0;
                        return (
                            <div key={m.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-bold text-slate-800">{m.name}</h3>
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl font-black text-blue-600">{progress}%</span>
                                            <span className="text-slate-300 text-sm">/</span>
                                            <span className="text-slate-500 font-bold">{m.current} / {m.target}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleUpdateProgress(index, m.current - 1)}
                                            className="w-10 h-10 rounded-xl border-2 border-slate-100 text-slate-400 hover:border-blue-200 hover:text-blue-500 transition-all flex items-center justify-center font-bold"
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            value={m.current}
                                            onChange={(e) => handleUpdateProgress(index, parseInt(e.target.value) || 0)}
                                            className="w-24 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-center font-black text-slate-700 text-xl focus:ring-4 focus:ring-blue-50 outline-none"
                                        />
                                        <button
                                            onClick={() => handleUpdateProgress(index, m.current + 1)}
                                            className="w-10 h-10 rounded-xl border-2 border-slate-100 text-slate-400 hover:border-blue-200 hover:text-blue-500 transition-all flex items-center justify-center font-bold"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 transition-all duration-700 ease-out relative"
                                            style={{ width: `${progress}%` }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </section>
            </div>

            {/* Floating Action Bar */}
            <div className="fixed bottom-8 left-0 right-0 flex justify-center px-4 md:px-6 pointer-events-none z-50">
                <div className="bg-slate-900 text-white px-4 md:px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 md:gap-6 pointer-events-auto transform transition-all hover:scale-105 border border-white/10 w-full max-w-sm md:max-w-none md:w-auto">
                    <div className="hidden md:block">
                        <p className="text-xs text-white/50 font-bold uppercase tracking-widest">Changes detected</p>
                        <p className="text-sm font-medium">進捗を保存しますか？</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`flex-1 md:flex-none px-6 md:px-8 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${success ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-500'} active:scale-95 disabled:opacity-50`}
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : (success ? <CheckCircle2 size={20} /> : <Save size={20} />)}
                        <span className="whitespace-nowrap">{success ? '保存しました' : '現在の進捗を保存'}</span>
                    </button>
                </div>
            </div>
        </main>
    );
}
