import { ListEnd, ListPlus, ListStart, MinusCircle, MoreHorizontal, Share2, User } from 'lucide-react';
import { MenuDivider, MenuItem, Popover } from './Popover';
import { useDialogs } from '../context/DialogContext';
import { useNav } from '../context/NavContext';
import { usePlayer } from '../context/PlayerContext';
import { useToast } from '../context/ToastContext';
import { primaryArtist } from '../services/ytMusicService';
import { cn } from '../lib/utils';
import type { Track } from '../types';

interface TrackMenuProps {
  track: Track;
  className?: string;
  /** shown for tracks inside an editable playlist */
  onRemove?: () => void;
}

export function TrackMenu({ track, className, onRemove }: TrackMenuProps) {
  const { addToQueue, playNext, isLiked, toggleLike } = usePlayer();
  const { openPicker } = useDialogs();
  const { navigate } = useNav();
  const { toast } = useToast();

  const share = async (close: () => void) => {
    close();
    const url = `https://youtu.be/${track.videoId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied to clipboard');
    } catch {
      toast(url);
    }
  };

  return (
    <Popover
      trigger={({ ref, toggle, open }) => (
        <button
          ref={ref}
          type="button"
          aria-label={`More options for ${track.title}`}
          aria-expanded={open}
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
          className={cn('glass-btn h-8 w-8', className)}
          data-active={open}
        >
          <MoreHorizontal className="h-[18px] w-[18px]" />
        </button>
      )}
    >
      {(close) => (
        <>
          <MenuItem icon={<ListStart className="h-4 w-4" />} label="Play next" onSelect={() => { playNext(track); toast('Will play next'); close(); }} />
          <MenuItem icon={<ListEnd className="h-4 w-4" />} label="Add to queue" onSelect={() => { addToQueue(track); toast('Added to queue'); close(); }} />
          <MenuItem icon={<ListPlus className="h-4 w-4" />} label="Add to playlist…" onSelect={() => { close(); openPicker([track]); }} />
          <MenuItem
            label={isLiked(track.id) ? (track.kind === 'video' ? 'Remove from Liked Videos' : 'Remove from Liked Songs') : (track.kind === 'video' ? 'Save to Liked Videos' : 'Save to Liked Songs')}
            onSelect={() => { toggleLike(track); close(); }}
          />
          <MenuDivider />
          {track.kind !== 'video' && (
            <MenuItem icon={<User className="h-4 w-4" />} label="Go to artist" onSelect={() => { close(); navigate({ type: 'collection', id: `artist:${primaryArtist(track.artist)}` }); }} />
          )}
          <MenuItem icon={<Share2 className="h-4 w-4" />} label="Copy link" onSelect={() => void share(close)} />
          {onRemove && (
            <>
              <MenuDivider />
              <MenuItem danger icon={<MinusCircle className="h-4 w-4" />} label="Remove from this playlist" onSelect={() => { onRemove(); close(); }} />
            </>
          )}
        </>
      )}
    </Popover>
  );
}
