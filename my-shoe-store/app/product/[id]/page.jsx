"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProductPage({ params }) {
  const { id } = params;
  const router = useRouter();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((list) => setProduct(list.find((p) => p.id === id)));
  }, [id]);

  if (!product) return <div style={{ padding: 24 }}>Loading…</div>;

  function addToBag() {
    const bag = JSON.parse(localStorage.getItem("bag") || "[]");
    bag.push(product);
    localStorage.setItem("bag", JSON.stringify(bag));
    window.dispatchEvent(new Event("storage"));
  }

  return (
    <div style={{ padding: 24 }}>
      <button className="button" onClick={() => router.back()}>
        ← Back
      </button>

      <div style={{ display: "flex", gap: 24, marginTop: 24 }}>
        <img
          src={product.image}
          alt={product.name}
          style={{
            width: 420,
            height: 360,
            objectFit: "cover",
            borderRadius: 12
          }}
        />

        <div>
          <h1 className="serif">{product.name}</h1>
          <p className="product-price">${product.price}</p>
          <p className="product-story">{product.story}</p>

          <div className="button-row" style={{ marginTop: 24 }}>
            <button className="button button-dark" onClick={addToBag}>
              Add to bag
            </button>

            <a href="/evaluate">
              <button className="button">Evaluate a pair</button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
