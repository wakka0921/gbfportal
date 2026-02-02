"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { mockDB } from '@/lib/db';
import {
    ChevronLeft, Zap, Trophy, History, Info, Trash2,
    ChevronRight, Calendar as CalendarIcon, X, Flame, BarChart3, PieChart, Activity
} from 'lucide-react';
import {
    format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
    eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isToday
} from 'date-fns';
import { ja } from 'date-fns/locale';
import confetti from 'canvas-confetti';

interface HihiLog {
    id: string;
    timestamp: string; // ISO string
    count: number;
    hasBlueChest: boolean;
    itemType?: 'hihi' | 'ring' | 'none';
    ringType?: 'eikou' | 'hajyou' | 'shigoku';
}

interface HihiStats {
    total: number;
    drops: number;
    blueChests: number;
    currentStreak: number;
}

export default function HihiTracker() {
    const router = useRouter();
    const [stats, setStats] = useState<HihiStats>({ total: 0, drops: 0, blueChests: 0, currentStreak: 1 });
    const [logs, setLogs] = useState<HihiLog[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showDetailedStats, setShowDetailedStats] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);

    // Selection States
    const [hasBlueChest, setHasBlueChest] = useState<boolean | null>(null);
    const [itemType, setItemType] = useState<'hihi' | 'ring' | 'none' | null>(null);
    const [ringType, setRingType] = useState<'eikou' | 'hajyou' | 'shigoku' | null>(null);

    useEffect(() => {
        const savedLogs = mockDB.getHihiLogs();
        setLogs(savedLogs);
        calculateStats(savedLogs);
    }, []);

    const calculateStats = (currentLogs: HihiLog[]) => {
        const total = currentLogs.length;
        const drops = currentLogs.filter(l => l.itemType === 'hihi').length;
        const blueChests = currentLogs.filter(l => l.hasBlueChest).length;

        let streak = 0;
        for (const log of currentLogs) {
            if (log.itemType === 'hihi') break;
            streak++;
        }

        const newStats = {
            total,
            drops,
            blueChests,
            currentStreak: streak + 1
        };

        setStats(newStats);
        mockDB.saveHihiStats(newStats);
    };

    const handleRegister = () => {
        if (hasBlueChest === null) return;

        const isHihi = itemType === 'hihi';

        const newLog: HihiLog = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            count: stats.currentStreak,
            hasBlueChest,
            itemType: itemType || 'none',
            ringType: ringType || undefined
        };

        const newLogs = [newLog, ...logs];
        setLogs(newLogs);
        mockDB.saveHihiLogs(newLogs);
        calculateStats(newLogs);

        if (isHihi) {
            triggerCelebration();
        }

        // Reset Selection
        setHasBlueChest(null);
        setItemType(null);
        setRingType(null);
    };

    const triggerCelebration = () => {
        setShowCelebration(true);

        // Multi-burst confetti
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            // since particles fall down, start a bit higher than random
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        setTimeout(() => setShowCelebration(false), 5000);
    };

    const handleDeleteLog = (id: string) => {
        if (!confirm('この履歴を削除しますか？')) return;
        const newLogs = logs.filter(l => l.id !== id);
        setLogs(newLogs);
        mockDB.saveHihiLogs(newLogs);
        calculateStats(newLogs);
    };

    const dropRate = stats.total > 0 ? ((stats.drops / stats.total) * 100).toFixed(2) : '0.00';
    const blueChestRate = stats.total > 0 ? ((stats.blueChests / stats.total) * 100).toFixed(1) : '0.0';

    // Advanced Stats Calculation
    const advancedStats = useMemo(() => {
        const now = new Date();
        const todayLogs = logs.filter(l => isToday(parseISO(l.timestamp)));
        const monthLogs = logs.filter(l => isSameMonth(parseISO(l.timestamp), now));

        const getStats = (currentLogs: HihiLog[]) => {
            const total = currentLogs.length;
            const blue = currentLogs.filter(l => l.hasBlueChest).length;
            const hihi = currentLogs.filter(l => l.itemType === 'hihi').length;
            const eikou = currentLogs.filter(l => l.ringType === 'eikou').length;
            const hajyou = currentLogs.filter(l => l.ringType === 'hajyou').length;
            const shigoku = currentLogs.filter(l => l.ringType === 'shigoku').length;

            return {
                total,
                blue,
                hihi,
                eikou,
                hajyou,
                shigoku,
                hihiRate: total > 0 ? ((hihi / total) * 100).toFixed(2) : '0.00',
                eikouRate: total > 0 ? ((eikou / total) * 100).toFixed(2) : '0.00',
                hajyouRate: total > 0 ? ((hajyou / total) * 100).toFixed(2) : '0.00',
                shigokuRate: total > 0 ? ((shigoku / total) * 100).toFixed(2) : '0.00',
                blueRate: total > 0 ? ((blue / total) * 100).toFixed(1) : '0.0',
            };
        };

        return {
            today: getStats(todayLogs),
            month: getStats(monthLogs),
            overall: getStats(logs)
        };
    }, [logs]);

    // Calendar Logic
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const hasHihiOnDay = (day: Date) => {
        return logs.some(log => {
            const logDate = parseISO(log.timestamp);
            return isSameDay(logDate, day) && log.itemType === 'hihi';
        });
    };

    return (
        <main className="min-h-screen bg-slate-50 p-6 md:p-12 pb-32 text-slate-900 font-sans">
            <div className="max-w-6xl mx-auto space-y-10">
                <div className="flex justify-between items-center">
                    <button onClick={() => router.push('/')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                        <ChevronLeft size={20} />
                        ポータルへ戻る
                    </button>

                    <button
                        onClick={() => setShowDetailedStats(!showDetailedStats)}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all shadow-sm border ${showDetailedStats ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                        {showDetailedStats ? <Activity size={18} /> : <BarChart3 size={18} />}
                        {showDetailedStats ? '簡易表示に切替' : '詳細統計を表示'}
                    </button>
                </div>

                <header className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 p-10 rounded-[40px] shadow-2xl text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                    <div className="relative z-10 space-y-2 text-center md:text-left">
                        <h1 className="text-4xl font-black tracking-tighter">ヒヒ堀り統計</h1>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center md:justify-start gap-2">
                            <Zap size={14} className="text-amber-400" />
                            Real-time Drop Analytics
                        </p>
                    </div>

                    <div className="flex gap-10 items-center relative z-10">
                        <div className="text-center">
                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">前回ドロップから</p>
                            <div className="flex items-center justify-center gap-2 text-amber-400">
                                <Flame size={20} />
                                <p className="text-4xl font-black">{stats.currentStreak - 1}<span className="text-lg text-yellow-400">回</span></p>
                            </div>
                        </div>
                        <div className="w-px h-12 bg-white/10 hidden md:block"></div>
                        <div className="text-center">
                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">ドロップ率</p>
                            <p className="text-4xl font-black text-blue-400">{dropRate}<span className="text-lg opacity-50">%</span></p>
                        </div>
                        <div className="w-px h-12 bg-white/10 hidden md:block"></div>
                        <div className="text-center">
                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">総試行回数</p>
                            <p className="text-4xl font-black">{stats.total}</p>
                        </div>
                    </div>
                </header>

                {showDetailedStats && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                        {/* Overall Detailed */}
                        <section className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                            <h3 className="text-lg font-black flex items-center gap-2 border-b border-slate-50 pb-4">
                                <PieChart className="text-blue-500" size={20} />
                                アイテム別ドロップ率
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'ヒヒイロカネ', count: advancedStats.overall.hihi, rate: advancedStats.overall.hihiRate, color: 'text-amber-500' },
                                    { label: '至極の指輪', count: advancedStats.overall.shigoku, rate: advancedStats.overall.shigokuRate, color: 'text-indigo-500' },
                                    { label: '覇業の指輪', count: advancedStats.overall.hajyou, rate: advancedStats.overall.hajyouRate, color: 'text-blue-500' },
                                    { label: '栄冠の指輪', count: advancedStats.overall.eikou, rate: advancedStats.overall.eikouRate, color: 'text-slate-500' },
                                ].map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <span className="font-bold text-slate-500">{item.label}</span>
                                        <div className="text-right">
                                            <span className={`font-black ${item.color} mr-2`}>{item.count}</span>
                                            <span className="text-xs font-black text-slate-400">({item.rate}%)</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Time period Breakdown */}
                        {[
                            { title: '本日', data: advancedStats.today, icon: <Activity className="text-green-500" /> },
                            { title: '今月', data: advancedStats.month, icon: <CalendarIcon className="text-indigo-500" /> }
                        ].map((period, idx) => (
                            <section key={idx} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                                <h3 className="text-lg font-black flex items-center gap-2 border-b border-slate-50 pb-4">
                                    {period.icon}
                                    {period.title}の集計
                                </h3>
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div className="bg-slate-50 p-4 rounded-2xl">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">試行</p>
                                        <p className="text-2xl font-black">{period.data.total}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">青箱率</p>
                                        <p className="text-2xl font-black text-blue-500">{period.data.blueRate}%</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ヒヒ数</p>
                                        <p className="text-2xl font-black text-amber-500">{period.data.hihi}</p>
                                    </div>
                                    <div className="bg-yellow-500 p-4 rounded-2xl flex flex-col justify-center items-center shadow-lg shadow-blue-100">
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest mb-1">ヒヒ率</span>
                                        <span className="text-2xl font-black text-white">{period.data.hihiRate}%</span>
                                    </div>
                                </div>
                            </section>
                        ))}
                    </div>
                )}

                <div className="grid lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-8">
                        <section className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black flex items-center gap-3">
                                    <Trophy className="text-blue-500" />
                                    ドロップ登録
                                </h2>
                                <div className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-sm font-black">
                                    Next: {stats.currentStreak} 回目
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[15px] font-black text-slate-600 uppercase tracking-widest px-1">Step 1: 青箱ドロップ</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => { setHasBlueChest(true); setItemType(null); }}
                                            className={`py-4 rounded-2xl font-black text-sm transition-all border-2 ${hasBlueChest === true ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-blue-200'}`}
                                        >
                                            あり
                                        </button>
                                        <button
                                            onClick={() => { setHasBlueChest(false); setItemType('none'); }}
                                            className={`py-4 rounded-2xl font-black text-sm transition-all border-2 ${hasBlueChest === false ? 'bg-slate-800 border-slate-800 text-white shadow-lg shadow-slate-200' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-300'}`}
                                        >
                                            なし
                                        </button>
                                    </div>
                                </div>

                                {hasBlueChest === true && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <label className="text-[15px] font-black text-slate-600 uppercase tracking-widest px-1">Step 2: ドロップ内容</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => { setItemType('hihi'); setRingType(null); }}
                                                className={`py-4 rounded-2xl font-black text-sm transition-all border-2 ${itemType === 'hihi' ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-100' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-amber-200'}`}
                                            >
                                                ヒヒイロカネ
                                            </button>
                                            <button
                                                onClick={() => setItemType('ring')}
                                                className={`py-4 rounded-2xl font-black text-sm transition-all border-2 ${itemType === 'ring' ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-blue-200'}`}
                                            >
                                                指輪
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {itemType === 'ring' && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <label className="text-[15px] font-black text-slate-600 uppercase tracking-widest px-1">Step 3: 指輪の種類</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            <button
                                                onClick={() => setRingType('eikou')}
                                                className={`py-4 rounded-2xl font-black text-xs transition-all border-2 ${ringType === 'eikou' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-200'}`}
                                            >
                                                栄冠
                                            </button>
                                            <button
                                                onClick={() => setRingType('hajyou')}
                                                className={`py-4 rounded-2xl font-black text-xs transition-all border-2 ${ringType === 'hajyou' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-200'}`}
                                            >
                                                覇業
                                            </button>
                                            <button
                                                onClick={() => setRingType('shigoku')}
                                                className={`py-4 rounded-2xl font-black text-xs transition-all border-2 ${ringType === 'shigoku' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-indigo-200'}`}
                                            >
                                                至極
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleRegister}
                                    disabled={hasBlueChest === null || (hasBlueChest === true && !itemType) || (itemType === 'ring' && !ringType)}
                                    className="w-full bg-slate-900 disabled:bg-slate-200 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:pointer-events-none mt-4"
                                >
                                    登録を確定する
                                </button>
                            </div>
                        </section>

                        {/* History Section */}
                        <section className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col h-[600px]">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-black flex items-center gap-3">
                                    <History className="text-amber-500" />
                                    履歴
                                </h2>
                                <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <span>青箱率: {blueChestRate}%</span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                {logs.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2 opacity-50">
                                        <Info size={32} />
                                        <p className="font-bold text-sm uppercase tracking-widest">No Logs Yet</p>
                                    </div>
                                ) : (
                                    logs.map((log) => (
                                        <div key={log.id} className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between group hover:bg-slate-100 transition-colors relative">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${log.itemType === 'hihi' ? 'bg-amber-100 text-amber-600' : 'bg-white text-slate-400'}`}>
                                                    {log.count}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-sm font-black ${log.itemType === 'hihi' ? 'text-amber-600' : 'text-slate-700'}`}>
                                                            {log.itemType === 'hihi' ? 'ヒヒイロカネ' : log.itemType === 'ring' ? (log.ringType === 'shigoku' ? '至極の指輪' : log.ringType === 'hajyou' ? '覇業の指輪' : '栄冠の指輪') : 'ドロップなし'}
                                                        </span>
                                                        {!log.hasBlueChest && <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">No Blue</span>}
                                                    </div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {format(parseISO(log.timestamp), 'yyyy/MM/dd HH:mm')}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteLog(log.id)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all"
                                                title="この履歴を削除"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar Area (4 cols) */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Calendar Card (Smaller size) */}
                        <section className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-black flex items-center gap-2">
                                    <CalendarIcon className="text-indigo-500" size={20} />
                                    カレンダー
                                </h2>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="font-black text-slate-700 text-xs min-w-[80px] text-center">
                                        {format(currentMonth, 'yyyy/MM', { locale: ja })}
                                    </span>
                                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                                {['日', '月', '火', '水', '木', '金', '土'].map(day => (
                                    <div key={day} className="text-center text-[9px] font-black text-slate-400 py-1 uppercase tracking-widest">{day}</div>
                                ))}
                                {calendarDays.map((day, i) => {
                                    const hihiDropped = hasHihiOnDay(day);
                                    return (
                                        <div
                                            key={i}
                                            className={`
                        aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all border
                        ${!isSameMonth(day, monthStart) ? 'opacity-10 pointer-events-none' : ''}
                        ${hihiDropped ? 'bg-amber-100 border-amber-300 shadow-sm' : 'bg-slate-50 border-slate-50'}
                      `}
                                        >
                                            <span className={`text-[10px] font-bold ${hihiDropped ? 'text-amber-700' : 'text-slate-400'}`}>{format(day, 'd')}</span>
                                            {hihiDropped && (
                                                <div className="absolute top-0.5 right-0.5">
                                                    <Trophy size={8} className="text-amber-500 fill-amber-500" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Danger Zone / Reset Card */}
                        <section className="bg-red-50 p-8 rounded-[32px] border border-red-100 shadow-inner space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center">
                                    <Trash2 size={16} />
                                </div>
                                <h3 className="text-sm font-black text-red-800 uppercase tracking-widest">データ削除</h3>
                            </div>
                            <p className="text-xs text-red-600/80 font-medium leading-relaxed">全ての統計を削除します。</p>
                            <button
                                onClick={() => {
                                    if (confirm('【重要】全ての統計と履歴をリセットしますか？この操作は取り消せません。')) {
                                        setLogs([]);
                                        mockDB.saveHihiLogs([]);
                                        calculateStats([]);
                                    }
                                }}
                                className="w-full py-4 bg-white border-2 border-red-200 text-red-600 rounded-2xl font-black text-sm hover:bg-red-600 hover:text-white hover:border-red-600 transition-all active:scale-95 shadow-sm"
                            >
                                全データを初期化する
                            </button>
                        </section>

                        {/* Info Card */}
                        <footer className="bg-blue-50/50 p-6 rounded-[32px] border border-blue-100/50 flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                                    <Info size={16} />
                                </div>
                                <p className="text-xs font-black text-blue-800 uppercase tracking-widest">About Stats</p>
                            </div>
                            <p className="text-sm text-blue-600/80 font-medium leading-relaxed italic">
                                「詳細統計」ボタンを押すと、当日・当月の動向や、指輪の種類別のドロップ率を確認できます。
                            </p>
                        </footer>
                    </div>
                </div>
            </div>
            {showCelebration && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
                    <div className="bg-white/90 backdrop-blur-md px-12 py-8 rounded-[40px] shadow-2xl border border-amber-200 animate-in zoom-in duration-500 flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center animate-bounce">
                            <Trophy size={48} />
                        </div>
                        <div className="text-center">
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-1">おめでとうございます！</h2>
                            <p className="text-amber-600 font-black text-lg">ヒヒイロカネ ドロップ確定！</p>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
