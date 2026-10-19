// app/checkout/page.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readCart } from "../../lib/cart";
import { addStoreCredit } from "../../lib/store-credit";

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

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result.split(",")[1];
      setLoading(true);
      try {
        // Send price along so API can compute return value (use total as reference)
        const res = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: file.type,
            referencePrice: total || 100
          })
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error || "Scan failed");
        } else {
          setScanResult(data);
        }
      } catch (err) {
        setError(err.message || "Network error");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  function acceptOffer() {
    if (!scanResult?.returnValue) {
      alert("No offer to accept");
      return;
    }
    // Store credit flow: save to localStorage as 'storeCredit'
    let credit;
    try {
      credit = addStoreCredit(scanResult.returnValue);
    } catch (creditError) {
      setError(creditError.message);
      return;
    }
    // Clear cart as demo
    localStorage.removeItem("cart");
    alert(`Offer accepted. Store credit: $${credit.toFixed(2)}. Use it to buy on Tradit.`);
    window.location.href = "/";
  }

  return (
    <section className="checkout-page container page-enter">
      <header className="page-top">
        <div className="page-top-copy">
          <p className="eyebrow">The archive / checkout</p>
          <h1 className="serif page-title">Your next <em>move.</em></h1>
        </div>
        <p className="page-top-note">
          Review your selection or explore a conditional trade-in estimate for a pair of your own.
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
          <p className="checkout-fineprint">Shipping and applicable taxes are calculated at checkout.</p>
        </section>

        <section className="checkout-tradein">
          <div className="checkout-section-heading">
            <p className="eyebrow">02 / Your pair</p>
            <h2 className="serif">Explore its next chapter.</h2>
          </div>
          <p className="checkout-intro">
            Share a clear photo for a first look at the brand, model, visible condition, and a
            conditional store-credit estimate.
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
            <div className="checkout-evaluation">
              <p className="eyebrow">First look / estimate</p>
              <dl>
                <div><dt>Brand name</dt><dd>{scanResult.brand}</dd></div>
                <div><dt>Model name</dt><dd>{scanResult.model}</dd></div>
                <div><dt>Condition</dt><dd>{scanResult.condition}</dd></div>
                <div><dt>Estimated store credit</dt><dd>${Number(scanResult.returnValue).toFixed(2)}</dd></div>
              </dl>
              <p className="checkout-fineprint">
                This photo-based estimate is conditional and is not a final authentication or payout offer.
              </p>
              <button className="button button-gold" onClick={acceptOffer}>
                Accept estimate
              </button>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
