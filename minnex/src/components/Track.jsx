import { useEffect, useMemo, useState } from "react";
import { addDoc, arrayUnion, collection, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { appEnv } from "../env";
import { loadRazorpay } from "../utils/razorpay";
import Map from "./Map.jsx";

const STATUS_STEPS = [
  "order placed",
  "restaurant accepted",
  "preparing",
  "agent assigned",
  "picked up",
  "on the way",
  "delivered"
];

const STATUS_ALIASES = {
  pending: "order placed",
  accepted: "agent assigned",
  arriving: "on the way"
};

const STATUS_COPY = {
  "order placed": "Payment confirmed. The order is waiting at the restaurant.",
  preparing: "The restaurant accepted the order and is preparing the food.",
  "agent assigned": "A delivery partner has accepted the pickup.",
  "picked up": "The delivery partner picked up the order.",
  "on the way": "Your order is on the way.",
  delivered: "Delivered successfully.",
  rejected: "The restaurant rejected this order."
};

const normalizeStatus = (status) => STATUS_ALIASES[status] || status || "order placed";

const SUPPORT_INTENTS = [
  { id: "late_delivery", label: "Late delivery", resolution: "AI marked this for delivery-delay review." },
  { id: "missing_item", label: "Missing item", resolution: "AI created a restaurant verification ticket." },
  { id: "refund", label: "Refund request", resolution: "AI queued this for refund eligibility review." }
];

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (typeof value.toMillis === "function") return value.toMillis();
  return 0;
};

