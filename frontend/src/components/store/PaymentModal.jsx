import { X } from "lucide-react";

export default function PaymentModal({ open, onClose, item, config, currency }) {
  if (!item) return null;
  const inr = Number(item.price_inr).toFixed(2);
  const upiString =
    `upi://pay?pa=${encodeURIComponent(config?.upi_id || "shiekhjeet19@fam")}` +
    `&pn=${encodeURIComponent(config?.payee_name || "Shiekh Jeet")}` +
    `&am=${inr}&cu=INR&tn=${encodeURIComponent(item.name)}`;
  const generatedQr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiString)}`;
  const qrSrc = config?.qr_image_url || generatedQr;

  const display =
    currency === "USD"
      ? `$${(Number(item.price_inr) * (config?.usd_rate || 0.012)).toFixed(2)}`
      : `₹${inr}`;

  return (
    <div className={`payment-modal ${open ? "open" : ""}`} onClick={onClose} data-testid="payment-modal">
      <div className="payment-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="payment-head">
          <div>
            <div className="panel-tag">Scan &amp; pay</div>
            <h2 style={{ margin: ".35rem 0 0", fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: ".06em", fontSize: "1.4rem" }}>
              Complete your purchase
            </h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close" data-testid="close-payment-btn">
            <X size={18} />
          </button>
        </div>

        <div className="payment-mini" style={{ marginTop: "1rem" }}>
          <strong data-testid="payment-item">{item.name}</strong>
          <p style={{ margin: ".35rem 0 0", color: "var(--muted)" }} data-testid="payment-amount">
            Pay <strong style={{ color: "var(--green-2)" }}>₹{inr}</strong> via UPI
            {currency === "USD" && <span style={{ color: "var(--faint)" }}> (≈ {display})</span>}
          </p>
        </div>

        <div className="qr-frame">
          <img src={qrSrc} alt={`UPI QR to pay for ${item.name}`} loading="lazy" data-testid="payment-qr" />
        </div>

        <div className="payment-grid">
          <div className="payment-mini">
            <strong>How to pay</strong>
            <p style={{ margin: ".35rem 0 0", color: "var(--muted)", fontSize: ".88rem" }}>
              Open any UPI app, scan the QR, pay the exact amount, then share the payment screenshot on Instagram to claim.
            </p>
          </div>
          <div className="payment-mini">
            <strong>UPI ID</strong>
            <p style={{ margin: ".35rem 0 0", color: "var(--green-2)", fontSize: ".9rem", wordBreak: "break-all" }}>
              {config?.upi_id || "shiekhjeet19@fam"}
            </p>
          </div>
        </div>

        <a
          className="button button-secondary"
          href={config?.instagram || "#"}
          target="_blank"
          rel="noopener noreferrer"
          style={{ width: "100%", marginTop: "1rem" }}
          data-testid="payment-instagram-btn"
        >
          Confirm on {config?.instagram_handle || "Instagram"}
        </a>
      </div>
    </div>
  );
}
