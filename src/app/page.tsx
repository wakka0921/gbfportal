"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Calculator, Zap, Globe,
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info
} from 'lucide-react';
import { mockDB } from '@/lib/db';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths,
  parseISO, isWithinInterval, addDays, startOfDay
} from 'date-fns';
import { ja } from 'date-fns/locale';
import * as actions from '@/lib/actions';
import { PortalEvent } from '@/lib/actions';

export default function PortalHome() {
  const router = useRouter();
  const [events, setEvents] = useState<PortalEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const fetchEvents = async () => {
      const data = await actions.getEvents();
      setEvents(data);
    };
    fetchEvents();
  }, []);

  const tools = [
    {
      title: 'グラブル目標管理ツール',
      description: '素材集めや装備作成の進捗をパスワードで管理。',
      icon: <LayoutDashboard size={32} />,
      path: '/tracker',
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      lightColor: 'bg-blue-50',
    },
    {
      title: '古戦場貢献度計算機',
      description: '必要貢献度や討伐数をシミュレーション。',
      icon: <Calculator size={32} />,
      path: '/calculator',
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      lightColor: 'bg-amber-50',
    },
    {
      title: 'ヒヒ堀りツール',
      description: 'ドロップデータを集計・分析。試行回数や確率を自動計算。',
      icon: <Zap size={32} />,
      path: '/hihi',
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600',
      lightColor: 'bg-indigo-50',
    },
  ];

  // Calendar Logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Lane Calculation for events
  const eventLanes = useMemo(() => {
    const lanes: { [eventId: string]: number } = {};
    const occupiedLanesByDay: { [day: string]: Set<number> } = {};

    const sortedEvents = [...events].sort((a, b) => {
      const aStart = parseISO(a.startDate).getTime();
      const bStart = parseISO(b.startDate).getTime();
      if (aStart !== bStart) return aStart - bStart;
      const aDur = parseISO(a.endDate).getTime() - aStart;
      const bDur = parseISO(b.endDate).getTime() - bStart;
      return bDur - aDur;
    });

    sortedEvents.forEach(ev => {
      const start = startOfDay(parseISO(ev.startDate));
      const end = startOfDay(parseISO(ev.endDate));
      let lane = 0;
      let foundLane = false;

      while (!foundLane) {
        let isAvailable = true;
        let current = new Date(start);
        while (current <= end) {
          const dayStr = format(current, 'yyyy-MM-dd');
          if (occupiedLanesByDay[dayStr]?.has(lane)) {
            isAvailable = false;
            break;
          }
          current = addDays(current, 1);
        }

        if (isAvailable) {
          lanes[ev.id] = lane;
          let marcher = new Date(start);
          while (marcher <= end) {
            const dayStr = format(marcher, 'yyyy-MM-dd');
            if (!occupiedLanesByDay[dayStr]) occupiedLanesByDay[dayStr] = new Set();
            occupiedLanesByDay[dayStr].add(lane);
            marcher = addDays(marcher, 1);
          }
          foundLane = true;
        } else {
          lane++;
        }
      }
    });
    return lanes;
  }, [events]);

  const getEventsForDay = (day: Date) => {
    return events.filter(ev => {
      const start = startOfDay(parseISO(ev.startDate));
      const end = startOfDay(parseISO(ev.endDate));
      const target = startOfDay(day);
      return isWithinInterval(target, { start, end });
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white border-b border-slate-100">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
          <Globe className="w-[800px] h-[800px] absolute -top-40 -right-40" />
        </div>

        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32 relative z-10">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
              <Zap size={14} /> トップページ
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900">
              栄枯盛衰<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                ポータルサイト
              </span>
            </h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl">
              栄枯盛衰ポータルサイトです。
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-20 space-y-24">
        {/* Event Calendar Section */}
        <section className="space-y-8">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-900">イベントカレンダー</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">グラブルのスケジュールを確認</p>
            </div>
            <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-slate-50 rounded-lg transition-colors">
                <ChevronLeft size={20} />
              </button>
              <span className="font-black text-slate-700 min-w-[100px] text-center">
                {format(currentMonth, 'yyyy年 MM月', { locale: ja })}
              </span>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-slate-50 rounded-lg transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-7 border-b border-slate-50">
              {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
                <div key={day} className={`py-4 text-center text-[10px] font-black uppercase tracking-widest ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-400'}`}>
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays.map((day, i) => {
                const dayEvents = getEventsForDay(day);
                const isToday = isSameDay(day, new Date());

                // Sort events by lane
                const sortedDayEvents = [...dayEvents].sort((a, b) => (eventLanes[a.id] || 0) - (eventLanes[b.id] || 0));

                // Fill in empty slots up to max lane to keep consistent height
                const maxLane = Math.max(-1, ...dayEvents.map(e => eventLanes[e.id] ?? -1));
                const lanesToRender = [];
                for (let l = 0; l <= maxLane; l++) {
                  lanesToRender.push(sortedDayEvents.find(e => eventLanes[e.id] === l) || null);
                }

                return (
                  <div
                    key={i}
                    className={`min-h-[120px] pb-4 border-r border-b border-slate-50 flex flex-col gap-0 transition-colors ${!isSameMonth(day, monthStart) ? 'bg-slate-50/30' : ''} ${isToday ? 'bg-blue-50/20' : ''}`}
                  >
                    <div className="flex justify-between items-center p-2 mb-1">
                      <span className={`text-xs font-black ${!isSameMonth(day, monthStart) ? 'text-slate-200' : isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                        {format(day, 'd')}
                      </span>
                      {isToday && <span className="w-1 h-1 bg-blue-600 rounded-full"></span>}
                    </div>
                    <div className="flex flex-col gap-px flex-1">
                      {lanesToRender.map((ev, lIdx) => {
                        if (!ev) return <div key={`empty-${lIdx}`} className="h-4" />;

                        const isStart = isSameDay(parseISO(ev.startDate), day);
                        const isEnd = isSameDay(parseISO(ev.endDate), day);
                        const isSunday = format(day, 'e') === '1';
                        const isSaturday = format(day, 'e') === '7';

                        return (
                          <div
                            key={ev.id}
                            style={{ backgroundColor: ev.color }}
                            className={`
                                                    h-4 text-[9px] text-white font-black flex items-center px-1.5 truncate shadow-sm transition-all
                                                    ${isStart || isSunday ? 'rounded-l-sm ml-0.5' : '-ml-px'}
                                                    ${isEnd || isSaturday ? 'rounded-r-sm mr-0.5' : '-mr-px'}
                                                    ${!isStart && !isEnd ? 'opacity-90' : ''}
                                                `}
                            title={ev.title}
                          >
                            {(isStart || isSunday) ? ev.title : '\u00A0'}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {events.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-[40px] border border-dashed border-slate-200 text-slate-300 gap-2">
              <Info size={32} />
              <p className="text-sm font-bold uppercase tracking-widest">No Events Scheduled</p>
            </div>
          )}
        </section>

        {/* Tools Grid */}
        <section className="space-y-8">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-900">ツール一覧</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">現在提供中のサービス</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 font-sans">
            {tools.map((tool) => (
              <button
                key={tool.path}
                onClick={() => router.push(tool.path)}
                className="group bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all duration-500 text-left flex flex-col justify-between h-[280px] relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 ${tool.textColor} opacity-[0.05] group-hover:scale-150 transition-transform duration-700`}>
                  {tool.icon}
                </div>

                <div className={`w-16 h-16 ${tool.lightColor} ${tool.textColor} rounded-2xl flex items-center justify-center mb-6`}>
                  {tool.icon}
                </div>

                <div>
                  <h3 className="text-2xl font-black text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed italic line-clamp-2">
                    {tool.description}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm font-bold opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-500">
                  <span className={tool.textColor}>ツールを開く</span>
                  <Zap size={16} className={tool.textColor} />
                </div>
              </button>
            ))}
          </div>
        </section>

        <footer className="text-center py-12 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-[0.2em]">
            &copy; 2026 Eikohissui Portal Project. All Rights Reserved.
          </p>
        </footer>
      </div>
    </main>
  );
}
