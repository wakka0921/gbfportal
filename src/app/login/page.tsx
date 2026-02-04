"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, User, Lock, ArrowRight, Loader2 } from 'lucide-react';
import * as actions from '@/lib/actions';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const res = await actions.login(username, password);
        if (res.success) {
            window.location.href = '/';
        } else {
            setError(res.error || 'ログインに失敗しました。');
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2.5rem] bg-indigo-50 text-indigo-600 mb-6 group hover:scale-110 transition-transform duration-500">
                        <LayoutDashboard size={40} className="group-hover:rotate-12 transition-transform" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Login Portal</h1>
                    <p className="text-slate-500 font-medium">アカウントにログインして目標を管理</p>
                </div>

                <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 uppercase tracking-widest pl-1">Username</label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 pl-12 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all font-bold text-slate-700"
                                    placeholder="ユーザー名を入力"
                                />
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 uppercase tracking-widest pl-1">Password</label>
                            <div className="relative group">
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 pl-12 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all font-bold text-slate-700"
                                    placeholder="パスワードを入力"
                                />
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-500 p-4 rounded-xl text-xs font-bold animate-shake">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black shadow-xl shadow-slate-100 transition-all active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    ログイン
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-200 text-center">
                        <p className="text-sm text-slate-400 font-medium">
                            アカウントをお持ちでないですか？
                            <button
                                onClick={() => router.push('/register')}
                                className="text-indigo-600 font-black ml-2 hover:underline"
                            >
                                新規登録はこちら
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
