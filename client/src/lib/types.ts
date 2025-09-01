export interface Topic {
  id: string;
  name: string;
  description: string;
  slug: string;
  createdAt: string;
}

export interface YoutubeVideo {
  id: string;
  topicId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  likeCount: number;
  viewCount: number;
  isArizonaSpecific: boolean;
  relevanceScore: number;
  popularityScore: number;
  ranking: number;
  lastUpdated: string;
  createdAt: string;
  topic?: string;
}

export interface SharePlatform {
  name: string;
  icon: string;
  color: string;
  hoverColor: string;
}
