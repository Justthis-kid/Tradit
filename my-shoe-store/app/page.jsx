"use client";

import { useState } from "react";

export default function Page() {
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e) {
    setError("");
    setResult(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result.split(",")[1];
      setLoading(true);
      try {
        const res = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64 })
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error || "Scan failed");
        } else {
          setResult(data);
        }
      } catch (err) {
        setError(err.message || "Network error");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>AI Shoe Scan</h1>
      <p>Upload a shoe photo and get a short AI analysis.</p>

      <input type="file" accept="image/*" onChange={handleFile} />
      {fileName && <div>Selected file: {fileName}</div>}

      {loading && <div>Scanning…</div>}

      {error && <div style={{ color: "red" }}>{error}</div>}

      {result && (
        <section style={{ marginTop: 16 }}>
          <h2>Scan Result</h2>
          <pre style={{ whiteSpace: "pre-wrap", background: "#f6f6f6", padding: 12 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </section>
      )}
    </main>
  );
}
