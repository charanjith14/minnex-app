import { useCallback, useEffect, useMemo, useState } from "react";
import { arrayUnion, collection, doc, onSnapshot, query, runTransaction, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import MinnexLogo from "../components/MinnexLogo.jsx";

const ACTIVE_STATUSES = ["agent assigned", "picked up", "on the way"];
const STATUS_FLOW = ["picked up", "on the way", "delivered"];
const DISPATCH_STATUS_BY_ORDER_STATUS = {
  "agent assigned": "assigned",
  "picked up": "picked_up",
  "on the way": "on_the_way",
  delivered: "delivered"
};
const AGENT_ID_KEY = "minnex-agent-id";
const AGENT_NAME_KEY = "minnex-agent-name";

const GO_INSIGHTS = [
  { label: "Hot zone", value: "Beach Road", detail: "High dinner demand in 18 min" },
  { label: "Guaranteed floor", value: "Rs 75", detail: "Minimum payout for long waits" },
  { label: "Safe route", value: "Lit streets", detail: "Route hints prefer main roads" },
  { label: "Batching", value: "Smart", detail: "Avoids cold-food double pickups" }
];

const FALLBACK_ROUTE = [
  { lat: 17.6868, lng: 83.2185 },
  { lat: 17.688, lng: 83.2197 },
  { lat: 17.6893, lng: 83.2211 },
  { lat: 17.6906, lng: 83.2226 },
  { lat: 17.692, lng: 83.2242 },
  { lat: 17.6932, lng: 83.2256 }
];

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (typeof value.toMillis === "function") return value.toMillis();
  return 0;
};

