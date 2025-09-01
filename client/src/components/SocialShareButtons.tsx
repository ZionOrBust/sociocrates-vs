import { Share2, ExternalLink } from "lucide-react";
import { FaXTwitter, FaInstagram, FaFacebook } from "react-icons/fa6";
import type { YoutubeVideo, SharePlatform } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SocialShareButtonsProps {
  video: YoutubeVideo;
}

export default function SocialShareButtons({ video }: SocialShareButtonsProps) {
  const { toast } = useToast();

  const platforms: SharePlatform[] = [
    {
      name: "X",
      icon: "x-twitter",
      color: "bg-black",
      hoverColor: "hover:bg-gray-800",
    },
    {
      name: "Instagram",
      icon: "instagram",
      color: "bg-pink-600",
      hoverColor: "hover:bg-pink-700",
    },
    {
      name: "Facebook",
      icon: "facebook",
      color: "bg-blue-600",
      hoverColor: "hover:bg-blue-700",
    },
  ];

  const handleShare = async (platform: string) => {
    try {
      const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
      const shareText = `Found this great homesteading video on HomesteadingYouTubeVideos.com: ${video.title}`;

      // Log the share action
      await apiRequest("POST", "/api/share", {
        platform,
        videoId: video.id,
        videoTitle: video.title,
        videoUrl,
      });

      let shareUrl = "";

      switch (platform.toLowerCase()) {
        case "x":
          shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(videoUrl)}`;
          break;
        case "facebook":
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`;
          break;
        case "instagram":
          // Instagram doesn't have direct URL sharing, copy to clipboard instead
          await navigator.clipboard.writeText(`${shareText} ${videoUrl}`);
          toast({
            title: "Copied to clipboard!",
            description: "Share link copied. Paste it in your Instagram post or story.",
          });
          return;
      }

      if (shareUrl) {
        window.open(shareUrl, "_blank", "width=600,height=400");
      }

      toast({
        title: "Shared successfully!",
        description: `Video shared to ${platform}`,
      });
    } catch (error) {
      console.error("Error sharing video:", error);
      toast({
        title: "Share failed",
        description: "Unable to share video. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "x-twitter":
        return <FaXTwitter className="w-3 h-3" />;
      case "instagram":
        return <FaInstagram className="w-3 h-3" />;
      case "facebook":
        return <FaFacebook className="w-3 h-3" />;
      default:
        return <Share2 className="w-3 h-3" />;
    }
  };

  return (
    <div className="flex space-x-2">
      {platforms.map((platform) => (
        <button
          key={platform.name}
          onClick={() => handleShare(platform.name)}
          className={`social-btn ${platform.color} ${platform.hoverColor} text-white px-3 py-1 rounded text-xs transition-all duration-300 flex items-center space-x-1`}
          title={`Share to ${platform.name}`}
        >
          {getIcon(platform.icon)}
          <span>{platform.name === "X" ? "X" : platform.name === "Instagram" ? "IG" : "FB"}</span>
        </button>
      ))}
      <a
        href={`https://www.youtube.com/watch?v=${video.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent-red text-sm font-medium hover:underline flex items-center space-x-1 transition-colors"
        title="Watch on YouTube"
      >
        <span>Watch Video</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}
