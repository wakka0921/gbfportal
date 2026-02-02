"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

const navItems = [
    { name: 'ホーム', href: '/' },
    { name: '目標管理ツール', href: '/tracker' },
    { name: 'ヒヒ堀りツール', href: '/hihi' },
    { name: '古戦場貢献度計算機', href: '/calculator' },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-2">
                        {navItems.map((item, idx) => (
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

                    {/* Mobile Logo/Title (Optional, adding a small indicator) */}
                    <div className="md:hidden font-black text-slate-800 tracking-tighter">
                        栄枯必衰 Portal
                    </div>

                    <div className="hidden md:block">
                        {/* Placeholder for potential right-side items like Profile/Settings */}
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Dropdown */}
            <div
                className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out bg-white border-t border-slate-50 ${isOpen ? 'max-h-64' : 'max-h-0'}`}
            >
                <nav className="p-4 space-y-1">
                    {navItems.map((item) => (
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
    );
}
