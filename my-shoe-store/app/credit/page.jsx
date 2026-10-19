"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  readStoreCredit,
  STORE_CREDIT_UPDATED_EVENT,
} from "../../lib/store-credit";

export default function CreditPage() {
  const [credit, setCredit] = useState(0);
  const [error, setError] = useState("");

  const refreshCredit = useCallback(() => {
    try {
      setCredit(readStoreCredit());
      setError("");
    } catch (creditError) {
      setError(creditError.message);
    }
  }, []);

  useEffect(() => {
    refreshCredit();
    window.addEventListener("storage", refreshCredit);
    window.addEventListener(STORE_CREDIT_UPDATED_EVENT, refreshCredit);
    return () => {
      window.removeEventListener("storage", refreshCredit);
      window.removeEventListener(STORE_CREDIT_UPDATED_EVENT, refreshCredit);
    };
  }, [refreshCredit]);

  return (
    <section className="credit-page container page-enter">
      <header className="page-top">
        <div className="page-top-copy">
          <p className="eyebrow">The archive / your exchange</p>
          <h1 className="serif page-title">Store <em>credit.</em></h1>
        </div>
        <p className="page-top-note">
          A little more room for the next pair. Your balance starts at zero and grows when you
          accept a trade-in offer.
        </p>
      </header>

      {error && <p className="credit-error" role="alert">{error}</p>}

      <section className="credit-content" aria-label="Store credit balance">
        <div className="credit-card">
          <div className="credit-card-head">
            <div>
              <p className="eyebrow">Available credit</p>
              <p className="credit-number" aria-live="polite">${credit.toFixed(2)}</p>
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
          <h2 className="serif">{credit > 0 ? "Find a pair for its next chapter." : "Start with a pair you love."}</h2>
          <p>
            {credit > 0
              ? "Your available balance is ready to put toward a pair in the archive."
              : "Evaluate a pre-owned pair to receive a conditional trade-in estimate. Credit is added only when you accept an offer."}
          </p>
          <div className="button-row">
            <Link className="button button-gold" href={credit > 0 ? "/shop" : "/evaluate"}>
              {credit > 0 ? "Shop the archive" : "Evaluate a pair"}
            </Link>
            <Link className="button button-light" href={credit > 0 ? "/evaluate" : "/shop"}>
              {credit > 0 ? "Trade in a pair" : "Browse the archive"}
            </Link>
          </div>
        </div>
      </section>
      <p className="credit-note">
        Store credit is currently saved in this browser for the private beta. It is not yet
        account-backed or redeemable at checkout.
      </p>
    </section>
  );
}
