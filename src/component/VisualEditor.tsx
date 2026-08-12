import type { DataDoc, FieldSchema, GeneratorBackend, JsonValue } from '../lib/types';
import { Plus, X } from 'lucide-react';

interface VisualEditorProps {
  backend: GeneratorBackend;
  doc: DataDoc;
  onChange: (doc: DataDoc) => void;
}

export function VisualEditor({ backend, doc, onChange }: VisualEditorProps) {
  const update = (key: string, value: JsonValue) => {
    onChange({ ...doc, data: { ...doc.data, [key]: value } });
  };

  return (
    <div className="editor-pane">
      <div className="pane-header">
        <span className="pane-title">Visual</span>
        <div className="pane-actions">
          <span className="pane-badge">{backend.label}</span>
        </div>
      </div>
      <div className="pane-body visual-body">
        {backend.schema.map((field) => (
          <FieldRow key={field.key} schema={field} value={doc.data[field.key]} onChange={(v) => update(field.key, v)} />
        ))}
      </div>
      <div className="pane-footer">
        <span className="pane-footer-hint">Form driven by the active backend schema.</span>
      </div>
    </div>
  );
}

interface FieldRowProps {
  schema: FieldSchema;
  value: JsonValue | undefined;
  onChange: (value: JsonValue) => void;
}

function FieldRow({ schema, value, onChange }: FieldRowProps) {
  if (schema.type === 'array') {
    return (
      <ArrayField schema={schema} value={Array.isArray(value) ? value : []} onChange={onChange} />
    );
  }

  return (
    <div className="field">
      <label className="field-label" htmlFor={`field-${schema.key}`}>{schema.label}</label>
      <FieldInput schema={schema} value={value} onChange={onChange} />
      {schema.help ? <span className="field-help">{schema.help}</span> : null}
    </div>
  );
}

function FieldInput({ schema, value, onChange }: FieldRowProps) {
  if (schema.type === 'string') {
    return (
      <input
        id={`field-${schema.key}`}
        type="text"
        className="field-input"
        placeholder={schema.placeholder}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.currentTarget.value)}
      />
    );
  }

  if (schema.type === 'number') {
    return (
      <input
        id={`field-${schema.key}`}
        type="number"
        className="field-input"
        value={typeof value === 'number' ? String(value) : ''}
        onChange={(e) => {
          const n = Number(e.currentTarget.value);
          onChange(e.currentTarget.value === '' || Number.isNaN(n) ? 0 : n);
        }}
      />
    );
  }

  if (schema.type === 'boolean') {
    return (
      <input
        id={`field-${schema.key}`}
        type="checkbox"
        className="field-check"
        checked={value === true}
        onChange={(e) => onChange(e.currentTarget.checked)}
      />
    );
  }

  if (schema.type === 'select') {
    const options = schema.options ?? [];
    return (
      <select
        id={`field-${schema.key}`}
        className="field-input"
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.currentTarget.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    );
  }

  if (schema.type === 'object' && schema.fields) {
    const objectValue = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    return (
      <fieldset className="field-group">
        {schema.fields.map((sub) => (
          <FieldRow
            key={sub.key}
            schema={sub}
            value={objectValue[sub.key]}
            onChange={(v) => onChange({ ...objectValue, [sub.key]: v })}
          />
        ))}
      </fieldset>
    );
  }

  return null;
}

interface ArrayFieldProps {
  schema: FieldSchema;
  value: JsonValue[];
  onChange: (value: JsonValue) => void;
}

function ArrayField({ schema, value, onChange }: ArrayFieldProps) {
  const add = () => {
    let empty: JsonValue = '';
    if (schema.itemType === 'object') {
      empty = {};
      for (const sub of schema.itemFields ?? []) {
        empty[sub.key] = sub.type === 'string' ? '' : sub.type === 'number' ? 0 : sub.type === 'boolean' ? false : '';
      }
    }
    onChange([...value, empty]);
  };

  const updateItem = (index: number, next: JsonValue) => {
    const copy = [...value];
    copy[index] = next;
    onChange(copy);
  };

  const removeItem = (index: number) => {
    const copy = [...value];
    copy.splice(index, 1);
    onChange(copy);
  };

  return (
    <div className="field">
      <div className="field-row">
        <span className="field-label">{schema.label}</span>
        <button type="button" className="pane-btn" onClick={add}>
          <Plus size={13} />
          Add
        </button>
      </div>
      {schema.help ? <span className="field-help">{schema.help}</span> : null}
      {value.length === 0 ? (
        <span className="field-empty">No items — add one above.</span>
      ) : (
        <div className="array-items">
          {value.map((entry, index) => (
            <div className="array-item" key={index}>
              {schema.itemType === 'object' ? (
                <div className="array-item-fields">
                  {schema.itemFields?.map((sub) => (
                    <FieldRow
                      key={`${index}-${sub.key}`}
                      schema={sub}
                      value={entry && typeof entry === 'object' && !Array.isArray(entry) ? entry[sub.key] : undefined}
                      onChange={(v) => {
                        const base = entry && typeof entry === 'object' && !Array.isArray(entry) ? { ...entry } : {};
                        updateItem(index, { ...base, [sub.key]: v });
                      }}
                    />
                  ))}
                </div>
              ) : (
                <FieldInput
                  schema={{ ...schema, type: schema.itemType ?? 'string' }}
                  value={entry}
                  onChange={(v) => updateItem(index, v)}
                />
              )}
              <button type="button" className="item-remove" onClick={() => removeItem(index)} aria-label="Remove item">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}