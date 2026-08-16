import type { GeneratorBackend } from './types';
import shapedRecipe from './generators/recipe_shaped.loom';
import itemTag from './generators/item_tag.loom';

export const REGISTRY: GeneratorBackend[] = [shapedRecipe, itemTag];

export function getBackend(id: string): GeneratorBackend | undefined {
  return REGISTRY.find((b) => b.id === id);
}