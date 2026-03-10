import React from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

export interface CodingQuestionData {
    title: string;
    difficulty: 'easy' | 'medium' | 'hard';
    description: string;
    htmlContent?: string;
    examples: { input: string; output: string; explanation?: string }[];
    platform?: 'leetcode' | 'codeforces';
    url?: string;
    tags?: string[];
}

interface CodingQuestionProps {
    visible: boolean;
    onClose: () => void;
}

export function CodingQuestion({ visible, onClose }: CodingQuestionProps) {
    const room = useRoomContext();
    const [question, setQuestion] = React.useState<CodingQuestionData | null>(null);

    React.useEffect(() => {
        const handleData = (payload: Uint8Array, _participant: any, _kind: any, topic?: string) => {
            if (topic !== 'coding-question') return;
            try {
                const text = new TextDecoder().decode(payload);
                const data = JSON.parse(text);
                if (data.type === 'coding-question' && data.question) {
                    setQuestion(data.question as CodingQuestionData);
                }
            } catch (e) {
                console.error('Failed to parse coding question:', e);
            }
        };

        room.on(RoomEvent.DataReceived, handleData);
        return () => { room.off(RoomEvent.DataReceived, handleData); };
    }, [room]);

    if (!visible) return null;

    return (
        <div className="coding-question-overlay">
            <div className="question-header">
                <h3>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                    </svg>
                    Coding Question
                </h3>
                <button className="close-panel-btn" onClick={onClose} title="Close">
                    ✕
                </button>
            </div>

            <div className="question-body">
                {question ? (
                    <>
                        <h2 className="question-title">{question.title}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                            <span className={`question-difficulty ${question.difficulty}`}>
                                {question.difficulty}
                            </span>
                            {question.platform && (
                                <span className={`question-platform ${question.platform}`}>
                                    {question.platform === 'leetcode' ? 'LeetCode' : 'Codeforces'}
                                </span>
                            )}
                            {question.tags && question.tags.length > 0 && (
                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                                    {question.tags.slice(0, 3).join(' · ')}
                                </span>
                            )}
                        </div>
                        {question.url && (
                            <a
                                href={question.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="question-url"
                            >
                                View on {question.platform === 'codeforces' ? 'Codeforces' : 'LeetCode'} ↗
                            </a>
                        )}

                        {question.htmlContent ? (
                            <div
                                className="question-html-content"
                                dangerouslySetInnerHTML={{ __html: question.htmlContent }}
                            />
                        ) : (
                            <>
                                <p className="question-description">{question.description}</p>

                                {question.examples && question.examples.length > 0 && (
                                    <div className="question-examples">
                                        {question.examples.map((ex, i) => (
                                            <div className="question-example" key={i}>
                                                <h4>Example {i + 1}</h4>
                                                <div className="example-row">
                                                    <span className="example-label">Input:</span>
                                                    <span className="example-value">{ex.input}</span>
                                                </div>
                                                <div className="example-row">
                                                    <span className="example-label">Output:</span>
                                                    <span className="example-value">{ex.output}</span>
                                                </div>
                                                {ex.explanation && (
                                                    <div className="example-row">
                                                        <span className="example-label">Note:</span>
                                                        <span className="example-value">{ex.explanation}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </>
                ) : (
                    <div className="no-question">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <p>No coding question yet. The interviewer will present a problem when ready.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
