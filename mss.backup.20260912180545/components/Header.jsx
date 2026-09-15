"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Header() {
  const [bagCount, setBagCount] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const c = JSON.parse(localStorage.getItem("bag") || "[]");
    setBagCount(c.length);
    const onStorage = () => setBagCount(JSON.parse(localStorage.getItem("bag") || "[]").length);
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="Tradits home">
          <div className="brand-mark">T</div>
          <div className="brand-wordmark">Tradits</div>
        </Link>

        <nav className="main-nav" aria-label="Main navigation">
          <Link href="/shop">Shop the archive</Link>
          <Link href="/evaluate">Evaluate a pair</Link>
          <Link href="/credit">My credit</Link>
        </nav>

        <div className="header-actions">
          <Link href="/shop" className="icon-button" aria-label="Search marketplace">🔍</Link>
          <button className="icon-button bag-button" aria-label="Open bag" onClick={() => alert(bagCount ? `${bagCount} pair(s) in your bag` : "Your bag is empty.")}>
            🧺{bagCount ? <span className="bag-count">{bagCount}</span> : null}
          </button>
          <button className="icon-button menu-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle menu">☰</button>
        </div>
      </div>
      {mobileMenu && (
        <nav className="mobile-nav">
          <Link href="/shop">Shop the archive</Link>
          <Link href="/evaluate">Evaluate a pair</Link>
          <Link href="/credit">My credit</Link>
        </nav>
      )}
    </header>
  );
}
