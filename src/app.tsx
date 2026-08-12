import { Header } from './component/Header';
import { Footer } from './component/Footer';
import { EditorPage } from './component/EditorPage';
import { getBackend } from './lib/generators';

export function App() {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--app-bg)] text-[var(--text-primary)]">
      <Header />
      <main className="flex-grow flex flex-col min-h-0">
        <EditorPage backend={getBackend(null)} />
      </main>
      <Footer />
    </div>
  );
}