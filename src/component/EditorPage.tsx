import { useMemo, useState } from 'preact/hooks';
import { Braces, Eye } from 'lucide-react';
import '../lib/monaco';
import type { DataDoc, GeneratorBackend, JsonValue } from '../lib/types';
import { VisualEditor } from './VisualEditor';
import { JsonEditor } from './JsonEditor';
import { JavaOutput } from './JavaOutput';
import '../styles/editor.css';

type EditorMode = 'visual' | 'json';

interface EditorPageProps {
  backend: GeneratorBackend;
}

export function EditorPage({ backend }: EditorPageProps) {
  const [doc, setDoc] = useState<DataDoc>(backend.defaultDoc);
  const [mode, setMode] = useState<EditorMode>('visual');
  const [jsonText, setJsonText] = useState(() => JSON.stringify(backend.defaultDoc, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const java = useMemo(() => backend.generateJava(doc), [doc, backend]);

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

      <div className="editor-columns">
        <section className="editor-column editor-column-main">
          {mode === 'visual' ? (
            <VisualEditor backend={backend} doc={doc} onChange={setDoc} />
          ) : (
            <JsonEditor value={jsonText} onChange={handleJsonChange} error={jsonError} />
          )}
        </section>

        <section className="editor-column">
          <JavaOutput value={java} copied={copied} onCopy={handleCopy} />
        </section>
      </div>
    </div>
  );
}