import Editor from '@monaco-editor/react';
import { Check } from 'lucide-react';
import { useIsLight } from '../lib/theme';

interface JavaOutputProps {
  value: string;
  copied: boolean;
  onCopy: () => void;
}

export function JavaOutput({ value, copied, onCopy }: JavaOutputProps) {
  const isLight = useIsLight();
  return (
    <div className="editor-pane">
      <div className="pane-header">
        <span className="pane-title">Generated Java</span>
        <div className="pane-actions">
          <button type="button" className="pane-btn" onClick={onCopy}>
            {copied ? <Check size={13} /> : null}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      <div className="pane-body">
        <Editor
          height="100%"
          language="java"
          theme={isLight ? 'vs' : 'vs-dark'}
          value={value}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 13,
            tabSize: 2,
            scrollBeyondLastLine: false,
            renderLineHighlight: 'none',
            automaticLayout: true,
            padding: { top: 8, bottom: 8 },
            domReadOnly: true,
          }}
        />
      </div>
    </div>
  );
}