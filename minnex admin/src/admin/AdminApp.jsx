import { useEffect, useMemo, useState } from "react";
import { arrayUnion, collection, doc, onSnapshot, query, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import MinnexLogo from "../components/MinnexLogo.jsx";

const STATUS_OPTIONS = [
  "all",
  "order placed",
  "preparing",
  "agent assigned",
  "picked up",
  "on the way",
  "delivered",
  "rejected"
];
const MANAGEABLE_STATUSES = STATUS_OPTIONS.filter((status) => status !== "all" && status !== "order placed");
const RESTAURANT_QUEUE_STATUSES = ["order placed", "pending"];
const ACTIVE_ORDER_STATUSES = ["order placed", "pending", "preparing", "agent assigned", "picked up", "on the way"];
const DISPATCH_STATUS_BY_ORDER_STATUS = {
  preparing: "waiting_for_agent",
  "agent assigned": "assigned",
  "picked up": "picked_up",
  "on the way": "on_the_way",
  delivered: "delivered",
  rejected: "cancelled"
};

const RESTAURANT_CATALOG = [
  {
    id: "s1",
    name: "The Burger Joint",
    item: { id: "classic-burger", name: "Classic Smash Burger" },
    schedule: { openHour: 9, closeHour: 23 }
  },
  {
    id: "s2",
    name: "Malabar Appam House",
    item: { id: "appam-stew", name: "Appam with Veg Stew" },
    schedule: { openHour: 7, closeHour: 22 }
  },
  {
    id: "s3",
    name: "Tandoor Table",
    item: { id: "tandoori-thali", name: "Tandoori Thali" },
    schedule: { openHour: 10, closeHour: 24 }
  },
  {
    id: "s4",
    name: "Kerala Meals Club",
    item: { id: "fish-curry-meal", name: "Fish Curry Meal" },
    schedule: { openHour: 11, closeHour: 23 }
  },
  {
    id: "s5",
    name: "Biryani League",
    item: { id: "hyderabadi-biryani", name: "Hyderabadi Chicken Biryani" },
    schedule: { openHour: 10, closeHour: 24 }
  },
  {
    id: "s6",
    name: "Green Bowl Studio",
    item: { id: "millet-power-bowl", name: "Millet Power Bowl" },
    schedule: { openHour: 8, closeHour: 22 }
  }
];
const MENU_OPTIONS = [
  "Profile",
  "Past orders",
  "Feedbacks",
  "Contact us",
  "Settings"
];

const MENU_CONTENT = {
  Profile: {
    title: "Profile",
    copy: "Manage the Minnex Biz operator profile, restaurant access, and approval identity."
  },
  "Past orders": {
    title: "Past orders",
    copy: "Review completed and rejected orders from the order desk using the status filters."
  },
  Feedbacks: {
    title: "Feedbacks",
    copy: "Customer food, restaurant, and delivery ratings are collected here after delivered orders."
  },
  "Contact us": {
    title: "Contact us",
    copy: "Use the AI support queue for customer issues and escalation tracking tied to each order."
  },
  Settings: {
    title: "Settings",
    copy: "Control restaurant hours, stock, partner verification, payment review, and support policies."
  }
};

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (typeof value.toMillis === "function") return value.toMillis();
  return 0;
};

const formatTime = (value) => {
  const timestamp = toMillis(value);
  if (!timestamp) return "Just now";

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short"
  }).format(new Date(timestamp));
};

const getPaymentLabel = (paid) => (paid ? "Paid" : "Unpaid");

const isRestaurantActionable = (order) =>
  Boolean(order?.paid) && RESTAURANT_QUEUE_STATUSES.includes(order.status);

const getRestaurantStatus = (order) => {
  if (order.restaurantStatus) return order.restaurantStatus;
  if (isRestaurantActionable(order)) return "new";
  if (order.status === "rejected") return "rejected";
  return "accepted";
};

const calculatePriorityScore = (order) => {
  const paidBoost = order.paid ? 30 : 0;
  const ageBoost = Math.min(30, Math.floor((Date.now() - toMillis(order.createdAtMs || order.createdAt)) / 60000));
  const distancePenalty = Math.round(Number(order.distanceKm || 0) * 2);

  return paidBoost + ageBoost - distancePenalty;
};

const average = (values) => {
  const cleanValues = values.map(Number).filter((value) => Number.isFinite(value) && value > 0);
  if (!cleanValues.length) return 0;
  return cleanValues.reduce((sum, value) => sum + value, 0) / cleanValues.length;
};

