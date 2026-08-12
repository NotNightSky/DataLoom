import '../styles/footer.css';

export function Footer() {
  return (
    <footer className="footer">
      <span className="footer-left">
        By <a href="https://github.com/NotNightSky/" target="_blank" rel="noreferrer" className="footer-link">NotNightSky</a>
      </span>
      <div className="footer-right">
        <span className="footer-item">
          Created with <span className="footer-heart" aria-label="love">♡</span>
        </span>
        <span className="footer-divider" aria-hidden="true" />
        <span className="footer-item">
          Made with Vite and Preact
        </span>
      </div>
    </footer>
  );
}