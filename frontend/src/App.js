import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import Store from "@/pages/Store";
import RefundPolicy from "@/pages/RefundPolicy";
import AuthCallback from "@/components/store/AuthCallback";

function AppRouter() {
  const location = useLocation();
  // Process the OAuth session_id FIRST (synchronously during render) to avoid race conditions.
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/" element={<Store />} />
      <Route path="/refund" element={<RefundPolicy />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <AppRouter />
          <Toaster position="top-center" theme="dark" richColors />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
