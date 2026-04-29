'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as actions from '@/lib/actions';
import GuildManagement from '../GuildManagement';
import { ChevronLeft, ShieldCheck } from 'lucide-react';

export default function GuildAdminPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAdmin = async () => {
            const user = await actions.getCurrentUser();
            if (user?.adminflg !== '1') {
                router.push('/');
                return;
            }
            setLoading(false);
        };
        checkAdmin();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 p-6 md:p-12 pb-32">
            <div className="max-w-7xl mx-auto space-y-8">


                <div className="bg-white/40 backdrop-blur-md rounded-[3rem] p-4 md:p-8 border border-white shadow-xl shadow-slate-200/50">
                    <GuildManagement />
                </div>
            </div>
        </main>
    );
}
