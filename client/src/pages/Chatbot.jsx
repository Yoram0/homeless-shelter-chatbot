import { useEffect, useRef, useState } from "react";
import ChatMessage from "../components/ChatMessage";
import ChatInput from "../components/ChatInput";
import { cleanInput } from "../utils/inputCleaner";
import "../components/Chat.css";

export default function Chatbot() {
  const [messages, setMessages] = useState([
    {
      id: "m0",
      role: "assistant",
      text: "Hi! I can help you find nearby shelters. What city or ZIP code are you in?",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState("");
  const [conversationHistory, setConversationHistory] = useState("");
  const scrollerRef = useRef(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  async function sendMessage(userText) {
    if (!userText.trim()) return;
    setError("");
    setIsTyping(true);

    const cleaned = cleanInput(userText);
    const updatedHistory = conversationHistory + `\nUser: ${cleaned}`;
    setConversationHistory(updatedHistory);

    const userMsg = {
      id: crypto.randomUUID(),
      role: "user",
      text: cleaned,
    };
    setMessages((m) => [...m, userMsg]);

    try {
      const res = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: updatedHistory }),
      });

      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "No response received.";

      const botMsg = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: reply,
      };
      setConversationHistory((prev) => prev + `\nAssistant: ${reply}`);
      setMessages((m) => [...m, botMsg]);
    } catch (e) {
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
