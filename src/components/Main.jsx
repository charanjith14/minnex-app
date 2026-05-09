import { useState } from "react";
import Home from "../Home.jsx";
import Track from "./Track.jsx";
import { auth } from "../firebase/config";
import MinnexLogo from "./MinnexLogo.jsx";

export default function Main({ user }) {
  const [activeTab, setActiveTab] = useState("home");
  const [cartRequest, setCartRequest] = useState(0);

  const openTrackAfterOrder = () => {
    setActiveTab("track");
  };

  const openCart = () => {
    setActiveTab("home");
    setCartRequest((request) => request + 1);
  };

  return (
    <div className="app-shell">
      <header className="top-bar">
        <button
          className="brand-lockup"
          onClick={() => setActiveTab("home")}
          type="button"
          aria-label="Go to home"
        >
          <MinnexLogo variant="customer" className="brand-mark" />
          <span className="brand-lockup-name">MINNEX</span>
        </button>

        <div className="top-bar-actions">
          <button
            className={`nav-pill-btn ${activeTab === "home" ? "is-active" : ""}`}
            onClick={() => setActiveTab("home")}
            type="button"
          >
            🍽 Order
          </button>
          <button
            className={`nav-pill-btn ${activeTab === "track" ? "is-active" : ""}`}
            onClick={() => setActiveTab("track")}
            type="button"
          >
            📦 Track
          </button>
          <button className="cart-pill-btn" onClick={openCart} type="button" aria-label="View cart">
            <span className="cart-glyph" aria-hidden="true" />
            Cart
          </button>
          <details className="menu-popover">
            <summary className="menu-trigger" aria-label="Open account menu">
              <span className="menu-avatar">{(user.phoneNumber || "U").slice(-1)}</span>
            </summary>
            <div className="menu-panel">
              <span>{user.phoneNumber || user.email || "Signed in"}</span>
              <button onClick={() => setActiveTab("home")} type="button">🍽 Food</button>
              <button onClick={() => setActiveTab("track")} type="button">📦 Track order</button>
              <button onClick={() => auth.signOut()} type="button" className="menu-signout">🚪 Sign out</button>
            </div>
          </details>
        </div>
      </header>

      <main className="app-content">
        {activeTab === "home" ? (
          <Home
            user={user}
            goTrack={openTrackAfterOrder}
            onOrderPlaced={openTrackAfterOrder}
            cartRequest={cartRequest}
          />
        ) : (
          <Track user={user} />
        )}
      </main>
    </div>
  );
}
