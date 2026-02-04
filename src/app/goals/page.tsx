"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Target, ChevronRight, PlusCircle, Loader2 } from 'lucide-react';
import * as actions from '@/lib/actions';

function GoalListContent() {
    const router = useRouter();
    const [goals, setGoals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const currentUser = await actions.getCurrentUser();
            setUser(currentUser);
            if (!currentUser) {
                router.push('/login');
                return;
            }
            const found = await actions.getGoals();
            setGoals(found);
            setLoading(false);
        };
        fetchData();
    }, [router]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-500" size={40} />
        </div>
    );

    return (
        <main className="min-h-screen bg-slate-50 p-6 md:p-12">
            <div className="max-w-3xl mx-auto space-y-8">
                <button onClick={() => router.push('/tracker')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
                    <ChevronLeft size={20} />
                    ツールTOPへ戻る
                </button>

                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold text-slate-900">あなたの目標一覧</h1>
                        <p className="text-slate-500">ユーザー名 「{user?.username}」 の目標です。</p>
                    </div>
                    <button
                        onClick={() => router.push('/create')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
                    >
                        <PlusCircle size={20} />
                        新しい目標を登録
                    </button>
                </header>

                <div className="grid gap-4">
                    {goals.length === 0 ? (
                        <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center text-slate-400 font-bold">
                            表示できる目標がありません。<br />
                            <span className="text-xs font-normal">「新しい目標を登録」から始めてみましょう。</span>
                        </div>
                    ) : (
                        goals.map(goal => {
                            const totalProgress = goal.materials.length > 0
                                ? Math.round(goal.materials.reduce((acc: number, m: any) => acc + (Math.min(1, m.current / m.target) || 0), 0) / goal.materials.length * 100)
                                : 0;
                            const isAchieved = totalProgress === 100;

                            return (
                                <button
                                    key={goal.id}
                                    onClick={() => router.push(`/goals/${goal.id}`)}
                                    className={`bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all text-left flex items-center justify-between group ${isAchieved ? 'border-amber-200 bg-amber-50/10' : 'border-slate-100'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                                        <div className={`w-12 h-12 md:w-16 md:h-16 relative flex-shrink-0 flex items-center justify-center`}>
                                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 48 48">
                                                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                                                <circle
                                                    cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent"
                                                    strokeDasharray={125.66}
                                                    strokeDashoffset={125.66 * (1 - totalProgress / 100)}
                                                    className={`transition-all duration-1000 ease-out ${isAchieved ? 'text-amber-500' : 'text-blue-600'
                                                        }`}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center leading-none select-none">
                                                <span className={`text-[10px] md:text-xs font-black ${isAchieved ? 'text-amber-600' : 'text-slate-800'}`}>
                                                    {totalProgress}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                                <h3 className={`font-bold text-base md:text-lg transition-colors truncate ${isAchieved ? 'text-amber-900' : 'text-slate-800 group-hover:text-blue-600'
                                                    }`}>
                                                    {goal.title}
                                                </h3>
                                                {isAchieved && (
                                                    <span className="w-fit bg-amber-100 text-amber-700 text-[8px] md:text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                                                        Achieved
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400 truncate">{goal.materials.length} 個の素材を設定中</p>
                                        </div>
                                    </div>
                                    <ChevronRight className={`transition-all group-hover:translate-x-1 ${isAchieved ? 'text-amber-400' : 'text-slate-300 group-hover:text-blue-500'
                                        }`} />
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </main>
    );
}

export default function GoalListPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">読み込み中...</div>}>
            <GoalListContent />
        </Suspense>
    );
}
