import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Braces, ChevronLeft, Eye } from 'lucide-react';
import '../lib/monaco';
import type { DataDoc, GeneratorBackend, JsonValue } from '../lib/types';
import { VisualEditor } from './VisualEditor';
import { JsonEditor } from './JsonEditor';
import { JavaOutput } from './JavaOutput';
import '../styles/editor.css';

type EditorMode = 'visual' | 'json';

interface EditorPageProps {
  backend: GeneratorBackend;
  onBack?: () => void;
}

export function EditorPage({ backend, onBack }: EditorPageProps) {
  const [doc, setDoc] = useState<DataDoc>(backend.defaultDoc);
  const [mode, setMode] = useState<EditorMode>('visual');
  const [jsonText, setJsonText] = useState(() => JSON.stringify(backend.defaultDoc, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [split, setSplit] = useState(61.5);
  const [dragging, setDragging] = useState(false);
  const columnsRef = useRef<HTMLDivElement>(null);

  const java = useMemo(() => backend.generateJava(doc), [doc, backend]);

  const updateSplit = (clientX: number) => {
    const container = columnsRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const available = rect.width - 12;
    if (available <= 0) return;
    const fraction = (clientX - rect.left - 6) / available;
    setSplit(Math.min(82, Math.max(18, fraction * 100)));
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (event: PointerEvent) => updateSplit(event.clientX);
    const onUp = () => {
      setDragging(false);
      document.body.classList.remove('resizing');
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging]);

  const startSplitDrag = () => {
    setDragging(true);
    document.body.classList.add('resizing');
  };

  const switchMode = (next: EditorMode) => {
    if (next === mode) return;
    if (next === 'json') {
      setJsonText(JSON.stringify(doc, null, 2));
      setJsonError(null);
    }
    setMode(next);
  };

  const handleJsonChange = (value: string) => {
    setJsonText(value);
    try {
      const parsed: unknown = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const candidate = parsed as Record<string, unknown>;
        const data = candidate['data'];
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          setDoc({ type: backend.docType, data: data as Record<string, JsonValue> });
          setJsonError(null);
          return;
        }
      }
      setJsonError('Document must be a JSON object with a "data" field.');
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(java).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="editor-view">
      <div className="editor-toolbar">
        {onBack && (
          <button type="button" className="pane-btn toolbar-back" onClick={onBack} aria-label="Back to generators">
            <ChevronLeft size={14} />
            Generators
          </button>
        )}
        <div className="mode-toggle" role="group" aria-label="Editor mode">
          <button
            type="button"
            className={`mode-btn${mode === 'visual' ? ' active' : ''}`}
            onClick={() => switchMode('visual')}
          >
            <Eye size={14} />
            Visual
          </button>
          <button
            type="button"
            className={`mode-btn${mode === 'json' ? ' active' : ''}`}
            onClick={() => switchMode('json')}
          >
            <Braces size={14} />
            JSON
          </button>
        </div>
        <span className="toolbar-divider" aria-hidden="true" />
        <span className="toolbar-doc-type">
          {backend.label} <span className="toolbar-doc-type-muted">— {backend.docType}</span>
        </span>
        <div className="toolbar-spacer" />
        <span className="toolbar-id">backend: {backend.id}</span>
      </div>

      <div className="editor-columns" ref={columnsRef}>
        <section
          className="editor-column editor-column-main"
          style={{ flexGrow: split, flexBasis: 0, flexShrink: 1 }}
        >
          {mode === 'visual' ? (
            <VisualEditor backend={backend} doc={doc} onChange={setDoc} />
          ) : (
            <JsonEditor value={jsonText} onChange={handleJsonChange} error={jsonError} />
          )}
        </section>

        <div
          className={`editor-splitter${dragging ? ' active' : ''}`}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize editor panes"
          onPointerDown={startSplitDrag}
        />

        <section
          className="editor-column"
          style={{ flexGrow: 100 - split, flexBasis: 0, flexShrink: 1 }}
        >
          <JavaOutput value={java} copied={copied} onCopy={handleCopy} />
        </section>
      </div>
    </div>
  );
}