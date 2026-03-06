import { type TrackReference, VideoTrack } from '@livekit/components-react';
import { cn } from '../utils';
import { forwardRef } from 'react';

interface VideoTileProps {
    trackRef: TrackReference;
    className?: string;
}

export const VideoTile = forwardRef<HTMLDivElement, VideoTileProps>(
    ({ trackRef, className }, ref) => {
        return (
            <div ref={ref} className={cn('overflow-hidden rounded-lg', className)}>
                <VideoTrack trackRef={trackRef} className="h-full w-full object-cover" />
            </div>
        );
    }
);

VideoTile.displayName = 'VideoTile';
