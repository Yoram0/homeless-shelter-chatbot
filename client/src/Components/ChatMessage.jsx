export default function ChatMessage({ role, text }) {
  const isUser = role === "user";
  return (
    <div className={`msg ${isUser ? "user" : "bot"}`}>
      <div className="bubble" role="text">
        {text}
      </div>
    </div>
  );
}
