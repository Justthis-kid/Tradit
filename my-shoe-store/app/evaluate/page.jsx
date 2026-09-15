"use client";

import { useState } from "react";

export default function EvaluatePage() {
  const [status, setStatus] = useState("idle"); // idle | analyzing | complete | error
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const referencePrice = 100;

  async function handleFileChange(e) {
    setError("");
    setResult(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStatus("analyzing");

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result.split(",")[1];

          const res = await fetch("/api/scan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: base64, referencePrice })
          });

          const data = await res.json();

          if (!res.ok) {
            setError(data?.error || "Scan failed");
            setStatus("error");
            setResult(null);
          } else {
            setResult(data);
            setStatus("complete");
          }
        } catch (err) {
          setError(err?.message || "Network error");
          setStatus("error");
        }
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setError(err?.message || "File read error");
      setStatus("error");
    }
  }

  function reset() {
    setStatus("idle");
    setFileName("");
    setError("");
    setResult(null);
  }

  return (
    <main className="page-enter">
      <section className="container evaluate-layout">
        <div className="evaluate-copy">
          <p className="eyebrow" style={{ color: "var(--gold-dark)" }}>
            The evaluator / private beta
          </p>
          <h1 className="serif page-title" style={{ marginTop: 20 }}>
            Know what<br />
            <em>you have.</em>
          </h1>
          <p>
            Give us a few clear photos. Our local evaluator reads the details that decide a pair’s
            place in the archive.
          </p>
          <div className="steps">
            <div>
              <span className="eyebrow" style={{ color: "var(--gold-dark)" }}>01</span>
              <p>Upload a photo</p>
            </div>
            <div>
              <span className="eyebrow" style={{ color: "var(--gold-dark)" }}>02</span>
              <p>Get a read</p>
            </div>
            <div>
              <span className="eyebrow" style={{ color: "var(--gold-dark)" }}>03</span>
              <p>Choose a next step</p>
            </div>
          </div>
        </div>

        <div className="evaluator">
          <div className="evaluator-head">
            <p>Start with one clear view</p>
            <span className="eyebrow" style={{ color: "var(--ink-soft)" }}>jpg · png · heic</span>
          </div>

          {status === "idle" && (
            <label className="dropzone">
              <input
                id="shoe-file"
                className="sr-only"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              <span className="drop-icon">📷</span>
              <h2 className="serif">Drop your shoe here</h2>
              <p>Or click to browse. A daylight photo from the side works best.</p>
              <span className="file-label">Choose photo</span>
            </label>
          )}

          {status === "analyzing" && (
            <div className="analyzing">
              <span className="loading-icon">✨</span>
              <p className="eyebrow" style={{ color: "var(--gold)", marginTop: 32 }}>
                Reading {fileName}
              </p>
              <h2 className="serif">Looking closely...</h2>
              <div className="analysis-list">
                <div><i></i>Silhouette and construction</div>
                <div><i></i>Wear pattern and condition</div>
                <div><i></i>Archive comparables</div>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="analysis-result" style={{ background: "var(--paper-card)", color: "var(--ink)" }}>
              <h2 className="serif">Scan error</h2>
              <p style={{ color: "var(--ink-soft)", marginTop: 12 }}>{error}</p>
              <button className="button" style={{ marginTop: 16 }} onClick={reset}>
                Try again
              </button>
            </div>
          )}

          {status === "complete" && result && (
            <div className="analysis-result">
              <div className="analysis-head">
                <div>
                  <p className="eyebrow" style={{ color: "var(--gold)" }}>
                    Read complete / {fileName}
                  </p>
                  <h2 className="serif">
                    A strong<br />
                    <em>second act.</em>
                  </h2>
                </div>
                <span style={{ color: "var(--gold)" }}>✔️</span>
              </div>

              <div className="analysis-grid">
                <div>
                  <p className="label">Likely type</p>
                  <p className="value">{result.brand || "Classic court low"}</p>
                </div>
                <div>
                  <p className="label">Condition read</p>
                  <p className="value">
                    {result.condition || "Very good · 8.2/10"}
                  </p>
                </div>
                <div>
                  <p className="label">Exchange range</p>
                  <p className="value gold">
                    {result.returnValue
                      ? `$${Number(result.returnValue).toFixed(2)}`
                      : "$90 – $125"}
                  </p>
                </div>
              </div>

              <div className="button-row">
                <a className="button button-gold" href="/credit">
                  See your credit options
                </a>
                <button
                  className="button"
                  style={{ color: "var(--paper)", borderColor: "#5c554c" }}
                  onClick={reset}
                >
                  Evaluate another pair
                </button>
              </div>
            </div>
          )}

          <p className="evaluator-note">
            <span>🛡️</span>
            <span>
              Your photos stay in this browser. This is a considered estimate, not a promise.
            </span>
          </p>
        </div>
      </section>
    </main>
  );
}
