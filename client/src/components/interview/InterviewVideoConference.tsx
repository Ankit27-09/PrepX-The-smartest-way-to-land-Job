/**
 * Custom VideoConference component for the interview room.
 * Based on LiveKit's VideoConference source — uses the same hooks and layout
 * primitives but adds interview-specific controls and panels directly into
 * the component tree (timer, code editor, coding question, etc).
 */
import type {
    MessageDecoder,
    MessageEncoder,
    TrackReferenceOrPlaceholder,
    WidgetState,
} from '@livekit/components-core';
import { isEqualTrackRef, isTrackReference, isWeb, log } from '@livekit/components-core';
import { RoomEvent, Track } from 'livekit-client';
import * as React from 'react';
import type { MessageFormatter } from '@livekit/components-react';
import {
    CarouselLayout,
    ConnectionStateToast,
    FocusLayout,
    FocusLayoutContainer,
    GridLayout,
    LayoutContextProvider,
    ParticipantTile,
    RoomAudioRenderer,
    ControlBar,
    Chat,
    useRoomContext,
} from '@livekit/components-react';
import { useCreateLayoutContext, usePinnedTracks, useTracks } from '@livekit/components-react';

import { InterviewTimer } from './InterviewTimer';
import { CodeEditorPanel } from './CodeEditorPanel';
import { CodingQuestion } from './CodingQuestion';
import { WhiteboardPanel } from './WhiteboardPanel';
import toast from 'react-hot-toast';

export interface InterviewVideoConferenceProps extends React.HTMLAttributes<HTMLDivElement> {
    chatMessageFormatter?: MessageFormatter;
    chatMessageEncoder?: MessageEncoder;
    chatMessageDecoder?: MessageDecoder;
    SettingsComponent?: React.ComponentType;
    durationMinutes?: number;
}

