export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <p className="footer-brand">Tradits</p>
          <p className="footer-copy">
            The considered way to pass good shoes forward. Condition checked, stories kept.
          </p>
        </div>

        <div>
          <p className="eyebrow footer-label">Explore</p>
          <div className="footer-links">
            <a href="/shop">Shop the archive</a>
            <a href="/evaluate">Evaluate a pair</a>
            <a href="/credit">My credit</a>
          </div>
        </div>

        <div>
          <p className="eyebrow footer-label">The exchange</p>
          <div className="footer-links">
            <button className="text-link">Condition guide</button>
            <button className="text-link">Contact the desk</button>
          </div>
        </div>

        <div>
          <p className="eyebrow footer-label">Notes from the archive</p>
          <form className="newsletter">
            <input type="email" placeholder="Your email address" required />
            <button>→</button>
          </form>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Tradits</span>
        <span>Not a storefront. A second life.</span>
      </div>
    </footer>
  );
}
