"use server";

import { sql } from '@vercel/postgres';
import { Template } from '@/types';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { getGuildSheetData } from './googleSheets';

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

        await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        adminflg VARCHAR(1) DEFAULT '0',
        daily_tickets INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

        // Ensure daily_tickets column exists if table was created before
        try {
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_tickets INTEGER DEFAULT 0`;
        } catch (e) {
            console.log("daily_tickets column already exists or error adding it");
        }

        await sql`
      CREATE TABLE IF NOT EXISTS goals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

        await sql`
      CREATE TABLE IF NOT EXISTS goal_materials (
        id SERIAL PRIMARY KEY,
        goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        current_count INTEGER DEFAULT 0,
        target_count INTEGER NOT NULL,
        sort_order INTEGER DEFAULT 0
      );
    `;

        await sql`
      CREATE TABLE IF NOT EXISTS game_scores (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        username TEXT NOT NULL,
        max_stage INTEGER DEFAULT 1,
        transcendence_count INTEGER DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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

// Goals Management
export async function getGoals() {
    try {
        const user = await getCurrentUser();
        if (!user) return [];

        const { rows: goalRows } = await sql`
      SELECT * FROM goals WHERE user_id = ${user.id} ORDER BY created_at DESC
    `;

        const goals = [];
        for (const g of goalRows) {
            const { rows: materialRows } = await sql`
        SELECT id, name, current_count as current, target_count as target 
        FROM goal_materials 
        WHERE goal_id = ${g.id} 
        ORDER BY sort_order ASC
      `;
            goals.push({
                id: g.id,
                title: g.title,
                materials: materialRows
            });
        }
        return goals;
    } catch (error) {
        console.error('Failed to fetch goals:', error);
        return [];
    }
}

export async function getGoalById(id: string) {
    try {
        const user = await getCurrentUser();
        if (!user) return null;

        const { rows: goalRows } = await sql`
      SELECT * FROM goals WHERE id = ${id} AND user_id = ${user.id}
    `;
        if (goalRows.length === 0) return null;

        const g = goalRows[0];
        const { rows: materialRows } = await sql`
      SELECT id, name, current_count as current, target_count as target 
      FROM goal_materials 
      WHERE goal_id = ${g.id} 
      ORDER BY sort_order ASC
    `;

        return {
            id: g.id,
            title: g.title,
            materials: materialRows
        };
    } catch (error) {
        console.error('Failed to fetch goal:', error);
        return null;
    }
}

export async function createGoal(title: string, materials: { name: string, target: number }[]) {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        const { rows } = await sql`
      INSERT INTO goals (user_id, title) VALUES (${user.id}, ${title}) RETURNING id
    `;
        const goalId = rows[0].id;

        for (let i = 0; i < materials.length; i++) {
            const m = materials[i];
            await sql`
        INSERT INTO goal_materials (goal_id, name, target_count, sort_order)
        VALUES (${goalId}, ${m.name}, ${m.target}, ${i})
      `;
        }

        revalidatePath('/goals');
        return { success: true, id: goalId };
    } catch (error) {
        console.error('Failed to create goal:', error);
        return { success: false, error: 'Failed to create goal' };
    }
}

export async function updateGoalProgress(goalId: string, materials: { id: string, current: number }[]) {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        // Verify ownership
        const { rows: goalRows } = await sql`SELECT id FROM goals WHERE id = ${goalId} AND user_id = ${user.id}`;
        if (goalRows.length === 0) return { success: false, error: 'Goal not found' };

        for (const m of materials) {
            await sql`
        UPDATE goal_materials 
        SET current_count = ${m.current} 
        WHERE id = ${m.id} AND goal_id = ${goalId}
      `;
        }

        revalidatePath(`/goals/${goalId}`);
        revalidatePath('/goals');
        return { success: true };
    } catch (error) {
        console.error('Failed to update progress:', error);
        return { success: false };
    }
}

export async function deleteGoal(id: string) {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        await sql`DELETE FROM goals WHERE id = ${id} AND user_id = ${user.id}`;
        revalidatePath('/goals');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete goal:', error);
        return { success: false };
    }
}

// User Authentication
export async function register(username: string, password: string) {
    try {
        const { rows: existing } = await sql`SELECT id FROM users WHERE username = ${username}`;
        if (existing.length > 0) {
            return { success: false, error: 'このユーザー名は既に使用されています。' };
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const { rows } = await sql`
      INSERT INTO users (username, password_hash)
      VALUES (${username}, ${hashedPassword})
      RETURNING id, username
    `;

        const user = rows[0];
        (await cookies()).set('user_id', user.id, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 60 * 60 * 24 * 7 });
        (await cookies()).set('username', user.username, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 60 * 60 * 24 * 7 });

        return { success: true, user: { id: user.id, username: user.username, adminflg: user.adminflg || '0' } };
    } catch (error) {
        console.error('Registration failed:', error);
        return { success: false, error: '登録に失敗しました。' };
    }
}

export async function login(username: string, password: string) {
    try {
        const { rows } = await sql`SELECT * FROM users WHERE username = ${username}`;
        const user = rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return { success: false, error: 'ユーザー名またはパスワードが正しくありません。' };
        }

        (await cookies()).set('user_id', user.id, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 60 * 60 * 24 * 7 });
        (await cookies()).set('username', user.username, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 60 * 60 * 24 * 7 });

        return { success: true, user: { id: user.id, username: user.username, adminflg: user.adminflg || '0' } };
    } catch (error) {
        console.error('Login failed:', error);
        return { success: false, error: 'ログインに失敗しました。' };
    }
}

export async function logout() {
    (await cookies()).delete('user_id');
    (await cookies()).delete('username');
    return { success: true };
}

export async function getCurrentUser() {
    const userId = (await cookies()).get('user_id')?.value;
    const username = (await cookies()).get('username')?.value;

    if (!userId || !username) return null;

    try {
        const { rows } = await sql`SELECT id, username, adminflg, daily_tickets FROM users WHERE id = ${userId}`;
        if (rows.length === 0) return { id: userId, username, daily_tickets: 0 }; // Fallback to cookie data if DB fetch fails
        return { id: rows[0].id, username: rows[0].username, adminflg: rows[0].adminflg, daily_tickets: rows[0].daily_tickets || 0 };
    } catch (error) {
        console.error('Failed to fetch user from DB:', error);
        return { id: userId, username, daily_tickets: 0 };
    }
}

export async function consumeDailyTicket() {
    try {
        const user = await getCurrentUser();
        if (!user || user.daily_tickets <= 0) return { success: false, error: 'No tickets available' };

        await sql`UPDATE users SET daily_tickets = daily_tickets - 1 WHERE id = ${user.id}`;
        return { success: true };
    } catch (error) {
        console.error('Failed to consume daily ticket:', error);
        return { success: false };
    }
}

export async function syncGuildData() {
    try {
        const user = await getCurrentUser();
        if (user?.adminflg !== '1') return { success: false, error: 'Unauthorized' };

        const data = await getGuildSheetData();
        if (!data) return { success: false, error: 'Failed to fetch from Google Sheets. Check environment variables and sheet sharing.' };

        return { success: true, data };
    } catch (error) {
        console.error('Failed to sync guild data:', error);
        return { success: false, error: 'Sync failed' };
    }
}

// Game Ranking Actions
export async function updateGameScore(stage: number, transcendence: number) {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        // Ranking requirement: Clear Stage 1 (meaning current stage is 2 or more) or have transcended
        if (stage < 2 && transcendence === 0) {
            return { success: true, message: 'Not eligible for ranking yet' };
        }

        await sql`
            INSERT INTO game_scores (user_id, username, max_stage, transcendence_count, updated_at)
            VALUES (${user.id}, ${user.username}, ${stage}, ${transcendence}, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id) DO UPDATE SET
                username = EXCLUDED.username,
                max_stage = GREATEST(game_scores.max_stage, EXCLUDED.max_stage),
                transcendence_count = GREATEST(game_scores.transcendence_count, EXCLUDED.transcendence_count),
                updated_at = CURRENT_TIMESTAMP
        `;

        return { success: true };
    } catch (error) {
        console.error('Failed to update game score:', error);
        return { success: false };
    }
}

export async function getGameRanking() {
    try {
        const { rows } = await sql`
            SELECT username, max_stage, transcendence_count
            FROM game_scores
            WHERE max_stage >= 2 OR transcendence_count > 0
            ORDER BY transcendence_count DESC, max_stage DESC
            LIMIT 10
        `;
        return rows;
    } catch (error) {
        console.error('Failed to fetch game ranking:', error);
        return [];
    }
}
export async function deleteGameScore() {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        await sql`DELETE FROM game_scores WHERE user_id = ${user.id}`;
        return { success: true };
    } catch (error) {
        console.error('Failed to delete game score:', error);
        return { success: false };
    }
}
