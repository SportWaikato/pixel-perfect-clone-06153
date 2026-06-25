import { useState } from 'react';
import { getYouTubeEmbedUrl, getYouTubeThumbnailUrl } from '../utils/youtubeUtils';
import { Play } from 'lucide-react';

interface YouTubeVideoEmbedProps {
  url: string;
  title?: string;
  className?: string;
}

const YouTubeVideoEmbed = ({ url, title = 'Event Video', className = '' }: YouTubeVideoEmbedProps) => {
  const [showVideo, setShowVideo] = useState(false);
  const embedUrl = getYouTubeEmbedUrl(url);
  const thumbnailUrl = getYouTubeThumbnailUrl(url, 'high');

  if (!embedUrl) return null;

  return (
    <div className={`relative w-full aspect-video rounded-lg overflow-hidden ${className}`}>
      {showVideo ? (
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <div 
          className="relative w-full h-full cursor-pointer group"
          onClick={() => setShowVideo(true)}
        >
          {thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
            <div className="bg-red-600 hover:bg-red-700 transition-colors duration-200 rounded-full p-4">
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubeVideoEmbed; 