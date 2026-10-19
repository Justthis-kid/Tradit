"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addToCart } from "../../../lib/cart";

export default function ProductPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/api/products")
      .then((response) => {
        if (!response.ok) throw new Error("The archive is unavailable right now.");
        return response.json();
      })
      .then((list) => {
        if (active) setProduct(list.find((item) => item.id === id) ?? null);
      })
      .catch((error) => {
        if (active) setLoadError(error.message);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loadError) {
    return (
      <section className="product-page container page-enter">
        <p className="eyebrow">The archive / unavailable</p>
        <h1 className="serif page-title">We couldn't find <em>that pair.</em></h1>
        <p className="product-load-error" role="alert">{loadError}</p>
        <Link className="button button-gold" href="/shop">Back to the archive</Link>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="product-page container page-enter" role="status" aria-live="polite">
        <p className="eyebrow">The archive / finding your pair</p>
        <h1 className="serif page-title">One moment <em>please.</em></h1>
      </section>
    );
  }

  return (
    <section className="product-page container page-enter">
      <button className="button button-gold product-back" onClick={() => router.back()}>
        <span aria-hidden="true">←</span> Back
      </button>

      <section className="product-detail">
        <div className="product-detail-image-wrap">
          <img className="product-detail-image" src={product.image} alt={product.name} />
          <span className="product-detail-stamp eyebrow">Condition checked / archive pair</span>
        </div>

        <div className="product-detail-copy">
          <p className="eyebrow">The archive / considered pairs</p>
          <h1 className="serif">{product.name}</h1>
          <p className="product-detail-price">${Number(product.price).toFixed(2)}</p>
          <p className="product-story">{product.story}</p>
          <div className="product-detail-rule">
            <span className="eyebrow">A pair with more life in it.</span>
            <p>Pre-owned, individually reviewed, and ready for its next chapter.</p>
          </div>

          <div className="button-row product-detail-actions">
            <button className="button button-gold" onClick={() => addToCart(product)}>
              Add to bag
            </button>
            <Link className="button button-light" href="/evaluate">Evaluate a pair</Link>
          </div>
          <Link className="product-bag-link" href="/cart">View your bag <span aria-hidden="true">↗</span></Link>
        </div>
      </section>
    </section>
  );
}
