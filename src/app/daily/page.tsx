import React from 'react';
import { getUserDailyTasks } from './actions';
import DailyClient from './DailyClient';
import { initDB, getCurrentUser } from '@/lib/actions';

export default async function DailyTasksPage() {
    // データベースの初期化（カラムの追加等）を確実に実行
    await initDB();
    
    // サーバーサイドでその日の進捗を含む日課リストを取得
    const tasks = await getUserDailyTasks();
    const user = await getCurrentUser();

    // @ts-ignore
    return <DailyClient initialTasks={tasks} currentUser={user} />;
}
