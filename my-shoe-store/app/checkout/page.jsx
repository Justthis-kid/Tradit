// app/checkout/page.jsx
"use client";

import { useEffect, useState } from "react";

export default function CheckoutPage() {
  const [cart, setCart] = useState([]);
  const [fileName, setFileName] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem("cart") || "[]"));
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
          body: JSON.stringify({ imageBase64: base64, referencePrice: total || 100 })
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
    const credit = Number(localStorage.getItem("storeCredit") || 0) + Number(scanResult.returnValue);
    localStorage.setItem("storeCredit", credit.toFixed(2));
    // Clear cart as demo
    localStorage.removeItem("cart");
    alert(`Offer accepted. Store credit: $${credit.toFixed(2)}. Use it to buy on Tradit.`);
    window.location.href = "/";
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Checkout</h1>

      <section style={{ marginTop: 12 }}>
        <h3>Order summary</h3>
        {cart.length === 0 && <div>Your cart is empty</div>}
        {cart.map((i, idx) => (
          <div key={idx}>{i.title} — ${i.price.toFixed(2)} × {i.qty}</div>
        ))}
        <h3>Total: ${total.toFixed(2)}</h3>
      </section>

      <section style={{ marginTop: 18 }}>
        <h3>Sell / Resell a Shoe (AI Valuation)</h3>
        <div style={{ color: "var(--muted)" }}>Upload a clear photo of the shoe. Tradit will analyze brand, model, condition, trend, and offer store credit up to 50% of original price.</div>

        <input type="file" accept="image/*" onChange={handleFile} style={{ marginTop: 12 }} />
        {fileName && <div>Selected: {fileName}</div>}
        {loading && <div>Scanning…</div>}
        {error && <div style={{ color: "red" }}>{error}</div>}

        {scanResult && (
          <div className="scan-result">
            <h4>AI Valuation</h4>
            <div><strong>Brand</strong>: {scanResult.brand ?? scanResult.scan?.brand ?? "Unknown"}</div>
            <div><strong>Model</strong>: {scanResult.model ?? scanResult.scan?.model ?? "Unknown"}</div>
            <div><strong>Condition</strong>: {scanResult.condition ?? scanResult.scan?.condition ?? "Unknown"}</div>
            <div><strong>Trend Score</strong>: {scanResult.trendingScore ?? scanResult.scan?.trendingScore ?? "N/A"}</div>
            <div><strong>Return Value (store credit)</strong>: ${Number(scanResult.returnValue ?? scanResult.scan?.returnValue ?? 0).toFixed(2)}</div>

            <div style={{ marginTop: 12 }}>
              <button className="btn primary" onClick={acceptOffer}>Accept Offer (Add store credit)</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
