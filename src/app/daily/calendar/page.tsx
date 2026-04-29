import React from 'react';
import { getCalendarCompletion } from '../actions';
import CalendarClient from './CalendarClient';

export default async function CalendarPage() {
    // 現在の月（YYYY-MM）を取得
    const today = new Date();
    // タイムゾーンのズレを避けるため、YYYY-MM形式で取得
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const targetMonth = `${year}-${month}`;

    const data = await getCalendarCompletion(targetMonth);

    return <CalendarClient initialData={data} initialDateStr={targetMonth} />;
}
