"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Construction, Clock } from 'lucide-react';

export default function DailyTasksPage() {
    const router = useRouter();

    return (
        <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="relative inline-flex mb-4">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-pulse" />
                    <div className="relative bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 text-blue-600">
                        <Construction size={64} />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-amber-400 p-3 rounded-2xl shadow-lg border-4 border-white text-white rotate-12">
                        <Clock size={24} />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">日課リスト</h1>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-ping" />
                        Under Construction
                    </div>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed">
                        現在開発中です。<br />

                    </p>
                </div>

                <div className="pt-8">
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black transition-all group mx-auto"
                    >
                        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        トップページへ戻る
                    </button>
                </div>
            </div>

            {/* Background Decorative Elements */}
            <div className="fixed top-1/4 left-10 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
            <div className="fixed bottom-1/4 right-10 w-64 h-64 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        </main>
    );
}
