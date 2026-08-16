import {
  ErrorSeverity,
  file as toFileNode,
  ParserContext,
  Project,
  Source,
  VanillaConfig,
} from '@spyglassmc/core';
import { BrowserExternals } from '@spyglassmc/core/lib/browser.js';
import { getInitializer as getJsonInitializer } from '@spyglassmc/json';
import type { JsonArrayNode, JsonFileNode, JsonNode as JsonNodeType } from '@spyglassmc/json';
import { TextDocument } from 'vscode-languageserver-textdocument';
import type { DataDoc, JsonValue } from './types';

const DraftUri = 'file:///dataloom-draft.json';

export interface SpyglassParseResult {
  doc: DataDoc | null;
  errors: string[];
  /** True when a document was recovered even though the JSON is not strictly valid. */
  recovered: boolean;
}

export interface Spyglass {
  parse(content: string): SpyglassParseResult;
  dispose(): Promise<void>;
}

let instance: Promise<Spyglass> | undefined;

export function getSpyglass(): Promise<Spyglass> {
  instance ??= createSpyglass();
  return instance;
}

async function createSpyglass(): Promise<Spyglass> {
  const project = new Project({
    cacheRoot: 'file:///cache/',
    defaultConfig: VanillaConfig,
    externals: BrowserExternals,
    // Only the JSON language is needed: syntactically tolerant AST generation.
    // The vanilla datapack/mcdoc dependencies are skipped on purpose — this app
    // only consumes the parse tree, and that avoids any network or provider use.
    initializers: [getJsonInitializer()],
    projectRoots: ['file:///'],
  });

  await project.init();

  let version = 0;

  const parse = (content: string): SpyglassParseResult => {
    const doc = TextDocument.create(DraftUri, 'json', ++version, content);
    const ctx = ParserContext.create(project, { doc });
    const parser = ctx.meta.getParserForLanguageId('json');
    const file = parser ? toFileNode(parser)(new Source(content), ctx) : undefined;
    const errors = ctx.err
      .dump()
      .filter((error) => error.severity >= ErrorSeverity.Warning)
      .map((error) => error.message);

    // `file` is a core FileNode whose first child is the `json:file` node,
    // whose first child is the parsed entry (object/array/primitive, or an
    // error stub when nothing could be recovered).
    const jsonFile = file?.children[0] as JsonFileNode | undefined;
    const entry = jsonFile?.children[0];
    if (entry && entry.type === 'json:object') {
      const value = nodeToValue(entry);
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return {
          doc: { data: value as Record<string, unknown> },
          errors,
          recovered: !isStrictlyValid(content),
        };
      }
    }
    return {
      doc: null,
      errors: errors.length > 0 ? errors : ['Document must be a JSON object.'],
      recovered: false,
    };
  };

  return { parse, dispose: () => project.close() };
}

function isStrictlyValid(content: string): boolean {
  try {
    JSON.parse(content);
    return true;
  } catch {
    return false;
  }
}

function nodeToValue(node: JsonNodeType | undefined): JsonValue | undefined {
  switch (node?.type) {
    case 'json:object': {
      const out: Record<string, JsonValue> = {};
      for (const pair of node.children) {
        const key = pair.key?.value;
        if (!key) {
          continue;
        }
        const value = nodeToValue(pair.value);
        if (value !== undefined) {
          out[key] = value;
        }
      }
      return out;
    }
    case 'json:array':
      return arrayToValue(node);
    case 'json:string':
      return node.value;
    case 'json:boolean':
      return node.value;
    case 'json:number':
      return Number(node.value.value);
    case 'json:null':
      return null;
    default:
      return undefined;
  }
}

function arrayToValue(node: JsonArrayNode): JsonValue[] {
  const out: JsonValue[] = [];
  for (const item of node.children) {
    const value = nodeToValue(item.value);
    if (value !== undefined) {
      out.push(value);
    }
  }
  return out;
}