const getProfile = (restaurant, profiles) => ({
  ...restaurant,
  ...(profiles[restaurant.id] || {}),
  schedule: profiles[restaurant.id]?.schedule || restaurant.schedule,
  menuAvailability: profiles[restaurant.id]?.menuAvailability || {}
});

const maskCustomerRef = (order) => {
  if (order.userPhone) {
    return `${order.userPhone.slice(0, 3)}****${order.userPhone.slice(-2)}`;
  }

  if (order.customerRef) return order.customerRef;

  return order.userId ? `customer-${order.userId.slice(0, 6)}` : "Customer";
};

export default function AdminApp({ user }) {
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [restaurantProfiles, setRestaurantProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [menuView, setMenuView] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(RESTAURANT_CATALOG[0].id);
  const [scheduleDraft, setScheduleDraft] = useState({
    openHour: RESTAURANT_CATALOG[0].schedule.openHour,
    closeHour: RESTAURANT_CATALOG[0].schedule.closeHour
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "orders")),
      (snapshot) => {
        const liveOrders = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .sort((a, b) => toMillis(b.createdAtMs || b.createdAt) - toMillis(a.createdAtMs || a.createdAt));

        setOrders(liveOrders);
        setLoading(false);
        setSelectedId((current) => current || liveOrders[0]?.id || "");
      },
      (error) => {
        setMessage(error.message || "Could not load Minnex Biz data.");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "agents")),
      (snapshot) => {
        const liveAgents = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

        setAgents(liveAgents);
      },
      (error) => {
        setMessage(error.message || "Could not load Go partner verification data.");
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "restaurants")),
      (snapshot) => {
        const profiles = {};
        snapshot.docs.forEach((item) => {
          profiles[item.id] = item.data();
        });
        setRestaurantProfiles(profiles);
      },
      (error) => {
        setMessage(error.message || "Could not load restaurant availability.");
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "supportTickets")),
      (snapshot) => {
        const tickets = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .sort((a, b) => toMillis(b.createdAtMs || b.createdAt) - toMillis(a.createdAtMs || a.createdAt));

        setSupportTickets(tickets);
      },
      (error) => {
        setMessage(error.message || "Could not load support tickets.");
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const selected = RESTAURANT_CATALOG.find((restaurant) => restaurant.id === selectedRestaurantId);
    const profile = selected ? getProfile(selected, restaurantProfiles) : null;

    if (profile?.schedule) {
      setScheduleDraft({
        openHour: Number(profile.schedule.openHour ?? 0),
        closeHour: Number(profile.schedule.closeHour ?? 24)
      });
    }
  }, [restaurantProfiles, selectedRestaurantId]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return orders;
    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedId) || filteredOrders[0] || null,
    [filteredOrders, orders, selectedId]
  );

  const stats = useMemo(() => {
    const active = orders.filter((order) => ACTIVE_ORDER_STATUSES.includes(order.status));
    const restaurantQueue = orders.filter(isRestaurantActionable);
    const deliveryQueue = orders.filter((order) => order.status === "preparing" && !order.agentId);
    const assigned = orders.filter((order) => order.agentId && order.status !== "delivered");
    const paidRevenue = orders.reduce((sum, order) => sum + (order.paid ? Number(order.price || 0) : 0), 0);
    const unpaidRevenue = orders.reduce((sum, order) => sum + (!order.paid ? Number(order.price || 0) : 0), 0);
    const platformRevenue = orders.reduce((sum, order) => sum + Number(order.settlement?.platformRevenue || 0), 0);
    const restaurantSettlement = orders.reduce(
      (sum, order) => sum + Number(order.settlement?.restaurantSettlement || 0),
      0
    );
    const partnerPayout = orders.reduce((sum, order) => sum + Number(order.settlement?.agentTotal || 0), 0);
    const tips = orders.reduce((sum, order) => sum + Number(order.billing?.tip || 0), 0);
    const openTickets = supportTickets.filter((ticket) => ticket.status !== "resolved");
    const activeAgents = new Set(orders.map((order) => order.agentName).filter(Boolean));
    const feedbackOrders = orders.filter((order) => order.feedback);
    const averageFood =
      feedbackOrders.reduce((sum, order) => sum + Number(order.feedback.foodRating || 0), 0) /
      (feedbackOrders.length || 1);
    const trustAverage = average(orders.map((order) => order.foodTrust?.score));
    const cashbackLiability = orders.reduce((sum, order) => sum + Number(order.wallet?.cashbackReserved || 0), 0);
    const refundWatch = supportTickets.filter((ticket) => ticket.autoRefundEligible && ticket.status !== "resolved");
    const hyperlocalOrders = orders.filter((order) => order.personalization?.hyperlocalType).length;
    const aiEtaOrders = orders.filter((order) => order.smartDelivery?.trafficAwareRouting).length;

    return {
      total: orders.length,
      active: active.length,
      restaurantQueue: restaurantQueue.length,
      deliveryQueue: deliveryQueue.length,
      assigned: assigned.length,
      paidRevenue,
      unpaidRevenue,
      platformRevenue,
      restaurantSettlement,
      partnerPayout,
      tips,
      openTickets: openTickets.length,
      refundWatch: refundWatch.length,
      agents: activeAgents.size,
      feedback: feedbackOrders.length,
      averageFood: feedbackOrders.length ? averageFood.toFixed(1) : "0.0",
      trustAverage: trustAverage ? `${Math.round(trustAverage)}%` : "NA",
      cashbackLiability,
      hyperlocalOrders,
      aiEtaOrders
    };
  }, [orders, supportTickets]);

  const updateOrder = async (orderId, data, successMessage) => {
    setBusyId(orderId);
    setMessage("");

    try {
      await updateDoc(doc(db, "orders", orderId), {
        ...data,
        adminUpdatedAt: Date.now(),
        adminUpdatedBy: user.phoneNumber || user.email || "admin"
      });
      setMessage(successMessage);
    } catch (error) {
      setMessage(error.message || "Minnex Biz update failed.");
    } finally {
      setBusyId("");
    }
  };

  const setOrderStatus = (order, status) => {
    const statusChangedAt = Date.now();

    updateOrder(
      order.id,
      {
        status,
        dispatchStatus: DISPATCH_STATUS_BY_ORDER_STATUS[status] || order.dispatchStatus || "",
        ...(status === "preparing"
          ? {
              restaurantStatus: "accepted",
              restaurantAcceptedAt: order.restaurantAcceptedAt || statusChangedAt
            }
          : {}),
        ...(status === "rejected"
          ? {
              restaurantStatus: "rejected",
              restaurantRejectedAt: statusChangedAt,
              agentId: "",
              agentName: ""
            }
          : {}),
        ...(status === "delivered" ? { deliveredAt: statusChangedAt } : {}),
        timeline: arrayUnion({
          key: `admin_${status.replace(/\s/g, "_")}`,
          label: `Order moved to ${status}`,
          at: statusChangedAt,
          by: "restaurant"
        })
      },
      `Order moved to ${status}.`
    );
  };

  const acceptRestaurantOrder = (order) => {
    const acceptedAt = Date.now();

    updateOrder(
      order.id,
      {
        status: "preparing",
        restaurantStatus: "accepted",
        restaurantAcceptedAt: acceptedAt,
        dispatchStatus: "waiting_for_agent",
        matching: {
          status: "queued_for_nearest_partner",
          priorityScore: calculatePriorityScore(order),
          assignedBy: "backend_matching_system",
          queuedAt: acceptedAt
        },
        timeline: arrayUnion({
          key: "restaurant_accepted",
          label: "Restaurant accepted the order and started preparing",
          at: acceptedAt,
          by: "restaurant"
        })
      },
      "Order accepted. It is now visible to delivery partners."
    );
  };

  const rejectRestaurantOrder = (order) => {
    const rejectedAt = Date.now();

    updateOrder(
      order.id,
      {
        status: "rejected",
        restaurantStatus: "rejected",
        restaurantRejectedAt: rejectedAt,
        dispatchStatus: "cancelled",
        agentId: "",
        agentName: "",
        timeline: arrayUnion({
          key: "restaurant_rejected",
          label: "Restaurant rejected the order",
          at: rejectedAt,
          by: "restaurant"
        })
      },
      "Order rejected and removed from dispatch."
    );
  };

  const togglePayment = (order) => {
    updateOrder(
      order.id,
      {
        paid: !order.paid,
        paymentStatus: order.paid ? "pending" : "confirmed",
        ...(order.paid
          ? { paymentId: "", paidAt: null }
          : {
              paidAt: Date.now(),
              status: order.status === "pending" ? "order placed" : order.status,
              restaurantStatus: order.restaurantStatus || "new",
              dispatchStatus: order.dispatchStatus || "waiting_for_restaurant"
            })
      },
      `Order marked ${order.paid ? "unpaid" : "paid"}.`
    );
  };

  const releaseOrder = async (order) => {
    await updateOrder(
      order.id,
      {
        status: "preparing",
        agentId: "",
        agentName: "",
        agentVerificationStatus: "",
        dispatchStatus: "waiting_for_agent",
        location: null,
        locationSource: "",
        locationUpdatedAt: null
      },
      "Order released back to the delivery queue."
    );

    await setDoc(
      doc(db, "orderDeliveryDetails", order.id),
      {
        assignedAgentId: "",
        assignedAgentName: "",
        releasedAt: Date.now()
      },
      { merge: true }
    );
  };

  const updateAgentVerification = async (agent, status) => {
    setBusyId(agent.id);
    setMessage("");

    try {
      await updateDoc(doc(db, "agents", agent.id), {
        "verification.status": status,
        "verification.reviewedAt": Date.now(),
        "verification.reviewedBy": user.phoneNumber || user.email || "admin",
        updatedAt: Date.now()
      });
      setMessage(`Go partner verification ${status}.`);
    } catch (error) {
      setMessage(error.message || "Could not update Go partner verification.");
    } finally {
      setBusyId("");
    }
  };

  const updateRestaurantProfile = async (restaurant, data, successMessage) => {
    setBusyId(restaurant.id);
    setMessage("");

    try {
      await setDoc(
        doc(db, "restaurants", restaurant.id),
        {
          restaurantId: restaurant.id,
          name: restaurant.name,
          updatedAt: Date.now(),
          updatedBy: user.phoneNumber || user.email || "restaurant",
          ...data
        },
        { merge: true }
      );
      setMessage(successMessage);
    } catch (error) {
      setMessage(error.message || "Could not update restaurant.");
    } finally {
      setBusyId("");
    }
  };

  const toggleRestaurantPause = (restaurant) => {
    const profile = getProfile(restaurant, restaurantProfiles);
    updateRestaurantProfile(
      restaurant,
      { isPaused: !profile.isPaused },
      profile.isPaused ? "Restaurant opened for orders." : "Restaurant paused."
    );
  };

  const toggleItemAvailability = (restaurant) => {
    const profile = getProfile(restaurant, restaurantProfiles);
    const current = profile.menuAvailability?.[restaurant.item.id] !== false;

    updateRestaurantProfile(
      restaurant,
      {
        menuAvailability: {
          ...(profile.menuAvailability || {}),
          [restaurant.item.id]: !current
        }
      },
      current ? "Menu item marked out of stock." : "Menu item marked available."
    );
  };

  const saveRestaurantHours = (restaurant) => {
    updateRestaurantProfile(
      restaurant,
      {
        schedule: {
          openHour: Number(scheduleDraft.openHour),
          closeHour: Number(scheduleDraft.closeHour)
        }
      },
      "Restaurant hours updated."
    );
  };

  const updateSupportTicket = async (ticket, status) => {
    setBusyId(ticket.id);
    setMessage("");

    try {
      await updateDoc(doc(db, "supportTickets", ticket.id), {
        status,
        reviewedAt: Date.now(),
        reviewedBy: user.phoneNumber || user.email || "support"
      });
      setMessage(`Support ticket marked ${status}.`);
    } catch (error) {
      setMessage(error.message || "Could not update support ticket.");
    } finally {
      setBusyId("");
    }
  };

  const selectedRestaurant = RESTAURANT_CATALOG.find((restaurant) => restaurant.id === selectedRestaurantId);
  const selectedRestaurantProfile = selectedRestaurant
    ? getProfile(selectedRestaurant, restaurantProfiles)
    : null;
  const menuContent = MENU_CONTENT[menuView];

  return (
    <div className="app-shell admin-shell">
      <header className="top-bar admin-top-bar">
        <a className="brand-lockup" href="/admin" aria-label="Minnex Biz app">
          <MinnexLogo variant="admin" className="brand-mark admin-mark" />
          <span>MINNEX BIZ</span>
        </a>

        <div className="top-bar-actions">
          <div className="menu-kpi">
            <span>Live</span>
            <strong>{stats.restaurantQueue} new</strong>
          </div>
          <details className="menu-popover">
            <summary className="menu-trigger">Menu</summary>
            <div className="menu-panel">
              <span>{user.phoneNumber || "Biz signed in"}</span>
              <span>Biz app only</span>
              {MENU_OPTIONS.map((option) => (
                <button key={option} onClick={() => setMenuView(option)} type="button">
                  {option}
                </button>
              ))}
              <button onClick={() => auth.signOut()} type="button">
                Logout
              </button>
            </div>
          </details>
        </div>
      </header>

      <main className="admin-content">
        <section className="admin-hero">
          <div>
            <p className="eyebrow">Minnex Biz</p>
            <h1>Orders, availability, support, and settlements in one desk.</h1>
          </div>
          <div className="admin-live-card">
            <span>New orders</span>
            <strong>{stats.restaurantQueue}</strong>
          </div>
        </section>

        <section className="biz-command-strip" aria-label="Minnex Biz command insights">
          <article>
            <span>Demand forecast</span>
            <strong>{stats.restaurantQueue > 2 ? "Surging" : "Normal"}</strong>
            <p>AI-ready staffing signal based on live queue and recent order flow.</p>
          </article>
          <article>
            <span>Prep SLA</span>
            <strong>{stats.active ? "18 min" : "Ready"}</strong>
            <p>Kitchen promise shown to customers and Go partners.</p>
          </article>
          <article>
            <span>Growth lever</span>
            <strong>Flash deal</strong>
            <p>Boost slow items without pausing the full menu.</p>
          </article>
          <article>
            <span>Risk monitor</span>
            <strong>{stats.openTickets ? `${stats.openTickets} open` : "Clear"}</strong>
            <p>Support and refund signals stay tied to the order timeline.</p>
          </article>
        </section>

        <section className="admin-metrics" aria-label="Minnex Biz overview">
          <Metric label="Total" value={stats.total} />
          <Metric label="Kitchen" value={stats.active} />
          <Metric label="Delivery queue" value={stats.deliveryQueue} />
          <Metric label="Assigned" value={stats.assigned} />
          <Metric label="Feedback" value={stats.feedback} />
          <Metric label="Food avg" value={stats.averageFood} />
          <Metric label="Paid" value={`Rs ${stats.paidRevenue}`} />
          <Metric label="Platform rev" value={`Rs ${stats.platformRevenue}`} />
          <Metric label="Restaurant due" value={`Rs ${stats.restaurantSettlement}`} />
          <Metric label="Partner payout" value={`Rs ${stats.partnerPayout}`} />
          <Metric label="Tips" value={`Rs ${stats.tips}`} />
          <Metric label="Support" value={stats.openTickets} />
          <Metric label="Trust avg" value={stats.trustAverage} />
          <Metric label="Cashback" value={`Rs ${stats.cashbackLiability}`} />
          <Metric label="Refund watch" value={stats.refundWatch} />
        </section>

        {message && <p className="notice admin-notice">{message}</p>}

        <section className="merchant-growth-panel" aria-label="Merchant growth controls">
          <article>
            <span>Smart coupon</span>
            <strong>Lunch saver</strong>
            <p>Auto-target nearby repeat customers during slow windows.</p>
          </article>
          <article>
            <span>Menu health</span>
            <strong>Stock-aware</strong>
            <p>Out-of-stock updates instantly hide items on Minnex.</p>
          </article>
          <article>
            <span>Loyalty</span>
            <strong>3rd order reward</strong>
            <p>Bring back customers without broad discount leakage.</p>
          </article>
        </section>

        <StrategyOpsPanel stats={stats} selectedProfile={selectedRestaurantProfile} />

        <RestaurantOpsPanel
          restaurants={RESTAURANT_CATALOG}
          profiles={restaurantProfiles}
          selectedId={selectedRestaurantId}
          selectedProfile={selectedRestaurantProfile}
          scheduleDraft={scheduleDraft}
          busyId={busyId}
          onSelect={setSelectedRestaurantId}
          onDraftChange={setScheduleDraft}
          onTogglePause={toggleRestaurantPause}
          onToggleItem={toggleItemAvailability}
          onSaveHours={saveRestaurantHours}
        />

        <section className="admin-layout">
          <div className="admin-panel">
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Orders</p>
                <h2>{loading ? "Loading" : `${filteredOrders.length} shown`}</h2>
              </div>
              <div className="filter-row admin-filter-row" aria-label="Admin status filters">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    className={`filter-chip ${statusFilter === status ? "is-active" : ""}`}
                    onClick={() => setStatusFilter(status)}
                    type="button"
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-order-list">
              {filteredOrders.map((order) => (
                <button
                  key={order.id}
                  className={`admin-order-row ${selectedOrder?.id === order.id ? "is-selected" : ""}`}
                  onClick={() => setSelectedId(order.id)}
                  type="button"
                >
                  <span className="order-main">
                    <strong>{order.shopName}</strong>
                    <small>{maskCustomerRef(order)}</small>
                  </span>
                  <span className="status-pill">{order.status}</span>
                  <span>{getPaymentLabel(order.paid)}</span>
                  <span>Rs {order.price || 0}</span>
                  <span>{formatTime(order.createdAtMs || order.createdAt)}</span>
                </button>
              ))}
              {!filteredOrders.length && (
                <div className="admin-empty">
                  <h3>No orders here</h3>
                  <p>Change the filter or place a customer order to see it live.</p>
                </div>
              )}
            </div>
          </div>

          <aside className="admin-panel admin-detail-panel">
            <div className="admin-panel-head">
              <div>
                <p className="eyebrow">Selected order</p>
                <h2>{selectedOrder?.shopName || "No order"}</h2>
              </div>
            </div>

            {selectedOrder ? (
              <OrderAdminDetail
                order={selectedOrder}
                busy={busyId === selectedOrder.id}
                onAccept={() => acceptRestaurantOrder(selectedOrder)}
                onReject={() => rejectRestaurantOrder(selectedOrder)}
                onStatus={(status) => setOrderStatus(selectedOrder, status)}
                onPayment={() => togglePayment(selectedOrder)}
                onRelease={() => releaseOrder(selectedOrder)}
              />
            ) : (
              <div className="admin-empty">
                <h3>Nothing selected</h3>
                <p>Pick an order from the list to manage it.</p>
              </div>
            )}
          </aside>
        </section>

        <section className="admin-panel verification-admin-panel">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Go partner verification</p>
              <h2>{agents.length ? `${agents.length} profiles` : "No profiles"}</h2>
            </div>
          </div>

          <div className="agent-verification-list">
            {agents.map((agent) => (
              <AgentVerificationCard
                key={agent.id}
                agent={agent}
                busy={busyId === agent.id}
                onApprove={() => updateAgentVerification(agent, "approved")}
                onReject={() => updateAgentVerification(agent, "rejected")}
              />
            ))}
            {!agents.length && (
              <div className="admin-empty">
                <h3>No Go partner verification yet</h3>
                <p>Partner PAN/Aadhaar submissions appear here.</p>
              </div>
            )}
          </div>
        </section>

        <section className="admin-panel verification-admin-panel">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">AI support queue</p>
              <h2>{supportTickets.length ? `${supportTickets.length} tickets` : "No tickets"}</h2>
            </div>
          </div>

          <div className="support-ticket-list">
            {supportTickets.map((ticket) => (
              <SupportTicketCard
                key={ticket.id}
                ticket={ticket}
                busy={busyId === ticket.id}
                onResolve={() => updateSupportTicket(ticket, "resolved")}
                onRefund={() => updateSupportTicket(ticket, "refund_review")}
              />
            ))}
            {!supportTickets.length && (
              <div className="admin-empty">
                <h3>No support issues</h3>
                <p>Customer chatbot tickets appear here for AI-first support and human escalation.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {menuContent && (
        <MenuInfoPanel
          title={menuContent.title}
          copy={menuContent.copy}
          account={user.phoneNumber || user.email || "Biz signed in"}
          onClose={() => setMenuView("")}
        />
      )}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="admin-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StrategyOpsPanel({ stats, selectedProfile }) {
  return (
    <section className="strategy-ops-panel" aria-label="Competitive strategy controls">
      <article>
        <span>Food trust</span>
        <strong>{stats.trustAverage}</strong>
        <p>Hygiene, real-photo, freshness, and tamper-seal signals attached to orders.</p>
      </article>
      <article>
        <span>Restaurant analytics</span>
        <strong>{selectedProfile?.isPaused ? "Paused" : "Live"}</strong>
        <p>Demand, stock, opening hours, and flash-deal controls stay in Minnex Biz.</p>
      </article>
      <article>
        <span>Wallet liability</span>
        <strong>Rs {stats.cashbackLiability}</strong>
        <p>Reserved cashback for prepaid customers before settlement release.</p>
      </article>
      <article>
        <span>Smart delivery</span>
        <strong>{stats.aiEtaOrders}</strong>
        <p>Traffic-aware ETA, EV preference, and grouped delivery readiness.</p>
      </article>
      <article>
        <span>Hyperlocal</span>
        <strong>{stats.hyperlocalOrders}</strong>
        <p>Street-food, home-chef, bakery, and local kitchen supply can be measured.</p>
      </article>
      <article>
        <span>Human escalation</span>
        <strong>{stats.refundWatch}</strong>
        <p>AI support tickets with refund or coupon review stay visible to operators.</p>
      </article>
    </section>
  );
}

function MenuInfoPanel({ title, copy, account, onClose }) {
  return (
    <div className="menu-info-backdrop" role="presentation">
      <section className="menu-info-panel" role="dialog" aria-modal="true" aria-label={title}>
        <div>
          <p className="eyebrow">Menu</p>
          <h2>{title}</h2>
          <p>{copy}</p>
        </div>
        <div className="menu-info-account">
          <span>Account</span>
          <strong>{account}</strong>
        </div>
        <button className="primary-button" onClick={onClose} type="button">
          Done
        </button>
      </section>
    </div>
  );
}

function RestaurantOpsPanel({
  restaurants,
  profiles,
  selectedId,
  selectedProfile,
  scheduleDraft,
  busyId,
  onSelect,
  onDraftChange,
  onTogglePause,
  onToggleItem,
  onSaveHours
}) {
  const selected = restaurants.find((restaurant) => restaurant.id === selectedId) || restaurants[0];
  const profile = selectedProfile || getProfile(selected, profiles);
  const itemAvailable = profile.menuAvailability?.[selected.item.id] !== false;

  return (
    <section className="admin-panel restaurant-ops-panel">
      <div className="admin-panel-head">
        <div>
          <p className="eyebrow">Restaurant availability</p>
          <h2>Open hours, pauses, and stock sync live to customer app.</h2>
        </div>
        <select value={selectedId} onChange={(event) => onSelect(event.target.value)}>
          {restaurants.map((restaurant) => (
            <option key={restaurant.id} value={restaurant.id}>
              {restaurant.name}
            </option>
          ))}
        </select>
      </div>

      <div className="restaurant-ops-grid">
        <div className="admin-info">
          <span>Status</span>
          <strong>{profile.isPaused ? "Paused" : "Accepting orders"}</strong>
        </div>
        <div className="admin-info">
          <span>Menu item</span>
          <strong>{itemAvailable ? "Available" : "Out of stock"}</strong>
        </div>
        <label className="admin-info">
          <span>Open hour</span>
          <input
            type="number"
            min="0"
            max="24"
            value={scheduleDraft.openHour}
            onChange={(event) =>
              onDraftChange((current) => ({ ...current, openHour: event.target.value }))
            }
          />
        </label>
        <label className="admin-info">
          <span>Close hour</span>
          <input
            type="number"
            min="0"
            max="24"
            value={scheduleDraft.closeHour}
            onChange={(event) =>
              onDraftChange((current) => ({ ...current, closeHour: event.target.value }))
            }
          />
        </label>
      </div>

      <div className="admin-action-row restaurant-action-row">
        <button className="primary-button" onClick={() => onTogglePause(selected)} disabled={busyId === selected.id} type="button">
          {profile.isPaused ? "Open restaurant" : "Pause restaurant"}
        </button>
        <button className="secondary-button" onClick={() => onToggleItem(selected)} disabled={busyId === selected.id} type="button">
          {itemAvailable ? "Mark out of stock" : "Mark in stock"}
        </button>
        <button className="secondary-button" onClick={() => onSaveHours(selected)} disabled={busyId === selected.id} type="button">
          Save hours
        </button>
      </div>
    </section>
  );
}

function OrderAdminDetail({ order, busy, onAccept, onReject, onStatus, onPayment, onRelease }) {
  const restaurantActionable = isRestaurantActionable(order);

  return (
    <div className="admin-detail">
      <div className="admin-detail-grid">
        <Info label="Customer ref" value={maskCustomerRef(order)} />
        <Info label="Go partner" value={order.agentName || "Unassigned"} />
        <Info label="Payment" value={getPaymentLabel(order.paid)} />
        <Info label="Amount" value={`Rs ${order.price || 0}`} />
        <Info label="Created" value={formatTime(order.createdAtMs || order.createdAt)} />
        <Info label="Restaurant" value={getRestaurantStatus(order)} />
        <Info label="Delivery" value={order.dispatchStatus || "waiting_for_restaurant"} />
        <Info label="Commission" value={`Rs ${order.settlement?.restaurantCommission || 0}`} />
        <Info label="Partner earn" value={`Rs ${order.settlement?.agentTotal || 0}`} />
        <Info label="Platform fee" value={`Rs ${order.billing?.platformFee || 0}`} />
        <Info label="Priority" value={order.matching?.priorityScore ?? "Queue"} />
        <Info label="Price lock" value={order.billing?.priceLockId || "Not locked"} />
        <Info label="Food trust" value={order.foodTrust?.score ? `${order.foodTrust.score}%` : "Pending"} />
        <Info label="Wallet" value={`Rs ${order.wallet?.cashbackReserved || 0}`} />
        <Info label="Smart ETA" value={order.smartDelivery?.etaConfidence || order.matching?.etaConfidence || "Pending"} />
      </div>

      {restaurantActionable && (
        <div className="admin-feedback-card">
          <p className="eyebrow">New paid order</p>
          <p>Accepting moves this order into preparation and opens it for delivery-partner assignment.</p>
          <div className="admin-action-row">
            <button className="primary-button" onClick={onAccept} disabled={busy} type="button">
              Accept order
            </button>
            <button className="secondary-button danger-button" onClick={onReject} disabled={busy} type="button">
              Reject
            </button>
          </div>
        </div>
      )}

      <FeedbackDetail feedback={order.feedback} />

      <StrategyOrderDetail order={order} />

      <div className="admin-actions">
        <p className="eyebrow">Status</p>
        <div className="status-buttons">
          {MANAGEABLE_STATUSES.map((status) => (
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
      </div>

      <div className="admin-action-row">
        <button className="primary-button" onClick={onPayment} disabled={busy} type="button">
          {order.paid ? "Mark unpaid" : "Mark paid"}
        </button>
        <button className="secondary-button danger-button" onClick={onRelease} disabled={busy} type="button">
          Release order
        </button>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="admin-info">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function FeedbackDetail({ feedback }) {
  return (
    <div className="admin-feedback-card">
      <p className="eyebrow">Customer feedback</p>
      {feedback ? (
        <>
          <div className="feedback-score-row">
            <span>Food {feedback.foodRating}/5</span>
            <span>Restaurant {feedback.restaurantRating || 5}/5</span>
            <span>Partner {feedback.agentRating}/5</span>
          </div>
          <p>{feedback.comment || "No written comment."}</p>
        </>
      ) : (
        <p>No feedback submitted yet.</p>
      )}
    </div>
  );
}

function StrategyOrderDetail({ order }) {
  return (
    <div className="admin-feedback-card">
      <p className="eyebrow">Competitive signals</p>
      <div className="strategy-detail-grid">
        <span>{order.foodTrust?.hygieneRating || "Hygiene pending"}</span>
        <span>{order.foodTrust?.freshness || "Freshness pending"}</span>
        <span>{order.personalization?.nutrition || "Nutrition pending"}</span>
        <span>{order.personalization?.trendSignal || "Trend pending"}</span>
        <span>{order.smartDelivery?.ecoDeliveryMode || "Eco route pending"}</span>
        <span>{order.wallet?.loyaltyRule || "Loyalty pending"}</span>
      </div>
    </div>
  );
}

function AgentVerificationCard({ agent, busy, onApprove, onReject }) {
  const verification = agent.verification || {};
  const status = verification.status || "not_submitted";

  return (
    <article className="agent-verification-card">
      <div>
        <h3>{agent.agentName || verification.legalName || "Minnex Go"}</h3>
        <p>{agent.phone || "No phone"}</p>
      </div>
      <span className={`status-pill verification-${status}`}>{status.replace("_", " ")}</span>
      <div className="agent-proof">
        <span>{verification.idType || "ID"}</span>
        <strong>{verification.idLast4 ? `Ending ${verification.idLast4}` : "Not submitted"}</strong>
        <small>{verification.fullIdStored === false ? "Full number not stored" : "Check storage policy"}</small>
      </div>
      <div className="admin-action-row">
        <button className="primary-button" onClick={onApprove} disabled={busy || status === "approved"} type="button">
          Approve
        </button>
        <button className="secondary-button danger-button" onClick={onReject} disabled={busy || status === "rejected"} type="button">
          Reject
        </button>
      </div>
    </article>
  );
}

function SupportTicketCard({ ticket, busy, onResolve, onRefund }) {
  return (
    <article className="support-ticket-card">
      <div>
        <h3>{ticket.title || "Support ticket"}</h3>
        <p>{ticket.shopName || "Minnex order"} - {ticket.status || "open"}</p>
      </div>
      <p>{ticket.message || ticket.aiResolution || "AI support ticket created."}</p>
      <div className="agent-proof">
        <span>AI action</span>
        <strong>{ticket.aiResolution || "Intent detected"}</strong>
        <small>
          {ticket.escalation || "ai_first_response"} - {ticket.humanEscalationSlaSeconds || 30}s SLA
        </small>
      </div>
      <div className="agent-proof">
        <span>Refund automation</span>
        <strong>{ticket.autoRefundEligible ? "Eligible for review" : "Manual review"}</strong>
        <small>{ticket.regionalLanguageReady ? "Regional language ready" : "English support"}</small>
      </div>
      <div className="admin-action-row">
        <button className="primary-button" onClick={onResolve} disabled={busy || ticket.status === "resolved"} type="button">
          Resolve
        </button>
        <button className="secondary-button" onClick={onRefund} disabled={busy} type="button">
          Refund review
        </button>
      </div>
    </article>
  );
}
