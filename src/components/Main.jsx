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
          aria-label="Go to orders"
        >
          <MinnexLogo variant="customer" className="brand-mark" />
          <span>MINNEX</span>
        </button>

        <div className="top-bar-actions">
          <div className="view-switch" aria-label="Minnex views">
            <button onClick={openCart} type="button">
              <span className="cart-glyph" aria-hidden="true" />
              Cart
            </button>
          </div>
          <details className="menu-popover">
            <summary className="menu-trigger" aria-label="Open account menu">
              Account
            </summary>
            <div className="menu-panel">
              <span>{user.phoneNumber || user.email || "Signed in"}</span>
              <button onClick={() => setActiveTab("home")} type="button">
                Food
              </button>
              <button onClick={() => auth.signOut()} type="button">
                Logout
              </button>
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
