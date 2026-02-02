"use client";

import React, { useMemo } from 'react';
import { format, addDays, eachDayOfInterval, isWithinInterval, startOfDay, differenceInDays } from 'date-fns';
import { Goal, Material } from '@/types';
import { cn } from '@/lib/utils';

interface GanttChartProps {
    goal: Goal;
}

export const GanttChart: React.FC<GanttChartProps> = ({ goal }) => {
    // Calculate date range
    const { minDate, maxDate } = useMemo(() => {
        let min = new Date();
        let max = addDays(new Date(), 14);

        goal.materials.forEach(m => {
            const start = new Date(m.startDate);
            const end = new Date(m.endDate);
            if (start < min) min = start;
            if (end > max) max = end;
        });

        return {
            minDate: startOfDay(min),
            maxDate: startOfDay(max)
        };
    }, [goal]);

    const days = eachDayOfInterval({ start: minDate, end: maxDate });
    const totalDays = days.length;

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                    {/* Header with Dates */}
                    <div className="grid grid-cols-[200px_1fr] border-b border-slate-100 bg-slate-50/50">
                        <div className="p-4 font-semibold text-slate-600 border-r border-slate-100">素材名称</div>
                        <div className="grid" style={{ gridTemplateColumns: `repeat(${totalDays}, 1fr)` }}>
                            {days.map(day => (
                                <div key={day.toISOString()} className="p-2 text-[10px] text-center text-slate-400 border-r border-slate-50 last:border-r-0">
                                    {format(day, 'MM/dd')}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Body with Rows */}
                    <div className="divide-y divide-slate-50">
                        {goal.materials.map(material => {
                            const start = new Date(material.startDate);
                            const end = new Date(material.endDate);
                            const duration = differenceInDays(end, start) + 1;
                            const offset = differenceInDays(start, minDate);
                            const progress = (material.current / material.target) * 100;

                            return (
                                <div key={material.id} className="grid grid-cols-[200px_1fr] hover:bg-slate-50/30 transition-colors">
                                    <div className="p-4 text-sm font-medium text-slate-700 border-r border-slate-100 flex flex-col gap-1">
                                        <span>{material.name}</span>
                                        <span className="text-[10px] text-blue-500 font-bold">
                                            {material.current} / {material.target} ({Math.round(progress)}%)
                                        </span>
                                    </div>
                                    <div className="relative h-14 bg-white/50" style={{ gridTemplateColumns: `repeat(${totalDays}, 1fr)` }}>
                                        {/* Grid lines */}
                                        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${totalDays}, 1fr)` }}>
                                            {days.map(day => (
                                                <div key={day.toISOString()} className="border-r border-slate-50 last:border-r-0 h-full" />
                                            ))}
                                        </div>

                                        {/* Progress Bar Container */}
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 h-6 bg-slate-100 rounded-full overflow-hidden"
                                            style={{
                                                left: `${(offset / totalDays) * 100}%`,
                                                width: `${(duration / totalDays) * 100}%`
                                            }}
                                        >
                                            {/* Actual Progress Fill */}
                                            <div
                                                className="h-full bg-blue-500 transition-all duration-500 ease-out"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
