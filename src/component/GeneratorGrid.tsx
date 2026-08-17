import { Blocks, ChevronRight, CookingPot, Tags } from 'lucide-react';
import { GROUPS } from '../lib/generators';
import type { GeneratorGroup } from '../lib/types';
import '../styles/generator-grid.css';

const CARD_ICONS: Record<string, any> = {
  recipe: CookingPot,
  item_tag: Tags,
};

interface GeneratorGridProps {
  query: string;
  onSelect: (group: GeneratorGroup) => void;
}

export function GeneratorGrid({ query, onSelect }: GeneratorGridProps) {
  const needle = query.trim().toLowerCase();
  const groups = GROUPS.filter(
    (group) =>
      needle === '' ||
      `${group.name} ${group.id} ${group.description}`.toLowerCase().includes(needle),
  );

  return (
    <div className="gen-grid-page">
      <div className="gen-grid">
        <div className="gen-grid-header">
          <span className="gen-grid-title">Generators</span>
          <span className="gen-grid-count">
            {groups.length} of {GROUPS.length} backend{GROUPS.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="gen-grid-cards">
          {groups.length === 0 ? (
            <span className="gen-grid-empty">No generators match “{query}”.</span>
          ) : (
            groups.map((group) => {
              const Icon = CARD_ICONS[group.id] ?? Blocks;
              return (
                <button
                  type="button"
                  key={group.id}
                  className="gen-card"
                  onClick={() => onSelect(group)}
                >
                  <span className="gen-card-icon">
                    <Icon size={26} />
                  </span>
                  <span className="gen-card-name">{group.name}</span>
                  <span className="gen-card-type">{group.description}</span>
                  <span className="gen-card-versions">
                    {group.versions.map((version) => (
                      <span key={version} className="gen-card-ver">
                        v{version}
                      </span>
                    ))}
                  </span>
                  <span className="gen-card-cta">
                    Open <ChevronRight size={13} />
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}