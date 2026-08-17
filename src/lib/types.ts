export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface DataDoc {
  /** The recovered JSON object structure extracted from the Spyglass AST */
  data: Record<string, unknown>;
}

export interface GeneratorBackend {
  id: string;
  name: string;
  version: string;
  description: string;
  defaultJson: string;
  /**
   * Transforms the DataDoc (which may be a partially recovered AST shape)
   * into a string of Fabric DataGen Java code.
   */
  generateJava: (doc: DataDoc) => string;
}

/**
 * All .loom templates sharing the same generator id, grouped together so the
 * UI can offer a Minecraft-version selector. `versions` is sorted newest-first.
 */
export interface GeneratorGroup {
  id: string;
  name: string;
  description: string;
  versions: string[];
  templatesByVersion: Record<string, GeneratorBackend>;
}