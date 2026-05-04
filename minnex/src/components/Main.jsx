import { useState } from "react";
import Home from "../Home.jsx";
import Track from "./Track.jsx";
import { auth } from "../firebase/config";
import MinnexLogo from "./MinnexLogo.jsx";

const TABS = [
  { id: "home", label: "Order" },
  { id: "track", label: "Track" }
];

export default function Main({ user }) {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div className="app-shell">
      <header className="top-bar">
        <button
          className="brand-lockup"
          onClick={() => setActiveTab("home")}
          type="button"
          aria-label="Go to orders"
        >
          <MinnexLogo variant="customer" className="brand-mark" />
          <span>MINNEX</span>
        </button>

        <div className="top-bar-actions">
          <div className="view-switch" aria-label="Minnex views">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={activeTab === tab.id ? "is-active" : ""}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
          <details className="menu-popover">
            <summary className="menu-trigger">Menu</summary>
            <div className="menu-panel">
              <span>{user.phoneNumber || user.email || "Signed in"}</span>
              <span>Customer app only</span>
              <button onClick={() => auth.signOut()} type="button">
                Logout
              </button>
            </div>
          </details>
        </div>
      </header>

      <main className="app-content">
        {activeTab === "home" ? (
          <Home user={user} goTrack={() => setActiveTab("track")} />
        ) : (
          <Track user={user} />
        )}
      </main>

      <nav className="bottom-nav" aria-label="Primary navigation">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`nav-button ${activeTab === tab.id ? "is-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            <span className="nav-dot" />
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
