export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface DataDoc {
  type: string;
  data: Record<string, JsonValue>;
}

export type FieldType = 'string' | 'number' | 'boolean' | 'select' | 'array' | 'object';

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldSchema {
  key: string;
  label: string;
  type: FieldType;
  help?: string;
  options?: FieldOption[];
  fields?: FieldSchema[];
  itemType?: FieldType;
  itemFields?: FieldSchema[];
  placeholder?: string;
}

export interface GeneratorBackend {
  id: string;
  label: string;
  docType: string;
  defaultDoc: DataDoc;
  schema: FieldSchema[];
  generateJava(doc: DataDoc): string;
}
