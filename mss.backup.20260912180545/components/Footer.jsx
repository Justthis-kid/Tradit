export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <p className="footer-brand">Tradits</p>
          <p className="footer-copy">The considered way to pass good shoes forward. Condition checked, stories kept.</p>
        </div>
        <div>
          <p className="eyebrow footer-label">Explore</p>
          <div className="footer-links"><a className="text-link" href="/shop">Shop the archive</a><a className="text-link" href="/evaluate">Evaluate a pair</a><a className="text-link" href="/credit">My credit</a></div>
        </div>
        <div>
          <p className="eyebrow footer-label">The exchange</p>
          <div className="footer-links"><button className="text-link" onClick={() => alert('Condition guide coming soon')}>Condition guide</button><button className="text-link" onClick={() => alert('Contact: hello@tradits.example')}>Contact the desk</button></div>
        </div>
        <div>
          <p className="eyebrow footer-label">Notes from the archive</p>
          <form className="newsletter" onSubmit={(e) => { e.preventDefault(); alert('You are on the list.'); e.currentTarget.reset(); }}>
            <input aria-label="Email address" type="email" placeholder="Your email address" required />
            <button aria-label="Subscribe">→</button>
          </form>
        </div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} Tradits</span><span>Not a storefront. A second life.</span></div>
    </footer>
  );
}
