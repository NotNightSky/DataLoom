import type { DataDoc, GeneratorBackend } from './types';

const recipeBackend: GeneratorBackend = {
  id: 'recipe',
  name: 'Recipe',
  description: 'Generate shaped, shapeless, and smelting recipes.',
  defaultJson:
    '{\n  "type": "minecraft:crafting_shaped",\n  "pattern": [\n    "###",\n    " # ",\n    " # "\n  ],\n  "key": {\n    "#": { "item": "minecraft:cobblestone" }\n  },\n  "result": {\n    "id": "minecraft:stone_pickaxe",\n    "count": 1\n  }\n}',
  generateJava: (doc: DataDoc) => {
    const data = doc.data;
    const type = typeof data.type === 'string' ? data.type : '';
    let out = '// Fabric DataGen Recipe\n\n';

    if (type === 'minecraft:crafting_shaped') {
      const resultObj = data.result as Record<string, unknown> | undefined;
      const resultId = typeof resultObj?.id === 'string' ? resultObj.id : 'minecraft:air';
      const count = typeof resultObj?.count === 'number' ? resultObj.count : 1;

      const itemName = resultId.replace('minecraft:', '').toUpperCase();

      out += `ShapedRecipeJsonBuilder.create(RecipeCategory.MISC, Items.${itemName}, ${count})\n`;

      const pattern = Array.isArray(data.pattern) ? data.pattern : [];
      for (const row of pattern) {
        if (typeof row === 'string') {
          out += `    .pattern("${row}")\n`;
        }
      }

      out += `    .criterion("has_item", conditionsFromItem(Items.DIRT))\n`;
      out += `    .offerTo(exporter);\n`;
    } else {
      out += `// DataGen fallback for type: ${type || 'unknown'}\n`;
      out += `/*\n${JSON.stringify(data, null, 2)}\n*/\n`;
    }

    return out;
  },
};

const tagBackend: GeneratorBackend = {
  id: 'tag',
  name: 'Tag',
  description: 'Group items, blocks, or entity types together.',
  defaultJson:
    '{\n  "replace": false,\n  "values": [\n    "minecraft:dirt",\n    "minecraft:grass_block"\n  ]\n}',
  generateJava: (doc: DataDoc) => {
    const data = doc.data;
    let out = '// Fabric DataGen Tag\n\n';
    out += 'getOrCreateTagBuilder(MyTags.CUSTOM_TAG)\n';

    const values = Array.isArray(data.values) ? data.values : [];
    for (const val of values) {
      if (typeof val === 'string') {
        out += `    .add(Identifier.of("${val}"))\n`;
      } else if (typeof val === 'object' && val !== null) {
        const valObj = val as Record<string, unknown>;
        if (typeof valObj.id === 'string') {
          out += `    .addOptional(Identifier.of("${valObj.id}"))\n`;
        }
      }
    }
    out += '    ;\n';
    return out;
  },
};

const lootTableBackend: GeneratorBackend = {
  id: 'loot_table',
  name: 'Loot Table',
  description: 'Block drops, mob drops, and chest loot.',
  defaultJson: '{\n  "type": "minecraft:block",\n  "pools": []\n}',
  generateJava: (doc: DataDoc) => {
    return (
      '// Fabric DataGen Loot Table\n\n' +
      '// Loot mapping logic goes here...\n' +
      `/*\n${JSON.stringify(doc.data, null, 2)}\n*/`
    );
  },
};

export const REGISTRY: GeneratorBackend[] = [recipeBackend, tagBackend, lootTableBackend];

export function getBackend(id: string): GeneratorBackend | undefined {
  return REGISTRY.find((b) => b.id === id);
}