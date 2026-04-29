'use client';

import React, { useState } from 'react';
import { GuildMember, GuildStats } from '@/lib/googleSheets';
import { syncGuildData } from '@/lib/actions';
import { RefreshCw, Search, Users, TrendingUp, Calendar, Hash, ExternalLink, Shield, ShieldAlert, User, CheckCircle2 } from 'lucide-react';

export default function GuildManagement() {
    const [stats, setStats] = useState<GuildStats | null>(null);
    const [members, setMembers] = useState<GuildMember[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [lastSync, setLastSync] = useState<Date | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: keyof GuildMember; direction: 'asc' | 'desc' } | null>(null);

    const handleSync = async () => {
        setLoading(true);
        const res = await syncGuildData();
        if (res.success && res.data) {
            setStats(res.data.stats);
            setMembers(res.data.members);
            setLastSync(new Date());
        } else {
            alert(res.error || '同期に失敗しました。環境変数やスプレッドシートの共有設定を確認してください。');
        }
        setLoading(false);
    };

    const handleSort = (key: keyof GuildMember) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedMembers = React.useMemo(() => {
        let sortableMembers = [...members];
        if (sortConfig !== null) {
            const rolePriority: Record<string, number> = {
                '団長': 1,
                '副団長': 2,
                '攻撃隊長': 3,
                '防衛隊長': 4,
                '団員': 5
            };

            sortableMembers.sort((a, b) => {
                let aValue: any = a[sortConfig.key];
                let bValue: any = b[sortConfig.key];

                // Custom handling for roles
                if (sortConfig.key === 'role') {
                    // Match the key in the priority map, default to 99 if not found
                    const getPriority = (val: string) => {
                        for (const key in rolePriority) {
                            if (val.includes(key)) return rolePriority[key];
                        }
                        return 99;
                    };
                    aValue = getPriority(aValue as string);
                    bValue = getPriority(bValue as string);
                }

                // Special handling for contribution (string with commas)
                if (sortConfig.key === 'contribution') {
                    aValue = parseInt((aValue as string).replace(/,/g, '')) || 0;
                    bValue = parseInt((bValue as string).replace(/,/g, '')) || 0;
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableMembers;
    }, [members, sortConfig]);

    const filteredMembers = sortedMembers.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getRoleBadge = (role: string) => {
        if (role.includes('副団長')) return <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-md text-[10px] font-black flex items-center gap-1"><Shield size={10} /> 副団長</span>;
        if (role.includes('団長')) return <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-md text-[10px] font-black flex items-center gap-1"><ShieldAlert size={10} /> 団長</span>;
        if (role.includes('隊長')) return <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded-md text-[10px] font-black flex items-center gap-1"><CheckCircle2 size={10} /> {role}</span>;
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-black flex items-center gap-1"><User size={10} /> 団員</span>;
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black flex items-center gap-2">
                        <Users className="text-[#00a1e9]" />
                        団員名簿・貢献度管理
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">ランク、役職、前回貢献度でのソート可能</p>
                </div>
                <div className="flex items-center gap-3">
                    {lastSync && (
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                            最終同期: {lastSync.toLocaleTimeString()}
                        </span>
                    )}
                    <button
                        onClick={handleSync}
                        disabled={loading}
                        className="bg-[#00a1e9] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#008bc5] transition-all shadow-lg shadow-blue-100 active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        スプシと同期
                    </button>
                </div>
            </header>

            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-1">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Calendar size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">最終更新日</span>
                        </div>
                        <div className="text-xl font-black text-slate-800">{stats.lastUpdated}</div>
                        <div className="text-[10px] text-slate-400 font-bold italic">前回: {stats.prevUpdated}</div>
                    </div>
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-1">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Users size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">団員数</span>
                        </div>
                        <div className="text-xl font-black text-slate-800">{stats.memberCount} <span className="text-sm text-slate-400">人</span></div>
                        <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(stats.memberCount / 30) * 100}%` }} />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-1">
                        <div className="flex items-center gap-2 text-slate-400">
                            <TrendingUp size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">平均ランク</span>
                        </div>
                        <div className="text-xl font-black text-slate-800">{stats.averageRank}</div>
                    </div>
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-1">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Shield size={14} className="text-indigo-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest">団順位</span>
                        </div>
                        <div className="text-xl font-black text-indigo-500">{stats.guildRank}</div>
                    </div>
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-1 overflow-hidden relative">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Hash size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">直近団貢献度</span>
                        </div>
                        <div className="text-lg font-black text-slate-800 truncate">{stats.totalContribution}</div>
                        <div className="absolute -right-4 -bottom-4 opacity-5 text-slate-900 italic font-black text-4xl">GW</div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden">
                <div className="p-4 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="名前で検索..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-[#00a1e9] outline-none transition-all"
                        />
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        表示中: <span className="text-slate-800">{filteredMembers.length}</span> / {members.length} 名
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left min-w-[1000px]">
                        <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                            <tr>
                                <th className="px-6 py-4">団員名 / X ID</th>
                                <th
                                    className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                                    onClick={() => handleSort('role')}
                                >
                                    <div className="flex items-center gap-1">
                                        役職
                                        {sortConfig?.key === 'role' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-center cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                                    onClick={() => handleSort('rank')}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        ランク
                                        {sortConfig?.key === 'rank' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-center">前回差</th>
                                <th className="px-6 py-4">GBF ID</th>
                                <th
                                    className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                                    onClick={() => handleSort('contribution')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        貢献度
                                        {sortConfig?.key === 'contribution' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </div>
                                </th>
                                <th className="px-6 py-4">年齢帯</th>
                                <th className="px-6 py-4">メモ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredMembers.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center text-slate-400 font-bold italic">
                                        {members.length === 0 ? '「スプシと同期」ボタンを押してデータを取得してください' : '該当する団員が見つかりません'}
                                    </td>
                                </tr>
                            ) : (
                                filteredMembers.map((m, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-800">{m.name}</span>
                                                <a href={m.twitterId.startsWith('http') ? m.twitterId : `https://x.com/${m.twitterId.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-[10px] font-bold flex items-center gap-1 hover:underline">
                                                    {m.twitterId} <ExternalLink size={8} />
                                                </a>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getRoleBadge(m.role)}
                                        </td>
                                        <td className="px-6 py-4 text-center font-black text-slate-700">
                                            {m.rank}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {m.rankDiff > 0 ? (
                                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black">
                                                    +{m.rankDiff}
                                                </span>
                                            ) : m.rankDiff < 0 ? (
                                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-[10px] font-black">
                                                    {m.rankDiff}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 text-[10px] font-black">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-slate-400 group-hover:text-slate-600 transition-colors">
                                            {m.gbfId}
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-slate-800 tabular-nums">
                                            {m.contribution}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.ageGroup.includes('社会人') ? 'bg-red-50 text-red-400' : 'bg-blue-50 text-blue-400'}`}>
                                                {m.ageGroup}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed italic">{m.memo}</p>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
