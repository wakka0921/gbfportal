'use client';

import React, { useState, useTransition } from 'react';
import { completeDailyTask } from './actions';
import { CheckCircle, Settings, Calendar as CalendarIcon, Image as ImageIcon, Check, Ticket, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';

type TaskItem = {
    battle_id: string;
    difficulty: string;
    battle_name: string;
    daily_limit: number;
    is_active: boolean;
    completed_count: string | number;
    has_img_flag: boolean;
};

export default function DailyClient({ initialTasks, currentUser }: { initialTasks: TaskItem[], currentUser: any }) {
    const router = useRouter();
    const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
    const [isPending, startTransition] = useTransition();

    // 各カードごとの「画像添付」チェックボックス状態
    const [imgFlags, setImgFlags] = useState<Record<string, boolean>>({});

    const handleComplete = (battleId: string, limit: number, currentCount: number) => {
        if (currentCount >= limit) return;

        const flag = !!imgFlags[battleId];

        // Optimistic Update
        const updated = tasks.map(t => {
            if (t.battle_id === battleId) {
                return { ...t, completed_count: Number(t.completed_count) + 1, has_img_flag: flag };
            }
            return t;
        });
        setTasks(updated);

        // Check if fully completed
        const isNowComplete = currentCount + 1 >= limit;
        if (isNowComplete) {
            triggerConfetti();
            // Optional: You could add a toast here. For now, we'll rely on the game UI to show tickets.
        }

        startTransition(async () => {
            const res = await completeDailyTask(battleId, flag);
            if (!res.success) {
                setTasks(tasks); // revert
                alert(res.error || 'エラーが発生しました');
            }
        });
    };

    const triggerConfetti = () => {
        const duration = 2000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({
                ...defaults, particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                colors: ['#00a1e9', '#FFD700', '#FFFFFF']
            });
            confetti({
                ...defaults, particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                colors: ['#00a1e9', '#FFD700', '#FFFFFF']
            });
        }, 250);
    };

    const completedAllCount = tasks.filter(t => Number(t.completed_count) >= t.daily_limit).length;
    const progressPercent = tasks.length === 0 ? 0 : Math.round((completedAllCount / tasks.length) * 100);

    return (
        <div className="max-w-3xl mx-auto w-full p-6 space-y-8 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">日課リスト</h1>
                    <p className="text-slate-500 font-medium mt-1">今日のグラブル日課を消化しましょう</p>
                    {!currentUser && (
                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[11px] font-bold border border-red-100">
                            <Info size={14} /> ログインすると日課チケットを獲得・保存できます
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => router.push('/daily/config')}
                        className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 text-slate-500 hover:text-[#00a1e9] hover:border-[#00a1e9]/30 transition group"
                        title="カスタマイズ"
                    >
                        <Settings size={22} className="group-hover:rotate-45 transition-transform" />
                    </button>
                    <button 
                        onClick={() => router.push('/daily/calendar')}
                        className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 text-slate-500 hover:text-[#00a1e9] hover:border-[#00a1e9]/30 transition group"
                        title="カレンダー"
                    >
                        <CalendarIcon size={22} className="group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Progress Section */}
            {tasks.length > 0 && (
                <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 flex flex-col md:flex-row items-center gap-6">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle className="text-slate-100 stroke-current block" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent"></circle>
                            <circle className="text-[#00a1e9] stroke-current block transition-all duration-1000 ease-out" strokeWidth="8" strokeLinecap="round" cx="50" cy="50" r="40" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * progressPercent) / 100}></circle>
                        </svg>
                        <span className="absolute text-xl font-black text-[#00a1e9]">{progressPercent}%</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">達成度</h2>
                        <p className="text-slate-500 font-medium">全 {tasks.length} 件中、{completedAllCount} 件を完了しました。</p>
                        {progressPercent === 100 && (
                            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-600 rounded-full text-sm font-bold">
                                <Check size={16} /> 本日の日課コンプリート！
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tasks list */}
            <div className="space-y-4">
                {tasks.length === 0 ? (
                    <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                            <Settings size={32} />
                        </div>
                        <div>
                            <p className="text-slate-600 font-bold text-lg mb-2">日課がまだありません</p>
                            <p className="text-slate-500 mb-6">カスタマイズ画面から自分だけの日課を追加してください。</p>
                            <button 
                                onClick={() => router.push('/daily/config')}
                                className="bg-[#00a1e9] hover:bg-[#008bc5] text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-blue-200 transition"
                            >
                                日課を追加する
                            </button>
                        </div>
                    </div>
                ) : (
                    tasks.map(task => {
                        const count = Number(task.completed_count);
                        const isDone = count >= task.daily_limit;

                        return (
                            <div 
                                key={task.battle_id} 
                                className={`
                                    relative overflow-hidden p-5 rounded-2xl border transition-all duration-300 
                                    ${isDone 
                                        ? 'bg-gradient-to-r from-amber-50 to-white border-amber-200 shadow-md transform scale-[1.01]' 
                                        : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-[#00a1e9]/40'
                                    }
                                `}
                            >
                                {isDone && (
                                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-amber-300 to-yellow-500 rounded-full opacity-20 blur-2xl" />
                                )}
                                
                                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${isDone ? 'bg-amber-100 text-amber-500' : 'bg-blue-50 text-[#00a1e9]'}`}>
                                            <CheckCircle size={28} className={isDone ? 'fill-current text-amber-50' : ''} />
                                        </div>
                                        <div>
                                            <p className={`text-xs font-bold mb-1 ${isDone ? 'text-amber-600' : 'text-[#00a1e9]'}`}>{task.difficulty}</p>
                                            <h3 className={`text-lg font-bold ${isDone ? 'text-amber-900' : 'text-slate-800'}`}>{task.battle_name}</h3>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col md:flex-row items-end md:items-center gap-4 md:gap-6 pl-14 md:pl-0">
                                        {/* Status */}
                                        <div className="flex flex-col items-end md:items-start text-sm font-bold">
                                            <span className="text-slate-400 text-xs">進捗</span>
                                            <span className={`text-xl ${isDone ? 'text-amber-600' : 'text-slate-700'}`}>
                                                {count} <span className="text-slate-400 text-sm">/ {task.daily_limit}</span>
                                            </span>
                                        </div>
                                        
                                        {!isDone ? (
                                            <div className="flex flex-col gap-2 w-full md:w-auto mt-2 md:mt-0">
                                                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 cursor-pointer hover:bg-slate-100 transition">
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-4 h-4 rounded border-slate-300 text-[#00a1e9] focus:ring-[#00a1e9]/50" 
                                                        checked={!!imgFlags[task.battle_id]}
                                                        onChange={(e) => setImgFlags({...imgFlags, [task.battle_id]: e.target.checked})}
                                                    />
                                                    <ImageIcon size={14} /> 証拠画像あり
                                                </label>
                                                <button 
                                                    onClick={() => handleComplete(task.battle_id, task.daily_limit, count)}
                                                    disabled={isPending}
                                                    className="w-full md:w-auto bg-[#00a1e9] hover:bg-[#008bc5] text-white px-6 py-2.5 rounded-xl font-bold shadow-md shadow-blue-200 transition active:scale-95 disabled:opacity-50"
                                                >
                                                    完了記録
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="px-6 py-2.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl font-black w-full md:w-auto flex justify-center items-center gap-2">
                                                    <Check size={18} /> 達成済
                                                </div>
                                                <p className="text-[10px] font-bold text-amber-500 flex items-center gap-1 animate-bounce mt-1">
                                                    <Ticket size={10} /> チケット獲得！
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Background Decor */}
            <div className="fixed top-1/4 left-10 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none -z-10" />
        </div>
    );
}
