import { type TrackReference, VideoTrack } from '@livekit/components-react';
import { cn } from '../utils';
import { forwardRef } from 'react';

interface AvatarTileProps {
    videoTrack: TrackReference;
    className?: string;
}

export const AvatarTile = forwardRef<HTMLDivElement, AvatarTileProps>(
    ({ videoTrack, className }, ref) => {
        return (
            <div ref={ref} className={cn(className)}>
                <VideoTrack
                    trackRef={videoTrack}
                    className="rounded-lg"
                />
            </div>
        );
    }
);

AvatarTile.displayName = 'AvatarTile';
