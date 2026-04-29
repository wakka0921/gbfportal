import React from 'react';
import { getUserConfigs } from '../actions';
import ConfigClient from './ConfigClient';

export default async function ConfigPage() {
    // サーバーサイドで設定情報をフェッチ
    const configs = await getUserConfigs();

    // @ts-ignore
    return <ConfigClient initialConfigs={configs} />;
}
