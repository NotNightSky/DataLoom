import Editor from '@monaco-editor/react';
import type { OnChange } from '@monaco-editor/react';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { useIsLight } from '../lib/theme';

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  error: string | null;
  issues: string[];
  recovered: boolean;
  booting: boolean;
}

export function JsonEditor({ value, onChange, error, issues, recovered, booting }: JsonEditorProps) {
  const isLight = useIsLight();
  const handleChange: OnChange = (next) => {
    onChange(next ?? '');
  };

  return (
    <div className="editor-pane">
      <div className="pane-header">
        <span className="pane-title">JSON</span>
        <div className="pane-actions">
          {booting ? (
            <span className="pane-badge">Spyglass booting…</span>
          ) : error ? (
            <span className="pane-warning" title={error}>
              <AlertCircle size={13} />
              Invalid JSON
            </span>
          ) : recovered || issues.length > 0 ? (
            <span className="pane-warning" title={[...issues, 'Generated from the recovered AST parts.'].join('\n')}>
              <AlertTriangle size={13} />
              {recovered ? `Recovered ${issues.length} issue${issues.length === 1 ? '' : 's'}` : `${issues.length} issue${issues.length === 1 ? '' : 's'}`}
            </span>
          ) : (
            <span className="pane-ok">Valid JSON</span>
          )}
        </div>
      </div>
      <div className="pane-body">
        <Editor
          height="100%"
          language="json"
          theme={isLight ? 'vs' : 'vs-dark'}
          value={value}
          onChange={handleChange}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            tabSize: 2,
            scrollBeyondLastLine: false,
            renderLineHighlight: 'line',
            automaticLayout: true,
            padding: { top: 8, bottom: 8 },
          }}
        />
      </div>
    </div>
  );
}