import { motion } from 'framer-motion';
import { ListPlus, Pause, Play } from 'lucide-react';
import { Artwork } from './Artwork';
import { Equalizer } from './Equalizer';
import { LikeButton } from './LikeButton';
import { TrackMenu } from './TrackMenu';
import { usePlayer } from '../context/PlayerContext';
import { listItem } from '../lib/motion';
import { cn, formatTime } from '../lib/utils';
import type { Track } from '../types';

interface TrackRowProps {
  track: Track;
  index: number;
  tracks: Track[];
  contextId: string | null;
  showAlbum?: boolean;
  onRemove?: () => void;
}

export function TrackRow({ track, index, tracks, contextId, showAlbum = true, onRemove }: TrackRowProps) {
  const { current, isPlaying, contextId: activeContext, playTracks, togglePlay, addToQueue } = usePlayer();
  const isCurrent = current?.id === track.id && (activeContext === contextId || contextId === null);
  const playing = isCurrent && isPlaying;

  const activate = () => {
    if (isCurrent) togglePlay();
    else playTracks(tracks, { startIndex: index, contextId });
  };

  return (
    <motion.div
      variants={listItem}
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
      onClick={activate}
      role="row"
      className={cn(
        'group grid cursor-pointer items-center gap-2 rounded-2xl px-2 py-2 sm:gap-4 sm:px-3',
        showAlbum
          ? 'grid-cols-[1.75rem_minmax(0,1fr)_auto_2.75rem] sm:grid-cols-[2.5rem_minmax(0,1fr)_auto_3.5rem] md:grid-cols-[2.5rem_minmax(0,1.6fr)_minmax(0,1fr)_auto_3.5rem]'
          : 'grid-cols-[1.75rem_minmax(0,1fr)_auto_2.75rem] sm:grid-cols-[2.5rem_minmax(0,1fr)_auto_3.5rem]',
        isCurrent && 'bg-white/[0.07]',
      )}
    >
      <div className="relative flex h-8 w-7 items-center justify-center justify-self-center sm:w-8 text-sm tabular-nums text-white/55">
        <span className={cn('group-hover:hidden', isCurrent && 'hidden')}>{index + 1}</span>
        {isCurrent && <Equalizer active={playing} className="text-emerald-300 group-hover:hidden" />}
        <button
          type="button"
          aria-label={playing ? `Pause ${track.title}` : `Play ${track.title}`}
          className="hidden text-white group-hover:block"
          onClick={(e) => {
            e.stopPropagation();
            activate();
          }}
        >
          {playing ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="h-4 w-4" fill="currentColor" />}
        </button>
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <Artwork src={track.cover} alt="" className="h-11 w-11 shrink-0 rounded-lg" />
        <div className="min-w-0">
          <p className={cn('truncate text-[15px] font-medium', isCurrent ? 'text-emerald-300' : 'text-white')}>
            {track.title}
          </p>
          <p className="truncate text-xs text-white/55">{track.artist}</p>
        </div>
      </div>

      {showAlbum && <p className="hidden truncate text-sm text-white/55 md:block">{track.album}</p>}

      <div className="flex items-center gap-1 justify-self-end">
        <button
          type="button"
          aria-label={`Add ${track.title} to queue`}
          onClick={(e) => {
            e.stopPropagation();
            addToQueue(track);
          }}
          className="glass-btn hidden h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 sm:inline-flex"
        >
          <ListPlus className="h-[18px] w-[18px]" />
        </button>
        <LikeButton track={track} />
        <TrackMenu
          track={track}
          onRemove={onRemove}
          className="[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:transition-opacity [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100"
        />
      </div>

      <p className="text-right text-sm tabular-nums text-white/55">{track.duration ? formatTime(track.duration) : '–:––'}</p>
    </motion.div>
  );
}