export default function Track({ user }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paying, setPaying] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportIntent, setSupportIntent] = useState(SUPPORT_INTENTS[0].id);
  const [supportText, setSupportText] = useState("");
  const [feedback, setFeedback] = useState({
    foodRating: 5,
    restaurantRating: 5,
    agentRating: 5,
    comment: ""
  });

  useEffect(() => {
    const ordersQuery = query(collection(db, "orders"), where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const orders = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .sort((a, b) => toMillis(b.createdAtMs || b.createdAt) - toMillis(a.createdAtMs || a.createdAt));

        setOrder(orders[0] || null);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message || "Could not load orders.");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user.uid]);

  const activeStep = useMemo(() => {
    const index = STATUS_STEPS.indexOf(normalizeStatus(order?.status));
    return index === -1 ? 0 : index;
  }, [order?.status]);

  const handlePay = async () => {
    if (!order || order.paid) return;

    const key = appEnv.razorpayKeyId;
    if (!key) {
      setPaymentMessage("Razorpay key is missing.");
      return;
    }

    setPaying(true);
    setPaymentMessage("");

    try {
      const loaded = await loadRazorpay();
      if (!loaded) {
        setPaymentMessage("Checkout could not be loaded.");
        return;
      }

      const options = {
        key,
        amount: Number(order.price) * 100,
        currency: "INR",
        name: "Minnex",
        description: order.shopName,
        prefill: {
          contact: user.phoneNumber || ""
        },
        handler: async (response) => {
          const paidAt = Date.now();

          await updateDoc(doc(db, "orders", order.id), {
            paid: true,
            paymentId: response.razorpay_payment_id || "",
            paymentMode: "razorpay",
            paidAt,
            paymentStatus: "client_confirmed",
            payment: {
              provider: "razorpay",
              providerPaymentId: response.razorpay_payment_id || "",
              providerOrderId: response.razorpay_order_id || "",
              status: "client_confirmed",
              verificationStatus: response.razorpay_signature ? "server_verification_required" : "client_confirmed",
              amountPaise: Number(order.price) * 100,
              currency: "INR",
              capturedAt: paidAt,
              sensitivePaymentDataStored: false
            },
            status: order.status === "pending" ? "order placed" : order.status,
            restaurantStatus: order.restaurantStatus || "new",
            dispatchStatus: order.dispatchStatus || "waiting_for_restaurant",
            timeline: arrayUnion({
              key: "order_paid",
              label: "Payment confirmed",
              at: paidAt,
              by: "customer"
            })
          });
          setPaymentMessage("Payment received.");
        },
        modal: {
          ondismiss: () => setPaying(false)
        }
      };

      new window.Razorpay(options).open();
    } catch (paymentError) {
      setPaymentMessage(paymentError.message || "Payment failed.");
    } finally {
      setPaying(false);
    }
  };

  const submitFeedback = async () => {
    if (!order || order.status !== "delivered") return;

    setFeedbackMessage("");

    try {
      await updateDoc(doc(db, "orders", order.id), {
        feedback: {
          foodRating: Number(feedback.foodRating),
          restaurantRating: Number(feedback.restaurantRating),
          agentRating: Number(feedback.agentRating),
          comment: feedback.comment.trim(),
          submittedAt: Date.now(),
          visibleTo: "biz",
          ratingImpact: {
            weightedScore:
              Number(feedback.foodRating) * 0.45 +
              Number(feedback.restaurantRating) * 0.35 +
              Number(feedback.agentRating) * 0.2,
            recentWeight: 1,
            affectsRestaurantRanking: true
          }
        }
      });
      setFeedbackMessage("Thanks. Your feedback was sent to Minnex Biz.");
    } catch (feedbackError) {
      setFeedbackMessage(feedbackError.message || "Could not submit feedback.");
    }
  };

  const submitSupportTicket = async () => {
    if (!order) return;

    const intent = SUPPORT_INTENTS.find((item) => item.id === supportIntent) || SUPPORT_INTENTS[0];
    setSupportMessage("");

    try {
      await addDoc(collection(db, "supportTickets"), {
        orderId: order.id,
        userId: user.uid,
        shopId: order.shopId,
        shopName: order.shopName,
        intent: intent.id,
        title: intent.label,
        message: supportText.trim(),
        aiResolution: intent.resolution,
        status: intent.id === "late_delivery" && order.status !== "delivered" ? "monitoring" : "open",
        escalation: intent.id === "refund" ? "human_review" : "ai_first_response",
        createdAtMs: Date.now()
      });
      setSupportText("");
      setSupportMessage(intent.resolution);
    } catch (supportError) {
      setSupportMessage(supportError.message || "Could not create support ticket.");
    }
  };

  if (loading) {
    return (
      <section className="page page-track">
        <div className="skeleton-card" />
        <div className="skeleton-map" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="page empty-state">
        <h1>Tracking paused</h1>
        <p>{error}</p>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="page empty-state">
        <h1>No active orders</h1>
        <p>Your latest Minnex order will appear here.</p>
      </section>
    );
  }

  return (
    <section className="page page-track">
      <article className="tracking-summary">
        <div>
          <p className="eyebrow">Current order</p>
          <h1>{order.shopName}</h1>
          <p className="tracking-status">{normalizeStatus(order.status)}</p>
          <p className="tracking-agent">
            {STATUS_COPY[normalizeStatus(order.status)] || "Status updates will appear here."}
          </p>
          {order.agentName && <p className="tracking-agent">Agent: {order.agentName}</p>}
        </div>
        <div className="price-pill">Rs {order.price}</div>
      </article>

      <div className="steps" aria-label="Order progress">
        {STATUS_STEPS.map((step, index) => (
          <div className={`step ${index <= activeStep ? "is-complete" : ""}`} key={step}>
            <span />
            <p>{step}</p>
          </div>
        ))}
      </div>

      <Map location={order.location} />

      <article className="payment-panel">
        <div>
          <p className="eyebrow">Checkout</p>
          <h2>{order.paid ? "Payment confirmed" : "Payment pending"}</h2>
        </div>
        <button
          className="primary-button payment-button"
          onClick={handlePay}
          disabled={paying || order.paid}
          type="button"
        >
          {order.paid ? "Done" : paying ? "Opening..." : `Pay Rs ${order.price}`}
        </button>
      </article>

      {paymentMessage && <p className="notice">{paymentMessage}</p>}

      <OrderEconomics order={order} />

      <SupportPanel
        intent={supportIntent}
        message={supportMessage}
        note={supportText}
        onIntentChange={setSupportIntent}
        onNoteChange={setSupportText}
        onSubmit={submitSupportTicket}
      />

      {order.status === "delivered" && (
        <FeedbackPanel
          feedback={feedback}
          existingFeedback={order.feedback}
          message={feedbackMessage}
          onChange={setFeedback}
          onSubmit={submitFeedback}
        />
      )}
    </section>
  );
}

