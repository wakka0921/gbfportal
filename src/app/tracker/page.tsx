"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockDB } from '@/lib/db';
import { LayoutDashboard, Key, PlusCircle, Search, Settings } from 'lucide-react';

export default function TrackerHome() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSearch = () => {
        if (password.length !== 4) {
            setError('パスワードは英数字4桁で入力してください。');
            return;
        }

        const found = mockDB.findGoalsByPassword(password);
        if (found.length > 0) {
            router.push(`/goals?pw=${password}`);
        } else {
            setError('一致する目標が見つかりませんでした。');
        }
    };

    return (
        <main className="min-h-screen bg-white text-slate-900 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8 text-center">
                <div className="space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mb-4">
                        <LayoutDashboard size={32} />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">グラブル目標管理ツール</h1>
                    <p className="text-slate-500">目標を管理して、効率よく素材を集めましょう。</p>
                </div>

                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <div className="space-y-4 text-left">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <Key size={16} className="text-blue-500" />
                            登録済みの目標を呼び出す
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                maxLength={4}
                                placeholder="英数字4桁のパスワード"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError('');
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-mono"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        </div>
                        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
                        <button
                            onClick={handleSearch}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-[0.98]"
                        >
                            目標を表示する
                        </button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-50 px-2 text-slate-400">または</span></div>
                    </div>

                    <button
                        onClick={() => router.push('/create')}
                        className="w-full bg-white border-2 border-slate-200 hover:border-blue-400 hover:text-blue-600 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                        <PlusCircle size={20} />
                        新しい目標を登録する
                    </button>
                </div>

                <p className="text-[10px] text-slate-300">
                    ※本アプリはパスワードのみで管理されます。パスワードを忘れないようご注意ください。
                </p>

                <div className="pt-4 flex justify-center">
                    <button
                        onClick={() => router.push('/admin')}
                        className="text-slate-200 hover:text-slate-400 transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest"
                    >
                        <Settings size={12} />
                        System Settings
                    </button>
                </div>
            </div>
        </main>
    );
}
