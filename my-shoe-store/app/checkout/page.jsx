// app/checkout/page.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readCart } from "../../lib/cart";
import { readShoePhoto } from "../../lib/shoe-scan-client";

export default function CheckoutPage() {
  const [cart, setCart] = useState([]);
  const [fileName, setFileName] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      setCart(readCart());
    } catch (cartError) {
      setError(cartError.message);
    }
  }, []);

  // Compute cart total helper
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  async function handleFile(e) {
    setError("");
    setScanResult(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    setLoading(true);
    try {
      const imageBase64 = await readShoePhoto(file);
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType: file.type }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error || "The photo assessment couldn't be completed. Please try again.");
      } else {
        setScanResult(data);
      }
    } catch (scanError) {
      setError(scanError?.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="checkout-page container page-enter">
      <header className="page-top">
        <div className="page-top-copy">
          <p className="eyebrow">The archive / checkout</p>
          <h1 className="serif page-title">Your next <em>move.</em></h1>
        </div>
        <p className="page-top-note">
          Review your saved selection or get a photo-based identification for a pair of your own.
        </p>
      </header>

      {error && <p className="checkout-error" role="alert">{error}</p>}

      <div className="checkout-grid">
        <section className="checkout-order">
          <div className="checkout-section-heading">
            <p className="eyebrow">01 / Your selection</p>
            <h2 className="serif">Order summary</h2>
          </div>
          {cart.length === 0 ? (
            <div className="checkout-empty">
              <p>Your bag is taking a breather.</p>
              <Link className="text-link" href="/shop">Browse the archive</Link>
            </div>
          ) : (
            <ul className="checkout-items">
              {cart.map((item) => (
                <li key={item.id}>
                  <div>
                    <p>{item.title}</p>
                    {item.detail && <span>{item.detail}</span>}
                    <span>Qty {item.qty}</span>
                  </div>
                  <strong>${(item.price * item.qty).toFixed(2)}</strong>
                </li>
              ))}
            </ul>
          )}
          <div className="checkout-total">
            <span>Subtotal</span>
            <strong>${total.toFixed(2)}</strong>
          </div>
          <p className="checkout-fineprint">
            This demo cart does not place orders or process payments. Prices and totals are not verified by a checkout service.
          </p>
        </section>

        <section className="checkout-tradein">
          <div className="checkout-section-heading">
            <p className="eyebrow">02 / Your pair</p>
            <h2 className="serif">Explore its next chapter.</h2>
          </div>
          <p className="checkout-intro">
            Share a clear photo for an AI-assisted first look at the brand, model, and visible condition.
          </p>
          <label className="checkout-upload" htmlFor="checkout-shoe-file">
            <span className="eyebrow">Choose a shoe photo</span>
            <input
              id="checkout-shoe-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFile}
              aria-describedby="checkout-upload-help"
            />
            <span id="checkout-upload-help" className="checkout-upload-help">
              JPEG, PNG, or WebP. A well-lit side view works best.
            </span>
          </label>
          {fileName && <p className="checkout-filename">Selected / {fileName}</p>}
          {loading && <p className="checkout-status" role="status" aria-live="polite">Taking a closer look…</p>}

          {scanResult && (
            <div className="checkout-evaluation" aria-live="polite">
              {scanResult.isFootwear ? (
                <>
                  <p className="eyebrow">Photo assessment</p>
                  <dl>
                    <div><dt>Brand name</dt><dd>{scanResult.brand}</dd></div>
                    <div><dt>Model name</dt><dd>{scanResult.model}</dd></div>
                    <div><dt>Condition</dt><dd>{scanResult.condition}</dd></div>
                  </dl>
                  <p className="checkout-fineprint">
                    This automated assessment is not a final authentication, valuation, or payout offer.
                  </p>
                </>
              ) : (
                <>
                  <p className="eyebrow">Not footwear</p>
                  <p role="status">{scanResult.message}</p>
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
