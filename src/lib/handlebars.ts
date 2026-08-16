import Handlebars from 'handlebars/runtime.js';

/**
 * Strips the namespace from an identifier.
 * Example: "minecraft:stone_pickaxe" -> "stone_pickaxe"
 */
Handlebars.registerHelper('stripNamespace', (val: unknown) => {
  if (typeof val !== 'string') return '';
  return val.split(':').pop() || '';
});

/**
 * Converts a Minecraft ID to a Fabric DataGen Item/Block enum.
 * Example: "minecraft:stone_pickaxe" -> "STONE_PICKAXE"
 */
Handlebars.registerHelper('toItemEnum', (val: unknown) => {
  if (typeof val !== 'string') return 'AIR'; // Safe fallback for partial ASTs
  const name = val.split(':').pop() || 'air';
  return name.toUpperCase();
});

/**
 * Capitalizes the first letter, useful for converting path names.
 */
Handlebars.registerHelper('capitalize', (val: unknown) => {
  if (typeof val !== 'string' || val.length === 0) return '';
  return val.charAt(0).toUpperCase() + val.slice(1);
});

function normalizeMinecraftId(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val.split(':').pop() || '';
}

function splitMinecraftId(val: unknown): { namespace: string; path: string } | null {
  if (typeof val !== 'string' || val.length === 0) return null;
  const [namespace, path] = val.split(':', 2);
  if (!path) {
    return { namespace: 'minecraft', path: namespace };
  }
  return { namespace, path };
}

function minecraftEnumName(val: unknown): string {
  const name = normalizeMinecraftId(val) || 'air';
  return name.toUpperCase();
}

function ingredientExpression(val: unknown): string {
  if (Array.isArray(val)) {
    return val.length > 0 ? ingredientExpression(val[0]) : 'Items.DIRT';
  }

  if (val && typeof val === 'object') {
    const record = val as Record<string, unknown>;
    if (typeof record.item === 'string') {
      return `Items.${minecraftEnumName(record.item)}`;
    }
    if (typeof record.tag === 'string') {
      return tagReferenceExpression(record.tag);
    }

    const values = Object.values(record);
    if (values.length > 0) {
      return ingredientExpression(values[0]);
    }
  }

  if (typeof val === 'string') {
    if (val.startsWith('#')) {
      return tagReferenceExpression(val);
    }
    return `Items.${minecraftEnumName(val)}`;
  }

  return 'Items.DIRT';
}

function tagReferenceExpression(val: unknown): string {
  if (typeof val !== 'string') return 'ItemTags.DIRT';
  const normalized = val.startsWith('#') ? val.slice(1) : val;
  const parsed = splitMinecraftId(normalized);
  if (!parsed) return 'ItemTags.DIRT';

  if (parsed.namespace === 'minecraft') {
    return `ItemTags.${minecraftEnumName(parsed.path)}`;
  }

  return `TagKey.create(Registries.ITEM, Identifier.of("${parsed.namespace}:${parsed.path}"))`;
}

Handlebars.registerHelper('recipeCategory', (val: unknown) => {
  const category = normalizeMinecraftId(val).replace(/[^a-z0-9]+/g, '_').toLowerCase();

  switch (category) {
    case 'building':
    case 'building_blocks':
    case 'blocks':
      return 'BUILDING_BLOCKS';
    case 'redstone':
      return 'REDSTONE';
    case 'food':
      return 'FOOD';
    case 'tools':
      return 'TOOLS';
    case 'combat':
      return 'COMBAT';
    case 'decorations':
    case 'decoration':
      return 'DECORATIONS';
    default:
      return 'MISC';
  }
});

Handlebars.registerHelper('recipeUnlock', (val: unknown) => new Handlebars.SafeString(ingredientExpression(val)));

Handlebars.registerHelper('tagEntry', (val: unknown) => {
  if (val && typeof val === 'object') {
    const record = val as Record<string, unknown>;
    if (typeof record.id === 'string' && record.id.startsWith('#')) {
      const tag = tagReferenceExpression(record.id);
      return new Handlebars.SafeString(
        record.required === false
          ? `.addOptionalTag(${tag})`
          : `.addTag(${tag})`,
      );
    }
    if (typeof record.id === 'string') {
      return new Handlebars.SafeString(`.add(Identifier.of("${record.id}"))`);
    }
  }

  if (typeof val === 'string') {
    if (val.startsWith('#')) {
      return new Handlebars.SafeString(`.forceAddTag(${tagReferenceExpression(val)})`);
    }
    return new Handlebars.SafeString(`.add(Identifier.of("${val}"))`);
  }

  return '';
});

// Fallback / Default helper: {{coalesce data.result.count 1}}
Handlebars.registerHelper('coalesce', function (value, defaultValue) {
  return (value !== undefined && value !== null && value !== '') ? value : defaultValue;
});

// Equality helper: {{#if (eq type "shaped")}} ... {{/if}}
Handlebars.registerHelper('eq', function (a, b) {
  return a === b;
});

// Logical OR helper: {{#if (or cond1 cond2)}} ... {{/if}}
Handlebars.registerHelper('or', function (...args) {
  // Exclude the options object passed by Handlebars at the end
  args.pop();
  return args.some(Boolean);
});

// Logical AND helper: {{#if (and cond1 cond2)}} ... {{/if}}
Handlebars.registerHelper('and', function (...args) {
  args.pop();
  return args.every(Boolean);
});

export default Handlebars;