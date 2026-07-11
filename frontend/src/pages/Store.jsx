import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Instagram, LogOut, Server, Zap, Copy, Check, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import PaymentModal from "@/components/store/PaymentModal";
import { FALLBACK_CONFIG, FALLBACK_PRODUCTS } from "@/data/fallback";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO = "/server-icon.png";

const fmt = (product, currency, rate) =>
  currency === "USD"
    ? `$${(Number(product.price_inr) * (rate || 0.012)).toFixed(2)}`
    : `₹${Number(product.price_inr).toFixed(2)}`;

function BrandMark({ logo }) {
  if (logo) {
    return (
      <img
        src={logo}
        alt="CrimsonMC logo"
        className="brand-mark brand-logo"
        data-testid="brand-logo"
      />
    );
  }
  return (
    <div className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.5 4.5h-7a6.5 6.5 0 1 0 0 13h7"></path>
        <path d="M12 8.2c2 0 3.6 1.7 3.6 3.8S14 15.8 12 15.8"></path>
      </svg>
    </div>
  );
}

function ProductCard({ p, currency, rate, onBuy, index }) {
  const isBundle = p.includes && p.includes.length > 0;
  return (
    <motion.article
      className={`product-card ${p.featured ? "featured" : ""}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: (index % 6) * 0.06 }}
      data-testid={`product-card-${p.name.replace(/\s+/g, "-").toLowerCase()}`}
    >
      <div className="product-top">
        <span className="badge">{p.badge}</span>
        {p.featured && <span className="tag-glow">Featured</span>}
      </div>
      <div className="tier-name">{p.name}</div>
      <p className="tier-copy">{p.copy}</p>
      {isBundle && (
        <div className="bundle-includes">
          <span className="bundle-includes-label">Includes</span>
          <div className="bundle-chips">
            {p.includes.map((it, i) => <span key={i} className="tag-glow">{it}</span>)}
          </div>
        </div>
      )}
      <div className="price-row">
        <div className="price">
          <strong data-testid={`price-${p.name.replace(/\s+/g, "-").toLowerCase()}`}>{fmt(p, currency, rate)}</strong>
          <span>{currency}</span>
        </div>
        <span style={{ color: p.note ? "var(--green-2)" : "var(--muted)", fontSize: ".8rem", textAlign: "right" }}>
          {p.note || "Switch currency any time"}
        </span>
      </div>
      {!isBundle && (
        <ul className="perks">
          {p.perks.map((perk, i) => <li key={i}>{perk}</li>)}
        </ul>
      )}
      {isBundle && <div style={{ flex: 1 }} />}
      <button
        className="button button-primary"
        style={{ width: "100%" }}
        onClick={() => onBuy(p)}
        data-testid={`buy-${p.name.replace(/\s+/g, "-").toLowerCase()}`}
      >
        Buy {p.name}
      </button>
    </motion.article>
  );
}

function StoreControls({ currency, setCurrency, sort, setSort, idPrefix }) {
  return (
    <div className="control-group">
      <div className="toggle-pill" role="tablist" aria-label="Currency">
        <button className={currency === "INR" ? "active" : ""} onClick={() => setCurrency("INR")} data-testid={`${idPrefix}-currency-inr`}>INR</button>
        <button className={currency === "USD" ? "active" : ""} onClick={() => setCurrency("USD")} data-testid={`${idPrefix}-currency-usd`}>USD</button>
      </div>
      <div className="toggle-pill" role="tablist" aria-label="Sort by price">
        <button className={sort === "default" ? "active" : ""} onClick={() => setSort("default")} data-testid={`${idPrefix}-sort-default`}>Featured</button>
        <button className={sort === "asc" ? "active" : ""} onClick={() => setSort("asc")} data-testid={`${idPrefix}-sort-asc`}>Price ↑</button>
        <button className={sort === "desc" ? "active" : ""} onClick={() => setSort("desc")} data-testid={`${idPrefix}-sort-desc`}>Price ↓</button>
      </div>
    </div>
  );
}

export default function Store() {
  const { user, login, logout } = useAuth();
  const [config, setConfig] = useState(null);
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState(null);
  const [currency, setCurrency] = useState("INR");
  const [sort, setSort] = useState("default");
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const copyIp = async () => {
    const ip = config?.server_ip || "play.crimsonmc.in:25569";
    try {
      await navigator.clipboard.writeText(ip);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = ip;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    toast.success("Server IP copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    axios.get(`${API}/config`)
      .then((r) => setConfig(r.data && Object.keys(r.data).length ? r.data : FALLBACK_CONFIG))
      .catch(() => setConfig(FALLBACK_CONFIG));
    axios.get(`${API}/products`)
      .then((r) => setProducts(Array.isArray(r.data) && r.data.length ? r.data : FALLBACK_PRODUCTS))
      .catch(() => setProducts(FALLBACK_PRODUCTS));
  }, []);

  // Live status fetched directly from the public Minecraft status API (CORS-enabled),
  // so it works even when the backend is not deployed.
  const fetchStatus = useCallback(async (host, port) => {
    try {
      const res = await fetch(`https://api.mcsrvstat.us/2/${host}:${port}`);
      const d = await res.json();
      setStatus({
        online: !!d.online,
        players_online: d.players?.online || 0,
        players_max: d.players?.max || 0,
        version: d.version || null,
      });
    } catch (e) {
      setStatus({ online: false, players_online: 0, players_max: 0, unavailable: true });
    }
  }, []);

  useEffect(() => {
    const host = config?.server_host || "play.crimsonmc.in";
    const port = config?.server_port || 25569;
    fetchStatus(host, port);
  }, [config, fetchStatus]);

  const applySort = useCallback((list) => {
    if (sort === "asc") return [...list].sort((a, b) => a.price_inr - b.price_inr);
    if (sort === "desc") return [...list].sort((a, b) => b.price_inr - a.price_inr);
    return list;
  }, [sort]);

  const ranks = useMemo(() => applySort(products.filter((p) => p.category === "rank")), [products, applySort]);
  const keys = useMemo(() => applySort(products.filter((p) => p.category === "key")), [products, applySort]);
  const bundles = useMemo(() => applySort(products.filter((p) => p.category === "bundle")), [products, applySort]);
  const rate = config?.usd_rate || 0.012;
  const featured = products.find((r) => r.category === "rank" && r.featured) || ranks[0];

  const handleBuy = async (p) => {
    setSelected(p);
    setModalOpen(true);
    try {
      await axios.post(`${API}/orders`, { item: p.name, price_inr: p.price_inr, currency }, { withCredentials: true });
    } catch (e) { /* order logging is best-effort */ }
    toast.success(`Scan the QR to buy ${p.name}`);
  };

  return (
    <div className="page-shell">
      <div className="particles" aria-hidden="true" />

      {/* Header */}
      <header className="site-header">
        <div className="container nav">
          <div className="brand">
            <BrandMark logo={LOGO} />
            <div className="brand-text">
              <strong>{config?.brand || "CrimsonMC"}</strong>
              <span>{config?.tagline || "Luxury Lava Store"}</span>
            </div>
          </div>
          <nav className="nav-links" aria-label="Primary">
            <a href="#ranks" className="hide-sm">Ranks</a>
            <a href="#keys" className="hide-sm">Keys</a>
            <a href="#bundles" className="hide-sm">Bundles</a>
            <a href="#server" className="hide-sm">Live</a>
            <Link to="/refund" className="hide-sm" data-testid="nav-refund-link">Refund Policy</Link>
            <a href={config?.instagram || "#"} target="_blank" rel="noopener noreferrer" className="hide-sm">Instagram</a>
            <div className="auth-actions hide-sm">
              {user ? (
                <div style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
                  {user.picture && <img className="avatar" src={user.picture} alt={user.name} data-testid="user-avatar" />}
                  <button className="button button-ghost" onClick={logout} data-testid="logout-btn">
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              ) : (
                <button className="button button-primary" onClick={login} data-testid="login-btn">
                  Sign in
                </button>
              )}
            </div>
            <button className="menu-toggle show-sm" onClick={() => setMenuOpen(true)} aria-label="Open menu" data-testid="mobile-menu-btn">
              <Menu size={22} />
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="mobile-menu-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMenuOpen(false)}
            data-testid="mobile-menu"
          >
            <motion.nav
              className="mobile-menu"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mobile-menu-head">
                <span>Menu</span>
                <button className="icon-button" onClick={() => setMenuOpen(false)} aria-label="Close menu" data-testid="mobile-menu-close">
                  <X size={18} />
                </button>
              </div>
              <a href="#ranks" onClick={() => setMenuOpen(false)}>Ranks</a>
              <a href="#keys" onClick={() => setMenuOpen(false)}>Keys</a>
              <a href="#bundles" onClick={() => setMenuOpen(false)}>Bundles</a>
              <a href="#server" onClick={() => setMenuOpen(false)}>Live Server</a>
              <Link to="/refund" onClick={() => setMenuOpen(false)} data-testid="mobile-refund-link">Refund Policy</Link>
              <a href={config?.instagram || "#"} target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}>Instagram</a>
              {user ? (
                <button className="button button-ghost" onClick={() => { logout(); setMenuOpen(false); }} data-testid="mobile-logout-btn">
                  <LogOut size={15} /> Logout
                </button>
              ) : (
                <button className="button button-primary" onClick={() => { login(); setMenuOpen(false); }} data-testid="mobile-login-btn">
                  Sign in
                </button>
              )}
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      <main id="main">
        {/* Hero */}
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <img src={LOGO} alt="CrimsonMC logo" className="hero-logo" data-testid="hero-logo" />
              <span className="eyebrow">Premium Minecraft Store • Multi-Currency</span>
              <h1>{config?.hero_title || "Rule the CrimsonMC"}</h1>
              <p>{config?.hero_subtitle}</p>
              <div className="hero-actions">
                <a className="button button-primary" href="#ranks" data-testid="hero-ranks-btn">View ranks</a>
                <a className="button button-secondary" href="#keys" data-testid="hero-keys-btn">See keys</a>
              </div>
              <div className="server-bar">
                <div className="stat-card">
                  <small>Server IP</small>
                  <div className="ip-row">
                    <strong data-testid="server-ip">{config?.server_ip || "play.crimsonmc.in:25569"}</strong>
                    <button className="copy-btn" onClick={copyIp} aria-label="Copy server IP" data-testid="copy-ip-btn">
                      {copied ? <Check size={15} /> : <Copy size={15} />}
                    </button>
                  </div>
                </div>
                <div className="stat-card">
                  <small>Players online</small>
                  <strong data-testid="players-online">
                    <span className={`status-dot ${status?.online ? "on" : "off"}`} style={{ marginRight: 8 }} />
                    {status ? (status.unavailable ? "N/A" : (status.online ? `${status.players_online}/${status.players_max}` : "Offline")) : "…"}
                  </strong>
                </div>
                <div className="stat-card">
                  <small>Primary social</small>
                  <strong>{config?.instagram_handle || "@Crimsonmc.in"}</strong>
                </div>
              </div>
            </div>

            <aside className="hero-panel" aria-label="Store preview">
              <div className="panel-top">
                <div>
                  <div className="panel-tag">Featured rank</div>
                  <h2 style={{ margin: ".25rem 0 0", fontSize: "1.5rem", fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                    {featured?.name || "Habibi"}
                  </h2>
                </div>
                <span className="tag-glow">Most premium</span>
              </div>
              <div className="panel-box">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "1rem" }}>
                  <div>
                    <div style={{ fontSize: ".72rem", color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".18em" }}>Current display</div>
                    <div style={{ fontSize: "2rem", fontWeight: 800, marginTop: ".25rem" }} data-testid="hero-price">
                      {featured ? fmt(featured, currency, rate) : "—"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: ".72rem", color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".18em" }}>Currency</div>
                    <div style={{ fontWeight: 700, marginTop: ".25rem" }}>{currency}</div>
                  </div>
                </div>
              </div>
              <div className="panel-box">
                <strong style={{ display: "block", marginBottom: ".45rem" }}>Included look &amp; feel</strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: ".55rem" }}>
                  <span className="tag-glow">Hover glow</span>
                  <span className="tag-glow">Particles</span>
                  <span className="tag-glow">Live status</span>
                  <span className="tag-glow">QR checkout</span>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* Ranks */}
        <section className="section container" id="ranks">
          <div className="section-head">
            <div>
              <h2>Ranks</h2>
              <p>Premium progression tiers with separate INR and USD viewing modes.</p>
            </div>
            <StoreControls currency={currency} setCurrency={setCurrency} sort={sort} setSort={setSort} idPrefix="ranks" />
          </div>
          <div className="grid" id="ranksGrid">
            {ranks.map((p, i) => (
              <ProductCard key={p.id} p={p} currency={currency} rate={rate} onBuy={handleBuy} index={i} />
            ))}
          </div>
        </section>

        {/* Keys */}
        <section className="section container" id="keys">
          <div className="section-head">
            <div>
              <h2>Keys</h2>
              <p>Event-ready crate keys and premium unlocks for featured drops.</p>
            </div>
            <div style={{ display: "flex", gap: ".8rem", alignItems: "center", flexWrap: "wrap" }}>
              <span className="badge">Common key is event based</span>
              <StoreControls currency={currency} setCurrency={setCurrency} sort={sort} setSort={setSort} idPrefix="keys" />
            </div>
          </div>
          <div className="grid" id="keysGrid">
            {keys.map((p, i) => (
              <ProductCard key={p.id} p={p} currency={currency} rate={rate} onBuy={handleBuy} index={i} />
            ))}
          </div>
        </section>

        {/* Bundles */}
        <section className="section container" id="bundles">
          <div className="section-head">
            <div>
              <h2>Bundles</h2>
              <p>Curated rank &amp; crate combos — premium value packs that save you more.</p>
            </div>
            <StoreControls currency={currency} setCurrency={setCurrency} sort={sort} setSort={setSort} idPrefix="bundles" />
          </div>
          <div className="grid">
            {bundles.map((p, i) => (
              <ProductCard key={p.id} p={p} currency={currency} rate={rate} onBuy={handleBuy} index={i} />
            ))}
          </div>
        </section>

        {/* Live Server Analytics */}
        <section className="section container" id="server">
          <div className="section-head">
            <div>
              <h2>Live Server</h2>
              <p>Real-time analytics pulled directly from {config?.server_ip || "play.crimsonmc.in:25569"}.</p>
            </div>
            <button
              className="button button-secondary"
              onClick={() => fetchStatus(config?.server_host || "play.crimsonmc.in", config?.server_port || 25569)}
              data-testid="refresh-status-btn"
            >
              <Server size={15} /> Refresh
            </button>
          </div>
          <div className="grid server-grid">
            <div className="product-card" data-testid="status-online">
              <div className="product-top">
                <span className="badge">Status</span>
                <span className={`status-dot ${status?.online ? "on" : "off"}`} />
              </div>
              <div className="tier-name" style={{ color: status?.online ? "var(--green-2)" : "var(--crimson-2)" }}>
                {status ? (status.unavailable ? "N/A" : (status.online ? "ONLINE" : "OFFLINE")) : "…"}
              </div>
              <p className="tier-copy" style={{ minHeight: "auto" }}>Current server availability.</p>
            </div>
            <div className="product-card" data-testid="status-players">
              <div className="product-top"><span className="badge">Players</span></div>
              <div className="tier-name">
                {status ? (status.unavailable ? "N/A" : `${status.players_online}/${status.players_max}`) : "…"}
              </div>
              <p className="tier-copy" style={{ minHeight: "auto" }}>Players currently online.</p>
            </div>
            <div className="product-card" data-testid="status-version">
              <div className="product-top"><span className="badge">Version</span></div>
              <div className="tier-name" style={{ fontSize: "1.15rem" }}>{status?.version || "—"}</div>
              <p className="tier-copy" style={{ minHeight: "auto" }}>Running Minecraft build.</p>
            </div>
            <div className="product-card" data-testid="status-ip">
              <div className="product-top"><span className="badge">Connect</span></div>
              <div className="tier-name" style={{ fontSize: "1.05rem", wordBreak: "break-all" }}>{config?.server_ip}</div>
              <button className="button button-secondary" style={{ width: "100%", marginTop: ".4rem" }} onClick={copyIp} data-testid="copy-ip-btn-2">
                {copied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy IP</>}
              </button>
            </div>
          </div>
        </section>

        {/* Extras */}
        <section className="container extras">
          <div id="future" className="social-box">
            <span className="eyebrow">Future expansion</span>
            <h2 style={{ margin: "1rem 0 .75rem", fontFamily: "var(--font-display)", fontSize: "clamp(1.6rem,4vw,2.4rem)", textTransform: "uppercase", letterSpacing: ".06em" }}>
              Bundles, flash sales &amp; event drops
            </h2>
            <p style={{ color: "var(--muted)", margin: 0 }}>
              The bundles area is planned into the design, so combo packs, sale banners, and limited-time offers can be added without redesigning the page.
            </p>
            <div className="future-grid">
              <div className="mini-card"><strong>Combo bundle slots</strong><p style={{ margin: ".45rem 0 0", color: "var(--muted)" }}>Starter combo, PvP upgrade & royal crate packs.</p></div>
              <div className="mini-card"><strong>Countdown banner ready</strong><p style={{ margin: ".45rem 0 0", color: "var(--muted)" }}>For key-all events, rank sales & festive drops.</p></div>
              <div className="mini-card"><strong><Zap size={14} style={{ display: "inline", verticalAlign: "middle" }} /> QR payment ready</strong><p style={{ margin: ".45rem 0 0", color: "var(--muted)" }}>Every buy button opens a scan-and-pay flow.</p></div>
              <div className="mini-card"><strong><Server size={14} style={{ display: "inline", verticalAlign: "middle" }} /> Live status</strong><p style={{ margin: ".45rem 0 0", color: "var(--muted)" }}>Real player count from your Minecraft server.</p></div>
            </div>
          </div>
          <aside className="social-box">
            <span className="eyebrow">Contact</span>
            <h2 style={{ margin: "1rem 0 .6rem", fontFamily: "var(--font-display)", fontSize: "2rem", textTransform: "uppercase", letterSpacing: ".06em" }}>Instagram first</h2>
            <p style={{ color: "var(--muted)", margin: "0 0 1rem" }}>The store points visitors to Instagram to confirm purchases and get support.</p>
            <a className="button button-secondary" href={config?.instagram || "#"} target="_blank" rel="noopener noreferrer" style={{ width: "100%" }} data-testid="contact-instagram-btn">
              <Instagram size={16} /> Open {config?.instagram_handle || "@Crimsonmc.in"}
            </a>
            <div className="panel-box" style={{ marginTop: "1rem" }}>
              <strong style={{ display: "block", marginBottom: ".4rem" }}>Included</strong>
              <ul className="perks" style={{ margin: 0 }}>
                <li>Luxury crimson-green lava mood.</li>
                <li>Featured cards & hover lift animations.</li>
                <li>Mobile-friendly layout.</li>
                <li>Live server status & QR checkout.</li>
              </ul>
            </div>
          </aside>
        </section>
      </main>

      <footer className="footer">
        <div className="container" style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <span>{config?.brand || "CrimsonMC"} Store</span>
          <div style={{ display: "flex", gap: "1.2rem", alignItems: "center" }}>
            <Link to="/refund" data-testid="footer-refund-link">Refund Policy</Link>
            <span>{config?.server_ip}</span>
          </div>
        </div>
      </footer>

      <PaymentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        item={selected}
        config={config}
        currency={currency}
      />
    </div>
  );
}
