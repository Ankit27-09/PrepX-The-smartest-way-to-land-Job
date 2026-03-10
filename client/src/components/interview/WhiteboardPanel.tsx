import React from 'react';
import { Excalidraw, exportToBlob } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

interface WhiteboardPanelProps {
    visible: boolean;
    onClose: () => void;
}

export interface SystemDesignQuestion {
    title: string;
    scenario: string;
    requirements: string[];
    hints?: string[];
}

export function WhiteboardPanel({ visible, onClose }: WhiteboardPanelProps) {
    const room = useRoomContext();
    const excalidrawRef = React.useRef<ExcalidrawImperativeAPI | null>(null);
    const [question, setQuestion] = React.useState<SystemDesignQuestion | null>(null);
    const [submitted, setSubmitted] = React.useState(false);
    const [isExporting, setIsExporting] = React.useState(false);
    const savedSceneRef = React.useRef<{ elements: any[]; appState: any; files: any } | null>(null);

    React.useEffect(() => {
        if (!visible && excalidrawRef.current) {
            const api = excalidrawRef.current;
            savedSceneRef.current = {
                elements: api.getSceneElements().map((el: any) => ({ ...el })),
                appState: { ...api.getAppState(), viewBackgroundColor: '#1a1a2e' },
                files: api.getFiles(),
            };
        }
    }, [visible]);

    React.useEffect(() => {
        if (visible && excalidrawRef.current && savedSceneRef.current) {
            const api = excalidrawRef.current;
            api.updateScene({
                elements: savedSceneRef.current.elements,
                appState: savedSceneRef.current.appState,
            });
            if (savedSceneRef.current.files) {
                api.addFiles(Object.values(savedSceneRef.current.files));
            }
        }
    }, [visible]);

    React.useEffect(() => {
        const api = excalidrawRef.current;
        if (!api) return;

        const libraryUrls = [
            'https://libraries.excalidraw.com/libraries/youritjang/software-architecture.excalidrawlib',
            'https://libraries.excalidraw.com/libraries/drwnio/drwnio.excalidrawlib',
            'https://libraries.excalidraw.com/libraries/childishgirl/aws-architecture-icons.excalidrawlib',
        ];

        Promise.all(
            libraryUrls.map((url) =>
                fetch(url)
                    .then((res) => res.json())
                    .then((data) => {
                        const items = Array.isArray(data) ? data : data.libraryItems ?? data.library ?? [];
                        return items;
                    })
                    .catch((err) => {
                        console.warn('Failed to load Excalidraw library:', url, err);
                        return [];
                    })
            )
        ).then((results) => {
            const allItems = results.flat();
            if (allItems.length > 0) {
                api.updateLibrary({
                    libraryItems: allItems,
                    merge: true,
                    openLibraryMenu: false,
                });
            }
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    React.useEffect(() => {
        const handleData = (_payload: Uint8Array, _participant: any, _kind: any, topic?: string) => {
            if (topic !== 'system-design-question') return;
            try {
                const text = new TextDecoder().decode(_payload);
                const data = JSON.parse(text);
                if (data.type === 'system-design-question' && data.question) {
                    setQuestion(data.question as SystemDesignQuestion);
                }
            } catch (e) {
                console.error('Failed to parse system design question:', e);
            }
        };

        room.on(RoomEvent.DataReceived, handleData);
        return () => { room.off(RoomEvent.DataReceived, handleData); };
    }, [room]);

    const handleSubmitDiagram = async () => {
        const api = excalidrawRef.current;
        if (!api) return;

        setIsExporting(true);
        try {
            const elements = api.getSceneElements();
            if (!elements || elements.length === 0) {
                setIsExporting(false);
                return;
            }

            const blob = await exportToBlob({
                elements: elements as any,
                appState: api.getAppState(),
                files: api.getFiles(),
                mimeType: 'image/png',
                quality: 0.8,
            });

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];

                const payload = JSON.stringify({
                    type: 'whiteboard-submission',
                    imageBase64: base64,
                    elementCount: elements.length,
                    questionTitle: question?.title || 'Untitled',
                });

                const encoder = new TextEncoder();
                room.localParticipant.publishData(encoder.encode(payload), {
                    reliable: true,
                    topic: 'whiteboard-submission',
                });

                setSubmitted(true);
                setTimeout(() => setSubmitted(false), 3000);
                setIsExporting(false);
            };
            reader.readAsDataURL(blob);
        } catch (err) {
            console.error('Failed to export whiteboard:', err);
            setIsExporting(false);
        }
    };

    return (
        <div className="whiteboard-backdrop" onClick={onClose} style={{ display: visible ? undefined : 'none' }}>
            <div className="whiteboard-modal" onClick={(e) => e.stopPropagation()}>
                <div className="whiteboard-header">
                    <h3>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="3" y1="9" x2="21" y2="9" />
                            <line x1="9" y1="21" x2="9" y2="9" />
                        </svg>
                        System Design Whiteboard
                    </h3>
                    <div className="whiteboard-header-actions">
                        <button
                            className="btn-submit-diagram"
                            onClick={handleSubmitDiagram}
                            disabled={isExporting}
                        >
                            {isExporting ? (
                                <>Exporting...</>
                            ) : (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13" />
                                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                    </svg>
                                    Submit Diagram
                                </>
                            )}
                        </button>
                        {submitted && <span className="submitted-badge">Sent</span>}
                        <button className="close-panel-btn" onClick={onClose} title="Close">✕</button>
                    </div>
                </div>

                {question && (
                    <div className="sd-question-bar">
                        <div className="sd-question-title">
                            <strong>{question.title}</strong>
                        </div>
                        <div className="sd-question-scenario">{question.scenario}</div>
                        {question.requirements.length > 0 && (
                            <div className="sd-question-requirements">
                                <span className="sd-label">Requirements:</span>
                                {question.requirements.map((req, i) => (
                                    <span key={i} className="sd-req-badge">{req}</span>
                                ))}
                            </div>
                        )}
                        {question.hints && question.hints.length > 0 && (
                            <details className="sd-hints">
                                <summary>Hints</summary>
                                <ul>
                                    {question.hints.map((hint, i) => (
                                        <li key={i}>{hint}</li>
                                    ))}
                                </ul>
                            </details>
                        )}
                    </div>
                )}

                <div className="whiteboard-canvas" style={{ height: '100%', width: '100%' }}>
                    <Excalidraw
                        excalidrawAPI={(api: ExcalidrawImperativeAPI) => { excalidrawRef.current = api; }}
                        theme="dark"
                        initialData={{
                            appState: {
                                viewBackgroundColor: '#1a1a2e',
                                currentItemFontFamily: 1,
                            },
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
