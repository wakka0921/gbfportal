export const MASTER_MATERIALS = [
    { id: 'm1', name: '刻の流砂', defaultTarget: 3 },
    { id: 'm2', name: 'ダークネス・マテリアル', defaultTarget: 50 },
    { id: 'm3', name: '終末のメダリオン', defaultTarget: 100 },
    { id: 'm4', name: '理想のタイプ', defaultTarget: 1 },
    { id: 'm5', name: '碧麗の証', defaultTarget: 1 },
    { id: 'm6', name: 'バハムートの角', defaultTarget: 5 },
    { id: 'm7', name: 'ヒヒイロカネ', defaultTarget: 1 },
    { id: 'm8', name: '福音の恩寵', defaultTarget: 1 },
    { id: 'm9', name: '終末の暗晶', defaultTarget: 5 },
    { id: 'm10', name: '星の砂', defaultTarget: 1 },
];

export const GOAL_TEMPLATES = [
    {
        id: 't1',
        title: '終末の神器 限界超越 (Lv210)',
        materials: [
            { name: '刻の流砂', target: 3 },
            { name: 'ダークネス・マテリアル', target: 50 },
            { name: '終末のメダリオン', target: 100 },
            { name: '福音の恩寵', target: 1 },
        ]
    },
    {
        id: 't2',
        title: '終末の神器 限界超越 (Lv230)',
        materials: [
            { name: '刻の流砂', target: 3 },
            { name: '終末の暗晶', target: 5 },
            { name: '星の砂', target: 1 },
        ]
    },
    {
        id: 't3',
        title: '十天衆 限界超越 (Lv110)',
        materials: [
            { name: '碧麗の証', target: 1 },
            { name: 'バハムートの角', target: 50 },
            { name: 'ヒヒイロカネ', target: 1 },
        ]
    }
];
