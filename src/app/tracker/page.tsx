"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, PlusCircle, Target, User, Loader2 } from 'lucide-react';
import * as actions from '@/lib/actions';

export default function TrackerHome() {
    const [user, setUser] = useState<{ id: string, username: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const currentUser = await actions.getCurrentUser();
            setUser(currentUser);
            setLoading(false);
        };
        checkUser();
    }, []);

    const handleLogout = async () => {
        await actions.logout();
        window.location.href = '/?logout=true';
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={40} />
            </main>
        );
    }

    if (!user) {
        return (
            <main className="min-h-screen bg-white text-slate-900 flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-md text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="space-y-4">
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2.5rem] bg-indigo-50 text-indigo-600 mb-6 border-4 border-white shadow-xl">
                            <LayoutDashboard size={48} />
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900">グラブル目標管理ツール</h1>
                        <p className="text-slate-500 font-medium text-lg leading-relaxed">
                            目標を管理して、効率よく素材を集めましょう。
                        </p>
                    </div>

                    <div className="grid gap-4">
                        <button
                            onClick={() => router.push('/login')}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-[2rem] font-black shadow-2xl shadow-slate-200 transition-all active:scale-95 text-lg"
                        >
                            ログイン
                        </button>
                        <button
                            onClick={() => router.push('/register')}
                            className="w-full bg-white border-4 border-slate-100 hover:border-indigo-100 hover:text-indigo-600 py-5 rounded-[2rem] font-black transition-all active:scale-95 text-lg"
                        >
                            アカウントを作成
                        </button>
                    </div>

                    <div className="pt-4 flex justify-center">
                        <button
                            onClick={() => router.push('/admin')}
                            className="text-slate-200 hover:text-slate-400 transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest"
                        >
                            System Settings
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 text-indigo-600 font-black uppercase tracking-widest text-xs mb-1">
                            <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                            トップページ
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                            ようこそ <span className="text-indigo-600 underline decoration-indigo-100 underline-offset-8">{user.username}</span>
                        </h1>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 bg-white px-6 py-3 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all"
                    >
                        <LogOut size={18} />
                        ログアウト
                    </button>
                </header>

                <div className="grid md:grid-cols-2 gap-8">
                    <button
                        onClick={() => router.push('/goals')}
                        className="group bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all duration-500 text-left flex flex-col justify-between h-[320px] relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50 rounded-full -mr-24 -mt-24 opacity-0 group-hover:opacity-100 transition-all duration-700 scale-50 group-hover:scale-100" />
                        <Target size={48} className="text-indigo-600 mb-auto relative z-10" />
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black text-slate-800 mb-3">目標一覧を表示</h2>
                            <p className="text-slate-400 font-medium leading-relaxed">
                                登録済みの素材収集目標を<br />確認・更新します。
                            </p>
                        </div>
                    </button>

                    <button
                        onClick={() => router.push('/create')}
                        className="group bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-emerald-200 transition-all duration-500 text-left flex flex-col justify-between h-[320px] relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-full -mr-24 -mt-24 opacity-0 group-hover:opacity-100 transition-all duration-700 scale-50 group-hover:scale-100" />
                        <PlusCircle size={48} className="text-emerald-500 mb-auto relative z-10" />
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black text-slate-800 mb-3">新しい目標を登録</h2>
                            <p className="text-slate-400 font-medium leading-relaxed">
                                必要な素材を選択して<br />新しい目標を作成します。
                            </p>
                        </div>
                    </button>
                </div>

                <div className="pt-8 text-center">
                    <button
                        onClick={() => router.push('/')}
                        className="text-slate-300 hover:text-slate-500 transition-colors font-black uppercase tracking-[0.2em] text-[10px]"
                    >
                        {/* Back to Portal Home */}
                    </button>
                </div>
            </div>
        </main>
    );
}
