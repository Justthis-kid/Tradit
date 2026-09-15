// components/Navbar.jsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const c = JSON.parse(localStorage.getItem("cart") || "[]");
    setCount(c.length);
    const onStorage = () => setCount(JSON.parse(localStorage.getItem("cart") || "[]").length);
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
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
