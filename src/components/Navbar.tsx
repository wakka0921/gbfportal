"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Menu, X, User as UserIcon, LogIn, LogOut, Bell } from 'lucide-react';
import * as actions from '@/lib/actions';

const navItems = [
    { name: 'ホーム', href: '/' },
    { name: '目標管理ツール', href: '/tracker' },
    { name: '日課リスト', href: '/daily' },
    { name: 'ヒヒ堀りツール', href: '/hihi' },
    { name: '古戦場貢献度計算機', href: '/calculator' },
];

function NavbarContent() {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<{ id: string, username: string, adminflg?: string } | null>(null);
    const [showLogoutToast, setShowLogoutToast] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const currentUser = await actions.getCurrentUser();
            setUser(currentUser);
        };
        checkUser();

        if (searchParams.get('logout') === 'true') {
            setShowLogoutToast(true);
            const timer = setTimeout(() => {
                setShowLogoutToast(false);
                // Clean up URL
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [searchParams]);

    const handleLogout = async () => {
        await actions.logout();
        window.location.href = '/?logout=true';
    };

    const allNavItems = [...navItems];
    if (user?.adminflg === '1') {
        allNavItems.push({ name: '団員名簿', href: '/admin/guild' });
        allNavItems.push({ name: '管理者ページ', href: '/admin' });
    }

    return (
        <>
            {/* Logout Notification Toast */}
            {showLogoutToast && (
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] animate-in zoom-in duration-300">
                    <div className="bg-red-500 text-white px-10 py-6 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(239,68,68,0.5)] flex flex-col items-center gap-4 border border-red-400 backdrop-blur-sm">
                        <div className="bg-white/20 p-4 rounded-full">
                            <Bell size={40} className="animate-bounce" />
                        </div>
                        <div className="text-center">
                            <p className="font-black text-2xl tracking-tight">ログアウトしました</p>
                            <p className="text-xs opacity-70 font-bold uppercase tracking-widest mt-1">Logged out successfully</p>
                        </div>
                    </div>
                </div>
            )}

            <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center space-x-2">
                            {allNavItems.map((item, idx) => (
                                <React.Fragment key={item.href}>
                                    {idx > 0 && <div className="w-px h-4 bg-slate-200 mx-2" />}
                                    <Link
                                        href={item.href}
                                        className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors group relative"
                                    >
                                        {item.name}
                                        <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
                                    </Link>
                                </React.Fragment>
                            ))}
                        </nav>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="p-2 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors"
                                aria-label="メニューを開く"
                            >
                                {isOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>

                        {/* Auth Status (Right Side) */}
                        <div className="flex items-center gap-2 md:gap-3">
                            {user ? (
                                <>
                                    <Link
                                        href="/tracker"
                                        className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 hover:bg-indigo-100 transition-all group"
                                    >
                                        <UserIcon size={16} className="group-hover:scale-110 transition-transform" />
                                        <span className="text-xs md:text-sm font-black truncate max-w-[80px] md:max-w-[120px]">{user.username}</span>
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 md:px-3 md:py-2 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all group"
                                        title="ログアウト"
                                    >
                                        <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                </>
                            ) : (
                                <Link
                                    href="/login"
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs md:text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-100"
                                >
                                    <LogIn size={16} />
                                    <span>ログイン</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation Dropdown */}
                <div
                    className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out bg-white border-t border-slate-50 ${isOpen ? 'max-h-64' : 'max-h-0'}`}
                >
                    <nav className="p-4 space-y-1">
                        {allNavItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className="block px-4 py-3 text-base font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-all"
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>
                </div>
            </header>
        </>
    );
}

export default function Navbar() {
    return (
        <Suspense>
            <NavbarContent />
        </Suspense>
    );
}
