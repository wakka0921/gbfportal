'use server';

import { sql } from '@vercel/postgres';
import { getUserId } from '@/lib/user';
import { revalidatePath } from 'next/cache';

// マスタデータ（全マルチバトル）を取得
export async function getMultiBattles() {
  try {
    const { rows } = await sql`SELECT * FROM multi_battles ORDER BY difficulty, battle_name`;
    return rows;
  } catch (error) {
    console.error('Failed to fetch multi battles:', error);
    return [];
  }
}

// ユーザーのアクティブな日課リストと、その日(本日)の達成数を取得
export async function getUserDailyTasks() {
  const userId = await getUserId();
  try {
    const { rows } = await sql`
      SELECT 
        mb.id as battle_id,
        mb.difficulty,
        mb.battle_name,
        mb.daily_limit,
        uc.is_active,
        COALESCE(dl_counts.completed_count, 0) as completed_count,
        COALESCE(dl_counts.has_img_flag, false) as has_img_flag
      FROM user_configs uc
      JOIN multi_battles mb ON uc.battle_id = mb.id
      LEFT JOIN (
        SELECT battle_id, SUM(completed_count) as completed_count, bool_or(has_img_flag) as has_img_flag
        FROM daily_logs
        WHERE user_id = ${userId} AND completed_at = CURRENT_DATE
        GROUP BY battle_id
      ) dl_counts ON dl_counts.battle_id = mb.id
      WHERE uc.user_id = ${userId} AND uc.is_active = true
      ORDER BY mb.difficulty, mb.battle_name
    `;
    return rows;
  } catch (error) {
    console.error('Failed to fetch user daily tasks:', error);
    return [];
  }
}

// ユーザーの設定（アクティブ/非アクティブ含む全設定）を取得
export async function getUserConfigs() {
  const userId = await getUserId();
  try {
    const { rows } = await sql`
      SELECT 
        mb.id as battle_id,
        mb.difficulty,
        mb.battle_name,
        COALESCE(uc.is_active, false) as is_active
      FROM multi_battles mb
      LEFT JOIN user_configs uc ON uc.battle_id = mb.id AND uc.user_id = ${userId}
      ORDER BY mb.difficulty, mb.battle_name
    `;
    return rows;
  } catch (error) {
    console.error('Failed to fetch user configs:', error);
    return [];
  }
}

// 日課設定を切り替える (ON/OFF)
export async function toggleUserConfig(battleId: string, isActive: boolean) {
  const userId = await getUserId();
  try {
    await sql`
      INSERT INTO user_configs (user_id, battle_id, is_active)
      VALUES (${userId}, ${battleId}, ${isActive})
      ON CONFLICT (user_id, battle_id)
      DO UPDATE SET is_active = EXCLUDED.is_active
    `;
    revalidatePath('/daily');
    revalidatePath('/daily/config');
    return { success: true };
  } catch (error) {
    console.error('Failed to toggle user config:', error);
    return { success: false };
  }
}

// 日課を完了（1カウント進める）する
export async function completeDailyTask(battleId: string, hasImgFlag: boolean) {
  const userId = await getUserId();
  // 1. Record the daily log
  try {
    await sql`
      INSERT INTO daily_logs (user_id, battle_id, completed_at, has_img_flag, completed_count)
      VALUES (${userId}, ${battleId}, CURRENT_DATE, ${hasImgFlag}, 1)
      ON CONFLICT (user_id, battle_id, completed_at)
      DO UPDATE SET 
        completed_count = daily_logs.completed_count + 1,
        has_img_flag = EXCLUDED.has_img_flag OR daily_logs.has_img_flag
    `;
  } catch (error) {
    console.error('Failed to complete daily task log:', error);
    return { success: false, error: "日課の記録に失敗しました。" };
  }

  // 2. Grant ticket (optional step, should not block completion)
  try {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (isUUID) {
      await sql`UPDATE users SET daily_tickets = COALESCE(daily_tickets, 0) + 1 WHERE id = ${userId}`;
    }
  } catch (error) {
    console.error('Failed to grant daily ticket:', error);
  }

  revalidatePath('/daily');
  revalidatePath('/daily/calendar');
  return { success: true };
}

// カレンダー用の過去の実績取得（月を指定して、日ごとの達成率を取得）
// dateStr: 'YYYY-MM'
export async function getCalendarCompletion(dateStr: string) {
  const userId = await getUserId();
  try {
    // アクティブな日課数を取得
    const { rows: configRows } = await sql`
      SELECT count(*) as total_configs FROM user_configs WHERE user_id = ${userId} AND is_active = true
    `;
    const totalConfigs = parseInt(configRows[0]?.total_configs || '0');

    if (totalConfigs === 0) return { totalConfigs: 0, logs: [] };

    // 指定された月(dateStr)の完了ログ数を日ごとに取得
    const { rows: logRows } = await sql`
      SELECT 
        completed_at,
        COUNT(DISTINCT battle_id) as completed_count
      FROM daily_logs
      WHERE user_id = ${userId} 
        AND TO_CHAR(completed_at, 'YYYY-MM') = ${dateStr}
      GROUP BY completed_at
      ORDER BY completed_at
    `;

    return { totalConfigs, logs: logRows };
  } catch (error) {
    console.error('Failed to fetch calendar completion:', error);
    return { totalConfigs: 0, logs: [] };
  }
}
