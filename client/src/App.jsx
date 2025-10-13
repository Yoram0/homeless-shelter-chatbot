// NOTE:  Only main components will be integrated to main project.
//        Most is temporary and will have to be modified or changed.

import { useState } from "react"; // Use State import to manage component states
import "./App.css"; // CSS import

function App() {
  // re-add free-text input state for the original chatbot UI
  const [input, setInput] = useState("");

  const [chatlog, setChatlog] = useState([]); // State to store the chat history
  const [loading, setLoading] = useState(false); // State to see if message is being sent

  // New form states
  const [mode, setMode] = useState("zip"); // "zip" or "city"
  const [zipcode, setZipcode] = useState("");
  const [city, setCity] = useState("");
  const [regionState, setRegionState] = useState("");

  // Function to send user messages to the backend + updating chatlog
  const sendMessage = async (userMessage) => {
    if (!userMessage.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage }),
      });

      const data = await res.json();
      const reply =
        data.choices?.[0]?.message?.content || "No response received.";

      setChatlog((prev) => [
        ...prev,
        { role: "user", content: userMessage },
        { role: "assistant", content: reply },
      ]);
    } catch (err) {
      console.error(err);
      setChatlog((prev) => [
        ...prev,
        { role: "user", content: userMessage },
        { role: "assistant", content: "Error contacting chatbot." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendFreeText = async () => {
    if (!input.trim()) return; // don't send empty
    const userMessage = input;
    setInput(""); // clear input box (convenience)
    await sendMessage(userMessage);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let userMessage = "";
    if (mode === "zip") {
      const z = zipcode.trim();
      if (!/^\d{5}$/.test(z)) {
        alert("Please enter a valid 5-digit ZIP code.");
        return;
      }
      userMessage = `Find homeless shelters near ZIP code ${z}.`;
    } else {
      const c = city.trim();
      const s = regionState.trim();
      if (!c || !s) {
        alert("Please enter both city and state.");
        return;
      }
      userMessage = `Find homeless shelters in ${c}, ${s}.`;
    }

    // clear inputs for convenience
    setZipcode("");
    setCity("");
    setRegionState("");

    sendMessage(userMessage);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h2>WIP Chatbot</h2>

      <div
        style={{
          marginBottom: "1rem",
          maxHeight: "300px",
          overflowY: "auto",
          border: "1px solid #ccc",
          padding: "1rem",
        }}
      >
        {chatlog.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: "0.5rem" }}>
            <strong>{msg.role === "user" ? "You" : "Bot"}:</strong>{" "}
            {msg.content}
          </div>
        ))}
      </div>

      <textarea
        rows="4"
        cols="50"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
      />
      <br />
      <button onClick={sendFreeText} disabled={loading}>
        {loading ? "Sending..." : "Send"}
      </button>

      <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
        <div style={{ marginBottom: "0.5rem" }}>
          <label>
            <input
              type="radio"
              name="mode"
              value="zip"
              checked={mode === "zip"}
              onChange={() => setMode("zip")}
            />
            Search by ZIP code
          </label>{" "}
          <label>
            <input
              type="radio"
              name="mode"
              value="city"
              checked={mode === "city"}
              onChange={() => setMode("city")}
            />
            Search by City & State
          </label>
        </div>

        {mode === "zip" ? (
          <div style={{ marginBottom: "0.5rem" }}>
            <input
              type="text"
              placeholder="ZIP code (5 digits)"
              value={zipcode}
              onChange={(e) => setZipcode(e.target.value)}
              maxLength={5}
            />
          </div>
        ) : (
          <div style={{ marginBottom: "0.5rem" }}>
            <input
              type="text"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={{ marginRight: "0.5rem" }}
            />
            <input
              type="text"
              placeholder="State (e.g. CA)"
              value={regionState}
              onChange={(e) => setRegionState(e.target.value)}
              style={{ width: "80px" }}
            />
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Submit"}
        </button>
      </form>
    </div>
  );
}

export default App;
