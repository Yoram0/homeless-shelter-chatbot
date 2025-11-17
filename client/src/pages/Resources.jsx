import { useEffect, useRef, useState } from "react";
import "../Components/Resources.css";

export default function Resources() {
  const resources = [
    {
      id: "911",
      name: "Emergency — 911",
      desc: "If you or someone else is in immediate danger or a crime is in progress.",
      phone: "911",
      actions: [{ type: "call", label: "Call 911", href: "tel:911" }],
      badge: "Emergency",
    },
    {
      id: "988",
      name: "Suicide & Crisis Lifeline — 988",
      desc: "24/7 free, confidential support for suicidal thoughts, mental health, or substance use crises. Press 1 for Veterans; opción 2 para español.",
      phone: "988",
      actions: [
        { type: "call", label: "Call 988", href: "tel:988" },
        {
          type: "link",
          label: "Chat Online",
          href: "https://988lifeline.org/chat/",
        },
      ],
      badge: "24/7",
    },
    {
      id: "ndvh",
      name: "National Domestic Violence Hotline",
      desc: "24/7 confidential support for domestic violence, emotional abuse, stalking, and safety planning.",
      phone: "1-800-799-7233",
      actions: [
        {
          type: "call",
          label: "Call 1-800-799-SAFE",
          href: "tel:+18007997233",
        },
        {
          type: "sms",
          label: "Text START to 88788",
          href: "sms:88788?&body=START",
        },
        {
          type: "link",
          label: "Chat at thehotline.org",
          href: "https://www.thehotline.org/",
        },
      ],
      badge: "24/7",
    },
    {
      id: "211",
      name: "2-1-1 Community Resources",
      desc: "Find local shelter, food, healthcare, and other community services. Available in most U.S. regions.",
      phone: "211",
      actions: [
        { type: "call", label: "Call 2-1-1", href: "tel:211" },
        { type: "link", label: "Search 211.org", href: "https://www.211.org/" },
      ],
      badge: "Info",
    },
  ];

  return (
    <div className="resources-page">
      <header className="resources-header" role="banner">
        <h1>Resources</h1>
        <p className="subtitle">
          Quick access to trusted hotlines and services. Calls and chats are
          usually free and confidential.
        </p>
        <div className="emergency-banner" aria-live="polite">
          <strong>In immediate danger?</strong>{" "}
          <a href="tel:911">Call 911 now</a>.
        </div>
      </header>

      <section
        className="resources-grid"
        aria-label="Emergency and support services"
      >
        {resources.map((r) => (
          <article className="resource-card" key={r.id}>
            <div className="card-top">
              <span
                className={`badge badge-${(r.badge || "info").toLowerCase()}`}
              >
                {r.badge}
              </span>
              <h2>{r.name}</h2>
              {r.phone && <p className="phone">Phone: {r.phone}</p>}
              <p className="desc">{r.desc}</p>
            </div>

            <div className="card-actions">
              {r.actions.map((a, i) => {
                const common = {
                  key: `${r.id}-${i}`,
                  href: a.href,
                  target: a.type === "link" ? "_blank" : undefined,
                  rel: a.type === "link" ? "noopener noreferrer" : undefined,
                  className: `btn ${a.type}`,
                  "aria-label": a.label,
                };
                return <a {...common}>{a.label}</a>;
              })}
            </div>
          </article>
        ))}
      </section>

      <footer className="resources-footer">
        <p>
          Note: If dialing short codes like <strong>988</strong> or{" "}
          <strong>211</strong> doesn’t work on your phone, try calling their
          full numbers from the links above.
        </p>
      </footer>
    </div>
  );
}
