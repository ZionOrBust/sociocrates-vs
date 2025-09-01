import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import type { Topic } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";

// Helper function to create topic headings with "Top" or "Best" - Updated July 20, 2025
function getTopicHeading(topicName: string): string {
  const topicWords = [
    "organic gardening",
    "beekeeping", 
    "solar energy",
    "water harvesting",
    "composting",
    "soil building in arid climates",
    "raising chickens",
    "livestock management"
  ];
  
  const bestWords = [
    "permaculture design",
    "herbal medicine", 
    "diy home maintenance",
    "homestead security",
    "off-grid water systems",
    "food preservation"
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

interface TopicCardProps {
  topic: Topic;
}

export default function TopicCard({ topic }: TopicCardProps) {
  const handleTopicClick = () => {
    // Safe analytics tracking with enhanced error handling
    if (topic?.name) {
      trackEvent('topic_click', 'navigation', topic.name, 1);
    }
  };

  // Embedded SVG data - works everywhere without any deployment issues
  const getSvgContent = (slug: string): string => {
    const svgs: Record<string, string> = {
      "organic-gardening": `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" fill="#F5F5DC"/><circle cx="30" cy="40" r="8" fill="#228B22"/><circle cx="50" cy="35" r="6" fill="#32CD32"/><circle cx="70" cy="42" r="7" fill="#006400"/><circle cx="90" cy="38" r="5" fill="#9ACD32"/><rect x="20" y="50" width="80" height="30" fill="#8B4513" rx="2"/><rect x="25" y="55" width="15" height="20" fill="#654321"/><rect x="45" y="55" width="15" height="20" fill="#654321"/><rect x="65" y="55" width="15" height="20" fill="#654321"/><rect x="85" y="55" width="10" height="20" fill="#654321"/><path d="M30 85 Q35 80 40 85 Q45 90 50 85 Q55 80 60 85 Q65 90 70 85 Q75 80 80 85 Q85 90 90 85" stroke="#228B22" stroke-width="2" fill="none"/><circle cx="35" cy="90" r="3" fill="#FF6347"/><circle cx="55" cy="88" r="3" fill="#FF6347"/><circle cx="75" cy="92" r="3" fill="#FF6347"/></svg>`,
      
      "beekeeping": `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" fill="#F5F5DC"/><rect x="35" y="30" width="50" height="60" fill="#8B4513" rx="3"/><rect x="37" y="35" width="46" height="8" fill="#FFD700"/><rect x="37" y="45" width="46" height="8" fill="#FFA500"/><rect x="37" y="55" width="46" height="8" fill="#FFD700"/><rect x="37" y="65" width="46" height="8" fill="#FFA500"/><rect x="37" y="75" width="46" height="8" fill="#FFD700"/><circle cx="45" cy="25" r="2" fill="#000000"/><circle cx="55" cy="23" r="2" fill="#000000"/><circle cx="65" cy="25" r="2" fill="#000000"/><circle cx="75" cy="27" r="2" fill="#000000"/><path d="M45 25 Q50 20 55 23 Q60 18 65 25 Q70 20 75 27" stroke="#000000" stroke-width="1" fill="none"/><rect x="40" y="95" width="40" height="15" fill="#654321" rx="2"/><circle cx="30" cy="40" r="3" fill="#FFD700"/><circle cx="90" cy="50" r="3" fill="#FFD700"/><circle cx="25" cy="60" r="2" fill="#FFD700"/><circle cx="95" cy="35" r="2" fill="#FFD700"/></svg>`,
      
      "raising-chickens": `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" fill="#F5F5DC"/><ellipse cx="60" cy="60" rx="25" ry="20" fill="#FFFFFF"/><ellipse cx="60" cy="45" rx="15" ry="12" fill="#FFFFFF"/><circle cx="55" cy="40" r="2" fill="#000000"/><path d="M65 42 L70 40 L68 45 Z" fill="#FFA500"/><path d="M45 65 L50 70 L40 72 Z" fill="#FFA500"/><path d="M75 65 L80 70 L70 72 Z" fill="#FFA500"/><path d="M50 30 Q55 25 60 30 Q65 25 70 30" stroke="#FF0000" stroke-width="2" fill="none"/><ellipse cx="60" cy="85" rx="30" ry="8" fill="#8B4513"/><rect x="20" y="75" width="80" height="4" fill="#654321"/><circle cx="30" cy="20" r="3" fill="#32CD32"/><circle cx="90" cy="25" r="3" fill="#32CD32"/></svg>`,
      
      "water-harvesting": `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" fill="#F5F5DC"/><path d="M20 30 L100 30 L95 80 L25 80 Z" fill="#4682B4" stroke="#2F4F4F" stroke-width="2"/><rect x="45" y="10" width="30" height="25" fill="#8B4513" stroke="#654321" stroke-width="1"/><rect x="50" y="15" width="20" height="15" fill="#654321"/><path d="M20 30 Q30 25 40 30 Q50 35 60 30 Q70 25 80 30 Q90 35 100 30" stroke="#87CEEB" stroke-width="2" fill="none"/><circle cx="35" cy="50" r="3" fill="#00BFFF"/><circle cx="65" cy="45" r="3" fill="#00BFFF"/><circle cx="80" cy="60" r="3" fill="#00BFFF"/><path d="M10 15 Q15 10 20 15" stroke="#87CEEB" stroke-width="2" fill="none"/><path d="M85 20 Q90 15 95 20" stroke="#87CEEB" stroke-width="2" fill="none"/><rect x="15" y="85" width="90" height="10" fill="#228B22"/></svg>`,
      
      "composting": `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" fill="#F5F5DC"/><rect x="25" y="45" width="70" height="40" fill="#654321" rx="5"/><rect x="30" y="50" width="60" height="30" fill="#8B4513"/><circle cx="40" cy="60" r="3" fill="#32CD32"/><circle cx="60" cy="55" r="4" fill="#228B22"/><circle cx="80" cy="65" r="3" fill="#9ACD32"/><rect x="35" y="58" width="8" height="2" fill="#8B4513"/><rect x="65" y="62" width="6" height="2" fill="#8B4513"/><rect x="75" y="57" width="10" height="2" fill="#8B4513"/><path d="M45 35 Q50 30 55 35 Q60 40 65 35" stroke="#32CD32" stroke-width="2" fill="none"/><circle cx="50" cy="25" r="2" fill="#228B22"/><circle cx="70" cy="30" r="2" fill="#228B22"/><rect x="20" y="90" width="80" height="5" fill="#8B4513"/></svg>`,
      
      "permaculture-design": `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" fill="#F5F5DC"/><circle cx="60" cy="60" r="40" fill="none" stroke="#228B22" stroke-width="2"/><circle cx="60" cy="60" r="25" fill="none" stroke="#32CD32" stroke-width="2"/><circle cx="60" cy="60" r="10" fill="#9ACD32"/><path d="M60 20 L65 30 L60 40 L55 30 Z" fill="#228B22"/><path d="M100 60 L90 65 L80 60 L90 55 Z" fill="#228B22"/><path d="M60 100 L55 90 L60 80 L65 90 Z" fill="#228B22"/><path d="M20 60 L30 55 L40 60 L30 65 Z" fill="#228B22"/><circle cx="45" cy="45" r="3" fill="#FF6347"/><circle cx="75" cy="45" r="3" fill="#FF6347"/><circle cx="75" cy="75" r="3" fill="#FF6347"/><circle cx="45" cy="75" r="3" fill="#FF6347"/><path d="M30 30 Q40 35 50 30" stroke="#8B4513" stroke-width="2" fill="none"/><path d="M70 30 Q80 35 90 30" stroke="#8B4513" stroke-width="2" fill="none"/></svg>`,
      
      "solar-energy": `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" fill="#F5F5DC"/><rect x="30" y="50" width="60" height="30" fill="#000080" stroke="#000000" stroke-width="1"/><rect x="32" y="52" width="26" height="26" fill="#000080" stroke="#FFFFFF" stroke-width="0.5"/><rect x="62" y="52" width="26" height="26" fill="#000080" stroke="#FFFFFF" stroke-width="0.5"/><circle cx="60" cy="25" r="8" fill="#FFD700"/><path d="M60 10 L60 20" stroke="#FFD700" stroke-width="2"/><path d="M60 30 L60 40" stroke="#FFD700" stroke-width="2"/><path d="M75 25 L85 25" stroke="#FFD700" stroke-width="2"/><path d="M35 25 L45 25" stroke="#FFD700" stroke-width="2"/><path d="M71 14 L78 21" stroke="#FFD700" stroke-width="2"/><path d="M42 29 L49 36" stroke="#FFD700" stroke-width="2"/><path d="M49 14 L42 21" stroke="#FFD700" stroke-width="2"/><path d="M78 29 L71 36" stroke="#FFD700" stroke-width="2"/><rect x="35" y="85" width="50" height="8" fill="#654321"/><path d="M55 80 L60 50 L65 80" stroke="#000000" stroke-width="2" fill="none"/></svg>`,
      
      "food-preservation": `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" fill="#F5F5DC"/><rect x="30" y="35" width="20" height="50" fill="#32CD32" stroke="#228B22" stroke-width="2" rx="2"/><rect x="55" y="35" width="20" height="50" fill="#FF6347" stroke="#DC143C" stroke-width="2" rx="2"/><rect x="80" y="35" width="20" height="50" fill="#FFD700" stroke="#DAA520" stroke-width="2" rx="2"/><rect x="32" y="25" width="16" height="15" fill="#C0C0C0" stroke="#808080" stroke-width="1" rx="8"/><rect x="57" y="25" width="16" height="15" fill="#C0C0C0" stroke="#808080" stroke-width="1" rx="8"/><rect x="82" y="25" width="16" height="15" fill="#C0C0C0" stroke="#808080" stroke-width="1" rx="8"/><rect x="25" y="90" width="70" height="15" fill="#8B4513" rx="2"/><circle cx="40" cy="45" r="2" fill="#006400"/><circle cx="65" cy="50" r="2" fill="#8B0000"/><circle cx="90" cy="45" r="2" fill="#B8860B"/></svg>`,
      
      "herbal-medicine": `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" fill="#F5F5DC"/><circle cx="60" cy="60" r="25" fill="#9ACD32"/><path d="M45 45 Q52 38 60 45 Q68 38 75 45 Q68 52 60 45 Q52 52 45 45" fill="#228B22"/><circle cx="55" cy="50" r="3" fill="#32CD32"/><circle cx="65" cy="50" r="3" fill="#32CD32"/><circle cx="60" cy="65" r="4" fill="#006400"/><rect x="30" y="30" width="8" height="25" fill="#654321"/><rect x="82" y="35" width="8" height="20" fill="#654321"/><circle cx="34" cy="25" r="4" fill="#FF69B4"/><circle cx="86" cy="30" r="4" fill="#FF69B4"/><path d="M25 75 Q35 70 45 75 Q55 80 65 75 Q75 70 85 75 Q95 80 105 75" stroke="#228B22" stroke-width="2" fill="none"/><circle cx="30" cy="85" r="2" fill="#8A2BE2"/><circle cx="50" cy="88" r="2" fill="#8A2BE2"/><circle cx="70" cy="85" r="2" fill="#8A2BE2"/><circle cx="90" cy="88" r="2" fill="#8A2BE2"/></svg>`,
      
      "livestock-management": `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" fill="#F5F5DC"/><ellipse cx="60" cy="65" rx="30" ry="20" fill="#8B4513"/><ellipse cx="60" cy="45" rx="20" ry="15" fill="#8B4513"/><circle cx="55" cy="40" r="2" fill="#000000"/><circle cx="65" cy="40" r="2" fill="#000000"/><ellipse cx="50" cy="35" rx="3" ry="5" fill="#000000"/><ellipse cx="70" cy="35" rx="3" ry="5" fill="#000000"/><rect x="50" y="85" width="6" height="15" fill="#654321"/><rect x="64" y="85" width="6" height="15" fill="#654321"/><rect x="20" y="25" width="80" height="4" fill="#654321"/><rect x="25" y="25" width="4" height="20" fill="#654321"/><rect x="91" y="25" width="4" height="20" fill="#654321"/><rect x="55" y="25" width="4" height="20" fill="#654321"/><rect x="20" y="100" width="80" height="8" fill="#228B22"/><circle cx="30" cy="50" r="2" fill="#FFD700"/><circle cx="90" cy="55" r="2" fill="#FFD700"/></svg>`,
      
      "diy-home-maintenance": `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" fill="#F5F5DC"/><rect x="20" y="40" width="80" height="50" fill="#8B4513" stroke="#654321" stroke-width="2"/><polygon points="20,40 60,20 100,40" fill="#DC143C" stroke="#8B0000" stroke-width="2"/><rect x="35" y="60" width="15" height="30" fill="#654321" stroke="#000000" stroke-width="1"/><rect x="70" y="55" width="20" height="20" fill="#87CEEB" stroke="#4682B4" stroke-width="1"/><rect x="72" y="57" width="8" height="8" fill="#B0E0E6"/><rect x="82" y="57" width="8" height="8" fill="#B0E0E6"/><rect x="72" y="67" width="8" height="8" fill="#B0E0E6"/><rect x="82" y="67" width="8" height="8" fill="#B0E0E6"/><rect x="30" y="25" width="8" height="20" fill="#FFD700"/><rect x="26" y="29" width="16" height="3" fill="#B8860B"/><circle cx="45" cy="68" r="2" fill="#C0C0C0"/><rect x="15" y="95" width="90" height="8" fill="#228B22"/></svg>`,
      
      "homestead-security": `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" fill="#F5F5DC"/><path d="M60 20 L40 35 L40 75 L60 85 L80 75 L80 35 Z" fill="#4682B4" stroke="#2F4F4F" stroke-width="2"/><circle cx="60" cy="50" r="8" fill="#FFD700" stroke="#DAA520" stroke-width="1"/><rect x="58" y="58" width="4" height="10" fill="#B8860B"/><rect x="25" y="45" width="12" height="25" fill="#654321"/><rect x="83" y="45" width="12" height="25" fill="#654321"/><circle cx="31" cy="40" r="3" fill="#FF0000"/><circle cx="89" cy="40" r="3" fill="#FF0000"/><rect x="50" y="25" width="20" height="4" fill="#C0C0C0"/><rect x="50" y="32" width="20" height="4" fill="#C0C0C0"/><path d="M20 90 L100 90" stroke="#654321" stroke-width="4"/><rect x="45" y="85" width="30" height="8" fill="#8B4513"/></svg>`,
      
      "off-grid-water-systems": `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" fill="#F5F5DC"/><rect x="40" y="45" width="40" height="40" fill="#4682B4" stroke="#2F4F4F" stroke-width="2" rx="3"/><rect x="45" y="50" width="30" height="30" fill="#87CEEB"/><circle cx="60" cy="65" r="8" fill="#00BFFF"/><rect x="55" y="25" width="10" height="25" fill="#654321"/><rect x="52" y="20" width="16" height="8" fill="#8B4513"/><rect x="30" y="35" width="15" height="4" fill="#C0C0C0"/><rect x="75" y="35" width="15" height="4" fill="#C0C0C0"/><path d="M20 40 Q25 35 30 40" stroke="#4682B4" stroke-width="2" fill="none"/><path d="M90 40 Q95 35 100 40" stroke="#4682B4" stroke-width="2" fill="none"/><circle cx="25" cy="50" r="2" fill="#00BFFF"/><circle cx="95" cy="50" r="2" fill="#00BFFF"/><rect x="35" y="90" width="50" height="6" fill="#228B22"/><path d="M50 85 Q60 80 70 85" stroke="#87CEEB" stroke-width="3" fill="none"/></svg>`,
      
      "soil-building-in-arid-climates": `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" fill="#F5F5DC"/><rect x="10" y="70" width="100" height="30" fill="#8B4513"/><rect x="10" y="60" width="100" height="10" fill="#D2691E"/><rect x="10" y="50" width="100" height="10" fill="#CD853F"/><circle cx="25" cy="45" r="8" fill="#FFD700"/><path d="M17 37 L25 29 L33 37" stroke="#FFD700" stroke-width="2" fill="none"/><path d="M19 39 L31 39" stroke="#FFD700" stroke-width="2" fill="none"/><path d="M21 41 L29 41" stroke="#FFD700" stroke-width="2" fill="none"/><circle cx="50" cy="40" r="3" fill="#32CD32"/><circle cx="70" cy="42" r="3" fill="#32CD32"/><circle cx="90" cy="38" r="3" fill="#32CD32"/><path d="M45 35 L45 20 L55 25 L50 30" fill="#228B22"/><path d="M65 37 L65 22 L75 27 L70 32" fill="#228B22"/><path d="M85 33 L85 18 L95 23 L90 28" fill="#228B22"/><circle cx="35" cy="75" r="2" fill="#654321"/><circle cx="60" cy="78" r="2" fill="#654321"/><circle cx="85" cy="75" r="2" fill="#654321"/></svg>`
    };
    return svgs[slug] || '';
  };

  const renderImage = () => {
    // Use custom images for specific topics, SVG for others
    if (topic.slug === 'beekeeping') {
      return (
        <img 
          src="/images/beekeeping.jpg"
          alt={`${topic.name} videos`}
          className="video-thumbnail rounded-lg w-full md:w-80 h-48 md:h-45 cursor-pointer transition-opacity hover:opacity-80 object-cover"
        />
      );
    }
    
    if (topic.slug === 'composting') {
      return (
        <img 
          src="/images/composting-videos.jpg"
          alt={`${topic.name} videos`}
          className="video-thumbnail rounded-lg w-full md:w-80 h-48 md:h-45 cursor-pointer transition-opacity hover:opacity-80 object-cover"
        />
      );
    }
    
    if (topic.slug === 'diy-home-maintenance') {
      return (
        <img 
          src="/images/home-maintenance-videos.jpg"
          alt={`${topic.name} videos`}
          className="video-thumbnail rounded-lg w-full md:w-80 h-48 md:h-45 cursor-pointer transition-opacity hover:opacity-80 object-cover"
        />
      );
    }
    
    if (topic.slug === 'food-preservation') {
      return (
        <img 
          src="/images/food-preservation-videos.jpg"
          alt={`${topic.name} videos`}
          className="video-thumbnail rounded-lg w-full md:w-80 h-48 md:h-45 cursor-pointer transition-opacity hover:opacity-80 object-cover"
        />
      );
    }
    
    if (topic.slug === 'herbal-medicine') {
      return (
        <img 
          src="/images/herbal-medicine-videos.jpg"
          alt={`${topic.name} videos`}
          className="video-thumbnail rounded-lg w-full md:w-80 h-48 md:h-45 cursor-pointer transition-opacity hover:opacity-80 object-cover"
        />
      );
    }
    
    if (topic.slug === 'homestead-security') {
      return (
        <img 
          src="/images/homestead-security-videos.jpg"
          alt={`${topic.name} videos`}
          className="video-thumbnail rounded-lg w-full md:w-80 h-48 md:h-45 cursor-pointer transition-opacity hover:opacity-80 object-cover"
        />
      );
    }
    
    if (topic.slug === 'off-grid-water-systems') {
      return (
        <img 
          src="/images/off-grid-water-systems-videos.jpg"
          alt={`${topic.name} videos`}
          className="video-thumbnail rounded-lg w-full md:w-80 h-48 md:h-45 cursor-pointer transition-opacity hover:opacity-80 object-cover"
        />
      );
    }
    
    if (topic.slug === 'livestock-management') {
      return (
        <img 
          src="/images/livestock-management-videos.jpg"
          alt={`${topic.name} videos`}
          className="video-thumbnail rounded-lg w-full md:w-80 h-48 md:h-45 cursor-pointer transition-opacity hover:opacity-80 object-cover"
        />
      );
    }
    
    if (topic.slug === 'organic-gardening') {
      return (
        <img 
          src="/images/organic-gardening-videos.jpg"
          alt={`${topic.name} videos`}
          className="video-thumbnail rounded-lg w-full md:w-80 h-48 md:h-45 cursor-pointer transition-opacity hover:opacity-80 object-cover"
        />
      );
    }
    
    if (topic.slug === 'permaculture-design') {
      return (
        <img 
          src="/images/permaculture-design-videos.jpg"
          alt={`${topic.name} videos`}
          className="video-thumbnail rounded-lg w-full md:w-80 h-48 md:h-45 cursor-pointer transition-opacity hover:opacity-80 object-cover"
        />
      );
    }
    
    if (topic.slug === 'raising-chickens') {
      return (
        <img 
          src="/images/raising-chickens-videos.jpg"
          alt={`${topic.name} videos`}
          className="video-thumbnail rounded-lg w-full md:w-80 h-48 md:h-45 cursor-pointer transition-opacity hover:opacity-80 object-cover"
        />
      );
    }
    
    if (topic.slug === 'soil-building-in-arid-climates') {
      return (
        <img 
          src="/images/soil-building-videos.jpg"
          alt={`${topic.name} videos`}
          className="video-thumbnail rounded-lg w-full md:w-80 h-48 md:h-45 cursor-pointer transition-opacity hover:opacity-80 object-cover"
        />
      );
    }
    
    if (topic.slug === 'solar-energy') {
      return (
        <img 
          src="/images/solar-energy-videos.jpg"
          alt={`${topic.name} videos`}
          className="video-thumbnail rounded-lg w-full md:w-80 h-48 md:h-45 cursor-pointer transition-opacity hover:opacity-80 object-cover"
        />
      );
    }
    
    if (topic.slug === 'water-harvesting') {
      return (
        <img 
          src="/images/water-harvesting-videos.jpg"
          alt={`${topic.name} videos`}
          className="video-thumbnail rounded-lg w-full md:w-80 h-48 md:h-45 cursor-pointer transition-opacity hover:opacity-80 object-cover"
        />
      );
    }
    
    const svgContent = getSvgContent(topic.slug);
    if (svgContent) {
      // Scale SVG to fill the entire container (320x180)
      const scaledSvgContent = svgContent.replace(
        'width="120" height="120" viewBox="0 0 120 120"',
        'width="100%" height="100%" viewBox="0 0 120 120" preserveAspectRatio="none"'
      );
      return (
        <div 
          className="video-thumbnail rounded-lg w-full md:w-80 h-48 md:h-45 cursor-pointer transition-opacity hover:opacity-80 bg-white overflow-hidden"
          dangerouslySetInnerHTML={{ __html: scaledSvgContent }}
          role="img"
          aria-label={`${topic.name} videos`}
        />
      );
    }
    return (
      <div className="video-thumbnail rounded-lg bg-gray-200 w-full md:w-80 h-48 md:h-45 flex items-center justify-center cursor-pointer">
        <span className="text-gray-500 font-semibold">{topic.name}</span>
      </div>
    );
  };

  return (
    <div className="topic-card bg-white rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-shrink-0">
          <Link href={`/topics/${topic.slug}`} onClick={handleTopicClick}>
            {renderImage()}
          </Link>
        </div>
        <div className="flex-1">
          <Link href={`/topics/${topic.slug}`} onClick={handleTopicClick}>
            <h3 className="text-xl font-lora font-semibold text-dark-blue mb-2 cursor-pointer hover:text-accent-red transition-colors">
              {getTopicHeading(topic.name)}
            </h3>
          </Link>
          <p className="text-text-gray mb-4 leading-relaxed">
            {topic.description}
          </p>
          <Link
            href={`/topics/${topic.slug}`}
            className="inline-flex items-center text-accent-red font-medium hover:underline transition-colors"
            onClick={handleTopicClick}
          >
            Explore Videos <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
