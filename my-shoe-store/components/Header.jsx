"use client";

import Image from "next/image";
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
            <Image
              className="brand-logo"
              src="/Tradit.jpeg"
              alt="Tradit — Tread Up, Trade In"
              width={768}
              height={576}
              priority
            />
          </Link>

          <nav className="main-nav">
            <Link href="/shop">Shop the archive</Link>
            <Link href="/evaluate">Evaluate a pair</Link>
            <Link href="/credit">My credit</Link>
            <Link href="/cart">Your bag ({bagCount})</Link>
          </nav>

          <div className="header-actions">
            <Link href="/shop" className="icon-button" aria-label="Search the archive">
              <svg className="ui-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="6.8" />
                <path d="m16 16 4.2 4.2" />
              </svg>
            </Link>

            <Link href="/cart" className="icon-button bag-button" aria-label={`Cart, ${bagCount} items`}>
              <svg className="ui-icon cart-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 4h2l2.2 11.1a2 2 0 0 0 2 1.6h8.1a2 2 0 0 0 1.9-1.5L21 8H6" />
                <path d="M9 11h9M10 8v6m7-6v6" />
                <circle cx="9.5" cy="20" r="1" />
                <circle cx="18" cy="20" r="1" />
              </svg>
              {bagCount > 0 && <span className="bag-count">{bagCount}</span>}
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
