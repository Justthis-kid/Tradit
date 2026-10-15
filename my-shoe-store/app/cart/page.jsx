// app/cart/page.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CART_UPDATED_EVENT,
  readCart,
  removeFromCart,
  updateCartQuantity,
} from "../../lib/cart";

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const onStorage = () => {
      try {
        setCart(readCart());
        setError("");
      } catch (cartError) {
        setError(cartError.message);
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

  function changeQuantity(id, delta) {
    try {
      updateCartQuantity(id, delta);
    } catch (cartError) {
      setError(cartError.message);
    }
  }

  function removeItem(id) {
    try {
      removeFromCart(id);
    } catch (cartError) {
      setError(cartError.message);
    }
  }

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <section className="cart-page">
      <div className="page-top-copy">
        <p className="eyebrow">The archive / your selection</p>
        <h1 className="serif page-title">Your <em>bag.</em></h1>
      </div>
      {error && <p className="cart-error" role="alert">{error}</p>}
      {cart.length === 0 ? (
        <div className="empty-state">
          <h2 className="serif">Your bag is taking a breather.</h2>
          <p>Find a pair in the archive and it will be waiting here.</p>
          <Link className="button button-dark" href="/shop">Browse the archive</Link>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items">
            {cart.map((item) => (
              <article className="cart-item" key={item.id}>
                {item.image && <img src={item.image} alt="" />}
                <div className="cart-item-details">
                  <h2>{item.title}</h2>
                  {item.detail && <p>{item.detail}</p>}
                  <p className="product-price">${item.price.toFixed(2)} each</p>
                  <div className="cart-item-controls">
                    <button className="button" aria-label={`Decrease ${item.title} quantity`} onClick={() => changeQuantity(item.id, -1)}>−</button>
                    <span aria-live="polite">{item.qty}</span>
                    <button className="button" aria-label={`Increase ${item.title} quantity`} onClick={() => changeQuantity(item.id, 1)}>+</button>
                    <button className="cart-remove" onClick={() => removeItem(item.id)}>Remove</button>
                  </div>
                </div>
                <strong>${(item.price * item.qty).toFixed(2)}</strong>
              </article>
            ))}
          </div>

          <aside className="cart-summary">
            <p className="eyebrow">Order summary</p>
            <div className="cart-total">
              <span>Subtotal</span>
              <strong>${total.toFixed(2)}</strong>
            </div>
            <p>Shipping and any applicable taxes are shown at checkout.</p>
            <Link className="button button-dark" href="/checkout">Continue to checkout</Link>
          </div>
        </div>
      )}
    </section>
  );
}
