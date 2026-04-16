import { useState } from "react";

export default function App() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitName = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/submit-name/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.name?.[0] || "Failed to submit name.");
      }

      setMessage(data.message);
      setName("");
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <h1>BioStock One-Button App</h1>
      <form onSubmit={submitName}>
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={100}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
    </main>
  );
}
