"use client";

// Note: In a real app, this would be a server-side DB.
// For development/demo, we use LocalStorage to simulate a persistence layer.

import { Goal, Material } from "@/types";
import { MASTER_MATERIALS, GOAL_TEMPLATES } from "./masterData";

const DB_KEY = 'gbf-db-mock';
const MASTER_KEY = 'gbf-master-materials';
const TEMPLATE_KEY = 'gbf-goal-templates';
const HIHI_STATS_KEY = 'gbf-hihi-stats';
const HIHI_LOGS_KEY = 'gbf-hihi-logs';
const EVENTS_KEY = 'gbf-portal-events';

export const mockDB = {
    getGoals: (): Goal[] => {
        if (typeof window === 'undefined') return [];
        const data = localStorage.getItem(DB_KEY);
        if (!data) {
            // Initialize with sample data
            const samples: (Goal & { password: string })[] = [
                {
                    id: 's1',
                    title: '終末の神器 限界超越 (Sample)',
                    password: 'test',
                    materials: [
                        { id: 'sm1', name: '刻の流砂', current: 1, target: 3, startDate: new Date().toISOString(), endDate: new Date().toISOString() },
                        { id: 'sm2', name: 'ダークネス・マテリアル', current: 10, target: 50, startDate: new Date().toISOString(), endDate: new Date().toISOString() },
                    ]
                },
                {
                    id: 's2',
                    title: '十天衆 限界超越 (Sample)',
                    password: 'test',
                    materials: [
                        { id: 'sm3', name: '碧麗の証', current: 0, target: 1, startDate: new Date().toISOString(), endDate: new Date().toISOString() },
                        { id: 'sm4', name: 'ヒヒイロカネ', current: 0, target: 1, startDate: new Date().toISOString(), endDate: new Date().toISOString() },
                    ]
                },
                {
                    id: 's3',
                    title: 'ブライト集め (Sample)',
                    password: 'test',
                    materials: [
                        { id: 'sm5', name: '理想のタイプ', current: 10, target: 30, startDate: new Date().toISOString(), endDate: new Date().toISOString() },
                    ]
                }
            ];
            localStorage.setItem(DB_KEY, JSON.stringify(samples));
            return samples;
        }
        return JSON.parse(data);
    },

    findGoalsByPassword: (password: string): Goal[] => {
        const goals = mockDB.getGoals();
        return goals.filter(g => (g as any).password === password);
    },

    checkPasswordExists: (password: string): boolean => {
        const goals = mockDB.getGoals();
        return goals.some(g => (g as any).password === password);
    },

    saveGoal: (goal: Goal & { password: string }) => {
        const goals = mockDB.getGoals();
        goals.push(goal);
        localStorage.setItem(DB_KEY, JSON.stringify(goals));
    },

    updateGoal: (updatedGoal: Goal) => {
        const goals = mockDB.getGoals();
        const index = goals.findIndex(g => g.id === updatedGoal.id);
        if (index !== -1) {
            goals[index] = updatedGoal;
            localStorage.setItem(DB_KEY, JSON.stringify(goals));
        }
    },

    getGoalById: (id: string): Goal | undefined => {
        const goals = mockDB.getGoals();
        return goals.find(g => g.id === id);
    },

    // Dynamic Master Data
    getMasterMaterials: () => {
        if (typeof window === 'undefined') return MASTER_MATERIALS;
        const data = localStorage.getItem(MASTER_KEY);
        if (!data) {
            localStorage.setItem(MASTER_KEY, JSON.stringify(MASTER_MATERIALS));
            return MASTER_MATERIALS;
        }
        return JSON.parse(data);
    },

    saveMasterMaterials: (materials: any[]) => {
        localStorage.setItem(MASTER_KEY, JSON.stringify(materials));
    },

    getTemplates: () => {
        if (typeof window === 'undefined') return GOAL_TEMPLATES;
        const data = localStorage.getItem(TEMPLATE_KEY);
        if (!data) {
            localStorage.setItem(TEMPLATE_KEY, JSON.stringify(GOAL_TEMPLATES));
            return GOAL_TEMPLATES;
        }
        return JSON.parse(data);
    },

    saveTemplates: (templates: any[]) => {
        localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates));
    },

    // Hihi Tracker Data
    getHihiStats: () => {
        if (typeof window === 'undefined') return { total: 0, drops: 0, blueChests: 0, currentStreak: 1 };
        const data = localStorage.getItem(HIHI_STATS_KEY);
        return data ? JSON.parse(data) : { total: 0, drops: 0, blueChests: 0, currentStreak: 1 };
    },

    saveHihiStats: (stats: any) => {
        localStorage.setItem(HIHI_STATS_KEY, JSON.stringify(stats));
    },

    getHihiLogs: () => {
        if (typeof window === 'undefined') return [];
        const data = localStorage.getItem(HIHI_LOGS_KEY);
        return data ? JSON.parse(data) : [];
    },

    saveHihiLogs: (logs: any[]) => {
        localStorage.setItem(HIHI_LOGS_KEY, JSON.stringify(logs));
    },

    // Event Calendar Data
    getEvents: () => {
        if (typeof window === 'undefined') return [];
        const data = localStorage.getItem(EVENTS_KEY);
        return data ? JSON.parse(data) : [];
    },

    saveEvents: (events: any[]) => {
        localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
    }
};
