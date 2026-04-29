"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mockDB } from '@/lib/db';
import { Template, Material } from '@/types';
import { ChevronLeft, Plus, Save, Trash2, Settings, Database, FileText, Lock, Calendar as CalendarIcon, RefreshCw, Search, ChevronDown, ChevronRight } from 'lucide-react';
import * as actions from '@/lib/actions';

const EVENT_COLORS = [
    { label: '火 (赤)', value: '#ef4444' },
    { label: '水 (青)', value: '#3b82f6' },
    { label: '土 (橙)', value: '#f97316' },
    { label: '風 (緑)', value: '#22c55e' },
    { label: '光 (黄)', value: '#eab308' },
    { label: '闇 (紫)', value: '#a855f7' },
    { label: 'キャンペーン (灰)', value: '#64748b' },
    { label: 'その他 (灰)', value: '#94a3b8' },
];

export default function AdminDashboard() {
    const router = useRouter();
    const [masterMaterials, setMasterMaterials] = useState<any[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(false);
    const [isMaterialsCollapsed, setIsMaterialsCollapsed] = useState(true);
    const [materialSearchQuery, setMaterialSearchQuery] = useState('');
    const [templateSearchQueries, setTemplateSearchQueries] = useState<{ [key: string]: string }>({});
    const [displayLimit, setDisplayLimit] = useState<number>(50);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [expandedTemplates, setExpandedTemplates] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        setCurrentPage(1);
    }, [materialSearchQuery, displayLimit]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const user = await actions.getCurrentUser();
            if (user?.adminflg !== '1') {
                router.push('/');
                return;
            }
            const [mats, temps, evs] = await Promise.all([
                actions.getMasterMaterials(),
                actions.getTemplates(),
                actions.getEvents()
            ]);
            setMasterMaterials(mats);
            setTemplates(temps);
            setEvents(evs);
            setLoading(false);
        };
        loadData();
    }, [router]);

    const handleSaveMaterials = async () => {
        setLoading(true);
        await actions.saveMasterMaterials(masterMaterials);
        setSuccess('素材マスタを保存しました。');
        setLoading(false);
        setTimeout(() => setSuccess(''), 3000);
    };

    const handleSaveTemplates = async () => {
        setLoading(true);
        await actions.saveTemplates(templates);
        setSuccess('テンプレートを保存しました。');
        setLoading(false);
        setTimeout(() => setSuccess(''), 3000);
    };

    const handleSaveEvents = async () => {
        setLoading(true);
        await actions.saveEvents(events);
        setSuccess('イベント設定を保存しました。');
        setLoading(false);
        setTimeout(() => setSuccess(''), 3000);
    };

    const handleInitDB = async () => {
        setInitializing(true);
        const res = await actions.initDB();
        if (res.success) {
            setSuccess('データベースを初期化しました。');
        } else {
            alert('初期化に失敗しました。Vercel Postgres の設定（POSTGRES_URL 等）を確認してください。');
        }
        setInitializing(false);
        setTimeout(() => setSuccess(''), 3000);
    };

    const addMaterialRow = () => {
        setMasterMaterials([...masterMaterials, { id: Math.random().toString(), name: '', defaultTarget: 0 }]);
    };

    const addTemplateRow = () => {
        setTemplates([...templates, { id: Math.random().toString(), title: '', materials: [] }]);
    };

    const addEventRow = () => {
        const today = new Date().toISOString().split('T')[0];
        setEvents([...events, { id: Math.random().toString(), title: '', startDate: today, endDate: today, color: EVENT_COLORS[0].value }]);
    };

    const addTemplateMaterial = (templateId: string) => {
        setTemplates(templates.map(t => t.id === templateId ? {
            ...t,
            materials: [...t.materials, { name: '', target: 0 }]
        } : t));
    };

    // Admin validation is handled in useEffect



    const filteredMaterials = masterMaterials.filter(m =>
        m.name.toLowerCase().includes(materialSearchQuery.toLowerCase())
    );

    const totalPages = displayLimit === 0 ? 1 : Math.ceil(filteredMaterials.length / displayLimit);
    const displayedMaterials = displayLimit === 0
        ? filteredMaterials
        : filteredMaterials.slice((currentPage - 1) * displayLimit, currentPage * displayLimit);

    return (
        <main className="min-h-screen bg-slate-50 p-6 md:p-12 pb-32 text-slate-900">
            <div className="max-w-5xl mx-auto space-y-12">
                <div className="flex justify-between items-center">
                    <button onClick={() => router.push('/tracker')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
                        <ChevronLeft size={20} />
                        ツールTOPへ戻る
                    </button>
                    <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-lg">
                        <Settings size={18} />
                        <span className="text-sm font-bold uppercase tracking-widest">Administrator</span>
                    </div>
                </div>

                <section className="space-y-6">
                    <header className="flex justify-between items-end">
                        <div>
                            <h2 className="text-2xl font-black flex items-center gap-2">
                                <Database className="text-blue-500" />
                                素材マスター管理
                            </h2>
                            <p className="text-slate-500 text-sm font-medium">定義済みの素材総数: <span className="text-slate-900 font-black">{masterMaterials.length}</span> 件</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsMaterialsCollapsed(!isMaterialsCollapsed)}
                                className="bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-all"
                            >
                                {isMaterialsCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                                {isMaterialsCollapsed ? '表示' : '隠す'}
                            </button>
                            <button
                                onClick={handleInitDB}
                                disabled={initializing}
                                className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-200 transition-all disabled:opacity-50"
                            >
                                <RefreshCw size={16} className={initializing ? "animate-spin" : ""} />
                                DB初期化
                            </button>
                            <button onClick={addMaterialRow} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-blue-100 transition-all">
                                <Plus size={16} /> 素材を追加
                            </button>
                        </div>
                    </header>

                    {!isMaterialsCollapsed && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="relative w-full md:max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="素材名で検索..."
                                        value={materialSearchQuery}
                                        onChange={(e) => setMaterialSearchQuery(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                    />
                                </div>

                                <div className="flex items-center gap-4 bg-white border border-slate-100 p-1.5 rounded-2xl shadow-sm">
                                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-3 mr-2">表示数:</span>
                                    <div className="flex gap-1">
                                        {[10, 50, 100, 0].map(limit => (
                                            <button
                                                key={limit}
                                                onClick={() => setDisplayLimit(limit)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${displayLimit === limit ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                            >
                                                {limit === 0 ? 'すべて' : limit}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left min-w-[600px]">
                                        <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                                            <tr>
                                                <th className="px-6 py-4">素材名</th>
                                                <th className="px-6 py-4 text-right">アクション</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {displayedMaterials.map((m) => {
                                                const originalIdx = masterMaterials.findIndex(orig => orig.id === m.id);
                                                return (
                                                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-3">
                                                            <input
                                                                type="text"
                                                                value={m.name}
                                                                onChange={(e) => {
                                                                    const updated = [...masterMaterials];
                                                                    updated[originalIdx].name = e.target.value;
                                                                    setMasterMaterials(updated);
                                                                }}
                                                                className="bg-white border border-slate-200 rounded-lg px-3 py-2 w-full font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-3 text-right">
                                                            <button
                                                                onClick={() => setMasterMaterials(masterMaterials.filter(orig => orig.id !== m.id))}
                                                                className="text-slate-300 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {totalPages > 1 && (
                                    <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-50 flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg text-slate-400 hover:bg-white hover:text-slate-800 disabled:opacity-30 transition-all font-black text-xs uppercase"
                                        >
                                            前へ
                                        </button>
                                        <div className="flex gap-1 flex-wrap justify-center">
                                            {[...Array(totalPages)].map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setCurrentPage(i + 1)}
                                                    className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${currentPage === i + 1 ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-white hover:text-slate-800'}`}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-lg text-slate-400 hover:bg-white hover:text-slate-800 disabled:opacity-30 transition-all font-black text-xs uppercase"
                                        >
                                            次へ
                                        </button>
                                    </div>
                                )}

                                <div className="p-4 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-4">
                                        <span>ページ: <span className="text-slate-900 font-black">{currentPage} / {totalPages}</span></span>
                                        <span className="hidden md:inline">|</span>
                                        <span>検索一致: <span className="text-slate-900 font-black">{filteredMaterials.length}</span> 件</span>
                                    </div>
                                    <button
                                        onClick={handleSaveMaterials}
                                        className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all"
                                    >
                                        <Save size={18} /> マスタを保存
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                <section className="space-y-6">
                    <header className="flex justify-between items-end">
                        <div>
                            <h2 className="text-2xl font-black flex items-center gap-2">
                                <FileText className="text-amber-500" />
                                目標テンプレート管理
                            </h2>
                            <p className="text-slate-500 text-sm font-medium">一括入力用のテンプレート定義</p>
                        </div>
                        <button onClick={addTemplateRow} className="bg-amber-50 text-amber-600 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-amber-100 transition-all">
                            <Plus size={16} /> テンプレートを追加
                        </button>
                    </header>

                    <div className="space-y-4">
                        {templates.map((t, tIdx) => (
                            <div key={t.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 max-w-md flex items-center gap-2">
                                        <button
                                            onClick={() => setExpandedTemplates(prev => ({ ...prev, [t.id]: !prev[t.id] }))}
                                            className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
                                        >
                                            {expandedTemplates[t.id] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                        </button>
                                        <input
                                            type="text"
                                            value={t.title}
                                            placeholder="テンプレート名"
                                            onChange={(e) => {
                                                const updated = [...templates];
                                                updated[tIdx].title = e.target.value;
                                                setTemplates(updated);
                                            }}
                                            className="text-xl font-black text-slate-800 w-full bg-slate-50 px-3 py-1 rounded-lg border-none focus:ring-2 focus:ring-amber-200"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setTemplates(templates.filter((_, i) => i !== tIdx))}
                                        className="text-slate-300 hover:text-red-500 transition-colors p-2"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>

                                {expandedTemplates[t.id] && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400 tracking-widest px-2">
                                        <span>素材</span>
                                        <span>必要数</span>
                                        <span></span>
                                    </div>
                                    {t.materials.map((tm, tmIdx) => (
                                        <div key={tmIdx} className="flex gap-4 items-center bg-slate-50 p-3 rounded-xl relative">
                                            <div className="flex-1 relative group">
                                                <input
                                                    type="text"
                                                    value={tm.name}
                                                    placeholder="素材を検索..."
                                                    onChange={(e) => {
                                                        const query = e.target.value;
                                                        const updated = [...templates];
                                                        updated[tIdx].materials[tmIdx].name = query;
                                                        setTemplates(updated);
                                                        setTemplateSearchQueries({ ...templateSearchQueries, [`${t.id}-${tmIdx}`]: query });
                                                    }}
                                                    onFocus={() => {
                                                        setTemplateSearchQueries({ ...templateSearchQueries, [`${t.id}-${tmIdx}`]: tm.name });
                                                    }}
                                                    onBlur={() => {
                                                        // Use timeout to allow click event on dropdown to fire first
                                                        setTimeout(() => {
                                                            setTemplateSearchQueries(prev => {
                                                                const next = { ...prev };
                                                                delete next[`${t.id}-${tmIdx}`];
                                                                return next;
                                                            });
                                                        }, 200);
                                                    }}
                                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-amber-100"
                                                />
                                                {templateSearchQueries[`${t.id}-${tmIdx}`] !== undefined && (
                                                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto overflow-x-hidden">
                                                        {masterMaterials
                                                            .filter(mm => mm.name.toLowerCase().includes((templateSearchQueries[`${t.id}-${tmIdx}`] || '').toLowerCase()))
                                                            .map(mm => (
                                                                <button
                                                                    key={mm.id}
                                                                    onClick={() => {
                                                                        const updated = [...templates];
                                                                        updated[tIdx].materials[tmIdx].name = mm.name;
                                                                        setTemplates(updated);
                                                                        const queries = { ...templateSearchQueries };
                                                                        delete queries[`${t.id}-${tmIdx}`];
                                                                        setTemplateSearchQueries(queries);
                                                                    }}
                                                                    className="w-full text-left px-4 py-2 text-sm hover:bg-amber-50 font-bold text-slate-700 transition-colors whitespace-nowrap overflow-hidden text-ellipsis"
                                                                >
                                                                    {mm.name}
                                                                </button>
                                                            ))}
                                                        {masterMaterials.filter(mm => mm.name.toLowerCase().includes((templateSearchQueries[`${t.id}-${tmIdx}`] || '').toLowerCase())).length === 0 && (
                                                            <div className="px-4 py-3 text-xs text-slate-400 italic">見つかりません</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <input
                                                type="number"
                                                value={tm.target}
                                                onChange={(e) => {
                                                    const updated = [...templates];
                                                    updated[tIdx].materials[tmIdx].target = parseInt(e.target.value) || 0;
                                                    setTemplates(updated);
                                                }}
                                                className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm text-center"
                                            />
                                            <button
                                                onClick={() => {
                                                    const updated = [...templates];
                                                    updated[tIdx].materials = updated[tIdx].materials.filter((_, i) => i !== tmIdx);
                                                    setTemplates(updated);
                                                }}
                                                className="text-slate-300 hover:text-red-500"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => addTemplateMaterial(t.id)}
                                        className="w-full py-2 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 text-xs font-bold hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-center gap-1"
                                    >
                                        <Plus size={14} /> 素材を追加
                                    </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-center pt-8">
                        <button
                            onClick={handleSaveTemplates}
                            className="bg-amber-600 text-white px-12 py-4 rounded-3xl font-black text-lg shadow-xl shadow-amber-100 hover:bg-amber-500 transition-all active:scale-95 flex items-center gap-3"
                        >
                            <Save size={24} /> 全テンプレート内容を保存
                        </button>
                    </div>
                </section>

                <hr className="border-slate-200" />

                <section className="space-y-6">
                    <header className="flex justify-between items-end">
                        <div>
                            <h2 className="text-2xl font-black flex items-center gap-2">
                                <CalendarIcon className="text-indigo-500" />
                                イベントカレンダー管理
                            </h2>
                            <p className="text-slate-500 text-sm font-medium">トップページに表示するイベント情報の管理</p>
                        </div>
                        <button onClick={addEventRow} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-indigo-100 transition-all">
                            <Plus size={16} /> イベントを追加
                        </button>
                    </header>

                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden text-sm">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left min-w-[700px]">
                                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">イベント名</th>
                                        <th className="px-6 py-4">開始日</th>
                                        <th className="px-6 py-4">終了日</th>
                                        <th className="px-6 py-4">色</th>
                                        <th className="px-6 py-4 text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {events.map((ev, idx) => (
                                        <tr key={ev.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={ev.title}
                                                    onChange={(e) => {
                                                        const updated = [...events];
                                                        updated[idx].title = e.target.value;
                                                        setEvents(updated);
                                                    }}
                                                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-full font-bold outline-none focus:ring-2 focus:ring-indigo-100"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="date"
                                                    value={ev.startDate}
                                                    onChange={(e) => {
                                                        const updated = [...events];
                                                        updated[idx].startDate = e.target.value;
                                                        setEvents(updated);
                                                    }}
                                                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 outline-none"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="date"
                                                    value={ev.endDate}
                                                    onChange={(e) => {
                                                        const updated = [...events];
                                                        updated[idx].endDate = e.target.value;
                                                        setEvents(updated);
                                                    }}
                                                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 outline-none"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={ev.color}
                                                    onChange={(e) => {
                                                        const updated = [...events];
                                                        updated[idx].color = e.target.value;
                                                        setEvents(updated);
                                                    }}
                                                    style={{ borderLeft: `4px solid ${ev.color}` }}
                                                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 outline-none w-full font-bold"
                                                >
                                                    {EVENT_COLORS.map(c => (
                                                        <option key={c.value} value={c.value}>{c.label}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <button
                                                    onClick={() => setEvents(events.filter((_, i) => i !== idx))}
                                                    className="text-slate-300 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 bg-slate-50/50 border-t border-slate-50 flex justify-end">
                            <button
                                onClick={handleSaveEvents}
                                className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-3 shadow-lg shadow-indigo-100 hover:bg-indigo-500 transition-all active:scale-95"
                            >
                                <Save size={20} /> イベントを保存
                            </button>
                        </div>
                    </div>
                </section>

            </div>

            {success && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-green-500 text-white px-8 py-4 rounded-2xl shadow-2xl font-bold animate-bounce z-[100]">
                    {success}
                </div>
            )}

            {loading && (
                <div className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-[100]">
                    <div className="flex flex-col items-center gap-4">
                        <RefreshCw size={48} className="text-blue-600 animate-spin" />
                        <p className="font-black text-slate-600">読み込み中...</p>
                    </div>
                </div>
            )}
        </main>
    );
}