function OrderEconomics({ order }) {
  const billing = order.billing || {};
  const finalAmount = billing.customerTotal ?? order.price ?? 0;

  return (
    <article className="economics-panel">
      <div>
        <p className="eyebrow">Final payment split</p>
        <h2>What you paid</h2>
      </div>
      <div className="economics-grid">
        <InfoTile label="Food" value={`Rs ${billing.subtotal ?? order.itemPrice ?? order.price}`} />
        <InfoTile label="Delivery fee" value={`Rs ${billing.deliveryFee ?? 0}`} />
        <InfoTile label="Platform fee" value={`Rs ${billing.platformFee ?? 0}`} />
        <InfoTile label="Priority match" value={`Rs ${billing.priorityMatchFee ?? 0}`} />
        <InfoTile label="Tip" value={`Rs ${billing.tip ?? 0}`} />
        <InfoTile label="Final amount" value={`Rs ${finalAmount}`} />
      </div>
    </article>
  );
}

function SupportPanel({ intent, note, message, onIntentChange, onNoteChange, onSubmit }) {
  return (
    <article className="support-panel">
      <div>
        <p className="eyebrow">AI support</p>
        <h2>Report an issue</h2>
      </div>
      <div className="support-controls">
        <select value={intent} onChange={(event) => onIntentChange(event.target.value)}>
          {SUPPORT_INTENTS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <input
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="Optional details"
        />
        <button className="primary-button" onClick={onSubmit} type="button">
          Send to support
        </button>
      </div>
      {message && <p className="notice">{message}</p>}
    </article>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="info-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function FeedbackPanel({ feedback, existingFeedback, message, onChange, onSubmit }) {
  if (existingFeedback) {
    return (
      <article className="feedback-panel">
        <div>
          <p className="eyebrow">Feedback sent</p>
          <h2>
            Food {existingFeedback.foodRating}/5 / Restaurant {existingFeedback.restaurantRating || 5}/5 / Partner{" "}
            {existingFeedback.agentRating}/5
          </h2>
          {existingFeedback.comment && <p>{existingFeedback.comment}</p>}
        </div>
      </article>
    );
  }

  return (
    <article className="feedback-panel">
      <div>
        <p className="eyebrow">Feedback</p>
        <h2>Rate your food and delivery partner.</h2>
      </div>

      <div className="rating-grid">
        <RatingControl
          label="Food"
          value={feedback.foodRating}
          onChange={(value) => onChange((current) => ({ ...current, foodRating: value }))}
        />
        <RatingControl
          label="Restaurant"
          value={feedback.restaurantRating}
          onChange={(value) => onChange((current) => ({ ...current, restaurantRating: value }))}
        />
        <RatingControl
          label="Delivery partner"
          value={feedback.agentRating}
          onChange={(value) => onChange((current) => ({ ...current, agentRating: value }))}
        />
      </div>

      <label className="feedback-comment">
        <span>Comment</span>
        <textarea
          value={feedback.comment}
          onChange={(event) => onChange((current) => ({ ...current, comment: event.target.value }))}
          placeholder="Tell us what went well or what should improve"
          rows="3"
        />
      </label>

      <button className="primary-button" onClick={onSubmit} type="button">
        Submit feedback
      </button>
      {message && <p className="notice">{message}</p>}
    </article>
  );
}

function RatingControl({ label, value, onChange }) {
  return (
    <div className="rating-control">
      <span>{label}</span>
      <div className="rating-buttons" aria-label={`${label} rating`}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            className={rating <= value ? "is-active" : ""}
            onClick={() => onChange(rating)}
            type="button"
            aria-label={`${rating} out of 5`}
          >
            {rating}
          </button>
        ))}
      </div>
    </div>
  );
}
