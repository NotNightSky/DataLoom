import { useEffect, useState } from 'preact/hooks';
import type { ComponentType } from 'preact';
import { Header } from './component/Header';
import { Footer } from './component/Footer';
import { GeneratorGrid } from './component/GeneratorGrid';
import type { GeneratorBackend } from './lib/types';

type EditorPageProps = {
  backend: GeneratorBackend;
  onBack: () => void;
};

export function App() {
  const [backend, setBackend] = useState<GeneratorBackend | null>(null);
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

  const handleSelectBackend = (selected: GeneratorBackend) => {
    setBackend(selected);
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
        {backend ? (
          EditorPageComponent ? (
            <EditorPageComponent backend={backend} onBack={() => setBackend(null)} />
          ) : (
            <div className="boot">
              <div className="boot-spinner"></div>
              <span>Loading Editor Environment...</span>
            </div>
          )
        ) : (
          <GeneratorGrid query={query} onSelect={handleSelectBackend} />
        )}
      </main>
      <Footer />
    </div>
  );
}