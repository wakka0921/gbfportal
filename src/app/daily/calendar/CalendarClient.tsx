'use client';

import React, { useState } from 'react';
import { getCalendarCompletion } from '../actions';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, ArrowLeft, Calendar as CalendarIcon, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

type LogItem = {
    completed_at: string; // ISO String from DB
    completed_count: string | number;
};

export default function CalendarClient({ initialData, initialDateStr }: { initialData: { totalConfigs: number, logs: LogItem[] }, initialDateStr: string }) {
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState(new Date(initialDateStr + '-01'));
    const [data, setData] = useState(initialData);
    const [isLoading, setIsLoading] = useState(false);

    const handleMonthChange = async (dir: 1 | -1) => {
        setIsLoading(true);
        const newDate = dir === 1 ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
        setCurrentDate(newDate);

        const targetStr = format(newDate, 'yyyy-MM');
        const newData = await getCalendarCompletion(targetStr);
        setData(newData as { totalConfigs: number, logs: LogItem[] });
        setIsLoading(false);
    };

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // 前月・来月の日付を埋めるためのパディング
    const startDayOfWeek = monthStart.getDay(); 
    const prefixDays = Array.from({ length: startDayOfWeek }).map((_, i) => i);
    const endDayOfWeek = monthEnd.getDay();
    const suffixDays = Array.from({ length: 6 - endDayOfWeek }).map((_, i) => i);

    return (
        <div className="max-w-4xl mx-auto w-full p-6 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push('/daily')}
                        className="p-2 border border-slate-200 rounded-full hover:bg-slate-50 transition text-slate-500"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-3xl font-black text-[#00a1e9] tracking-tight flex items-center gap-2">
                        <CalendarIcon size={32} /> 達成カレンダー
                    </h1>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100">
                <div className="flex items-center justify-between mb-8">
                    <button 
                        onClick={() => handleMonthChange(-1)} 
                        disabled={isLoading}
                        className="p-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition disabled:opacity-50"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h2 className="text-2xl font-black text-slate-800 tracking-wider">
                        {format(currentDate, 'yyyy年 M月', { locale: ja })}
                    </h2>
                    <button 
                        onClick={() => handleMonthChange(1)} 
                        disabled={isLoading}
                        className="p-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition disabled:opacity-50"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2 md:gap-4 mb-2">
                    {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
                        <div key={d} className={`text-center font-bold text-sm ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-400'}`}>
                            {d}
                        </div>
                    ))}
                </div>

                <div className={`grid grid-cols-7 gap-2 md:gap-4 transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                    {prefixDays.map(i => (
                        <div key={`prefix-${i}`} className="aspect-square rounded-2xl bg-slate-50/50 border border-transparent" />
                    ))}
                    
                    {daysInMonth.map(day => {
                        // find log for this day
                        const dateStr = format(day, 'yyyy-MM-dd');
                        // DateのパースやTypeScript型エラーを回避
                        const log = (data.logs || []).find(l => {
                            if (!l.completed_at) return false;
                            try {
                                const dStr = format(new Date(l.completed_at), 'yyyy-MM-dd');
                                return dStr === dateStr;
                            } catch {
                                return false;
                            }
                        });

                        
                        const completedCount = log ? Number(log.completed_count) : 0;
                        const totalConfigs = data.totalConfigs || 0;
                        const isCompleted = totalConfigs > 0 && completedCount >= totalConfigs;
                        const isPartial = totalConfigs > 0 && completedCount > 0 && completedCount < totalConfigs;
                        const isTodayMarker = isToday(day);

                        return (
                            <div 
                                key={dateStr}
                                className={`
                                    relative aspect-square rounded-2xl border flex flex-col items-center justify-center p-2 transition-all cursor-default
                                    ${isCompleted ? 'bg-[#00a1e9] border-[#008bc5] shadow-md shadow-blue-200 text-white transform hover:scale-[1.02]' : 
                                      isPartial ? 'bg-blue-50 border-[#00a1e9]/30 text-slate-700' : 
                                      'bg-white border-slate-100 text-slate-600 hover:border-slate-300'}
                                    ${isTodayMarker && !isCompleted ? 'ring-2 ring-amber-400 ring-offset-2' : ''}
                                `}
                            >
                                <span className={`text-lg font-black ${isCompleted ? 'text-white' : ''}`}>
                                    {format(day, 'd')}
                                </span>
                                
                                {isCompleted && (
                                    <div className="absolute top-1 right-1 text-white opacity-80 animate-in fade-in zoom-in">
                                        <CheckCircle size={14} className="fill-current text-[#008bc5]" />
                                    </div>
                                )}
                                
                                <div className={`text-[10px] sm:text-xs font-bold mt-1 ${isCompleted ? 'text-blue-100' : 'text-slate-400'}`}>
                                    {totalConfigs > 0 ? `${completedCount}/${totalConfigs}` : '-'}
                                </div>
                            </div>
                        );
                    })}

                    {suffixDays.map(i => (
                        <div key={`suffix-${i}`} className="aspect-square rounded-2xl bg-slate-50/50 border border-transparent" />
                    ))}
                </div>

                {data.totalConfigs === 0 && (
                    <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-700 text-sm font-bold text-center">
                        <CalendarIcon size={18} className="inline mr-2 -mt-1" />
                        まだ日課が設定されていません。カスタマイズ画面から追加してください。
                    </div>
                )}
            </div>

            {/* Background Decor */}
            <div className="fixed top-1/4 left-10 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none -z-10" />
            <div className="fixed bottom-1/4 right-10 w-64 h-64 bg-amber-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none -z-10 animation-delay-2000" />
        </div>
    );
}
