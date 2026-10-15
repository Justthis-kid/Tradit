// components/Navbar.jsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { CART_UPDATED_EVENT, readCart } from "../lib/cart";

export default function Navbar() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const onStorage = () => {
      try {
        setCount(readCart().reduce((count, item) => count + item.qty, 0));
      } catch {
        setCount(0);
      }
    };
    onStorage();
    window.addEventListener(CART_UPDATED_EVENT, onStorage);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, onStorage);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return (
    <header className="navbar">
      <div className="brand">
        <div className="logo">T</div>
        <div>
          <div style={{fontSize:14, color:"var(--muted)"}}>Tradit</div>
          <div style={{fontSize:12, color:"var(--muted)"}}>Buy • Sell • Resell</div>
        </div>
      </div>

      <nav className="nav-links">
        <Link href="/">Home</Link>
        <Link href="/checkout">Checkout</Link>
        <Link href="/cart">Cart ({count})</Link>
      </nav>
    </header>
  );
}