export function InterviewVideoConference({
    chatMessageFormatter,
    chatMessageDecoder,
    chatMessageEncoder,
    SettingsComponent,
    durationMinutes = 30,
    ...props
}: InterviewVideoConferenceProps) {
    const room = useRoomContext();

    const [showCodeEditor, setShowCodeEditor] = React.useState(false);
    const [showQuestion, setShowQuestion] = React.useState(false);
    const [showWhiteboard, setShowWhiteboard] = React.useState(false);

    const [widgetState, setWidgetState] = React.useState<WidgetState>({
        showChat: false,
        unreadMessages: 0,
        showSettings: false,
    });
    const lastAutoFocusedScreenShareTrack = React.useRef<TrackReferenceOrPlaceholder | null>(null);

    const tracks = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: true },
            { source: Track.Source.ScreenShare, withPlaceholder: false },
        ],
        { updateOnlyOn: [RoomEvent.ActiveSpeakersChanged], onlySubscribed: false },
    );

    const widgetUpdate = (state: WidgetState) => {
        log.debug('updating widget state', state);
        setWidgetState(state);
    };

    const layoutContext = useCreateLayoutContext();

    const screenShareTracks = tracks
        .filter(isTrackReference)
        .filter((track) => track.publication.source === Track.Source.ScreenShare);

    const focusTrack = usePinnedTracks(layoutContext)?.[0];
    const carouselTracks = tracks.filter((track) => !isEqualTrackRef(track, focusTrack));

    React.useEffect(() => {
        if (
            screenShareTracks.some((track) => track.publication.isSubscribed) &&
            lastAutoFocusedScreenShareTrack.current === null
        ) {
            log.debug('Auto set screen share focus:', { newScreenShareTrack: screenShareTracks[0] });
            layoutContext.pin.dispatch?.({ msg: 'set_pin', trackReference: screenShareTracks[0] });
            lastAutoFocusedScreenShareTrack.current = screenShareTracks[0];
        } else if (
            lastAutoFocusedScreenShareTrack.current &&
            !screenShareTracks.some(
                (track) =>
                    track.publication.trackSid ===
                    lastAutoFocusedScreenShareTrack.current?.publication?.trackSid,
            )
        ) {
            log.debug('Auto clearing screen share focus.');
            layoutContext.pin.dispatch?.({ msg: 'clear_pin' });
            lastAutoFocusedScreenShareTrack.current = null;
        }
        if (focusTrack && !isTrackReference(focusTrack)) {
            const updatedFocusTrack = tracks.find(
                (tr) =>
                    tr.participant.identity === focusTrack.participant.identity &&
                    tr.source === focusTrack.source,
            );
            if (updatedFocusTrack !== focusTrack && isTrackReference(updatedFocusTrack)) {
                layoutContext.pin.dispatch?.({ msg: 'set_pin', trackReference: updatedFocusTrack });
            }
        }
    }, [
        screenShareTracks
            .map((ref) => `${ref.publication.trackSid}_${ref.publication.isSubscribed}`)
            .join(),
        focusTrack?.publication?.trackSid,
        tracks,
    ]);

    React.useEffect(() => {
        const handleData = (_payload: Uint8Array, _participant: any, _kind: any, topic?: string) => {
            if (topic === 'coding-question') {
                setShowQuestion(true);
                setShowCodeEditor(true);
            }
            if (topic === 'system-design-question') {
                setShowWhiteboard(true);
            }
            if (topic === 'screen-share-request') {
                toast('The interviewer is requesting you to share your screen.\nClick the "Share screen" button below.', {
                    duration: 8000,
                    icon: '\uD83D\uDDA5\uFE0F',
                    style: {
                        background: '#1e1e2e',
                        color: '#e0e0e0',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                    },
                });
            }
        };
        room.on(RoomEvent.DataReceived, handleData);
        return () => { room.off(RoomEvent.DataReceived, handleData); };
    }, [room]);

    return (
        <div className="lk-video-conference" {...props}>
            {isWeb() && (
                <LayoutContextProvider
                    value={layoutContext}
                    onWidgetChange={widgetUpdate}
                >
                    <div className="lk-video-conference-inner">
                        <InterviewTimer durationMinutes={durationMinutes} />

                        {!focusTrack ? (
                            <div className="lk-grid-layout-wrapper">
                                <GridLayout tracks={tracks}>
                                    <ParticipantTile />
                                </GridLayout>
                            </div>
                        ) : (
                            <div className="lk-focus-layout-wrapper">
                                <FocusLayoutContainer>
                                    <CarouselLayout tracks={carouselTracks}>
                                        <ParticipantTile />
                                    </CarouselLayout>
                                    {focusTrack && <FocusLayout trackRef={focusTrack} />}
                                </FocusLayoutContainer>
                            </div>
                        )}

                        <div className="lk-control-bar-container">
                            <ControlBar controls={{ chat: true, settings: !!SettingsComponent }} />

                            <div className="interview-extra-controls">
                                <button
                                    className={`extra-control-btn ${showQuestion ? 'active' : ''}`}
                                    onClick={() => setShowQuestion((v) => !v)}
                                    title="Toggle Coding Question"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                    </svg>
                                    Question
                                </button>
                                <button
                                    className={`extra-control-btn ${showCodeEditor ? 'active' : ''}`}
                                    onClick={() => setShowCodeEditor((v) => !v)}
                                    title="Toggle Code Editor"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="16 18 22 12 16 6" />
                                        <polyline points="8 6 2 12 8 18" />
                                    </svg>
                                    Code Editor
                                </button>
                                <button
                                    className={`extra-control-btn ${showWhiteboard ? 'active' : ''}`}
                                    onClick={() => setShowWhiteboard((v) => !v)}
                                    title="Toggle Whiteboard"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                        <line x1="3" y1="9" x2="21" y2="9" />
                                        <line x1="9" y1="21" x2="9" y2="9" />
                                    </svg>
                                    Whiteboard
                                </button>
                            </div>
                        </div>
                    </div>

                    <Chat
                        style={{ display: widgetState.showChat ? 'grid' : 'none' }}
                        messageFormatter={chatMessageFormatter}
                        messageEncoder={chatMessageEncoder}
                        messageDecoder={chatMessageDecoder}
                    />

                    {SettingsComponent && (
                        <div
                            className="lk-settings-menu-modal"
                            style={{ display: widgetState.showSettings ? 'block' : 'none' }}
                        >
                            <SettingsComponent />
                        </div>
                    )}
                </LayoutContextProvider>
            )}
            <RoomAudioRenderer />
            <ConnectionStateToast />

            <CodeEditorPanel
                visible={showCodeEditor}
                onClose={() => setShowCodeEditor(false)}
            />
            <CodingQuestion
                visible={showQuestion}
                onClose={() => setShowQuestion(false)}
            />
            <WhiteboardPanel
                visible={showWhiteboard}
                onClose={() => setShowWhiteboard(false)}
            />
        </div>
    );
}
