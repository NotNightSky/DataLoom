import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { ChevronLeft } from 'lucide-react';
import '../lib/monaco';
import type { DataDoc, GeneratorBackend } from '../lib/types';
import { getSpyglass } from '../lib/spyglass';
import type { SpyglassParseResult } from '../lib/spyglass';
import { JsonEditor } from './JsonEditor';
import { JavaOutput } from './JavaOutput';
import '../styles/editor.css';

interface EditorPageProps {
  backend: GeneratorBackend;
  onBack?: () => void;
}

function parseDefaultJson(defaultJson: string): DataDoc {
  try {
    const parsed: unknown = JSON.parse(defaultJson);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { data: parsed as Record<string, unknown> };
    }
  } catch {
    // Fall through to the empty document.
  }
  return { data: {} };
}

export function EditorPage({ backend, onBack }: EditorPageProps) {
  const [doc, setDoc] = useState<DataDoc>(() => parseDefaultJson(backend.defaultJson));
  const [jsonText, setJsonText] = useState(() => backend.defaultJson);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonIssues, setJsonIssues] = useState<string[]>([]);
  const [jsonRecovered, setJsonRecovered] = useState(false);
  const [spyglassBooted, setSpyglassBooted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [split, setSplit] = useState(61.5);
  const [dragging, setDragging] = useState(false);
  const columnsRef = useRef<HTMLDivElement>(null);
  const parseTimer = useRef<number | undefined>(undefined);
  const parseSeq = useRef(0);

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

  const applyParseResult = (result: SpyglassParseResult) => {
    setSpyglassBooted(true);
    if (result.doc) {
      // Even a partially parsed AST can yield a working document, so the
      // backend keeps generating Java for the parts Spyglass recovered.
      setDoc(result.doc);
      setJsonIssues(result.errors);
      setJsonRecovered(result.recovered);
      setJsonError(null);
      return;
    }
    setJsonIssues([]);
    setJsonRecovered(false);
    setJsonError(result.errors[0] ?? 'Document must be a JSON object.');
  };

  // Boot the Spyglass engine once and seed the document from the initial JSON.
  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        const service = await getSpyglass();
        applyParseResult(await service.parse(jsonText));
      } catch (err) {
        setSpyglassBooted(true);
        setJsonIssues([]);
        setJsonError(err instanceof Error ? err.message : 'Spyglass failed to initialize');
      }
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backend]);

  useEffect(() => () => window.clearTimeout(parseTimer.current), []);

  const handleJsonChange = (value: string) => {
    setJsonText(value);
    window.clearTimeout(parseTimer.current);
    const seq = ++parseSeq.current;
    parseTimer.current = window.setTimeout(async () => {
      try {
        const service = await getSpyglass();
        if (seq !== parseSeq.current) return;
        applyParseResult(await service.parse(value));
      } catch (err) {
        if (seq !== parseSeq.current) return;
        setSpyglassBooted(true);
        setJsonIssues([]);
        setJsonError(err instanceof Error ? err.message : 'Spyglass parsing failed');
      }
    }, 80);
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
        <span className="toolbar-divider" aria-hidden="true" />
        <span className="toolbar-doc-type">
          {backend.name} <span className="toolbar-doc-type-muted">— {backend.id}</span>
        </span>
        <div className="toolbar-spacer" />
        <span className="toolbar-id">backend: {backend.id}</span>
      </div>

      <div className="editor-columns" ref={columnsRef}>
        <section
          className="editor-column editor-column-main"
          style={{ flexGrow: split, flexBasis: 0, flexShrink: 1 }}
        >
          <JsonEditor
            value={jsonText}
            onChange={handleJsonChange}
            error={jsonError}
            issues={jsonIssues}
            recovered={jsonRecovered}
            booting={!spyglassBooted}
          />
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