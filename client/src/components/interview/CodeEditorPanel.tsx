import React from 'react';
import Editor from '@monaco-editor/react';
import { useRoomContext } from '@livekit/components-react';

const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || "http://localhost:8000/api";

const LANGUAGE_MAP: Record<string, { pistonLang: string; pistonVersion: string; monacoLang: string }> = {
    python: { pistonLang: 'python', pistonVersion: '3.10.0', monacoLang: 'python' },
    javascript: { pistonLang: 'javascript', pistonVersion: '18.15.0', monacoLang: 'javascript' },
    java: { pistonLang: 'java', pistonVersion: '15.0.2', monacoLang: 'java' },
    cpp: { pistonLang: 'c++', pistonVersion: '10.2.0', monacoLang: 'cpp' },
    go: { pistonLang: 'go', pistonVersion: '1.16.2', monacoLang: 'go' },
};

const DEFAULT_CODE: Record<string, string> = {
    python: '# Write your solution here\n\ndef solution():\n    pass\n\nsolution()\n',
    javascript: '// Write your solution here\n\nfunction solution() {\n  \n}\n\nsolution();\n',
    java: '// Write your solution here\n\npublic class Main {\n    public static void main(String[] args) {\n        \n    }\n}\n',
    cpp: '// Write your solution here\n\n#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n',
    go: '// Write your solution here\n\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello")\n}\n',
};

interface CodeEditorPanelProps {
    visible: boolean;
    onClose: () => void;
}

export function CodeEditorPanel({ visible, onClose }: CodeEditorPanelProps) {
    const room = useRoomContext();
    const [language, setLanguage] = React.useState('python');
    const [code, setCode] = React.useState(DEFAULT_CODE.python);
    const [stdin, setStdin] = React.useState('');
    const [output, setOutput] = React.useState('');
    const [outputType, setOutputType] = React.useState<'none' | 'success' | 'error' | 'running'>('none');
    const [isRunning, setIsRunning] = React.useState(false);
    const [submitted, setSubmitted] = React.useState(false);

    if (!visible) return null;

    const handleLanguageChange = (lang: string) => {
        setLanguage(lang);
        setCode(DEFAULT_CODE[lang] || '');
        setOutput('');
        setOutputType('none');
        setSubmitted(false);
    };

    const handleRunCode = async () => {
        setIsRunning(true);
        setOutput('');
        setOutputType('running');

        try {
            const langInfo = LANGUAGE_MAP[language];
            const res = await fetch(`${FASTAPI_URL}/code/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language: langInfo.pistonLang,
                    version: langInfo.pistonVersion,
                    code,
                    stdin,
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => null);
                throw new Error(err?.detail || `Server error (${res.status})`);
            }

            const data = await res.json();
            if (data.stderr) {
                setOutput(data.stderr);
                setOutputType('error');
            } else {
                setOutput(data.stdout || '(no output)');
                setOutputType('success');
            }
        } catch (e) {
            setOutput(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`);
            setOutputType('error');
        } finally {
            setIsRunning(false);
        }
    };

    const handleSubmitCode = () => {
        try {
            const payload = JSON.stringify({
                type: 'code-submission',
                language,
                code,
                output,
            });
            const encoder = new TextEncoder();
            room.localParticipant.publishData(encoder.encode(payload), {
                reliable: true,
                topic: 'code-submission',
            });
            setSubmitted(true);
            setTimeout(() => setSubmitted(false), 3000);
        } catch (err) {
            console.error('Failed to submit code:', err);
        }
    };

    return (
        <div className="code-editor-overlay">
            <div className="code-editor-header">
                <h3>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                    </svg>
                    Code Editor
                </h3>
                <div className="code-editor-actions">
                    <select value={language} onChange={(e) => handleLanguageChange(e.target.value)}>
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                        <option value="go">Go</option>
                    </select>
                    <button className="close-panel-btn" onClick={onClose} title="Close">
                        ✕
                    </button>
                </div>
            </div>

            <div className="code-editor-body">
                <div className="editor-wrapper">
                    <Editor
                        height="100%"
                        language={LANGUAGE_MAP[language].monacoLang}
                        value={code}
                        onChange={(val: string | undefined) => setCode(val || '')}
                        theme="vs-dark"
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            wordWrap: 'on',
                            padding: { top: 12 },
                            automaticLayout: true,
                            tabSize: 4,
                        }}
                    />
                </div>

                <div className="editor-toolbar">
                    <div className="editor-toolbar-left">
                        <button className="btn-run" onClick={handleRunCode} disabled={isRunning}>
                            {isRunning ? (
                                <>Running...</>
                            ) : (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <polygon points="5 3 19 12 5 21 5 3" />
                                    </svg>
                                    Run
                                </>
                            )}
                        </button>
                        <button className="btn-submit" onClick={handleSubmitCode} disabled={!code.trim()}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13" />
                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                            Submit
                        </button>
                        {submitted && (
                            <span className="submitted-badge">Sent to interviewer</span>
                        )}
                    </div>
                    <div className="stdin-input-row">
                        <label>stdin:</label>
                        <input
                            type="text"
                            placeholder="Input (optional)"
                            value={stdin}
                            onChange={(e) => setStdin(e.target.value)}
                        />
                    </div>
                </div>

                <div className="code-output-panel">
                    <div className="output-header">
                        <span>Output</span>
                        {outputType !== 'none' && (
                            <span className={`output-status ${outputType}`}>
                                {outputType === 'running' ? 'Running...' : outputType === 'success' ? 'Success' : 'Error'}
                            </span>
                        )}
                    </div>
                    <div className={`output-content ${outputType === 'error' ? 'error-output' : ''}`}>
                        {output || <span className="output-placeholder">Run your code to see output here...</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}
