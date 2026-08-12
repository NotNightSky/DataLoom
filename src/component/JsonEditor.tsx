import Editor from '@monaco-editor/react';
import type { OnChange } from '@monaco-editor/react';
import { AlertCircle } from 'lucide-react';

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  error: string | null;
}

export function JsonEditor({ value, onChange, error }: JsonEditorProps) {
  const handleChange: OnChange = (next) => {
    onChange(next ?? '');
  };

  return (
    <div className="editor-pane">
      <div className="pane-header">
        <span className="pane-title">JSON</span>
        <div className="pane-actions">
          {error ? (
            <span className="pane-warning" title={error}>
              <AlertCircle size={13} />
              Invalid JSON
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
          theme="vs-dark"
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
      <div className="pane-footer">
        <span className="pane-footer-hint">JSON edits update the visual form and generated Java live.</span>
      </div>
    </div>
  );
}