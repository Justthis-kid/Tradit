"use client";

import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";

export default function HomePage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts)
      .catch(console.error);
  }, []);

  function addToBag(product) {
    const bag = JSON.parse(localStorage.getItem("bag") || "[]");
    bag.push(product);
    localStorage.setItem("bag", JSON.stringify(bag));
    window.dispatchEvent(new Event("storage"));
    alert(`${product.name} added to your bag`);
  }

  return (
    <div style={{ paddingTop: 20 }}>
      <h1 style={{ marginBottom: 8 }}>Trending Shoes</h1>
      <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>Buy, sell, and get AI-powered valuations</p>

      <div className="product-grid" style={{ marginTop: 20 }}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} onAdd={addToBag} />
        ))}
      </div>
    </div>
  );
}