const getAgentId = () => {
  const existing = window.localStorage.getItem(AGENT_ID_KEY);
  if (existing) return existing;

  const created = `agent-${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(AGENT_ID_KEY, created);
  return created;
};

const getFallbackLocation = (orderId) => {
  const key = `minnex-agent-route-${orderId}`;
  const currentStep = Number(window.localStorage.getItem(key) || "0");
  const point = FALLBACK_ROUTE[currentStep % FALLBACK_ROUTE.length];
  window.localStorage.setItem(key, String(currentStep + 1));
  return point;
};

const getBrowserLocation = () => {
  if (!navigator.geolocation) {
    return Promise.reject(new Error("Location unavailable"));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }),
      reject,
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 7000
      }
    );
  });
};

const getAgentEarnings = (order) => {
  const settlement = order?.settlement || {};

  return {
    base: Number(settlement.agentBasePay || 0),
    distance: Number(settlement.distancePay || 0),
    surge: Number(settlement.surgePay || 0),
    tip: Number(settlement.tip || order?.billing?.tip || 0),
    total: Number(settlement.agentTotal || 0)
  };
};

export default function AgentApp({ user }) {
  const [orders, setOrders] = useState([]);
  const [agentProfile, setAgentProfile] = useState(null);
  const [activeDeliveryDetails, setActiveDeliveryDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [autoShare, setAutoShare] = useState(false);
  const [agentId] = useState(() => user.uid || getAgentId());
  const [agentName, setAgentName] = useState(
    () => window.localStorage.getItem(AGENT_NAME_KEY) || "Minnex Agent"
  );
  const [verificationForm, setVerificationForm] = useState({
    legalName: "",
    idType: "PAN",
    idNumber: ""
  });

  useEffect(() => {
    window.localStorage.setItem(AGENT_NAME_KEY, agentName.trim() || "Minnex Agent");
  }, [agentName]);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "agents", agentId), (snapshot) => {
      const profile = snapshot.exists() ? snapshot.data() : null;
      setAgentProfile(profile);

      if (profile?.agentName) {
        setAgentName(profile.agentName);
      }
    });

    return unsubscribe;
  }, [agentId]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "orders")),
      (snapshot) => {
        const liveOrders = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .sort((a, b) => toMillis(b.createdAtMs || b.createdAt) - toMillis(a.createdAtMs || a.createdAt));

        setOrders(liveOrders);
        setLoading(false);
      },
      (error) => {
        setMessage(error.message || "Could not load orders.");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const pendingOrders = useMemo(
    () =>
      orders
        .filter((order) => order.status === "preparing" && !order.agentId && order.paid !== false)
        .sort((a, b) => Number(b.matching?.priorityScore || 0) - Number(a.matching?.priorityScore || 0)),
    [orders]
  );

  const myOrders = useMemo(
    () => orders.filter((order) => order.agentId === agentId && ACTIVE_STATUSES.includes(order.status)),
    [agentId, orders]
  );

  const completedOrders = useMemo(
    () => orders.filter((order) => order.agentId === agentId && order.status === "delivered"),
    [agentId, orders]
  );

  const activeOrder = myOrders[0] || null;
  const verificationStatus = agentProfile?.verification?.status || "not_submitted";
  const canAcceptOrders = verificationStatus === "approved";
  const earnings = useMemo(() => {
    const allMine = [...myOrders, ...completedOrders];
    const totals = allMine.reduce(
      (sum, order) => {
        const orderEarnings = getAgentEarnings(order);
        return {
          total: sum.total + orderEarnings.total,
          tips: sum.tips + orderEarnings.tip,
          surge: sum.surge + orderEarnings.surge
        };
      },
      { total: 0, tips: 0, surge: 0 }
    );

    return totals;
  }, [completedOrders, myOrders]);

  useEffect(() => {
    if (!activeOrder) {
      setActiveDeliveryDetails(null);
      return undefined;
    }

    const unsubscribe = onSnapshot(doc(db, "orderDeliveryDetails", activeOrder.id), (snapshot) => {
      setActiveDeliveryDetails(snapshot.exists() ? snapshot.data() : null);
    });

    return unsubscribe;
  }, [activeOrder]);

  const submitVerification = async () => {
    const legalName = verificationForm.legalName.trim();
    const idType = verificationForm.idType;
    const idNumber = verificationForm.idNumber.trim().toUpperCase().replace(/\s/g, "");
    const isPanValid = idType === "PAN" && /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(idNumber);
    const isAadhaarValid = idType === "AADHAAR" && /^[0-9]{12}$/.test(idNumber);

    if (!legalName) {
      setMessage("Enter your legal name for verification.");
      return;
    }

    if (!isPanValid && !isAadhaarValid) {
      setMessage(idType === "PAN" ? "Enter a valid PAN format." : "Enter a valid 12 digit Aadhaar number.");
      return;
    }

    setBusyId("verification");
    setMessage("");

    try {
      await setDoc(
        doc(db, "agents", agentId),
        {
          agentId,
          userId: user.uid,
          phone: user.phoneNumber || "",
          agentName: agentName.trim() || legalName,
          verification: {
            legalName,
            idType,
            idLast4: idNumber.slice(-4),
            status: "submitted",
            submittedAt: Date.now(),
            fullIdStored: false
          },
          updatedAt: Date.now()
        },
        { merge: true }
      );
      setVerificationForm((current) => ({ ...current, idNumber: "" }));
      setMessage("Verification submitted. Minnex Biz approval is required before accepting orders.");
    } catch (error) {
      setMessage(error.message || "Verification could not be submitted.");
    } finally {
      setBusyId("");
    }
  };

  const updateOrder = async (orderId, data) => {
    setBusyId(orderId);
    setMessage("");

    try {
      await updateDoc(doc(db, "orders", orderId), data);
    } catch (error) {
      setMessage(error.message || "Order update failed.");
    } finally {
      setBusyId("");
    }
  };

  const pushLocation = useCallback(
    async (order, nextStatus) => {
      if (!order) return;

      setBusyId(order.id);
      setMessage("");

      try {
        let source = "device";
        let location;

        try {
          location = await getBrowserLocation();
        } catch {
          source = "demo";
          location = getFallbackLocation(order.id);
        }

        await updateDoc(doc(db, "orders", order.id), {
          location,
          locationSource: source,
          locationUpdatedAt: Date.now(),
          agentId,
          agentName: agentName.trim() || "Minnex Agent",
          agentVerificationStatus: verificationStatus,
          ...(nextStatus ? { status: nextStatus } : {})
        });

        setMessage(source === "device" ? "Live location shared." : "Demo location shared.");
      } catch (error) {
        setMessage(error.message || "Could not share location.");
      } finally {
        setBusyId("");
      }
    },
    [agentId, agentName, verificationStatus]
  );

  useEffect(() => {
    if (!autoShare || !activeOrder) return undefined;

    pushLocation(activeOrder);
    const interval = setInterval(() => pushLocation(activeOrder), 8000);

    return () => clearInterval(interval);
  }, [activeOrder, autoShare, pushLocation]);

  const acceptOrder = async (order) => {
    if (!canAcceptOrders) {
      setMessage("Minnex Biz must approve your PAN/Aadhaar verification before you can accept orders.");
      return;
    }

    const assignedAt = Date.now();
    const assignedAgentName = agentName.trim() || "Minnex Agent";

    setBusyId(order.id);
    setMessage("");

    try {
      await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, "orders", order.id);
        const detailsRef = doc(db, "orderDeliveryDetails", order.id);
        const orderSnapshot = await transaction.get(orderRef);

        if (!orderSnapshot.exists()) {
          throw new Error("This order is no longer available.");
        }

        const liveOrder = orderSnapshot.data();

        if (liveOrder.agentId) {
          throw new Error("Another delivery partner already accepted this order.");
        }

        if (liveOrder.status !== "preparing" || liveOrder.paid === false) {
          throw new Error("This pickup is not ready for assignment.");
        }

        transaction.update(orderRef, {
          status: "agent assigned",
          agentId,
          agentName: assignedAgentName,
          agentVerificationStatus: verificationStatus,
          dispatchStatus: "assigned",
          matching: {
            ...(liveOrder.matching || {}),
            status: "assigned_to_partner",
            assignedAgentId: agentId,
            assignedAt,
            lockType: "transactional_assignment"
          },
          agentSettlementStatus: "earning",
          assignedAt,
          timeline: arrayUnion({
            key: "delivery_partner_assigned",
            label: "Delivery partner accepted the pickup",
            at: assignedAt,
            by: assignedAgentName
          })
        });

        transaction.set(
          detailsRef,
          {
            assignedAgentId: agentId,
            assignedAgentName,
            assignedAt,
            accessLockedToAssignedAgent: true
          },
          { merge: true }
        );
      });

      await pushLocation({ ...order, agentId, agentName: assignedAgentName, status: "agent assigned" });
    } catch (error) {
      setMessage(error.message || "Could not accept this delivery.");
    } finally {
      setBusyId("");
    }
  };

  const setStatus = async (order, status) => {
    const statusChangedAt = Date.now();
    const payload = {
      status,
      agentId,
      agentName: agentName.trim() || "Minnex Agent",
      agentVerificationStatus: verificationStatus,
      dispatchStatus: DISPATCH_STATUS_BY_ORDER_STATUS[status] || order.dispatchStatus || "",
      ...(status === "delivered"
        ? {
            deliveredAt: statusChangedAt,
            "settlement.status": "ready_for_payout",
            agentSettlementStatus: "ready_for_payout"
          }
        : {}),
      timeline: arrayUnion({
        key: `agent_${status.replace(/\s/g, "_")}`,
        label: `Delivery partner marked ${status}`,
        at: statusChangedAt,
        by: agentName.trim() || "Minnex Agent"
      })
    };

    await updateOrder(order.id, payload);

    if (status !== "delivered") {
      await pushLocation(order, status);
    }
  };

  return (
    <div className="app-shell agent-shell">
      <header className="top-bar agent-top-bar">
        <a className="brand-lockup" href="/agent" aria-label="Minnex Go app">
          <MinnexLogo variant="agent" className="brand-mark" />
          <span>MINNEX GO</span>
        </a>

        <div className="top-bar-actions">
          <div className="menu-kpi">
            <span>Earned</span>
            <strong>Rs {earnings.total}</strong>
          </div>
          <details className="menu-popover">
            <summary className="menu-trigger">Menu</summary>
            <div className="menu-panel">
              <span>{user.phoneNumber || "Go signed in"}</span>
              <span>Go app only</span>
              <button onClick={() => auth.signOut()} type="button">
                Logout
              </button>
            </div>
          </details>
        </div>
      </header>

      <main className="agent-content">
        <section className="agent-hero">
          <div>
            <p className="eyebrow">Minnex Go</p>
            <h1>Priority pickups, route updates, and earnings up front.</h1>
          </div>
          <label className="agent-name-field">
            <span>Go partner name</span>
            <input
              value={agentName}
              onChange={(event) => setAgentName(event.target.value)}
              placeholder="Minnex Agent"
            />
          </label>
        </section>

        <section className="go-insight-strip" aria-label="Minnex Go smart shift insights">
          {GO_INSIGHTS.map((insight) => (
            <article className="go-insight-card" key={insight.label}>
              <span>{insight.label}</span>
              <strong>{insight.value}</strong>
              <p>{insight.detail}</p>
            </article>
          ))}
        </section>

        <section className="agent-metrics" aria-label="Shift overview">
          <div className="metric-tile">
            <span>Ready</span>
            <strong>{pendingOrders.length}</strong>
          </div>
          <div className="metric-tile">
            <span>Mine</span>
            <strong>{myOrders.length}</strong>
          </div>
          <div className="metric-tile">
            <span>Done</span>
            <strong>{completedOrders.length}</strong>
          </div>
          <div className="metric-tile">
            <span>Earned</span>
            <strong>Rs {earnings.total}</strong>
          </div>
          <div className="metric-tile">
            <span>Tips</span>
            <strong>Rs {earnings.tips}</strong>
          </div>
          <div className="metric-tile">
            <span>Surge</span>
            <strong>Rs {earnings.surge}</strong>
          </div>
        </section>

        {message && <p className="notice agent-notice">{message}</p>}

        <VerificationPanel
          agentName={agentName}
          form={verificationForm}
          profile={agentProfile}
          busy={busyId === "verification"}
          onAgentNameChange={setAgentName}
          onFormChange={setVerificationForm}
          onSubmit={submitVerification}
        />

        <section className="agent-layout">
          <div className="agent-panel">
            <div className="agent-panel-head">
              <div>
                <p className="eyebrow">Active delivery</p>
                <h2>{activeOrder ? activeOrder.shopName : "No assigned order"}</h2>
              </div>
              <label className="switch-control">
                <input
                  type="checkbox"
                  checked={autoShare}
                  onChange={(event) => setAutoShare(event.target.checked)}
                  disabled={!activeOrder}
                />
                <span>Auto location</span>
              </label>
            </div>

            {activeOrder ? (
              <OrderWorkSurface
                order={activeOrder}
                busy={busyId === activeOrder.id}
                deliveryDetails={activeDeliveryDetails}
                onLocation={() => pushLocation(activeOrder)}
                onStatus={(status) => setStatus(activeOrder, status)}
              />
            ) : (
              <div className="agent-empty">
                <h3>Ready for the next order</h3>
                <p>{loading ? "Loading queue..." : "Accept a restaurant-approved order to start delivery."}</p>
              </div>
            )}
          </div>

          <div className="agent-panel">
            <div className="agent-panel-head">
              <div>
                <p className="eyebrow">Pickup queue</p>
                <h2>{pendingOrders.length ? `${pendingOrders.length} waiting` : "All clear"}</h2>
              </div>
            </div>

            <div className="go-queue-tools" aria-label="Queue intelligence">
              <span>Nearest first</span>
              <span>High payout</span>
              <span>Prep ready</span>
            </div>

            <div className="agent-list">
              {pendingOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  busy={busyId === order.id}
                  canAccept={canAcceptOrders}
                  verificationStatus={verificationStatus}
                  onAccept={() => acceptOrder(order)}
                />
              ))}
              {!pendingOrders.length && (
                <div className="agent-empty agent-empty-compact">
                  <h3>No approved pickups</h3>
                  <p>Restaurant-accepted orders appear here in real time.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function VerificationPanel({ agentName, form, profile, busy, onAgentNameChange, onFormChange, onSubmit }) {
  const verification = profile?.verification;
  const status = verification?.status || "not_submitted";

  return (
    <section className="verification-panel">
      <div className="verification-copy">
        <p className="eyebrow">Go verification</p>
        <h2>{status === "approved" ? "Approved for deliveries" : "PAN or Aadhaar approval required"}</h2>
        <p>
          Full PAN/Aadhaar numbers are not stored in this prototype. Minnex Biz sees only document type, last 4,
          and approval status.
        </p>
      </div>

      <div className="verification-status-card">
        <span className={`status-pill verification-${status}`}>{status.replace("_", " ")}</span>
        {verification?.idType && <strong>{verification.idType} ending {verification.idLast4}</strong>}
      </div>

      {status !== "approved" && (
        <div className="verification-form">
          <label>
            <span>Display name</span>
            <input
              value={agentName}
              onChange={(event) => onAgentNameChange(event.target.value)}
              placeholder="Minnex Agent"
            />
          </label>
          <label>
            <span>Legal name</span>
            <input
              value={form.legalName}
              onChange={(event) => onFormChange((current) => ({ ...current, legalName: event.target.value }))}
              placeholder="As on PAN/Aadhaar"
            />
          </label>
          <label>
            <span>ID type</span>
            <select
              value={form.idType}
              onChange={(event) => onFormChange((current) => ({ ...current, idType: event.target.value }))}
            >
              <option value="PAN">PAN</option>
              <option value="AADHAAR">Aadhaar</option>
            </select>
          </label>
          <label>
            <span>{form.idType} number</span>
            <input
              value={form.idNumber}
              onChange={(event) =>
                onFormChange((current) => ({ ...current, idNumber: event.target.value.toUpperCase() }))
              }
              placeholder={form.idType === "PAN" ? "ABCDE1234F" : "12 digit Aadhaar"}
            />
          </label>
          <button className="primary-button" onClick={onSubmit} disabled={busy} type="button">
            {busy ? "Submitting..." : "Submit verification"}
          </button>
        </div>
      )}
    </section>
  );
}

function OrderCard({ order, busy, canAccept, verificationStatus, onAccept }) {
  return (
    <article className="agent-card">
      <div className="agent-card-header">
        <div>
          <h3>{order.shopName}</h3>
          <p>{order.cuisine || "Minnex order"}</p>
        </div>
        <span className="status-pill">{order.status}</span>
      </div>
      <div className="shop-meta">
        <span>{order.eta || "ASAP"}</span>
        <span>Rs {order.price}</span>
        <span>{order.paid ? "Paid" : "Unpaid"}</span>
        <span>Earn Rs {getAgentEarnings(order).total}</span>
        <span>Priority {order.matching?.priorityScore ?? 0}</span>
      </div>
      <button className="primary-button" onClick={onAccept} disabled={busy || !canAccept} type="button">
        {busy ? "Accepting..." : canAccept ? "Accept delivery" : `Verification ${verificationStatus}`}
      </button>
    </article>
  );
}

function OrderWorkSurface({ order, busy, deliveryDetails, onLocation, onStatus }) {
  return (
    <div className="agent-work-surface">
      <div className="agent-card-header">
        <div>
          <h3>{order.shopName}</h3>
          <p>{order.userPhone || "Customer"}</p>
        </div>
        <span className="status-pill status-pill-live">{order.status}</span>
      </div>

      <div className="shop-meta">
        <span>{order.eta || "ASAP"}</span>
        <span>Rs {order.price}</span>
        <span>{order.paid ? "Paid" : "Collect payment"}</span>
        <span>Earn Rs {getAgentEarnings(order).total}</span>
      </div>

      <DeliveryDetails order={order} deliveryDetails={deliveryDetails} />

      <EarningsPanel order={order} />

      <RouteAssistPanel order={order} />

      <div className="status-buttons">
        {STATUS_FLOW.map((status) => (
          <button
            key={status}
            className={`secondary-button ${order.status === status ? "is-active" : ""}`}
            onClick={() => onStatus(status)}
            disabled={busy || order.status === status}
            type="button"
          >
            {status}
          </button>
        ))}
      </div>

      <div className="location-strip">
        <div>
          <span>Last location</span>
          <strong>
            {order.location
              ? `${Number(order.location.lat).toFixed(4)}, ${Number(order.location.lng).toFixed(4)}`
              : "Waiting"}
          </strong>
        </div>
        <button className="primary-button" onClick={onLocation} disabled={busy} type="button">
          {busy ? "Sharing..." : "Share location"}
        </button>
      </div>
    </div>
  );
}

function RouteAssistPanel({ order }) {
  return (
    <div className="route-assist-panel">
      <div>
        <span>Pickup promise</span>
        <strong>{order.eta || "ASAP"}</strong>
      </div>
      <div>
        <span>Food care</span>
        <strong>Hot bag check</strong>
      </div>
      <div>
        <span>Support</span>
        <strong>One-tap escalation</strong>
      </div>
    </div>
  );
}

function EarningsPanel({ order }) {
  const earnings = getAgentEarnings(order);

  return (
    <div className="earnings-panel">
      <div>
        <span>Base</span>
        <strong>Rs {earnings.base}</strong>
      </div>
      <div>
        <span>Distance</span>
        <strong>Rs {earnings.distance}</strong>
      </div>
      <div>
        <span>Surge</span>
        <strong>Rs {earnings.surge}</strong>
      </div>
      <div>
        <span>Tip</span>
        <strong>Rs {earnings.tip}</strong>
      </div>
      <div>
        <span>Total</span>
        <strong>Rs {earnings.total}</strong>
      </div>
    </div>
  );
}

function DeliveryDetails({ order, deliveryDetails }) {
  const contact = deliveryDetails?.deliveryContact || order.deliveryContact;

  if (!contact) {
    return (
      <div className="delivery-agent-card">
        <p className="eyebrow">Delivery details</p>
        <h3>Customer details unavailable</h3>
      </div>
    );
  }

  const mapsHref = contact.location
    ? `https://www.google.com/maps?q=${contact.location.lat},${contact.location.lng}`
    : "";

  return (
    <div className="delivery-agent-card">
      <p className="eyebrow">Delivery details</p>
      <div className="delivery-agent-grid">
        <InfoLine label="Receiver" value={contact.name || "Customer"} />
        <InfoLine label="Contact" value={contact.phone || order.userPhone || "Not provided"} />
        <InfoLine label="Address" value={contact.address || "Not provided"} />
        <InfoLine label="Notes" value={contact.notes || "None"} />
      </div>
      {contact.location && (
        <a className="ghost-link maps-link" href={mapsHref} target="_blank" rel="noreferrer">
          Open customer location
        </a>
      )}
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="agent-info-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
