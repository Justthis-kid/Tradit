"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CART_UPDATED_EVENT, readCart } from "../lib/cart";

export default function Header() {
  const [bagCount, setBagCount] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const sync = () => {
      try {
        setBagCount(readCart().reduce((count, item) => count + item.qty, 0));
      } catch {
        setBagCount(0);
      }
    };

    sync();
    window.addEventListener(CART_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
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
            <Link href="/cart">Your bag ({bagCount})</Link>
          </nav>

          <div className="header-actions">
            <Link href="/shop" className="icon-button">🔍</Link>

            <Link href="/cart" className="icon-button bag-button" aria-label={`Cart, ${bagCount} items`}>
              🧺{bagCount > 0 && <span className="bag-count">{bagCount}</span>}
            </Link>

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
            <Link href="/cart">Your bag ({bagCount})</Link>
          </nav>
        )}
      </header>
    </>
  );
}
