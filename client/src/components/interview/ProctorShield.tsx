import React from 'react';

interface Violation {
  keys: string;
  message: string;
  timestamp: Date;
}

export function ProctorShield() {
  const [violation, setViolation] = React.useState<Violation | null>(null);
  const [violations, setViolations] = React.useState<Violation[]>([]);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  const showViolation = React.useCallback((keys: string, message: string) => {
    const v: Violation = { keys, message, timestamp: new Date() };
    setViolation(v);
    setViolations((prev) => [...prev, v]);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setViolation(null), 5000);
  }, []);

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Ctrl+C / Ctrl+V / Ctrl+X — copy/paste/cut
      if (ctrl && (key === 'c' || key === 'v' || key === 'x')) {
        e.preventDefault();
        e.stopPropagation();
        const action = key === 'c' ? 'Copy' : key === 'v' ? 'Paste' : 'Cut';
        showViolation(
          `Ctrl+${key.toUpperCase()}`,
          `${action} is not allowed during the interview. This action has been logged.`
        );
        return;
      }

      // Ctrl+A — select all
      if (ctrl && key === 'a') {
        e.preventDefault();
        e.stopPropagation();
        showViolation('Ctrl+A', 'Select All is not allowed during the interview. This action has been logged.');
        return;
      }

      // Ctrl+Z / Ctrl+Y — undo/redo (allow in code editor context, block elsewhere)
      // We'll let these through if a Monaco editor is focused

      // Ctrl+Tab / Alt+Tab — tab switching
      if ((ctrl && key === 'tab') || (e.altKey && key === 'tab')) {
        e.preventDefault();
        e.stopPropagation();
        showViolation(
          ctrl ? 'Ctrl+Tab' : 'Alt+Tab',
          'Switching tabs/windows is flagged during the interview. Stay focused on this window.'
        );
        return;
      }

      // Alt key alone (menu access)
      if (e.altKey && !e.ctrlKey && !e.shiftKey && key === 'alt') {
        return; // Don't block alt alone, catch combos
      }

      // Alt+F4 — close window
      if (e.altKey && key === 'f4') {
        e.preventDefault();
        e.stopPropagation();
        showViolation('Alt+F4', 'You cannot close the window during the interview. Use "End Session" to leave properly.');
        return;
      }

      // F12 / Ctrl+Shift+I — dev tools
      if (key === 'f12' || (ctrl && e.shiftKey && key === 'i')) {
        e.preventDefault();
        e.stopPropagation();
        showViolation(
          key === 'f12' ? 'F12' : 'Ctrl+Shift+I',
          'Developer tools are not allowed during the interview. This action has been logged.'
        );
        return;
      }

      // Ctrl+U — view source
      if (ctrl && key === 'u') {
        e.preventDefault();
        e.stopPropagation();
        showViolation('Ctrl+U', 'Viewing page source is not allowed during the interview.');
        return;
      }

      // Ctrl+P — print
      if (ctrl && key === 'p') {
        e.preventDefault();
        e.stopPropagation();
        showViolation('Ctrl+P', 'Printing is not allowed during the interview.');
        return;
      }

      // Ctrl+S — save
      if (ctrl && key === 's') {
        e.preventDefault();
        e.stopPropagation();
        showViolation('Ctrl+S', 'This shortcut is disabled during the interview.');
        return;
      }

      // PrintScreen
      if (key === 'printscreen') {
        e.preventDefault();
        e.stopPropagation();
        showViolation('PrintScreen', 'Screenshots are not allowed during the interview. This action has been logged.');
        return;
      }
    }

    // Context menu (right-click)
    function handleContextMenu(e: MouseEvent) {
      e.preventDefault();
      showViolation('Right-Click', 'Context menu is disabled during the interview.');
    }

    // Visibility change (tab switch detection)
    function handleVisibilityChange() {
      if (document.hidden) {
        showViolation('Tab Switch', 'You switched away from the interview tab. This has been recorded.');
      }
    }

    // Text selection detection — flag selecting text in question/code areas
    function handleSelectionChange() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) return;

      // Only flag if selection is outside Monaco editor (allow selecting inside editor for editing)
      const anchorNode = sel.anchorNode;
      if (anchorNode) {
        let el: Node | null = anchorNode;
        while (el) {
          if (el instanceof HTMLElement) {
            // Allow selection inside the Monaco editor area and stdin input
            if (el.classList.contains('monaco-editor') || el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') return;
          }
          el = el.parentNode;
        }
      }

      const selectedText = sel.toString().trim();
      if (selectedText.length > 3) {
        showViolation(
          'Text Selection',
          'Selecting text from questions is not allowed during the interview. This action has been logged.'
        );
        sel.removeAllRanges();
      }
    }

    window.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('mouseup', handleSelectionChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('mouseup', handleSelectionChange);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [showViolation]);

  if (!violation) return null;

  return (
    <div className="proctor-overlay" onClick={() => setViolation(null)}>
      <div className="proctor-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="proctor-dialog-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h3 className="proctor-dialog-title">Action Not Allowed</h3>
        <div className="proctor-key-badge">{violation.keys}</div>
        <p className="proctor-dialog-message">{violation.message}</p>
        <div className="proctor-dialog-meta">
          <span>Violations recorded: {violations.length}</span>
        </div>
        <button className="proctor-dismiss-btn" onClick={() => setViolation(null)}>
          I Understand
        </button>
      </div>
    </div>
  );
}
