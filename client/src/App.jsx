// NOTE:  Only main components will be integrated to main project.
//        Most is temporary and will have to be modified or changed.


import { useState } from "react";   // Use State import to manage component states
import "./App.css";                 // CSS import

function App() {
  const [input, setInput] = useState("");           // State to hold user input
  const [chatlog, setChatlog] = useState([]);       // State to store the chat history
  const [loading, setLoading] = useState(false);    // State to see if message is being sent

  // Function to send user messages to the backend + updating chatlog
  const sendMessage = async () => {
  if (!input.trim()) return;          // Doesn't let the user send empty messages
  setLoading(true);                   // Shows loading while waiting for response

  const userMessage = input;
  setInput("");                       // Clears out the input box (convenience)

  // Send POST to Spring Boot with the user message
  try {
    const res = await fetch("http://localhost:8080/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: userMessage })
    });

    // Wait for JSON response and extract the actual chatbot reply
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "No response received.";   // Trims JSON response

    // Chatlog keeps track of both user and chatbot messages
    setChatlog((prev) => [
      ...prev,
      { role: "user", content: userMessage },
      { role: "assistant", content: reply }
    ]);

    // Handles errors and shows message
  } catch (err) {
    console.error(err);
    setChatlog((prev) => [
      ...prev,
      { role: "user", content: userMessage },
      { role: "assistant", content: "Error contacting chatbot." }
    ]);
  } finally {
    setLoading(false);    // Reset loading userState
  }
};

  // Actual chatbot interface layout (temporary)
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h2>WIP Chatbot</h2>

      {/* Chatlog display area with scrollable container */}
      <div style={{ marginBottom: "1rem", maxHeight: "300px", overflowY: "auto", border: "1px solid #ccc", padding: "1rem" }}>
        {chatlog.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: "0.5rem" }}>
            <strong>{msg.role === "user" ? "You" : "Bot"}:</strong> {msg.content}
          </div>
        ))}
      </div>
      {/* Text input for user message */}
      <textarea
        rows="4"
        cols="50"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
      />
      <br />
      {/* Send button, disabled while loading (IMPORTANT)*/}
      <button onClick={sendMessage} disabled={loading}>
        {loading ? "Sending..." : "Send"}
      </button>
    </div>
  );
}

export default App;
