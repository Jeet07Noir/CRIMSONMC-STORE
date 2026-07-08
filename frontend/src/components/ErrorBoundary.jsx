import React from "react";

// Prevents a silent blank page: if the app throws, show a readable message.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "Unexpected error" };
  }

  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          data-testid="error-boundary"
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "2rem",
            textAlign: "center",
            color: "#f5efea",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <div style={{ maxWidth: 480 }}>
            <h1 style={{ fontFamily: "'Cinzel', serif", color: "#e43657", marginBottom: ".5rem" }}>
              CrimsonMC
            </h1>
            <p style={{ color: "#b7aea8" }}>
              Something went wrong while loading the store. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: "1.2rem",
                padding: ".7rem 1.4rem",
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                color: "#120306",
                background: "linear-gradient(120deg,#e43657,#b3122f)",
              }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
