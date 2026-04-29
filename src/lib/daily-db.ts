import { sql } from '@vercel/postgres';

export type MultiBattle = {
  id: string;
  difficulty: string;
  battle_name: string;
  daily_limit: number;
};

export type UserConfig = {
  id: string;
  user_id: string;
  battle_id: string;
  is_active: boolean;
};

export type DailyLog = {
  id: string;
  user_id: string;
  battle_id: string;
  completed_at: Date;
  has_img_flag: boolean;
  img_url: string | null;
};
