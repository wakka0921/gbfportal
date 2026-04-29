-- 1. multi_battles テーブル (マスタデータ)
CREATE TABLE IF NOT EXISTS multi_battles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    difficulty VARCHAR(50) NOT NULL,
    battle_name VARCHAR(100) NOT NULL,
    daily_limit INTEGER NOT NULL DEFAULT 1
);

-- 2. user_configs テーブル (ユーザーのカスタマイズ設定)
CREATE TABLE IF NOT EXISTS user_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL,
    battle_id UUID NOT NULL REFERENCES multi_battles(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE(user_id, battle_id) -- 同じユーザーが同じバトルを2回追加するのを防ぐ
);

-- 3. daily_logs テーブル (日々の実績)
CREATE TABLE IF NOT EXISTS daily_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL,
    battle_id UUID NOT NULL REFERENCES multi_battles(id) ON DELETE CASCADE,
    completed_at DATE NOT NULL DEFAULT CURRENT_DATE,
    has_img_flag BOOLEAN NOT NULL DEFAULT FALSE,
    completed_count INTEGER DEFAULT 1,
    img_url TEXT,
    UNIQUE(user_id, battle_id, completed_at) -- 同じ日に2回以上完了するのを防ぐ(1回制限の場合)
);

-- ==========================================
-- 初期マスタデータ (Seed) 投入
-- ==========================================
INSERT INTO multi_battles (difficulty, battle_name, daily_limit) VALUES
('マグナ', 'ティアマト・マグナ', 3),
('マグナ', 'コロッサス・マグナ', 3),
('マグナ', 'リヴァイアサン・マグナ', 3),
('マグナ', 'ユグドラシル・マグナ', 3),
('マグナ', 'シュヴァリエ・マグナ', 3),
('マグナ', 'セレスト・マグナ', 3),
('マグナII', 'シヴァ', 2),
('マグナII', 'エウロペ', 2),
('マグナII', 'ブローディア', 2),
('マグナII', 'グリームニル', 2),
('マグナII', 'メタトロン', 2),
('マグナII', 'アバター', 2),
('エニアド', 'アトゥム', 1),
('エニアド', 'テフヌト', 1),
('エニアド', 'ベンヌ', 1),
('エニアド', 'ラー', 1),
('エニアド', 'ホルス', 1),
('エニアド', 'オシリス', 1),
('六竜', 'ウィルナス', 1),
('六竜', 'ワムデュス', 1),
('六竜', 'ガレヲン', 1),
('六竜', 'イーウィヤ', 1),
('六竜', 'ル・オー', 1),
('六竜', 'フェディエル', 1),
('高難易度', 'ルシファー', 1),
('高難易度', 'ベルゼバブ', 1),
('高難易度', 'ベリアル', 1),
('スパバハ', 'スーパーアルティメットバハムート', 1),
('天元', '天元たる六色の理', 1),
('ルシゼロ', 'ダーク・ラプチャー・ゼロ', 1)
ON CONFLICT DO NOTHING;
