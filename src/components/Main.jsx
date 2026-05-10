import { useState } from "react";
import Home from "../Home.jsx";
import Track from "./Track.jsx";
import { auth } from "../firebase/config";

export default function Main({ user }) {
  const [activeTab, setActiveTab] = useState("home");
  const [cartRequest, setCartRequest] = useState(0);
  const [globalSearch, setGlobalSearch] = useState("");

  const openTrackAfterOrder = () => {
    setActiveTab("orders");
  };

  const openCart = () => {
    setActiveTab("home");
    setCartRequest((request) => request + 1);
  };

  return (
    <div className="app-shell">
      {activeTab !== "profile" && (
        <header className="top-bar">
          <div className="top-bar-location">
            <span className="location-icon">📍</span>
            <span>Home, Location...</span>
          </div>
          {(activeTab === "home" || activeTab === "search") && (
             <div className="top-bar-search">
                <span className="search-icon">🔍</span>
                <input 
                  type="text" 
                  placeholder="Search for food, restaurants..." 
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                />
             </div>
          )}
        </header>
      )}

      <main className="app-content">
        {activeTab === "home" || activeTab === "search" ? (
          <Home
            user={user}
            goTrack={openTrackAfterOrder}
            onOrderPlaced={openTrackAfterOrder}
            cartRequest={cartRequest}
            globalSearchTerm={globalSearch}
          />
        ) : activeTab === "orders" ? (
          <Track user={user} />
        ) : (
          <div style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "16px", color: "white" }}>Profile</h2>
            <div style={{ background: "var(--premium-surface)", padding: "16px", borderRadius: "12px", marginBottom: "16px" }}>
              <p style={{ margin: "0 0 8px", color: "var(--text-secondary)" }}>Logged in as</p>
              <p style={{ margin: "0", fontSize: "1.2rem", fontWeight: "bold", color: "white" }}>{user.phoneNumber || user.email || "User"}</p>
            </div>
            
            <button 
               onClick={() => auth.signOut()} 
               type="button" 
               style={{ width: "100%", padding: "16px", background: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "12px", fontSize: "1.1rem", fontWeight: "bold" }}
            >
              🚪 Sign out
            </button>
          </div>
        )}
      </main>

      <nav className="bottom-nav-bar">
        <button className={`nav-item ${activeTab === 'home' ? 'is-active' : ''}`} onClick={() => setActiveTab('home')}>
          <span className="nav-icon">🍽️</span>
          <span>Home</span>
        </button>
        <button className={`nav-item ${activeTab === 'search' ? 'is-active' : ''}`} onClick={() => setActiveTab('search')}>
          <span className="nav-icon">🔍</span>
          <span>Search</span>
        </button>
        <button className={`nav-item ${activeTab === 'orders' ? 'is-active' : ''}`} onClick={() => setActiveTab('orders')}>
          <span className="nav-icon">📦</span>
          <span>Orders</span>
        </button>
        <button className={`nav-item ${activeTab === 'profile' ? 'is-active' : ''}`} onClick={() => setActiveTab('profile')}>
          <span className="nav-icon">👤</span>
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
}
