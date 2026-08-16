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

export default Handlebars;