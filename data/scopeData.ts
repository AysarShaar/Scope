export interface ScopeArticle {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  categorySlug: 'news' | 'region' | 'world' | 'economy' | 'politics' | 'society' | 'culture' | 'science' | 'investigations' | 'history';
  categoryColor?: 'red' | 'blue';
  time?: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
  commentsCount?: number;
  isSpecial?: boolean;
  imageType?:
  | 'anchor_studio'
  | 'skyline_sunset'
  | 'colosseum_history'
  | 'society_people'
  | 'diplomats_meeting'
  | 'oil_shipping'
  | 'world_flags'
  | 'city_ruins'
  | 'youth_future'
  | 'comedy_emoji'
  | 'vintage_book'
  | 'lightbulb_idea'
  | 'number_one'
  | 'deep_investigation'
  | (string & {});
  imageUrl?: string;
  caption?: string;
  author?: {
    name: string;
    role: string;
  };
  authorAvatar?: string;
  editorId?: string;
  content?: string[];
  status?: string;
}

export interface ProgramEpisode {
  id: string;
  programId?: string;
  title: string;
  youtubeId: string;
  date?: string;
  description?: string;
  episodeNumber?: number;
  duration?: string;
}

export interface ScopeShow {
  id: string;
  title: string;
  subtitle: string;
  imageType: string;
  imageUrl?: string;
  episodeCount: number;
  latestEpisode: string;
  host: string;
  description: string;
  youtubeId?: string;
  episodes?: ProgramEpisode[];
}

export interface BreakingItem {
  id: string;
  title: string;
}
