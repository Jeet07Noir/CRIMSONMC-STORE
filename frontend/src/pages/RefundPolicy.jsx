import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, ShieldCheck } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO = "/server-icon.png";

export default function RefundPolicy() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    axios.get(`${API}/config`).then((r) => setConfig(r.data)).catch(() => {});
    window.scrollTo(0, 0);
  }, []);

  const instagram = config?.instagram || "https://instagram.com/Crimsonmc.in";
  const handle = config?.instagram_handle || "@Crimsonmc.in";

  return (
    <div className="page-shell" data-testid="refund-policy-page">
      <div className="particles" aria-hidden="true" />

      <header className="site-header">
        <div className="container nav">
          <Link to="/" className="brand" data-testid="policy-home-link">
            <img src={LOGO} alt="CrimsonMC logo" className="brand-mark brand-logo" />
            <div className="brand-text">
              <strong>{config?.brand || "CrimsonMC"}</strong>
              <span>{config?.tagline || "Luxury Lava Store"}</span>
            </div>
          </Link>
          <Link to="/" className="button button-secondary" data-testid="back-to-store-btn">
            <ArrowLeft size={16} /> Back to store
          </Link>
        </div>
      </header>

      <main id="main" className="container" style={{ maxWidth: "820px", padding: "3rem 0 4rem" }}>
        <span className="eyebrow">Policy</span>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2rem,5vw,3rem)",
            textTransform: "uppercase",
            letterSpacing: ".04em",
            margin: "1rem 0 .5rem",
          }}
          data-testid="refund-title"
        >
          Refund Policy
        </h1>
        <p style={{ color: "var(--muted)", margin: 0 }}>
          Last updated: December 2025 · CrimsonMC ({config?.server_ip || "play.crimsonmc.in:25569"})
        </p>

        <div className="policy-highlight" data-testid="refund-48hr">
          <ShieldCheck size={22} />
          <div>
            <strong>48-Hour Refund Guarantee on Ranks</strong>
            <p>
              If you purchase any <b>rank</b> from the CrimsonMC store, you are eligible for a full refund
              <b> within 48 hours</b> of the purchase — no questions asked, as long as the conditions below are met.
            </p>
          </div>
        </div>

        <section className="policy-block">
          <h2>1. Eligibility — Ranks (48 Hours)</h2>
          <p>
            Any rank purchased on the CrimsonMC store can be refunded if the refund request is raised within
            <b> 48 hours</b> of the successful payment. To qualify:
          </p>
          <ul>
            <li>The request must be made within 48 hours of purchase (based on the payment timestamp).</li>
            <li>You must provide valid proof of payment (UPI transaction ID / screenshot).</li>
            <li>The purchase must have been made through our official store and UPI details.</li>
            <li>Refunds are issued to the original payment method.</li>
          </ul>
        </section>

        <section className="policy-block">
          <h2>2. How to Request a Refund</h2>
          <p>Refund requests are handled through our official Instagram. Please include the details below:</p>
          <ul>
            <li>Your in-game username (IGN).</li>
            <li>The rank purchased and the amount paid.</li>
            <li>UPI transaction ID and payment screenshot.</li>
            <li>The date &amp; time of purchase.</li>
          </ul>
          <a className="button button-secondary" href={instagram} target="_blank" rel="noopener noreferrer" style={{ marginTop: ".8rem" }} data-testid="refund-contact-btn">
            Request via {handle}
          </a>
        </section>

        <section className="policy-block">
          <h2>3. Processing Time</h2>
          <p>
            Approved refunds are typically processed within <b>3–5 business days</b> after verification. The time it
            takes to reflect in your account depends on your bank or UPI provider.
          </p>
        </section>

        <section className="policy-block">
          <h2>4. Non-Refundable Items &amp; Conditions</h2>
          <ul>
            <li>Requests made <b>after 48 hours</b> from the time of purchase.</li>
            <li>Crate <b>keys</b> and event/limited-time items once used or opened.</li>
            <li>Purchases where store rules or server rules were violated.</li>
            <li>Accounts banned for cheating, exploiting, or breaking server rules — perks are forfeited without refund.</li>
            <li>Chargebacks filed without contacting us first may result in a permanent ban.</li>
          </ul>
        </section>

        <section className="policy-block">
          <h2>5. Important Notes</h2>
          <ul>
            <li>Rank perks are delivered digitally and applied in-game after payment confirmation.</li>
            <li>Prices are shown in INR (with a USD viewing option); payments are collected in INR via UPI.</li>
            <li>CrimsonMC reserves the right to update this policy at any time; the latest version always applies.</li>
          </ul>
        </section>

        <div className="policy-footnote">
          Questions about a purchase or refund? Reach us on Instagram at{" "}
          <a href={instagram} target="_blank" rel="noopener noreferrer" style={{ color: "var(--green-2)" }}>{handle}</a>.
        </div>

        <div style={{ marginTop: "2rem" }}>
          <Link to="/" className="button button-primary" data-testid="refund-back-store-bottom">
            <ArrowLeft size={16} /> Back to store
          </Link>
        </div>
      </main>

      <footer className="footer">
        <div className="container" style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <span>{config?.brand || "CrimsonMC"} Store</span>
          <span>{config?.server_ip}</span>
        </div>
      </footer>
    </div>
  );
}
