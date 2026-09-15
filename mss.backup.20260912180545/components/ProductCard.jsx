"use client";

import Link from "next/link";

export default function ProductCard({ product, onAdd }) {
  return (
    <article className="product-card">
      <div className="product-media">
        <Link href={`/product/${product.id}`}>
          <img src={product.image} alt={`${product.name}, ${product.detail}`} />
        </Link>
        {product.isNew ? <span className="product-tag">Just in</span> : null}
        <button className="favorite" aria-label="Save">♡</button>
        <button className="add-bag" onClick={() => onAdd(product)}>Add to bag</button>
      </div>
      <div className="product-meta">
        <div>
          <h3>{product.name}</h3>
          <p>{product.detail} · {product.condition}</p>
        </div>
        <p className="product-price">${product.price}</p>
      </div>
      <p className="product-story">{product.story}</p>
    </article>
  );
}
