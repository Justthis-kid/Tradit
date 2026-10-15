"use client";

import { useEffect, useState } from "react";
import ProductGrid from "../components/ProductGrid";
import { addToCart } from "../lib/cart";

export default function HomePage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts);
  }, []);

  return (
    <>
      <section className="home-hero">
        <div className="home-copy">
          <h1 className="home-title serif">
            Good shoes<br />
            <em>go places.</em>
          </h1>
          <p className="home-intro">
            The considered marketplace for pairs with more life in them.
          </p>
          <div className="button-row">
            <a className="button button-dark" href="/shop">Shop the archive</a>
            <a className="button button-light" href="/evaluate">Evaluate a pair</a>
          </div>
        </div>

        <div className="hero-image-wrap">
          <img className="hero-image" src="/editorial-shoe.jpg" />
          <div className="hero-label">
            <p className="eyebrow">Condition checked</p>
          </div>
          <div className="hero-new">
            <span></span>New arrivals
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2 className="serif">Trending</h2>
          <p className="eyebrow">Fresh from the archive</p>
        </div>

        <ProductGrid products={products} onAdd={addToCart} />
      </section>
    </>
  );
}
