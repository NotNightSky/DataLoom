import { useState } from 'preact/hooks';
import { Header } from './component/Header';
import { Footer } from './component/Footer';
import { EditorPage } from './component/EditorPage';
import { GeneratorGrid } from './component/GeneratorGrid';
import type { GeneratorBackend } from './lib/types';

export function App() {
  const [backend, setBackend] = useState<GeneratorBackend | null>(null);
  const [query, setQuery] = useState('');

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-(--app-bg) text-(--text-primary)">
      <Header search={query} onSearchChange={setQuery} />
      <main className="grow flex flex-col min-h-0">
        {backend ? (
          <EditorPage backend={backend} onBack={() => setBackend(null)} />
        ) : (
          <GeneratorGrid query={query} onSelect={setBackend} />
        )}
      </main>
      <Footer />
    </div>
  );
}