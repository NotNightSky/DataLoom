import { Header } from './component/Header';
import { Footer } from './component/Footer';

export function App() {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--app-bg)] text-[var(--text-primary)]">
      <Header />
      <main className="flex-grow flex items-center justify-center">
        <p className="text-sm text-gray-400">DataLoom.</p>
      </main>
      <Footer />
    </div>
  );
}