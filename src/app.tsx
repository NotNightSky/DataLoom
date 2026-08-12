import { Header } from './component/Header';

export function App() {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--app-bg)] text-[var(--text-primary)]">
      <Header />
      <main className="flex-grow flex items-center justify-center">
        <p className="text-sm text-gray-400">DataLoom scaffold — build something here.</p>
      </main>
    </div>
  );
}