"use server";

import { sql } from '@vercel/postgres';
import { Template } from '@/types';
import { revalidatePath } from 'next/cache';

export interface PortalEvent {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    color: string;
}

// Initialize Database Tables
export async function initDB() {
    try {
        await sql`
      CREATE TABLE IF NOT EXISTS master_materials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        default_target INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

        await sql`
      CREATE TABLE IF NOT EXISTS templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

        await sql`
      CREATE TABLE IF NOT EXISTS template_materials (
        id SERIAL PRIMARY KEY,
        template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        target_count INTEGER NOT NULL,
        sort_order INTEGER DEFAULT 0
      );
    `;

        await sql`
      CREATE TABLE IF NOT EXISTS portal_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        color TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

        return { success: true };
    } catch (error) {
        console.error('Failed to init DB:', error);
        return { success: false, error };
    }
}

// Master Materials
export async function getMasterMaterials() {
    try {
        const { rows } = await sql`SELECT * FROM master_materials ORDER BY name ASC`;
        return rows.map(r => ({
            id: r.id,
            name: r.name,
            defaultTarget: r.default_target
        }));
    } catch (error) {
        console.error('Failed to fetch master materials:', error);
        return [];
    }
}

export async function saveMasterMaterials(materials: { id?: string, name: string, defaultTarget?: number }[]) {
    try {
        await sql`DELETE FROM master_materials`;
        for (const mat of materials) {
            await sql`INSERT INTO master_materials (name, default_target) VALUES (${mat.name}, ${mat.defaultTarget || 0})`;
        }
        revalidatePath('/admin');
        revalidatePath('/create');
        return { success: true };
    } catch (error) {
        console.error('Failed to save master materials:', error);
        return { success: false };
    }
}

// Templates
export async function getTemplates(): Promise<Template[]> {
    try {
        const { rows: templateRows } = await sql`SELECT * FROM templates ORDER BY created_at ASC`;
        const templates: Template[] = [];

        for (const t of templateRows) {
            const { rows: materialRows } = await sql`
        SELECT name, target_count as target 
        FROM template_materials 
        WHERE template_id = ${t.id} 
        ORDER BY sort_order ASC
      `;
            templates.push({
                id: t.id,
                title: t.title,
                materials: materialRows as { name: string, target: number }[]
            });
        }

        return templates;
    } catch (error) {
        console.error('Failed to fetch templates:', error);
        return [];
    }
}

export async function saveTemplates(templates: Template[]) {
    try {
        // Clear and Replace (Simpler for this specific UI)
        await sql`DELETE FROM templates`;
        // Cascades into template_materials

        for (const t of templates) {
            const { rows } = await sql`
        INSERT INTO templates (title) VALUES (${t.title}) RETURNING id
      `;
            const templateId = rows[0].id;

            for (let i = 0; i < t.materials.length; i++) {
                const m = t.materials[i];
                await sql`
          INSERT INTO template_materials (template_id, name, target_count, sort_order)
          VALUES (${templateId}, ${m.name}, ${m.target}, ${i})
        `;
            }
        }
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error('Failed to save templates:', error);
        return { success: false };
    }
}

// Events
export async function getEvents(): Promise<PortalEvent[]> {
    try {
        const { rows } = await sql`SELECT * FROM portal_events ORDER BY start_date ASC`;
        return rows.map(r => ({
            id: r.id,
            title: r.title,
            color: r.color,
            startDate: r.start_date instanceof Date ? r.start_date.toISOString().split('T')[0] : r.start_date,
            endDate: r.end_date instanceof Date ? r.end_date.toISOString().split('T')[0] : r.end_date
        }));
    } catch (error) {
        console.error('Failed to fetch events:', error);
        return [];
    }
}

export async function saveEvents(events: any[]) {
    try {
        await sql`DELETE FROM portal_events`;
        for (const ev of events) {
            await sql`
        INSERT INTO portal_events (title, start_date, end_date, color)
        VALUES (${ev.title}, ${ev.startDate}, ${ev.endDate}, ${ev.color})
      `;
        }
        revalidatePath('/');
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error('Failed to save events:', error);
        return { success: false };
    }
}
