// NOTE:  Only main components will be integrated to main project.
//        Most is temporary and will have to be modified or changed.

import { useState } from "react"; // Use State import to manage component states
import "./App.css"; // CSS import
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Chatbot from "./pages/Chatbot";
import NavBar from "./Components/NavBar";
import { cleanInput } from "./utils/inputCleaner";
import Resources from "./pages/Resources";

function App() {
  // re-add free-text input state for the original chatbot UI
  const [input, setInput] = useState("");

  const [chatlog, setChatlog] = useState([]); // State to store the chat history
  const [loading, setLoading] = useState(false); // State to see if message is being sent
  // const [conversationHistory, setConversationHistory] = useState("");

  // New form states
  const [mode, setMode] = useState("zip"); // "zip" or "city"
  const [zipcode, setZipcode] = useState("");
  const [city, setCity] = useState("");
  const [regionState, setRegionState] = useState("");

  
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
          <Route path="/resources" element={<Resources />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
