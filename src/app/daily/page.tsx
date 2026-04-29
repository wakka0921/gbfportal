import React from 'react';
import { getUserDailyTasks } from './actions';
import DailyClient from './DailyClient';

export default async function DailyTasksPage() {
    // サーバーサイドでその日の進捗を含む日課リストを取得
    const tasks = await getUserDailyTasks();

    // @ts-ignore
    return <DailyClient initialTasks={tasks} />;
}
