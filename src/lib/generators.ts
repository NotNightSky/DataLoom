import type { GeneratorBackend } from './types';
import genericRecipe from './generators/recipe.loom';
import itemTag from './generators/item_tag.loom';

export const REGISTRY: GeneratorBackend[] = [genericRecipe, itemTag];

export function getBackend(id: string): GeneratorBackend | undefined {
  return REGISTRY.find((b) => b.id === id);
}