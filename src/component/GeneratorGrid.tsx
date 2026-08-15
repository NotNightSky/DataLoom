import { Blocks, ChevronRight, CookingPot, ScrollText, Tags } from 'lucide-react';
import { REGISTRY } from '../lib/generators';
import type { GeneratorBackend } from '../lib/types';
import '../styles/generator-grid.css';

const CARD_ICONS: Record<string, any> = {
  recipe: CookingPot,
  tag: Tags,
  loot_table: ScrollText,
};

interface GeneratorGridProps {
  onSelect: (backend: GeneratorBackend) => void;
}

export function GeneratorGrid({ onSelect }: GeneratorGridProps) {
  return (
    <div className="gen-grid-page">
      <div className="gen-grid">
        <div className="gen-grid-header">
          <span className="gen-grid-title">Generators</span>
          <span className="gen-grid-count">
            {REGISTRY.length} backend{REGISTRY.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="gen-grid-cards">
          {REGISTRY.map((backend) => {
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
          })}
        </div>
      </div>
    </div>
  );
}