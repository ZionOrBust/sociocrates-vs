import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Loader2, ExternalLink } from "lucide-react";
import type { YoutubeVideo } from "@/lib/types";

export default function VideoPlayer() {
  const { videoId } = useParams();

  const { data: video, isLoading } = useQuery<YoutubeVideo>({
    queryKey: ["/api/video", videoId],
    queryFn: async () => {
      const baseUrl = import.meta.env.DEV ? 'http://localhost:5000' : '';
      const res = await fetch(`${baseUrl}/api/video/${videoId}`);
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
    enabled: !!videoId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-dark-blue" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-lora font-bold text-dark-blue mb-4">
            Video not found
          </h2>
          <p className="text-text-gray mb-6">
            The requested video could not be found.
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center text-accent-red font-medium hover:underline transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Topics
          </Link>
          <a
            href={`https://youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-dark-blue font-medium hover:underline transition-colors"
          >
            Watch on YouTube
            <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </div>



        {/* Video Player */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="aspect-video w-full">
            <iframe
              src={`https://www.youtube.com/embed/${video.id}?rel=0&modestbranding=1`}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
          
          {/* Video Info */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-lora font-bold text-dark-blue mb-2 leading-tight">
                  {video.title}
                </h1>
                <div className="flex items-center text-sm text-text-gray mb-4">
                  <span className="font-medium">{video.channelTitle}</span>
                  <span className="mx-2">•</span>
                  <span>{formatDate(video.publishedAt)}</span>
                  <span className="mx-2">•</span>
                  <span>{video.likeCount?.toLocaleString() || 0} likes</span>
                </div>
              </div>
              {video.isArizonaSpecific && (
                <div className="bg-border-green text-white px-3 py-1 rounded text-sm font-medium">
                  Specialized Content
                </div>
              )}
            </div>
            
            {video.description && (
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-semibold text-dark-blue mb-2">Description</h3>
                <p className="text-text-gray leading-relaxed whitespace-pre-wrap">
                  {video.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
