import {
  type User,
  type UpsertUser,
  type Topic,
  type InsertTopic,
  type YoutubeVideo,
  type InsertYoutubeVideo,
} from "@shared/schema";
import { IStorage } from "./storage";

// In-memory storage for development
export class DevelopmentStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private topics: Map<string, Topic> = new Map();
  private videos: Map<string, YoutubeVideo> = new Map();

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Initialize default topics
    const defaultTopics: Topic[] = [
      {
        id: "organic-gardening",
        name: "Organic Gardening",
        slug: "organic-gardening",
        description: "Learn sustainable organic gardening techniques for healthier crops and soil.",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "raising-chickens",
        name: "Raising Chickens",
        slug: "raising-chickens",
        description: "Complete guide to raising healthy chickens for eggs and meat.",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "beekeeping",
        name: "Beekeeping",
        slug: "beekeeping",
        description: "Start your beekeeping journey with essential techniques and tips.",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "solar-energy",
        name: "Solar Energy",
        slug: "solar-energy",
        description: "Harness solar power for your homestead with practical solar solutions.",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "water-harvesting",
        name: "Water Harvesting",
        slug: "water-harvesting",
        description: "Collect and store rainwater for sustainable water management.",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "food-preservation",
        name: "Food Preservation",
        slug: "food-preservation",
        description: "Traditional and modern methods for preserving your harvest.",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultTopics.forEach(topic => {
      this.topics.set(topic.id, topic);
    });

    // Initialize sample videos
    const sampleVideos: YoutubeVideo[] = [
      {
        id: "dQw4w9WgXcQ",
        title: "Ultimate Organic Gardening Guide for Beginners",
        description: "Learn the basics of organic gardening with this comprehensive tutorial.",
        thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
        channelId: "UCGardeningPro",
        channelTitle: "Gardening Pro",
        publishedAt: new Date("2024-01-15"),
        viewCount: 125000,
        likeCount: 3500,
        topicId: "organic-gardening",
        isArizonaSpecific: false,
        relevanceScore: 85,
        popularityScore: 90,
        ranking: 1,
        lastUpdated: new Date(),
        createdAt: new Date()
      },
      {
        id: "jNQXAC9IVRw",
        title: "Raising Chickens: Complete Beginner's Guide",
        description: "Everything you need to know about raising healthy chickens.",
        thumbnailUrl: "https://i.ytimg.com/vi/jNQXAC9IVRw/mqdefault.jpg",
        channelId: "UCChickenLady",
        channelTitle: "The Chicken Lady",
        publishedAt: new Date("2024-02-10"),
        viewCount: 89000,
        likeCount: 2100,
        topicId: "raising-chickens",
        isArizonaSpecific: false,
        relevanceScore: 88,
        popularityScore: 85,
        ranking: 1,
        lastUpdated: new Date(),
        createdAt: new Date()
      },
      {
        id: "y6120QOlsfU",
        title: "Beekeeping Basics: Starting Your First Hive",
        description: "Step-by-step guide to starting your beekeeping journey safely.",
        thumbnailUrl: "https://i.ytimg.com/vi/y6120QOlsfU/mqdefault.jpg",
        channelId: "UCBeeKeeper",
        channelTitle: "Bee Keeper Pro",
        publishedAt: new Date("2024-03-05"),
        viewCount: 156000,
        likeCount: 4200,
        topicId: "beekeeping",
        isArizonaSpecific: false,
        relevanceScore: 92,
        popularityScore: 95,
        ranking: 1,
        lastUpdated: new Date(),
        createdAt: new Date()
      }
    ];

    sampleVideos.forEach(video => {
      this.videos.set(video.id, video);
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const user: User = {
      ...userData,
      createdAt: this.users.get(userData.id)?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  // Topic operations
  async getAllTopics(): Promise<Topic[]> {
    return Array.from(this.topics.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getTopicBySlug(slug: string): Promise<Topic | undefined> {
    return Array.from(this.topics.values()).find(topic => topic.slug === slug);
  }

  async upsertTopic(topicData: InsertTopic): Promise<Topic> {
    const topic: Topic = {
      ...topicData,
      createdAt: this.topics.get(topicData.id)?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.topics.set(topic.id, topic);
    return topic;
  }

  // Video operations
  async getVideosByTopic(topicId: string, limit = 12): Promise<YoutubeVideo[]> {
    return Array.from(this.videos.values())
      .filter(video => video.topicId === topicId)
      .sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0))
      .slice(0, limit);
  }

  async getVideoById(videoId: string): Promise<YoutubeVideo | undefined> {
    return this.videos.get(videoId);
  }

  async getVideosByTopicSlug(slug: string, limit = 12): Promise<YoutubeVideo[]> {
    const topic = await this.getTopicBySlug(slug);
    if (!topic) return [];
    return this.getVideosByTopic(topic.id, limit);
  }

  async upsertVideo(videoData: InsertYoutubeVideo): Promise<YoutubeVideo> {
    const video: YoutubeVideo = {
      ...videoData,
      createdAt: this.videos.get(videoData.id)?.createdAt || new Date(),
      lastUpdated: new Date(),
    };
    this.videos.set(video.id, video);
    return video;
  }

  async deleteOldVideosForTopic(topicId: string, keepIds: string[]): Promise<void> {
    for (const [id, video] of this.videos.entries()) {
      if (video.topicId === topicId && !keepIds.includes(id)) {
        this.videos.delete(id);
      }
    }
  }

  async updateVideoRankings(topicId: string): Promise<void> {
    const videos = await this.getVideosByTopic(topicId, 50);
    const sortedVideos = videos
      .sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0))
      .slice(0, 12);

    sortedVideos.forEach((video, index) => {
      const updatedVideo = { ...video, ranking: index + 1 };
      this.videos.set(video.id, updatedVideo);
    });
  }
}
