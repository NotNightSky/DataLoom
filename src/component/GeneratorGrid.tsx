import { Blocks, ChevronRight, CookingPot } from 'lucide-react';
import { REGISTRY } from '../lib/generators';
import type { GeneratorBackend } from '../lib/types';
import '../styles/generator-grid.css';

const CARD_ICONS: Record<string, any> = {
  recipe_shaped: CookingPot,
};

interface GeneratorGridProps {
  query: string;
  onSelect: (backend: GeneratorBackend) => void;
}

export function GeneratorGrid({ query, onSelect }: GeneratorGridProps) {
  const needle = query.trim().toLowerCase();
  const backends = REGISTRY.filter(
    (backend) =>
      needle === '' ||
      `${backend.name} ${backend.id} ${backend.description}`.toLowerCase().includes(needle),
  );

  return (
    <div className="gen-grid-page">
      <div className="gen-grid">
        <div className="gen-grid-header">
          <span className="gen-grid-title">Generators</span>
          <span className="gen-grid-count">
            {backends.length} of {REGISTRY.length} backend{REGISTRY.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="gen-grid-cards">
          {backends.length === 0 ? (
            <span className="gen-grid-empty">No generators match “{query}”.</span>
          ) : (
            backends.map((backend) => {
              const Icon = CARD_ICONS[backend.id] ?? Blocks;
              return (
                <button
                  type="button"
                  key={backend.id}
                  className="gen-card"
                  onClick={() => onSelect(backend)}
                >
                  <span className="gen-card-icon">
                    <Icon size={26} />
                  </span>
                  <span className="gen-card-name">{backend.name}</span>
                  <span className="gen-card-type">{backend.description}</span>
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