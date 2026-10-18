import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Check, X, AlertCircle } from "lucide-react";
import Public from "./Public";
import Rewards from "./Rewards";
import Dashboard from "./Dashboard";
import { ToastContext } from "./ui";
import { getStorageError } from "./services/demo";
import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/cormorant-garamond/latin-400-italic.css";
import "@fontsource/cormorant-garamond/latin-500.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "./styles.css";
function App() {
  const [hash, setHash] = useState(location.hash);
  const [toast, setToast] = useState("");
  useEffect(() => {
    function route() {
      setHash(location.hash);
      if (["#owner", "#rewards", "#home", ""].includes(location.hash))
        window.scrollTo(0, 0);
    }
    window.addEventListener("hashchange", route);
    return () => window.removeEventListener("hashchange", route);
  }, []);
  useEffect(() => {
    if (!["#owner", "#rewards", ""].includes(hash)) {
      const frame = requestAnimationFrame(() =>
        document
          .getElementById(hash.slice(1))
          ?.scrollIntoView({ behavior: "instant" }),
      );
      return () => cancelAnimationFrame(frame);
    }
  }, [hash]);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 6500);
    return () => clearTimeout(timeout);
  }, [toast]);
  const live =
    import.meta.env.VITE_DATA_MODE && import.meta.env.VITE_DATA_MODE !== "demo";
  return (
    <ToastContext.Provider value={setToast}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div id="main-content" tabIndex={-1}>
        {live ? (
          <div className="configuration-error">
            <AlertCircle size={32} />
            <h1>Live setup is not complete.</h1>
            <p>
              Live mode is deliberately blocked until the Firebase project,
              security rules, trusted operations and data adapters have been
              reviewed and connected.
            </p>
            <p>Please contact the website administrator for assistance.</p>
          </div>
        ) : hash === "#owner" ? (
          <Dashboard />
        ) : hash === "#rewards" ? (
          <Rewards />
        ) : (
          <Public />
        )}
      </div>
      {getStorageError() && (
        <div className="storage-error" role="alert">
          {getStorageError()}
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          <span>{toast}</span>
          <button
            className="icon-button"
            aria-label="Dismiss message"
            onClick={() => setToast("")}
          >
            <X size={17} />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
