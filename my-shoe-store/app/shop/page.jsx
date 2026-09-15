"use client";

import { useEffect, useState } from "react";
import ProductGrid from "../../components/ProductGrid";

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All pairs");
  const [sort, setSort] = useState("Featured");

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts);
  }, []);

  const categories = ["All pairs", "Low-tops", "High-tops", "Runners", "Loafers"];

  const filtered = products.filter((p) => {
    const matchesQuery = `${p.name} ${p.detail} ${p.category}`
      .toLowerCase()
      .includes(query.toLowerCase());

    const matchesCategory = category === "All pairs" || p.category === category;

    return matchesQuery && matchesCategory;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "Price: low to high") return a.price - b.price;
    if (sort === "Price: high to low") return b.price - a.price;
    return 0;
  });

  function addToBag(product) {
    const bag = JSON.parse(localStorage.getItem("bag") || "[]");
    bag.push(product);
    localStorage.setItem("bag", JSON.stringify(bag));
    window.dispatchEvent(new Event("storage"));
  }

  return (
    <>
      <div className="page-top">
        <div className="page-top-copy">
          <p className="eyebrow" style={{ color: "var(--gold-dark)" }}>
            The archive / {products.length} pairs
          </p>
          <h1 className="serif page-title">
            Find your<br />
            <em>next pair.</em>
          </h1>
        </div>
        <p className="page-top-note">
          No trend cycle required. Browse pairs with a little history and a lot of life left.
        </p>
      </div>

      <div className="shop-toolbar">
        <div className="filters">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`filter ${category === cat ? "active" : ""}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="shop-controls">
          <label className="field-control">
            🔍
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the archive"
            />
          </label>

          <label className="field-control">
            ⚙️
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option>Featured</option>
              <option>Price: low to high</option>
              <option>Price: high to low</option>
            </select>
          </label>
        </div>
      </div>

      <div className="results-line">
        <span>{sorted.length} pairs found</span>
        <span className="eyebrow">All condition notes are human-written</span>
      </div>

      {sorted.length > 0 ? (
        <ProductGrid products={sorted} onAdd={addToBag} />
      ) : (
        <div className="empty-state">
          <h2 className="serif">No pair by that name.</h2>
          <p>Try a wider search, or clear the filter and start from the top.</p>
          <button
            className="button button-light"
            onClick={() => {
              setQuery("");
              setCategory("All pairs");
            }}
          >
            Clear search
          </button>
        </div>
      )}
    </>
  );
}
