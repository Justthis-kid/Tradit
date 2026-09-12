"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [file, setFile] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState("");
  const [user, setUser] = useState({ credit: 0 });
  const [products, setProducts] = useState([]);
  const [checkoutMessage, setCheckoutMessage] = useState("");

  useEffect(() => {
    fetch("/api/user")
      .then(res => res.json())
      .then(setUser);

    fetch("/api/products")
      .then(res => res.json())
      .then(setProducts);
  }, []);

  async function handleScan() {
    setScanError("");
    setScanResult(null);
    setCheckoutMessage("");

    if (!file) {
      setScanError("Please select a shoe photo first.");
      return;
    }

    setScanLoading(true);
    try {
      // In a real app you'd send FormData with the file.
      const res = await fetch("/api/scan", {
        method: "POST"
      });

      if (!res.ok) {
        const data = await res.json();
        setScanError(data.error || "Scan failed.");
      } else {
        const data = await res.json();
        setScanResult(data);
      }
    } catch (err) {
      setScanError("Something went wrong while scanning.");
    } finally {
      setScanLoading(false);
    }
  }

  async function acceptCredit() {
    if (!scanResult) return;
    setCheckoutMessage("");
    const res = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", amount: scanResult.creditOffer })
    });
    const data = await res.json();
    setUser(data);
    setScanResult(null);
  }

  async function buyWithCredit(product) {
    setCheckoutMessage("");
    const res = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "spend", amount: product.discountPrice })
    });

    const data = await res.json();
    if (!res.ok) {
      setCheckoutMessage(data.error || "Could not complete purchase.");
    } else {
      setUser(data);
      setCheckoutMessage(`You bought ${product.name} using store credit!`);
    }
  }

  return (
    <>
      <header style={{ marginBottom: "2rem" }}>
        <h1>SoleSwap</h1>
        <p>Trade your worn kicks for store credit and buy fresh pairs at a discount.</p>
        <div className="flex" style={{ marginTop: "0.75rem" }}>
          <span className="credit-pill">Your Store Credit: ${user.credit}</span>
        </div>
      </header>

      <section className="card">
        <h2>Submit Your Shoes</h2>
        <p>Upload a photo of your shoes. Our AI (mocked for now) will estimate brand, model, condition, and credit.</p>

        <div style={{ marginTop: "1rem" }}>
          <input
            type="file"
            accept="image/*"
            onChange={e => {
              setFile(e.target.files[0] || null);
              setScanResult(null);
              setScanError("");
            }}
          />
        </div>

        <div style={{ marginTop: "1rem" }}>
          <button onClick={handleScan} disabled={scanLoading}>
            {scanLoading ? "Scanning..." : "Scan Shoes"}
          </button>
        </div>

        {scanError && (
          <p style={{ color: "#f97373", marginTop: "0.75rem" }}>{scanError}</p>
        )}

        {scanResult && (
          <div style={{ marginTop: "1.25rem" }}>
            <h3>Scan Result</h3>
            <p><strong>Brand:</strong> {scanResult.brand}</p>
            <p><strong>Model:</strong> {scanResult.model}</p>
            <p><strong>Condition:</strong> {scanResult.condition}</p>
            <p><strong>Estimated Resale Value:</strong> ${scanResult.estimatedValue}</p>
            <p><strong>Store Credit Offer:</strong> ${scanResult.creditOffer}</p>
            <div style={{ marginTop: "0.75rem" }} className="flex">
              <button onClick={acceptCredit}>Accept Credit</button>
              <button
                onClick={() => {
                  setScanResult(null);
                  setCheckoutMessage("");
                }}
                style={{ background: "#6b7280", color: "#e5e7eb" }}
              >
                Decline
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Fresh Kicks Storefront</h2>
        <p>Use your store credit to buy new shoes at discounted prices.</p>

        <div className="products-grid" style={{ marginTop: "1rem" }}>
          {products.map(product => (
            <div key={product.id} className="product-card">
              <div className="flex" style={{ justifyContent: "space-between" }}>
                <h3>{product.name}</h3>
                <span className="badge">{product.brand}</span>
              </div>
              <p style={{ marginTop: "0.5rem" }}>
                <span style={{ textDecoration: "line-through", color: "#9ca3af" }}>
                  ${product.price}
                </span>{" "}
                <strong>${product.discountPrice}</strong> with SoleSwap discount
              </p>
              <button
                style={{ marginTop: "0.75rem" }}
                onClick={() => buyWithCredit(product)}
              >
                Buy with Credit
              </button>
            </div>
          ))}
        </div>

        {checkoutMessage && (
          <p style={{ marginTop: "1rem", color: "#22c55e" }}>{checkoutMessage}</p>
        )}
      </section>
    </>
  );
}
