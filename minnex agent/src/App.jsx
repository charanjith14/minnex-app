import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/config";
import AgentApp from "./agent/AgentApp.jsx";
import Login from "./components/Login.jsx";
import MinnexLogo from "./components/MinnexLogo.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setSplashDone(true), 1150);
    return () => window.clearTimeout(timer);
  }, []);

  if (loading || !splashDone) {
    return (
      <main className="app-shell app-shell-centered splash-screen splash-screen-agent">
        <MinnexLogo variant="agent" className="splash-logo" wordmark tagline />
        <div className="splash-loader" aria-label="Loading Minnex Go" />
      </main>
    );
  }

  return user ? <AgentApp user={user} /> : <Login mode="agent" />;
}
