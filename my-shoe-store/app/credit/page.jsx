"use client";

import { useState } from "react";

export default function CreditPage() {
  const [useCredit, setUseCredit] = useState(false);

  const history = [
    { label: "Credit from Mariner 86 sale", date: "Jun 14, 2024", amount: "+ $68.40", type: "in" },
    { label: "Applied to Pace Runner 04", date: "May 29, 2024", amount: "− $22.00", type: "out" },
    { label: "Welcome credit", date: "May 07, 2024", amount: "+ $10.00", type: "in" }
  ];

  return (
    <section className="credit-layout">
      <div className="credit-copy">
        <p className="eyebrow" style={{ color: "var(--gold-dark)" }}>
          Your exchange / wallet
        </p>
        <h1 className="serif page-title">
          Credit that<br />
          <em>keeps moving.</em>
        </h1>
        <p>
          Every good sale gives you a little more room to find the next pair. No expiry. No fuss.
        </p>
      </div>

      <div className="credit-panel">
        <div className="credit-card">
          <div className="credit-card-head">
            <div>
              <p className="eyebrow gold-text">Available credit</p>
              <p className="credit-number">$56.40</p>
            </div>
            <span className="gold-text">💳</span>
          </div>

          <div className="credit-card-bottom">
            <span>Last updated just now</span>
            <button
              className={`toggle ${useCredit ? "active" : ""}`}
              onClick={() => setUseCredit(!useCredit)}
            >
              {useCredit ? "Credit applied to next purchase" : "Tap to apply credit"}
            </button>
          </div>
        </div>

        <div className="credit-history">
          <p className="eyebrow">Recent movements</p>
          <ul>
            {history.map((item, i) => (
              <li key={i} className={`credit-row credit-${item.type}`}>
                <div>
                  <p>{item.label}</p>
                  <span className="eyebrow">{item.date}</span>
                </div>
                <span className="amount">{item.amount}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="credit-note">
          Credit is tied to your email and can be used on any future pair. No expiry, just good shoes.
        </p>
      </div>
    </section>
