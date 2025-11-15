import { useEffect, useRef, useState } from "react";
import ChatMessage from "../components/ChatMessage";
import ChatInput from "../components/ChatInput";
import { cleanInput } from "../utils/inputCleaner";
import "../components/Chat.css";

export default function Chatbot() {
  // Initial message and state
  const [messages, setMessages] = useState([
    {
      id: "m0",
      role: "assistant",
      text: "Hi! I can help you find nearby shelters. What city or ZIP code are you in?",
    },
  ]);

  const [isTyping, setIsTyping] = useState(false);                      // Typing state
  const [error, setError] = useState("");                               // Error state
  const [conversationHistory, setConversationHistory] = useState("");   // Conversation history for memory
  const scrollerRef = useRef(null);                                     // Auto-scroll
  const [nextSummaryAt, setNextSummaryAt] = useState(5);                // New memory approach

  // Auto-scroll to bottom when message or typing state changes
  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  // Main message handler
  async function sendMessage(userText) {
    if (!userText.trim()) return;
    setError("");
    setIsTyping(true);

    const cleaned = cleanInput(userText);                               // Clean input for security/privacy
    let updatedHistory = conversationHistory + `\nUser: ${cleaned}`;    // Append cleaned input to message history

    // Every 5 messages (excluding initial assistant): summarize history
    if (messages.length >= nextSummaryAt) {
      const summary = await summarizeHistory(updatedHistory);
      updatedHistory = summary + `\nUser: ${cleaned}`;
      setConversationHistory(summary);
      setNextSummaryAt(nextSummaryAt + 1);      // progressively increase interval
    } else {
      setConversationHistory(updatedHistory);
    }


    // Add user message to UI
    const userMsg = {
      id: crypto.randomUUID(),
      role: "user",
      text: cleaned,
    };
    setMessages((m) => [...m, userMsg]);

    try {
      // Send updated history to backend
      const res = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: updatedHistory }),
      });

      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();

      let reply = data.choices?.[0]?.message?.content || "No response received.";

      // Trim multi-turn hallucinations
      const hallucinationStart = reply.indexOf("\nUser:");
      if (hallucinationStart !== -1) {
        console.log("Trimming hallucinated continuation at index:", hallucinationStart);
        reply = reply.substring(0, hallucinationStart).trim();
      }

      // Remove "(Note: ...)" hallucinations
      const noteStart = reply.indexOf("(Note:");
      if (noteStart !== -1) {
        console.log("Trimming hallucinated note at index:", noteStart);
        reply = reply.substring(0, noteStart).trim();
      }

      reply = reply.trimStart();    // Remove leading spaces

      // Add chatbot message to UI
      const botMsg = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: reply,
      };

      // Update conversation history and message list
      setConversationHistory((prev) => prev + `\nAssistant: ${reply}`);
      setMessages((m) => [...m, botMsg]);

    } catch (e) {
      // Network error handling
      setError("Sorry, I couldn't reach the server. Please try again.");
      const botMsg = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: "I'm having trouble connecting right now. Please try again in a moment.",
      };
      setMessages((m) => [...m, botMsg]);
    } finally {
      setIsTyping(false);   // Reset typing state
    }
  }

  // Page layout
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
async function summarizeHistory(historyText) {
  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: `You are a summarization engine. Do not respond as a chatbot. Summarize the following conversation in 2–3 sentences for internal memory use only. Do not greet, advise, or offer help.\n\n${historyText}`,
      }),
    });

    if (!res.ok) throw new Error(`Summary failed: ${res.status}`);
    const data = await res.json();
    let summary = data.choices?.[0]?.message?.content || "";

    // Trim hallucinated continuation
    const hallucinationStart = summary.indexOf("\nUser:");
    if (hallucinationStart !== -1) {
      summary = summary.substring(0, hallucinationStart);
    }

    // Extract only the summary portion if it includes a marker
    const marker = "Previous conversation summary:";
    const markerIndex = summary.indexOf(marker);
    if (markerIndex !== -1) {
      summary = summary.substring(markerIndex + marker.length).trim();
    }

    summary = summary.trimStart();              // Remove leading whitespace
    console.log("Final summary:", summary);     // QA log
    return summary;
  } catch (e) {
    console.error("Failed to summarize:", e);
    return historyText;                         // Fallback to full history
  }
}
