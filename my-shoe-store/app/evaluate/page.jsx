"use client";

import { useState } from "react";

export default function EvaluatePage() {
  const [status, setStatus] = useState("idle");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const referencePrice = 100;

  function handleFileChange(event) {
    setError("");
    setResult(null);
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStatus("analyzing");

    const reader = new FileReader();
    reader.onerror = () => {
      setError("We couldn't read that photo. Please choose another image.");
      setStatus("error");
    };
    reader.onload = async () => {
      if (typeof reader.result !== "string") {
        setError("We couldn't read that photo. Please choose another image.");
        setStatus("error");
        return;
      }

      try {
        const response = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: reader.result.split(",")[1],
            referencePrice,
          }),
        });
        const data = await response.json();

        if (!response.ok) {
          setError(data?.error || "The evaluation couldn't be completed. Please try again.");
          setStatus("error");
          return;
        }

        setResult(data);
        setStatus("complete");
      } catch (requestError) {
        setError(requestError?.message || "Network error. Please try again.");
        setStatus("error");
      }
    };

    try {
      reader.readAsDataURL(file);
    } catch (readError) {
      setError(readError?.message || "We couldn't read that photo. Please try another image.");
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
      <section className="evaluate-layout container">
        <div className="evaluate-copy">
          <p className="eyebrow evaluate-eyebrow">The evaluator / private beta</p>
          <h1 className="serif page-title">
            <span className="evaluate-title-line">Know what</span><br />
            <em>you have.</em>
          </h1>
          <p className="evaluate-intro">
            Every pair has a story. Get a thoughtful first read on its make, condition, and
            next chapter in the archive.
          </p>

          <div className="steps" aria-label="How evaluation works">
            <div className="evaluate-step">
              <span className="eyebrow">01</span>
              <p>Share a photo</p>
            </div>
            <div className="evaluate-step">
              <span className="eyebrow">02</span>
              <p>Get your read</p>
            </div>
            <div className="evaluate-step">
              <span className="eyebrow">03</span>
              <p>Choose next steps</p>
            </div>
          </div>

          <p className="evaluate-side-note">
            <span aria-hidden="true">✳</span>
            A useful estimate, made with a human eye in mind.
          </p>
        </div>

        <div className="evaluator-wrap">
          <section className="evaluator" aria-label="Shoe evaluation">
            <div className="evaluator-head">
              <div>
                <p className="eyebrow">Tradits / first look</p>
                <h2 className="serif">The shoe, up close.</h2>
              </div>
              <span className="evaluator-counter">01 <i>/</i> 01</span>
            </div>

            {status === "idle" && (
              <label className="dropzone" htmlFor="shoe-file">
                <input
                  id="shoe-file"
                  className="sr-only"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  aria-describedby="upload-guidance"
                />
                <span className="drop-icon" aria-hidden="true">
                  <svg viewBox="0 0 32 32" fill="none">
                    <path d="M5 10.5h5l2-3h8l2 3h5v14H5v-14Z" />
                    <circle cx="16" cy="17" r="4.5" />
                    <path d="M23.5 14h.01" />
                  </svg>
                </span>
                <span className="dropzone-kicker eyebrow">A good pair deserves a good portrait</span>
                <span className="dropzone-title serif">Start with one clear view.</span>
                <span id="upload-guidance" className="dropzone-copy">
                  Choose a well-lit photo of the whole shoe, taken from the side.
                </span>
                <span className="button button-gold file-label">Choose a photo <span aria-hidden="true">↗</span></span>
                <span className="dropzone-footnote">Your image is only used to create this estimate.</span>
              </label>
            )}

            {status === "analyzing" && (
              <div className="analyzing" role="status" aria-live="polite">
                <div className="analysis-orbit" aria-hidden="true"><span>✳</span></div>
                <p className="eyebrow">Reading / {fileName}</p>
                <h2 className="serif">Looking closely.</h2>
                <p className="analyzing-copy">Taking in the details that give this pair its character.</p>
                <div className="analysis-list">
                  <div><i></i>Silhouette and construction</div>
                  <div><i></i>Wear pattern and condition</div>
                  <div><i></i>Archive comparables</div>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="analysis-error" role="alert">
                <span className="eyebrow">A small pause</span>
                <h2 className="serif">We couldn't finish the read.</h2>
                <p>{error}</p>
                <button className="button button-gold" onClick={reset}>Try another photo</button>
              </div>
            )}

            {status === "complete" && result && (
              <div className="analysis-result" aria-live="polite">
                <div className="analysis-head">
                  <div>
                    <p className="eyebrow">Read complete / {fileName}</p>
                    <h2 className="serif">A new chapter<br /><em>starts here.</em></h2>
                  </div>
                  <span className="analysis-check" aria-label="Evaluation complete">✓</span>
                </div>

                <dl className="analysis-grid">
                  <div>
                    <dt>Brand</dt>
                    <dd>{result.brand || "Not identified"}</dd>
                  </div>
                  <div>
                    <dt>Model</dt>
                    <dd>{result.model || "Not identified"}</dd>
                  </div>
                  <div>
                    <dt>Condition read</dt>
                    <dd>{result.condition || "Not identified"}</dd>
                  </div>
                  <div className="analysis-offer">
                    <dt>Estimated offer</dt>
                    <dd>
                      {result.returnValue != null && Number.isFinite(Number(result.returnValue))
                        ? `$${Number(result.returnValue).toFixed(2)}`
                        : "Unavailable"}
                    </dd>
                  </div>
                </dl>

                {result.notable && <p className="analysis-note">{result.notable}</p>}

                <div className="button-row">
                  <a className="button button-gold" href="/credit">Explore store credit</a>
                  <button className="button button-light" onClick={reset}>Evaluate another pair</button>
                </div>
              </div>
            )}
          </section>

          <p className="evaluator-note">
            <span aria-hidden="true">✳</span>
            Your photo is sent to our AI provider for analysis. This is a considered estimate, not a promise.
          </p>
        </div>
      </section>

      <section className="evaluate-guide">
        <div className="container">
          <div className="evaluate-guide-heading">
            <p className="eyebrow">A few things worth knowing</p>
            <h2 className="serif">The details make<br /><em>the difference.</em></h2>
          </div>
          <div className="evaluate-guide-grid">
            <article>
              <span className="eyebrow">01 / Light</span>
              <h3 className="serif">Find the daylight.</h3>
              <p>Natural light brings out the real color and texture of the materials.</p>
            </article>
            <article>
              <span className="eyebrow">02 / Angle</span>
              <h3 className="serif">Show the whole pair.</h3>
              <p>A clear side view helps us see the shape, sole, and overall condition.</p>
            </article>
            <article>
              <span className="eyebrow">03 / Honesty</span>
              <h3 className="serif">Let wear tell its story.</h3>
              <p>Keep scuffs and creases in frame for a more useful, realistic estimate.</p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
