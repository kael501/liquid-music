import { useEffect, useState } from 'react';
import { Music2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface ArtworkProps {
  src: string;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
  fallbackClassName?: string;
}

const toSmall = (src: string) => src.replace('maxresdefault', 'mqdefault');

/** Square artwork with a resilient fallback chain: max-res → medium thumbnail → gradient tile. */
export function Artwork({ src, alt, className, fallbackIcon, fallbackClassName }: ArtworkProps) {
  const [current, setCurrent] = useState(src);
  const [failed, setFailed] = useState(!src);

  useEffect(() => {
    setCurrent(src);
    setFailed(!src);
  }, [src]);

  const degrade = () => {
    if (current.includes('maxresdefault')) setCurrent(toSmall(current));
    else setFailed(true);
  };

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'flex items-center justify-center text-white/70',
          fallbackClassName ?? 'bg-gradient-to-br from-white/20 to-white/5',
          className,
        )}
      >
        {fallbackIcon ?? <Music2 className="h-1/3 w-1/3" strokeWidth={1.5} />}
      </div>
    );
  }

  return (
    <img
      src={current}
      alt={alt}
      draggable={false}
      loading="lazy"
      onError={degrade}
      onLoad={(e) => {
        if (e.currentTarget.naturalWidth <= 120 && current.includes('maxresdefault')) degrade();
      }}
      className={cn('select-none object-cover', className)}
    />
  );
}
