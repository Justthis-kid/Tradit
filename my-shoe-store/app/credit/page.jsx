"use client";

import Link from "next/link";

export default function CreditPage() {
  return (
    <section className="credit-page container page-enter">
      <header className="page-top">
        <div className="page-top-copy">
          <p className="eyebrow">The archive / your exchange</p>
          <h1 className="serif page-title">Store <em>credit.</em></h1>
        </div>
        <p className="page-top-note">
          A little more room for the next pair. Your balance starts at zero; trade-in offers and account-backed credit are not yet available.
        </p>
      </header>

      <section className="credit-content" aria-label="Store credit balance">
        <div className="credit-card">
          <div className="credit-card-head">
            <div>
              <p className="eyebrow">Available credit</p>
              <p className="credit-number">$0.00</p>
            </div>
            <span className="credit-mark" aria-hidden="true">T</span>
          </div>
          <div className="credit-card-bottom">
            <span className="eyebrow">Tradits / exchange balance</span>
            <span>No expiry</span>
          </div>
        </div>

        <div className="credit-details">
          <p className="eyebrow">Your next move</p>
          <h2 className="serif">Start with a pair you love.</h2>
          <p>
            Photo evaluation currently identifies visible shoe details only. It does not create a trade-in offer or add store credit.
          </p>
          <div className="button-row">
            <Link className="button button-gold" href="/evaluate">Identify a pair</Link>
            <Link className="button button-light" href="/shop">Browse the archive</Link>
          </div>
        </div>
      </section>
      <p className="credit-note">Account-backed store credit is not yet available.</p>
    </section>
  );
}
