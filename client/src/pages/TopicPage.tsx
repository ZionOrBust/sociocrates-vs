import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Loader2, VideoOff } from "lucide-react";
import VideoCard from "@/components/VideoCard";
import type { Topic, YoutubeVideo } from "@/lib/types";

// Helper function to create topic headings with "Top" or "Best" - Updated July 20, 2025
function getTopicHeading(topicName: string): string {
  const topicWords = [
    "organic gardening",
    "beekeeping", 
    "solar energy",
    "water harvesting",
    "composting",
    "soil building in arid climates"
  ];
  
  const bestWords = [
    "permaculture design",
    "herbal medicine", 
    "diy home maintenance",
    "homestead security",
    "off-grid water systems"
  ];
  
  const lowerName = topicName.toLowerCase();
  
  if (topicWords.includes(lowerName)) {
    return `Top ${topicName} Videos`;
  } else if (bestWords.includes(lowerName)) {
    return `Best ${topicName} Videos`;
  } else {
    return `Premium ${topicName} Videos`;
  }
}

export default function TopicPage() {
  const params = useParams();
  
  // Extract slug with fallback from URL pathname
  const slug = params?.slug || (() => {
    const path = window.location.pathname;
    const segments = path.split('/');
    return segments[segments.length - 1] || segments[segments.length - 2];
  })();

  console.log('TopicPage params:', params, 'extracted slug:', slug);

  // Early return if no slug is available
  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-lora font-bold text-dark-blue mb-4">
            Invalid Topic URL
          </h2>
          <p className="text-text-gray mb-6">
            The requested topic URL is not valid.
          </p>
          <Link
            href="/"
            className="inline-flex items-center text-accent-red font-medium hover:underline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Topics
          </Link>
        </div>
      </div>
    );
  }

  const { data: topic, isLoading: topicLoading } = useQuery<Topic>({
    queryKey: ["/api/topics", slug],
    queryFn: async () => {
      console.log('Fetching topic data for slug:', slug);
      const baseUrl = import.meta.env.DEV ? 'http://localhost:5000' : '';
      const res = await fetch(`${baseUrl}/api/topics/${slug}`);
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      const data = await res.json();
      console.log('Topic data received:', data);
      return data;
    },
    enabled: !!slug && slug.length > 0,
  });

  const { data: videos, isLoading: videosLoading } = useQuery<YoutubeVideo[]>({
    queryKey: ["/api/topics", slug, "videos"],
    queryFn: async () => {
      console.log('Fetching videos for slug:', slug);
      const baseUrl = import.meta.env.DEV ? 'http://localhost:5000' : '';
      const url = `${baseUrl}/api/topics/${slug}/videos`;
      console.log('Making request to:', url);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      const data = await res.json();
      console.log('Videos data received:', data.length, 'videos');
      if (data.length > 0) {
        console.log('First video sample:', data[0]);
      }
      return data;
    },
    enabled: !!slug && slug.length > 0,
  });

  if (topicLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-dark-blue" />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-lora font-bold text-dark-blue mb-4">
            Topic not found
          </h2>
          <p className="text-text-gray mb-6">
            The requested homesteading topic could not be found.
          </p>
          <Link
            href="/"
            className="inline-flex items-center text-accent-red font-medium hover:underline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Topics
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Page Header */}
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-4">
            <Link
              href="/"
              className="text-accent-red hover:underline mr-2 flex items-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Topics
            </Link>
          </div>
          <h1 className="text-4xl md:text-5xl font-lora font-bold text-dark-blue mb-4">
            {getTopicHeading(topic.name)}
          </h1>
          <p className="text-lg text-text-gray">
            These are the top videos on YouTube today for {topic.name.toLowerCase()}. Our expert-curated selection covers everything from basics to advanced techniques, with a focus on sustainable practices and practical solutions for homesteaders.
          </p>
        </div>

        {/* Videos Grid */}
        <div className="max-w-7xl mx-auto">
          {videosLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-dark-blue" />
            </div>
          ) : videos && videos.length > 0 ? (
            <div className="space-y-8">
              {/* Top 10 General Videos */}
              <div className="grid md:grid-cols-2 gap-6">
                {videos.slice(0, 10).map((video, index) => (
                  <VideoCard 
                    key={video.id} 
                    video={{
                      ...video,
                      ranking: index + 1
                    }} 
                    topicName={topic.name}
                    showRanking={true}
                  />
                ))}
              </div>
              
              {/* Arizona-Specific Section Divider */}
              {videos.length > 10 && (
                <div className="text-center py-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="flex-1 h-px bg-border-green"></div>
                    <div className="px-6 py-2 bg-border-green text-white text-sm font-semibold rounded-full">
                      Arizona-Specific Content
                    </div>
                    <div className="flex-1 h-px bg-border-green"></div>
                  </div>
                  <p className="text-text-gray text-sm">
                    These videos focus specifically on Arizona homesteading conditions and techniques
                  </p>
                </div>
              )}
              
              {/* Arizona-Specific Videos */}
              {videos.length > 10 && (
                <div className="grid md:grid-cols-2 gap-6">
                  {videos.slice(10).map((video, index) => (
                    <VideoCard 
                      key={video.id} 
                      video={{
                        ...video,
                        ranking: index + 1
                      }} 
                      topicName={topic.name}
                      showRanking={true}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <VideoOff className="w-16 h-16 text-border-green mx-auto mb-4" />
              <h3 className="text-xl font-lora font-semibold text-dark-blue mb-2">
                No videos available yet
              </h3>
              <p className="text-text-gray mb-6">
                We're working on curating the best {topic.name.toLowerCase()} videos for Arizona homesteaders. Please check back soon!
              </p>
              <Link
                href="/"
                className="inline-flex items-center text-accent-red font-medium hover:underline"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Explore Other Topics
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
