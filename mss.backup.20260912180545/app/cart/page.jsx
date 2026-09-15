// app/cart/page.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CartPage() {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem("cart") || "[]"));
    const onStorage = () => setCart(JSON.parse(localStorage.getItem("cart") || "[]"));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function updateQty(index, delta) {
    const c = [...cart];
    c[index].qty = Math.max(1, c[index].qty + delta);
    setCart(c);
    localStorage.setItem("cart", JSON.stringify(c));
  }

  function removeItem(index) {
    const c = [...cart];
    c.splice(index, 1);
    setCart(c);
    localStorage.setItem("cart", JSON.stringify(c));
  }

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div style={{ padding: 24 }}>
      <h1>Your Cart</h1>
      {cart.length === 0 && <div>Cart is empty</div>}
      {cart.map((item, idx) => (
        <div key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", padding: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>{item.title}</div>
            <div>${item.price.toFixed(2)} × {item.qty}</div>
          </div>
          <div style={{ marginTop: 8 }}>
            <button className="btn small" onClick={() => updateQty(idx, -1)}>-</button>
            <button className="btn small" onClick={() => updateQty(idx, 1)} style={{ marginLeft: 8 }}>+</button>
            <button className="btn small" onClick={() => removeItem(idx)} style={{ marginLeft: 8 }}>Remove</button>
          </div>
        </div>
      ))}
      <h3 style={{ marginTop: 12 }}>Total: ${total.toFixed(2)}</h3>
      <Link href="/checkout">
        <button className="btn primary" disabled={cart.length === 0}>Proceed to Checkout</button>
      </Link>
    </div>
  );
}
