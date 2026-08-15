export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface DataDoc {
  /** The recovered JSON object structure extracted from the Spyglass AST */
  data: Record<string, unknown>;
}

export interface GeneratorBackend {
  id: string;
  name: string;
  description: string;
  defaultJson: string;
  /**
   * Transforms the DataDoc (which may be a partially recovered AST shape)
   * into a string of Fabric DataGen Java code.
   */
  generateJava: (doc: DataDoc) => string;
}