"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Header() {
  const [bagCount, setBagCount] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const bag = JSON.parse(localStorage.getItem("bag") || "[]");
    setBagCount(bag.length);

    const sync = () => {
      const bag = JSON.parse(localStorage.getItem("bag") || "[]");
      setBagCount(bag.length);
    };

    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  return (
    <>
      <div className="topline">Every pair has a past. Give it another good one.</div>

      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="brand">
            <span className="brand-mark">T</span>
            <span className="brand-wordmark">Tradits</span>
          </Link>

          <nav className="main-nav">
            <Link href="/shop">Shop the archive</Link>
            <Link href="/evaluate">Evaluate a pair</Link>
            <Link href="/credit">My credit</Link>
          </nav>

          <div className="header-actions">
            <Link href="/shop" className="icon-button">🔍</Link>

            <button className="icon-button bag-button">
              🧺{bagCount > 0 && <span className="bag-count">{bagCount}</span>}
            </button>

            <button
              className="icon-button menu-button"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              {mobileMenu ? "✕" : "☰"}
            </button>
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
    </>
  );
}
