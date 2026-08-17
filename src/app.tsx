import { useEffect, useState } from 'preact/hooks';
import type { ComponentType } from 'preact';
import { Header } from './component/Header';
import { Footer } from './component/Footer';
import { GeneratorGrid } from './component/GeneratorGrid';
import type { GeneratorBackend, GeneratorGroup } from './lib/types';

type EditorPageProps = {
  group: GeneratorGroup;
  backend: GeneratorBackend;
  onVersionChange?: (version: string) => void;
  onBack: () => void;
};

export function App() {
  const [group, setGroup] = useState<GeneratorGroup | null>(null);
  const [version, setVersion] = useState('');
  const [query, setQuery] = useState('');
  const [EditorPageComponent, setEditorPageComponent] = useState<ComponentType<EditorPageProps> | null>(null);

  // Background preload: fetch the editor chunk after the grid is painted
  useEffect(() => {
    const timer = setTimeout(() => {
      import('./component/EditorPage')
        .then((module) => {
          setEditorPageComponent(() => module.EditorPage);
        })
        .catch(console.error);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const backend = group ? group.templatesByVersion[version] : null;

  const handleSelectGroup = (selected: GeneratorGroup) => {
    setGroup(selected);
    setVersion(selected.versions[0]);
    if (!EditorPageComponent) {
      import('./component/EditorPage')
        .then((module) => {
          setEditorPageComponent(() => module.EditorPage);
        })
        .catch(console.error);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-(--app-bg) text-(--text-primary)">
      <Header search={query} onSearchChange={setQuery} />
      <main className="grow flex flex-col min-h-0">
        {group && backend ? (
          EditorPageComponent ? (
            <EditorPageComponent
              group={group}
              backend={backend}
              onVersionChange={setVersion}
              onBack={() => setGroup(null)}
            />
          ) : (
            <div className="boot">
              <div className="boot-spinner"></div>
              <span>Loading Editor Environment...</span>
            </div>
          )
        ) : (
          <GeneratorGrid query={query} onSelect={handleSelectGroup} />
        )}
      </main>
      <Footer />
    </div>
  );
}