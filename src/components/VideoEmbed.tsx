interface VideoEmbedProps {
  url: string;
  className?: string;
}

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function getInstagramId(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export function VideoEmbed({ url, className = '' }: VideoEmbedProps) {
  const ytId = getYouTubeId(url);
  if (ytId) {
    return (
      <div className={`aspect-video rounded-lg overflow-hidden ${className}`}>
        <iframe
          src={`https://www.youtube.com/embed/${ytId}`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube video"
        />
      </div>
    );
  }

  const igId = getInstagramId(url);
  if (igId) {
    return (
      <div className={`rounded-lg overflow-hidden ${className}`}>
        <iframe
          src={`https://www.instagram.com/p/${igId}/embed`}
          className="w-full min-h-[400px] border-0"
          allowFullScreen
          title="Instagram post"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center justify-center gap-2 p-4 bg-muted rounded-lg text-sm text-primary hover:underline"
        >
          📷 Watch on Instagram
        </a>
      </div>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
      🎥 Watch Video
    </a>
  );
}
