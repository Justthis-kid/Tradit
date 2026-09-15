"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProductPage({ params }) {
  const { id } = params;
  const [product, setProduct] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((list) => setProduct(list.find((p) => p.id === id)))
      .catch(console.error);
  }, [id]);

  if (!product) return <div style={{ padding: 24 }}>Loading…</div>;

  function addToBag() {
    const bag = JSON.parse(localStorage.getItem("bag") || "[]");
    bag.push(product);
    localStorage.setItem("bag", JSON.stringify(bag));
    window.dispatchEvent(new Event("storage"));
    alert("Added to bag");
  }

  return (
    <div style={{ padding: 24 }}>
      <button className="button" onClick={() => router.back()}>← Back</button>
      <div style={{ display: "flex", gap: 24, marginTop: 12 }}>
        <img src={product.image} alt={product.title} style={{ width: 420, height: 360, objectFit: "cover", borderRadius: 12 }} />
        <div style={{ flex: 1 }}>
          <h1>{product.name}</h1>
          <div className="product-price">${product.price.toFixed(2)}</div>
          <p style={{ color: "var(--ink-soft)" }}>{product.story}</p>

          <div style={{ marginTop: 12 }}>
            <button className="button button-dark" onClick={addToBag}>Buy now</button>
            <a href="/evaluate" style={{ marginLeft: 12 }}>
              <button className="button">Sell / Resell</button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
