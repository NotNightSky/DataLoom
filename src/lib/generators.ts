import type { GeneratorBackend } from './types';
import shapedRecipe from './generators/recipe_shaped.loom';

export const REGISTRY: GeneratorBackend[] = [shapedRecipe];

export function getBackend(id: string): GeneratorBackend | undefined {
  return REGISTRY.find((b) => b.id === id);
}