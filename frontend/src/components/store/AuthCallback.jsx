import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Handles the OAuth redirect: exchanges session_id (URL fragment) for a session cookie.
export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash || "";
    const match = hash.match(/session_id=([^&]+)/);
    const sessionId = match ? match[1] : null;

    const run = async () => {
      if (!sessionId) {
        navigate("/", { replace: true });
        return;
      }
      try {
        const res = await axios.post(
          `${API}/auth/session`,
          {},
          { headers: { "X-Session-ID": sessionId }, withCredentials: true }
        );
        setUser(res.data);
      } catch (e) {
        // ignore, land on store anyway
      } finally {
        window.history.replaceState(null, "", window.location.pathname);
        navigate("/", { replace: true });
      }
    };
    run();
  }, [navigate, setUser]);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "var(--muted)" }}>
      <span data-testid="auth-processing">Signing you in…</span>
    </div>
  );
}
