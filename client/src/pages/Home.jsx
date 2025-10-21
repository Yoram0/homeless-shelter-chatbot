import { Link } from "react-router-dom";
import "../Components/Home.css";

export default function Home() {
  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <h1>Find Safe Shelter & Services Fast</h1>
          <p className="subtitle">
            Get clear, up-to-date info on nearby shelters
          </p>

          <div className="cta-row">
            <Link
              to="/chatbot"
              className="btn-primary"
              aria-label="Open chatbot to find shelters"
            >
              Find Shelter
            </Link>
          </div>

          <ul className="trust-points" aria-label="Key highlights">
            <li>Free</li>
            <li>No account required</li>
            <li>Privacy-first</li>
          </ul>
        </div>
      </section>

      {/* Feature cards */}
      <section className="features" aria-labelledby="features-title">
        <h2 id="features-title">Why use Shelter Finder?</h2>
        <div className="grid">
          <article className="card">
            <div className="icon" aria-hidden>
              💬
            </div>
            <h3>Plain-language chat</h3>
            <p>
              Ask for help like you’d text a friend. We’ll handle the filters
              and details.
            </p>
          </article>

          <article className="card">
            <div className="icon" aria-hidden>
              📍
            </div>
            <h3>Location aware</h3>
            <p>
              Share a ZIP code (or use your device location) to see nearby
              services.
            </p>
          </article>

          <article className="card">
            <div className="icon" aria-hidden>
              🕘
            </div>
            <h3>Up-to-date info</h3>
            <p>
              Hours, requirements, and special rules—summarized clearly before
              you go.
            </p>
          </article>

          <article className="card">
            <div className="icon" aria-hidden>
              ♿
            </div>
            <h3>Accessible by design</h3>
            <p>Keyboard friendly, high contrast, and readable on any device.</p>
          </article>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="how">
        <h2>How it works</h2>
        <ol className="steps">
          <li>
            <span className="step-num">1</span>
            Tell us your city or ZIP.
          </li>
          <li>
            <span className="step-num">2</span>
            Say your needs (pets, no ID, timing, capacity).
          </li>
          <li>
            <span className="step-num">3</span>
            Get a short list with directions and requirements.
          </li>
        </ol>

        <Link to="/chatbot" className="btn-primary btn-center">
          Start the chatbot
        </Link>
      </section>

      {/* Footer / small print */}
      <footer className="footer" role="contentinfo">
        <p>
          Information is provided as a best-effort resource and may change
          without notice. Always call ahead when possible.
        </p>
      </footer>
    </div>
  );
}
