import type { GeneratorBackend, GeneratorGroup } from './types';
import genericRecipe from './generators/recipe.loom';
import itemTag from './generators/item_tag.loom';

const TEMPLATES: GeneratorBackend[] = [genericRecipe, itemTag];

function buildGroups(templates: GeneratorBackend[]): GeneratorGroup[] {
  const byId = new Map<string, GeneratorGroup>();

  templates.forEach((template) => {
    let group = byId.get(template.id);
    if (!group) {
      group = {
        id: template.id,
        name: template.name,
        description: template.description,
        versions: [],
        templatesByVersion: {},
      };
      byId.set(template.id, group);
    }
    group.versions.push(template.version);
    group.templatesByVersion[template.version] = template;
  });

  for (const group of byId.values()) {
    group.versions.sort((a, b) => b.localeCompare(a));
  }

  return [...byId.values()];
}

export const GROUPS: GeneratorGroup[] = buildGroups(TEMPLATES);

export function getGroup(id: string): GeneratorGroup | undefined {
  return GROUPS.find((g) => g.id === id);
}

export function getBackend(id: string, version: string): GeneratorBackend | undefined {
  return getGroup(id)?.templatesByVersion[version];
}