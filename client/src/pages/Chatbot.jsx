import { useEffect, useRef, useState } from "react";
import ChatMessage from "../components/ChatMessage";
import ChatInput from "../components/ChatInput";
import { cleanInput } from "../utils/inputCleaner";
import "../components/Chat.css";

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

export default function Chatbot() {
  const [messages, setMessages] = useState([
    {
      id: "m0",
      role: "assistant",
      text: "Hi, I’m here to listen and support you. What’s on your mind today?",
    },
  ]);

  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState("");
  const [conversationHistory, setConversationHistory] = useState([
    {
      role: "assistant",
      content:
        "Hi, I’m here to listen and support you. What’s on your mind today?",
    },
  ]);
  const scrollerRef = useRef(null);
  const [nextSummaryAt, setNextSummaryAt] = useState(5);

  const MAX_TURNS = 5; // keep last 5 user+assistant pairs

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  function getLimitedHistory(historyArray) {
    const systemMessages = historyArray.filter((m) => m.role === "system");
    const nonSystem = historyArray.filter((m) => m.role !== "system");
    const limited = nonSystem.slice(-MAX_TURNS * 2); // each turn has 2 messages
    return [...systemMessages, ...limited];
  }

  async function sendMessage(userText) {
    if (!userText.trim()) return;
    setError("");
    setIsTyping(true);

    const cleaned = cleanInput(userText);

    // Add user message to UI + history
    const userMsg = { id: crypto.randomUUID(), role: "user", text: cleaned };
    setMessages((m) => [...m, userMsg]);
    const newHistory = [
      ...conversationHistory,
      { role: "user", content: cleaned },
    ];

    let updatedHistory = newHistory;

    // Summarize every 5 messages
    if (messages.length >= nextSummaryAt) {
      const summary = await summarizeHistory(newHistory);
      updatedHistory = [
        { role: "system", content: summary },
        { role: "user", content: cleaned },
      ];
      setNextSummaryAt(nextSummaryAt + 1);
    }

    setConversationHistory(updatedHistory);

    try {
      const limitedHistory = getLimitedHistory(updatedHistory);

      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: limitedHistory }),
      });

      // Debug logs
      console.log("Raw response object:", res);

      if (!res.ok) throw new Error(`Server responded ${res.status}`);

      const rawText = await res.text();
      console.log("Raw response body:", rawText);

      let data = JSON.parse(rawText);
      console.log("Backend response JSON:", data);

      let reply = (data.reply || "").trim();
      console.log("Final reply:", reply);

      if (!reply) reply = "No response received.";

      const botMsg = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: reply,
      };
      setMessages((m) => [...m, botMsg]);
      setConversationHistory((prev) => [
        ...prev,
        { role: "assistant", content: reply },
      ]);
    } catch (e) {
      console.error("Error in sendMessage:", e);
      setError("Sorry, I couldn't reach the server. Please try again.");
      const botMsg = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: "I'm having trouble connecting right now. Please try again in a moment.",
      };
      setMessages((m) => [...m, botMsg]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <div className="chat-page">
      <header className="chat-header">
        <h1>Find Shelter</h1>
        <p>
          Ask about shelters by city, ZIP, or needs (pets, no ID, 24/7, etc.).
        </p>
      </header>

      <section className="chat-panel">
        <div
          className="chat-scroll"
          ref={scrollerRef}
          aria-live="polite"
          aria-busy={isTyping}
        >
          {messages.map((m) => (
            <ChatMessage key={m.id} role={m.role} text={m.text} />
          ))}
          {isTyping && (
            <div className="msg bot">
              <div className="bubble typing">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}
        </div>
        <ChatInput onSend={sendMessage} disabled={isTyping} />
        {error && (
          <div className="chat-error" role="alert">
            {error}
          </div>
        )}
      </section>
    </div>
  );
}

// Summarize history for more efficient memory
async function summarizeHistory(historyArray) {
  const textTranscript = historyArray
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");
  try {
    const res = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You are a summarization engine. Summarize the following conversation in 2–3 sentences for internal memory use only.",
          },
          { role: "user", content: textTranscript },
        ],
      }),
    });
    const rawText = await res.text();
    let data = JSON.parse(rawText);
    let summary = (data.reply || "").trim();
    return summary;
  } catch (e) {
    console.error("Failed to summarize:", e);
    return textTranscript; // fallback
  }
}
