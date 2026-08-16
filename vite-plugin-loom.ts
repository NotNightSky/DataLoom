import type { Plugin } from 'vite';
import { load } from 'js-yaml';
import Handlebars from 'handlebars';

export default function loomPlugin(): Plugin {
  return {
    name: 'vite-plugin-loom',
    // Tell Vite this plugin handles custom file transformations
    transform(code: string, id: string) {
      if (!id.endsWith('.loom')) return null;

      // 1. Split the file by the YAML boundaries (---)
      const parts = code.split(/^---\s*$/m);
      if (parts.length < 3) {
        throw new Error(
          `Invalid .loom file format in ${id}. Must contain YAML frontmatter surrounded by ---`,
        );
      }

      const frontmatter = parts[1].trim();
      const template = parts.slice(2).join('---').trim();

      // 2. Parse the YAML metadata
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const metadata = load(frontmatter) as any;

      // 3. Precompile the Handlebars template at build-time
      const precompiledTemplate = Handlebars.precompile(template);

      // 4. Return the generated JavaScript module.
      // We import the configured Handlebars instance with our custom helpers
      // (src/lib/handlebars.ts), keeping the browser bundle small.
      const generatedCode = `
        import Handlebars from '/src/lib/handlebars.ts';

        const renderTemplate = Handlebars.template(${precompiledTemplate});

        export default {
          id: ${JSON.stringify(metadata.id)},
          name: ${JSON.stringify(metadata.name)},
          description: ${JSON.stringify(metadata.description)},
          defaultJson: ${JSON.stringify(metadata.defaultJson || '{}')},
          generateJava: (doc) => renderTemplate(doc)
        };
      `;

      return {
        code: generatedCode,
        map: null, // We don't need sourcemaps for this generated boilerplate
      };
    },
  };
}