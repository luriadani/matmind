export interface Technique {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  source_platform: 'youtube' | 'vimeo' | 'instagram' | 'tiktok' | 'facebook' | 'custom';
  category: string;
  tags: string | null;
  notes: string | null;
  training_id?: string | null;

  shared_by_gym_id?: string | null;
  created_by: string;
  created_date: string; // ISO date string
  updated_date: string; // ISO date string
  created_by_id: string;
  is_sample?: boolean | null;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
} 