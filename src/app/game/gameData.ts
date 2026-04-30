
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

export const WEAPON_POOL: Record<Rarity, string[]> = {
    "N": [
        "ショートソード",
        "クリス",
        "木刀"
    ],
    "UC": [
        "ファイアソード",
        "ランス",
        "バスタードソード"
    ],
    "R": [
        "世界樹の晶剣",
        "ティアマトボルト",
        "コロッサスケーン"
    ],
    "HR": [
        "シュヴァリエボルト・マグナ",
        "シュヴァリエソード・マグナ"
    ],
    "SR": [
        "バハムートダガー・フツルス",
        "バハムートソード・フツルス"
    ],
    "SSR": [
        "終末の神器",
        "ドラゴニックウェポン",
        "エデン"
    ],
    "SSSR": [
        "レヴァンスウェポン・リビルド",
        "禁禍武器"
    ],
    "LEGEND": [
        "超越された終末の神器",
        "ドラゴニックウェポン・オリジン"
    ],
    "GOD": [
        "破壊武器",
        "リミテッドシリーズ",
        "スペリオルシリーズ"
    ],
    "GOD+": [
        "エレシュキガル",
        "フルンティング"
    ]
};

export const ARMOR_POOL: Record<Rarity, string[]> = {
    "N": [
        "そのへんの召喚石"
    ],
    "UC": [
        "召喚石カーバンクル",
        "粘土の巨像"
    ],
    "R": [
        "ティアマト",
        "コロッサス",
        "リヴァイアサン",
        "セレスト",
        "ユグドラシル",
        "アドウェルサ"
    ],
    "HR": [
        "コロッサス・マグナ",
        "リヴァイアサン・マグナ",
        "ティアマト・マグナ",
        "ユグドラシル・マグナ"
    ],
    "SR": [
        "セレスト・マグナ",
        "シュヴァリエ・マグナ",
        "アテナ",
        "グラニ",
        "ナタク",
        "メドゥーサ"
    ],
    "SSR": [
        "アグニス",
        "ゼウス",
        "ハデス",
        "ティターン",
        "ヴァルナ",
        "ゼピュロス"
    ],
    "SSSR": [
        "ウリエル",
        "ガブリエル",
        "ミカエル",
        "ラファエル"
    ],
    "LEGEND": [
        "アグニス",
        "ゼウス",
        "ハデス",
        "ティターン",
        "ヴァルナ",
        "新規アイテム"
    ],
    "GOD": [
        "ルシフェル",
        "バハムート",
        "ヤチマ",
        "オロロジャイア",
        "ベリアル",
        "ベルゼバブ"
    ],
    "GOD+": [
        "ヴェルサシア"
    ]
};

export const FACILITIES = [
    {
        "id": 1,
        "name": "島HARD",
        "basePrice": 10,
        "baseCps": 1
    },
    {
        "id": 2,
        "name": "マグナ",
        "basePrice": 75,
        "baseCps": 7.5
    },
    {
        "id": 3,
        "name": "マグナ2",
        "basePrice": 562,
        "baseCps": 56
    },
    {
        "id": 4,
        "name": "天使武器4凸",
        "basePrice": 4218,
        "baseCps": 420
    },
    {
        "id": 5,
        "name": "マグナ3",
        "basePrice": 31640,
        "baseCps": 3150
    },
    {
        "id": 6,
        "name": "ルシHL",
        "basePrice": 237300,
        "baseCps": 23600
    },
    {
        "id": 7,
        "name": "スパバハ",
        "basePrice": 1779700,
        "baseCps": 177000
    },
    {
        "id": 8,
        "name": "天元",
        "basePrice": 13348000,
        "baseCps": 1327000
    },
    {
        "id": 9,
        "name": "ルシゼロ",
        "basePrice": 100110000,
        "baseCps": 9952000
    },
    {
        "id": 10,
        "name": "ヴェルサシア",
        "basePrice": 750800000,
        "baseCps": 74640000
    }
];

export const EQUIPMENT = [
    {
        "id": 1,
        "name": "ボロいスマホ",
        "basePrice": 15,
        "multiplier": 2
    },
    {
        "id": 2,
        "name": "ボロいノーパソ",
        "basePrice": 150,
        "multiplier": 4
    },
    {
        "id": 3,
        "name": "スマホ",
        "basePrice": 1200,
        "multiplier": 8
    },
    {
        "id": 4,
        "name": "スカイリープ単窓",
        "basePrice": 10000,
        "multiplier": 16
    },
    {
        "id": 5,
        "name": "パソコン単窓",
        "basePrice": 85000,
        "multiplier": 32
    },
    {
        "id": 6,
        "name": "スカイリープ2窓",
        "basePrice": 700000,
        "multiplier": 64
    },
    {
        "id": 7,
        "name": "パソコン2窓",
        "basePrice": 5000000,
        "multiplier": 128
    },
    {
        "id": 8,
        "name": "ゲーミングPC2窓",
        "basePrice": 40000000,
        "multiplier": 256
    },
    {
        "id": 9,
        "name": "パソコン3窓",
        "basePrice": 350000000,
        "multiplier": 512
    },
    {
        "id": 10,
        "name": "古戦場英雄",
        "basePrice": 2800000000,
        "multiplier": 1024
    },
    {
        "id": 11,
        "name": "24時間稼働",
        "basePrice": 20000000000,
        "multiplier": 2048
    },
    {
        "id": 12,
        "name": "ツーラー",
        "basePrice": 150000000000,
        "multiplier": 4096
    }
];

export const TITLES = [
    { threshold: 0, name: "新米騎空士" },
    { threshold: 1, name: "駆け出し騎空士" },
    { threshold: 2, name: "一人前の騎空士" },
    { threshold: 3, name: "熟練の騎空士" },
    { threshold: 4, name: "歴戦の騎空士" },
    { threshold: 5, name: "精鋭の騎空士" },
    { threshold: 6, name: "覇道の騎空士" },
    { threshold: 7, name: "超越せし者" },
    { threshold: 8, name: "極致の守護者" },
    { threshold: 9, name: "星を統べる者" },
    { threshold: 10, name: "創世の騎空士" },
];
