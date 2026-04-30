
'use server';

import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

const DATA_FILE_PATH = path.join(process.cwd(), 'src/app/game/gameData.ts');

export async function updateGameData(newData: {
    WEAPON_POOL: any;
    ARMOR_POOL: any;
    FACILITIES: any;
    EQUIPMENT: any;
}) {
    try {
        // gameData.ts の内容を生成
        const content = `
export const RARITIES = ['N', 'UC', 'R', 'HR', 'SR', 'SSR', 'SSSR', 'LEGEND', 'GOD', 'GOD+'] as const;
export type Rarity = typeof RARITIES[number];

export const RARITY_CONFIG: Record<Rarity, { color: string, maxLevel: number, baseWeight: number }> = {
    'N': { color: 'text-slate-400', maxLevel: 30, baseWeight: 600 },
    'UC': { color: 'text-emerald-400', maxLevel: 40, baseWeight: 250 },
    'R': { color: 'text-blue-400', maxLevel: 50, baseWeight: 100 },
    'HR': { color: 'text-purple-400', maxLevel: 60, baseWeight: 40 },
    'SR': { color: 'text-pink-400', maxLevel: 70, baseWeight: 8 },
    'SSR': { color: 'text-amber-400', maxLevel: 80, baseWeight: 1.5 },
    'SSSR': { color: 'text-orange-500', maxLevel: 90, baseWeight: 0.4 },
    'LEGEND': { color: 'text-red-500', maxLevel: 100, baseWeight: 0.08 },
    'GOD': { color: 'text-cyan-400', maxLevel: 110, baseWeight: 0.015 },
    'GOD+': { color: 'text-white shadow-glow', maxLevel: 120, baseWeight: 0.005 },
};

export const WEAPON_POOL: Record<Rarity, string[]> = ${JSON.stringify(newData.WEAPON_POOL, null, 4)};

export const ARMOR_POOL: Record<Rarity, string[]> = ${JSON.stringify(newData.ARMOR_POOL, null, 4)};

export const FACILITIES = ${JSON.stringify(newData.FACILITIES, null, 4)};

export const EQUIPMENT = ${JSON.stringify(newData.EQUIPMENT, null, 4)};
`;

        fs.writeFileSync(DATA_FILE_PATH, content, 'utf8');
        revalidatePath('/game');
        return { success: true };
    } catch (error) {
        console.error('Failed to update game data:', error);
        return { success: false, error: String(error) };
    }
}
