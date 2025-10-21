// NOTE:  Only main components will be integrated to main project.
//        Most is temporary and will have to be modified or changed.

import { useState } from "react"; // Use State import to manage component states
import "./App.css"; // CSS import
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Chatbot from "./pages/Chatbot";
import NavBar from "./Components/NavBar";

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
      <NavBar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chatbot" element={<Chatbot />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
