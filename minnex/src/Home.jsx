import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { appEnv } from "./env";
import { db } from "./firebase/config";
import { createOrder } from "./utils/orders";
import { loadRazorpay } from "./utils/razorpay";

const SHOPS = [
  {
    id: "s1",
    name: "The Burger Joint",
    cuisine: "Smash burgers",
    eta: "18-24 min",
    rating: "4.8",
    price: 299,
    commissionRate: 0.22,
    distanceKm: 3.2,
    sponsoredBoost: 2,
    veg: false,
    deliveryMode: "Express",
    prepTime: "12 min prep",
    offer: "60% off up to Rs 120",
    tags: ["burgers", "express", "offers"],
    schedule: { openHour: 9, closeHour: 23 },
    item: {
      id: "classic-burger",
      name: "Classic Smash Burger",
      description: "Double patty, cheese, house sauce",
      price: 299
    },
    accent: "#f05d3d",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "s2",
    name: "Malabar Appam House",
    cuisine: "Kerala breakfast",
    eta: "16-22 min",
    rating: "4.9",
    price: 220,
    commissionRate: 0.18,
    distanceKm: 2.1,
    sponsoredBoost: 1,
    veg: true,
    deliveryMode: "Express",
    prepTime: "10 min prep",
    offer: "Free stew upgrade",
    tags: ["kerala", "dosa", "healthy", "veg", "express"],
    schedule: { openHour: 7, closeHour: 22 },
    item: {
      id: "appam-stew",
      name: "Appam with Veg Stew",
      description: "Soft appam, coconut stew, curry leaves",
      price: 220
    },
    accent: "#22c55e",
    image:
      "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "s3",
    name: "Tandoor Table",
    cuisine: "North Indian meals",
    eta: "20-28 min",
    rating: "4.7",
    price: 349,
    commissionRate: 0.18,
    distanceKm: 4.4,
    sponsoredBoost: 1,
    veg: true,
    deliveryMode: "Standard",
    prepTime: "16 min prep",
    offer: "Rs 80 off on thalis",
    tags: ["north indian", "veg", "offers"],
    schedule: { openHour: 10, closeHour: 24 },
    item: {
      id: "tandoori-thali",
      name: "Tandoori Thali",
      description: "Paneer tikka, dal, rice, roti",
      price: 349
    },
    accent: "#d88c23",
    image:
      "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "s4",
    name: "Kerala Meals Club",
    cuisine: "Sadya and fish curry",
    eta: "24-32 min",
    rating: "4.9",
    price: 399,
    commissionRate: 0.2,
    distanceKm: 5.7,
    sponsoredBoost: 3,
    veg: false,
    deliveryMode: "Standard",
    prepTime: "18 min prep",
    offer: "Banana leaf meal combo",
    tags: ["kerala", "biryani", "offers"],
    schedule: { openHour: 11, closeHour: 23 },
    item: {
      id: "fish-curry-meal",
      name: "Fish Curry Meal",
      description: "Matta rice, fish curry, avial, pickle",
      price: 399
    },
    accent: "#ff6b00",
    image:
      "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "s5",
    name: "Biryani League",
    cuisine: "Dum biryani",
    eta: "21-29 min",
    rating: "4.6",
    price: 329,
    commissionRate: 0.19,
    distanceKm: 3.9,
    sponsoredBoost: 0,
    veg: false,
    deliveryMode: "Standard",
    prepTime: "15 min prep",
    offer: "Buy 1 get dessert",
    tags: ["biryani", "offers"],
    schedule: { openHour: 10, closeHour: 24 },
    item: {
      id: "hyderabadi-biryani",
      name: "Hyderabadi Chicken Biryani",
      description: "Sealed dum, raita, salan",
      price: 329
    },
    accent: "#ef4444",
    image:
      "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "s6",
    name: "Green Bowl Studio",
    cuisine: "Healthy bowls",
    eta: "19-25 min",
    rating: "4.8",
    price: 279,
    commissionRate: 0.17,
    distanceKm: 2.8,
    sponsoredBoost: 0,
    veg: true,
    deliveryMode: "Express",
    prepTime: "11 min prep",
    offer: "Protein add-on free",
    tags: ["healthy", "veg", "express"],
    schedule: { openHour: 8, closeHour: 22 },
    item: {
      id: "millet-power-bowl",
      name: "Millet Power Bowl",
      description: "Millet, sprouts, paneer, coconut chutney",
      price: 279
    },
    accent: "#14b8a6",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80"
  }
];

const FILTERS = ["Recommended", "Offers", "Express", "Pure veg", "Healthy", "Top rated", "Near you"];
const TIP_OPTIONS = [0, 20, 40, 60];
const FOOD_MOODS = ["All", "Kerala", "Biryani", "Dosa", "Burgers", "Healthy"];
const SCHEDULE_SLOTS = [
  { id: "asap", label: "ASAP" },
  { id: "lunch", label: "Lunch 12-2" },
  { id: "dinner", label: "Dinner 7-9" }
];
const SERVICE_MODES = [
  { id: "food", title: "Food delivery", copy: "Top restaurants near you" },
  { id: "express", title: "Express 20", copy: "Fast kitchens and smart batching" },
  { id: "party", title: "Party box", copy: "Group carts and scheduled drops" },
  { id: "healthy", title: "Healthy", copy: "Curated veg and high-protein meals" }
];
const OFFER_RAIL = [
  { title: "Pocket meals", copy: "Meals under Rs 149 in 25 min" },
  { title: "Gold hour", copy: "Extra rewards on prepaid orders" },
  { title: "Kerala picks", copy: "Sadya, appam, stew and fish curry" }
];
const DELIVERY_PROFILE_VERSION = "v2";
const DEFAULT_DELIVERY_PROFILES = [
  {
    id: "home",
    label: "Home",
    name: "",
    address: "",
    notes: ""
  },
  {
    id: "work",
    label: "Work",
    name: "",
    address: "",
    notes: ""
  }
];

const cleanPhone = (value) => value.replace(/\D/g, "").slice(0, 10);

const getDeliveryProfileKey = (user) => `minnex-delivery-profiles-${DELIVERY_PROFILE_VERSION}-${user.uid}`;

const getActiveDeliveryProfileKey = (user) => `minnex-active-delivery-profile-${DELIVERY_PROFILE_VERSION}-${user.uid}`;

const normalizeDeliveryProfile = (profile, index, user) => ({
  id: profile.id || `profile-${index + 1}`,
  label: profile.label || `Address ${index + 1}`,
  name: profile.name || "",
  phone: cleanPhone(profile.phone || user.phoneNumber || ""),
  address: profile.address || "",
  notes: profile.notes || "",
  location: profile.location || null
});

const loadDeliveryProfiles = (user) => {
  const fallbackProfiles = DEFAULT_DELIVERY_PROFILES.map((profile, index) =>
    normalizeDeliveryProfile(profile, index, user)
  );

  if (typeof window === "undefined") return fallbackProfiles;

  try {
    const saved = JSON.parse(window.localStorage.getItem(getDeliveryProfileKey(user)) || "[]");
    const profiles = Array.isArray(saved)
      ? saved.map((profile, index) => normalizeDeliveryProfile(profile, index, user))
      : [];

    return profiles.length ? profiles : fallbackProfiles;
  } catch {
    return fallbackProfiles;
  }
};

const loadActiveDeliveryProfileId = (user, profiles) => {
  if (typeof window === "undefined") return profiles[0]?.id || "";

  const savedId = window.localStorage.getItem(getActiveDeliveryProfileKey(user));
  return profiles.some((profile) => profile.id === savedId) ? savedId : profiles[0]?.id || "";
};

const getAddressPreview = (profile) => {
  const address = profile?.address?.trim();
  if (!address) return "Add delivery address";
  return address.length > 74 ? `${address.slice(0, 74)}...` : address;
};

const createDemoPayment = (mode = "demo") => ({
  paymentId: `demo-pay-${Date.now()}`,
  providerOrderId: "",
  mode,
  verificationStatus: "demo_payment",
  paidAt: Date.now()
});

const calculateBill = (shop, tip = 0, priorityMatch = false) => {
  const subtotal = Number(shop.item?.price || shop.price || 0);
  const deliveryFee = Math.round(25 + Number(shop.distanceKm || 0) * 8);
  const platformFee = subtotal >= 400 ? 15 : 9;
  const priorityMatchFee = priorityMatch ? 12 : 0;
  const surgePay = shop.isPeakHour ? 20 : 0;
  const restaurantCommission = Math.round(subtotal * Number(shop.commissionRate || 0.2));
  const restaurantSettlement = subtotal - restaurantCommission;
  const agentBasePay = 35;
  const distancePay = Math.round(Number(shop.distanceKm || 0) * 9);
  const agentTotal = agentBasePay + distancePay + surgePay + Number(tip || 0) + priorityMatchFee;
  const platformRevenue =
    restaurantCommission + platformFee + deliveryFee + priorityMatchFee - agentBasePay - distancePay - surgePay;
  const customerTotal = subtotal + deliveryFee + platformFee + priorityMatchFee + Number(tip || 0);

  return {
    subtotal,
    itemTotal: subtotal,
    deliveryFee,
    platformFee,
    priorityMatchFee,
    tip: Number(tip || 0),
    customerTotal,
    commissionRate: Number(shop.commissionRate || 0.2),
    restaurantCommission,
    restaurantSettlement,
    agentBasePay,
    distancePay,
    surgePay,
    agentTotal,
    platformRevenue,
    distanceKm: Number(shop.distanceKm || 0)
  };
};

const isWithinHours = (schedule) => {
  const hour = new Date().getHours();
  const openHour = Number(schedule?.openHour ?? 0);
  const closeHour = Number(schedule?.closeHour ?? 24);

  if (openHour === closeHour) return true;
  if (closeHour > openHour) return hour >= openHour && hour < closeHour;
  return hour >= openHour || hour < closeHour;
};

const getEffectiveShop = (shop, profile = {}) => {
  const schedule = profile.schedule || shop.schedule;
  const isPaused = Boolean(profile.isPaused);
  const isOpenByHours = isWithinHours(schedule);
  const menuAvailability = profile.menuAvailability || {};
  const itemAvailable = menuAvailability[shop.item.id] !== false;
  const isOpen = !isPaused && isOpenByHours && itemAvailable;
  const availabilityReason = isPaused
    ? "Paused by restaurant"
    : !isOpenByHours
      ? `Opens ${schedule.openHour}:00`
      : !itemAvailable
        ? "Item out of stock"
        : "Open";

  return {
    ...shop,
    rating: profile.rating || shop.rating,
    schedule,
    isPaused,
    itemAvailable,
    isOpen,
    availabilityReason,
    isPeakHour: new Date().getHours() >= 19 && new Date().getHours() <= 22,
    sponsoredBoost: Number(profile.sponsoredBoost ?? shop.sponsoredBoost ?? 0)
  };
};

const collectPayment = async (shop, bill, user) => {
  const key = appEnv.razorpayKeyId;

  if (!key || key.includes("your_")) {
    return createDemoPayment();
  }

  const loaded = await loadRazorpay();

  if (!loaded || !window.Razorpay) {
    return createDemoPayment("demo-checkout-unavailable");
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const options = {
      key,
      amount: Number(bill.customerTotal) * 100,
      currency: "INR",
      name: "Minnex",
      description: shop.name,
      prefill: {
        contact: user.phoneNumber || ""
      },
      handler: (response) => {
        settled = true;
        resolve({
          paymentId: response.razorpay_payment_id || `razorpay-${Date.now()}`,
          providerOrderId: response.razorpay_order_id || "",
          mode: "razorpay",
          verificationStatus: response.razorpay_signature ? "server_verification_required" : "client_confirmed",
          paidAt: Date.now()
        });
      },
      modal: {
        ondismiss: () => {
          if (!settled) {
            reject(new Error("Payment was cancelled."));
          }
        }
      }
    };

    new window.Razorpay(options).open();
  });
};

const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    return Promise.reject(new Error("Location is not available in this browser."));
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
        maximumAge: 60000,
        timeout: 8000
      }
    );
  });
};

export default function Home({ user, goTrack }) {
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
  const [selectedMood, setSelectedMood] = useState("All");
  const [selectedFoodId, setSelectedFoodId] = useState("all");
  const [activeMode, setActiveMode] = useState("food");
  const [searchTerm, setSearchTerm] = useState("");
  const [orderingId, setOrderingId] = useState(null);
  const [reviewShopId, setReviewShopId] = useState("");
  const [message, setMessage] = useState("");
  const [locating, setLocating] = useState(false);
  const [restaurantProfiles, setRestaurantProfiles] = useState({});
  const [tip, setTip] = useState(0);
  const [scheduleSlot, setScheduleSlot] = useState("asap");
  const [noContact, setNoContact] = useState(true);
  const [groupOrder, setGroupOrder] = useState(false);
  const [priorityMatch, setPriorityMatch] = useState(true);
  const [deliveryProfiles, setDeliveryProfiles] = useState(() => loadDeliveryProfiles(user));
  const [activeProfileId, setActiveProfileId] = useState(() => {
    const profiles = loadDeliveryProfiles(user);
    return loadActiveDeliveryProfileId(user, profiles);
  });

  const activeDeliveryProfile = useMemo(
    () => deliveryProfiles.find((profile) => profile.id === activeProfileId) || deliveryProfiles[0],
    [activeProfileId, deliveryProfiles]
  );
  const deliveryDetails = activeDeliveryProfile || normalizeDeliveryProfile({}, 0, user);

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
      () => {
        setRestaurantProfiles({});
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!deliveryProfiles.length) return;

    if (!deliveryProfiles.some((profile) => profile.id === activeProfileId)) {
      setActiveProfileId(deliveryProfiles[0].id);
    }
  }, [activeProfileId, deliveryProfiles]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(getDeliveryProfileKey(user), JSON.stringify(deliveryProfiles));
  }, [deliveryProfiles, user]);

  useEffect(() => {
    if (typeof window === "undefined" || !activeProfileId) return;
    window.localStorage.setItem(getActiveDeliveryProfileKey(user), activeProfileId);
  }, [activeProfileId, user]);

  const updateDeliveryDetails = (field, value) => {
    const nextValue = field === "phone" ? cleanPhone(value) : value;

    setDeliveryProfiles((current) =>
      current.map((profile) =>
        profile.id === deliveryDetails.id
          ? {
              ...profile,
              [field]: nextValue
            }
          : profile
      )
    );
  };

  const addDeliveryProfile = () => {
    const nextProfile = normalizeDeliveryProfile(
      {
        id: `address-${Date.now()}`,
        label: `Address ${deliveryProfiles.length + 1}`,
        name: deliveryDetails.name,
        phone: deliveryDetails.phone,
        address: "",
        notes: "",
        location: null
      },
      deliveryProfiles.length,
      user
    );

    setDeliveryProfiles((current) => [...current, nextProfile]);
    setActiveProfileId(nextProfile.id);
  };

  const useCurrentLocation = async () => {
    setLocating(true);
    setMessage("");

    try {
      const location = await getCurrentLocation();
      setDeliveryProfiles((current) =>
        current.map((profile) => (profile.id === deliveryDetails.id ? { ...profile, location } : profile))
      );
      setMessage("Current location added for faster partner matching.");
    } catch (error) {
      setMessage(error.message || "Could not read current location.");
    } finally {
      setLocating(false);
    }
  };

  const effectiveShops = useMemo(
    () => SHOPS.map((shop) => getEffectiveShop(shop, restaurantProfiles[shop.id])),
    [restaurantProfiles]
  );

  const foodCatalog = useMemo(() => {
    const catalog = new Map();

    effectiveShops.forEach((shop) => {
      const foodId = shop.item.id;
      const existing = catalog.get(foodId) || {
        id: foodId,
        name: shop.item.name,
        description: shop.item.description,
        image: shop.image,
        accent: shop.accent,
        availableCount: 0,
        openCount: 0
      };

      catalog.set(foodId, {
        ...existing,
        availableCount: existing.availableCount + 1,
        openCount: existing.openCount + (shop.isOpen ? 1 : 0)
      });
    });

    return Array.from(catalog.values()).sort((a, b) => b.openCount - a.openCount || a.name.localeCompare(b.name));
  }, [effectiveShops]);

  const visibleShops = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const normalizedMood = selectedMood.toLowerCase();

    let shops = [...effectiveShops];

    if (selectedFoodId !== "all") {
      shops = shops.filter((shop) => shop.item.id === selectedFoodId);
    }

    if (activeMode === "express") {
      shops = shops.filter((shop) => shop.deliveryMode === "Express");
    }

    if (activeMode === "healthy") {
      shops = shops.filter((shop) => shop.tags.includes("healthy"));
    }

    if (normalizedMood !== "all") {
      shops = shops.filter((shop) => shop.tags.some((tag) => tag.toLowerCase().includes(normalizedMood)));
    }

    if (normalizedSearch) {
      shops = shops.filter((shop) => {
        const haystack = [
          shop.name,
          shop.cuisine,
          shop.item.name,
          shop.item.description,
          shop.offer,
          ...shop.tags
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedSearch);
      });
    }

    if (activeFilter === "Offers") {
      return [...shops].sort((a, b) => Number(Boolean(b.offer)) - Number(Boolean(a.offer)));
    }

    if (activeFilter === "Express") {
      return [...shops].sort((a, b) => (a.deliveryMode === "Express" ? -1 : 1));
    }

    if (activeFilter === "Pure veg") {
      return shops.filter((shop) => shop.veg);
    }

    if (activeFilter === "Healthy") {
      return shops.filter((shop) => shop.tags.includes("healthy"));
    }

    if (activeFilter === "Top rated") {
      return [...shops].sort((a, b) => Number(b.rating) - Number(a.rating));
    }

    if (activeFilter === "Near you") {
      return [...shops].sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return [...shops].sort((a, b) => {
      const aScore =
        (a.isOpen ? 50 : 0) + Number(a.rating) * 10 + a.sponsoredBoost * 5 - a.distanceKm + (a.offer ? 4 : 0);
      const bScore =
        (b.isOpen ? 50 : 0) + Number(b.rating) * 10 + b.sponsoredBoost * 5 - b.distanceKm + (b.offer ? 4 : 0);
      return bScore - aScore;
    });
  }, [activeFilter, activeMode, effectiveShops, searchTerm, selectedFoodId, selectedMood]);

  const reviewShop = useMemo(
    () => effectiveShops.find((shop) => shop.id === reviewShopId) || null,
    [effectiveShops, reviewShopId]
  );

  const openCheckoutReview = (shop) => {
    if (!shop.isOpen) {
      setMessage(`${shop.name} is unavailable: ${shop.availabilityReason}.`);
      return;
    }

    if (deliveryDetails.phone.length !== 10) {
      setMessage("Enter a valid 10 digit delivery contact number.");
      return;
    }

    if (!deliveryDetails.address.trim()) {
      setMessage("Add your delivery address before placing an order.");
      return;
    }

    setMessage("");
    setReviewShopId(shop.id);
  };

  const handleOrder = async (shop) => {
    if (!shop.isOpen) {
      setMessage(`${shop.name} is unavailable: ${shop.availabilityReason}.`);
      return;
    }

    if (deliveryDetails.phone.length !== 10) {
      setMessage("Enter a valid 10 digit delivery contact number.");
      return;
    }

    if (!deliveryDetails.address.trim()) {
      setMessage("Add your delivery address before placing an order.");
      return;
    }

    setOrderingId(shop.id);
    setMessage("Confirming payment...");

    try {
      const bill = calculateBill(shop, tip, priorityMatch);
      const payment = await collectPayment(shop, bill, user);
      const slot = SCHEDULE_SLOTS.find((item) => item.id === scheduleSlot) || SCHEDULE_SLOTS[0];
      const mode = SERVICE_MODES.find((item) => item.id === activeMode) || SERVICE_MODES[0];
      const enhancedDeliveryDetails = {
        ...deliveryDetails,
        noContact,
        groupOrder,
        scheduleSlot: slot.label,
        deliveryMode: mode.title,
        priorityMatch,
        smartPreferences: {
          noContact,
          groupOrder,
          scheduleSlot: slot.label,
          deliveryMode: mode.title,
          priorityMatch
        }
      };

      setMessage("Payment confirmed. Sending order to restaurant.");
      await createOrder(user, shop, enhancedDeliveryDetails, payment, bill);
      setReviewShopId("");
      goTrack();
    } catch (error) {
      setMessage(error.message || "Could not place and pay for this order.");
    } finally {
      setOrderingId(null);
    }
  };

  return (
    <section className="page page-order food-home">
      <DeliverySwitchPanel
        profiles={deliveryProfiles}
        activeProfile={deliveryDetails}
        activeProfileId={activeProfileId}
        onSelect={setActiveProfileId}
        onAdd={addDeliveryProfile}
      />

      <section className="food-hero">
        <div className="food-hero-copy">
          <p className="eyebrow">Minnex now</p>
          <h1>Food delivery that feels fast before you even order.</h1>
          <label className="food-search">
            <span>Search</span>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search biryani, appam, burger, healthy bowls"
            />
          </label>
          <div className="hero-badges">
            <span>Live ETA</span>
            <span>Smart matching</span>
            <span>No-contact ready</span>
          </div>
        </div>
        <aside className="food-hero-card">
          <span>Fast lane</span>
          <strong>20 min</strong>
          <p>Express kitchens, prepaid checkout, and partner-ready pickups.</p>
        </aside>
      </section>

      <section className="service-grid" aria-label="Minnex services">
        {SERVICE_MODES.map((mode) => (
          <button
            key={mode.id}
            className={`service-tile ${activeMode === mode.id ? "is-active" : ""}`}
            onClick={() => setActiveMode(mode.id)}
            type="button"
          >
            <strong>{mode.title}</strong>
            <span>{mode.copy}</span>
          </button>
        ))}
      </section>

      <section className="food-picker-panel" aria-label="Pick food first">
        <div className="food-section-head compact-head">
          <div>
            <p className="eyebrow">Choose food</p>
            <h2>Food first, then the shops that have it.</h2>
          </div>
          <span>{foodCatalog.length} foods</span>
        </div>
        <div className="food-card-rail">
          <button
            className={`food-card-choice food-card-all ${selectedFoodId === "all" ? "is-active" : ""}`}
            onClick={() => setSelectedFoodId("all")}
            type="button"
          >
            <strong>All food</strong>
            <span>{effectiveShops.filter((shop) => shop.isOpen).length} shops open</span>
          </button>
          {foodCatalog.map((food) => (
            <button
              key={food.id}
              className={`food-card-choice ${selectedFoodId === food.id ? "is-active" : ""}`}
              onClick={() => setSelectedFoodId(food.id)}
              style={{ "--food-accent": food.accent }}
              type="button"
            >
              <img src={food.image} alt={food.name} />
              <span>{food.openCount ? `${food.openCount} open` : "Unavailable"}</span>
              <strong>{food.name}</strong>
              <small>{food.description}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="offer-rail" aria-label="Offers and collections">
        {OFFER_RAIL.map((offer) => (
          <article key={offer.title} className="offer-card">
            <span>{offer.title}</span>
            <strong>{offer.copy}</strong>
          </article>
        ))}
      </section>

      <div className="food-section-head">
        <div>
          <p className="eyebrow">Available shops</p>
          <h2>
            {selectedFoodId === "all"
              ? "Shops near you"
              : foodCatalog.find((food) => food.id === selectedFoodId)?.name || "Selected food"}
          </h2>
        </div>
        <span>{visibleShops.length} options</span>
      </div>

      <div className="mood-row" aria-label="Food moods">
        {FOOD_MOODS.map((mood) => (
          <button
            key={mood}
            className={`mood-chip ${selectedMood === mood ? "is-active" : ""}`}
            onClick={() => setSelectedMood(mood)}
            type="button"
          >
            {mood}
          </button>
        ))}
      </div>

      <div className="filter-row" aria-label="Restaurant filters">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            className={`filter-chip ${activeFilter === filter ? "is-active" : ""}`}
            onClick={() => setActiveFilter(filter)}
            type="button"
          >
            {filter}
          </button>
        ))}
      </div>

      {message && <p className="notice notice-error">{message}</p>}

      <section className="delivery-panel delivery-panel-modern">
        <div className="delivery-panel-head">
          <div>
            <p className="eyebrow">Delivery setup</p>
            <h2>Faster checkout, clearer handoff, fewer support issues.</h2>
          </div>
          <button
            className="secondary-button"
            onClick={useCurrentLocation}
            disabled={locating}
            type="button"
          >
            {locating ? "Locating..." : deliveryDetails.location ? "Update location" : "Use current location"}
          </button>
        </div>

        <div className="delivery-form">
          <label>
            <span>Name</span>
            <input
              value={deliveryDetails.name}
              onChange={(event) => updateDeliveryDetails("name", event.target.value)}
              placeholder="Receiver name"
            />
          </label>
          <label>
            <span>Contact</span>
            <input
              value={deliveryDetails.phone}
              onChange={(event) => updateDeliveryDetails("phone", event.target.value)}
              inputMode="numeric"
              placeholder="9876543210"
            />
          </label>
          <label className="delivery-address-field">
            <span>Address</span>
            <textarea
              value={deliveryDetails.address}
              onChange={(event) => updateDeliveryDetails("address", event.target.value)}
              placeholder="House, street, area, landmark"
              rows="3"
            />
          </label>
          <label>
            <span>Notes</span>
            <input
              value={deliveryDetails.notes}
              onChange={(event) => updateDeliveryDetails("notes", event.target.value)}
              placeholder="Gate code, landmark, handoff note"
            />
          </label>
        </div>

        <div className="checkout-preferences">
          <label className="preference-card">
            <input type="checkbox" checked={noContact} onChange={(event) => setNoContact(event.target.checked)} />
            <span>No-contact drop</span>
          </label>
          <label className="preference-card">
            <input type="checkbox" checked={groupOrder} onChange={(event) => setGroupOrder(event.target.checked)} />
            <span>Group order mode</span>
          </label>
          <label className="preference-card">
            <input
              type="checkbox"
              checked={priorityMatch}
              onChange={(event) => setPriorityMatch(event.target.checked)}
            />
            <span>Priority partner match</span>
          </label>
        </div>

        <div className="schedule-row" aria-label="Schedule order">
          {SCHEDULE_SLOTS.map((slot) => (
            <button
              key={slot.id}
              className={`filter-chip ${scheduleSlot === slot.id ? "is-active" : ""}`}
              onClick={() => setScheduleSlot(slot.id)}
              type="button"
            >
              {slot.label}
            </button>
          ))}
        </div>

        {deliveryDetails.location && (
          <p className="privacy-note">
            Location saved: {deliveryDetails.location.lat.toFixed(4)}, {deliveryDetails.location.lng.toFixed(4)}
          </p>
        )}

        <div className="tip-row" aria-label="Delivery tip">
          <span>Tip goes 100% to delivery partner</span>
          <div>
            {TIP_OPTIONS.map((amount) => (
              <button
                key={amount}
                className={`filter-chip ${tip === amount ? "is-active" : ""}`}
                onClick={() => setTip(amount)}
                type="button"
              >
                {amount ? `Rs ${amount}` : "No tip"}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="shop-list modern-shop-list">
        {visibleShops.map((shop) => {
          const bill = calculateBill(shop, tip, priorityMatch);

          return (
            <article className={`shop-card modern-shop-card ${shop.isOpen ? "" : "is-closed"}`} key={shop.id}>
              <div className="shop-image-wrap">
                <img src={shop.image} alt={shop.name} className="shop-image" />
                <div className="shop-image-badges">
                  <span>{shop.deliveryMode}</span>
                  {shop.veg && <span>Pure veg</span>}
                </div>
              </div>
              <div className="shop-content">
                <div className="shop-card-title-row">
                  <div>
                    <p className="shop-cuisine">{shop.cuisine}</p>
                    <h2>{shop.name}</h2>
                  </div>
                  <span className="rating-pill">{shop.rating}</span>
                </div>
                <p className="menu-item-line">{shop.item.name} - {shop.item.description}</p>
                <div className="shop-meta">
                  <span>{shop.eta}</span>
                  <span>{shop.distanceKm.toFixed(1)} km</span>
                  <span>{shop.prepTime}</span>
                  <span>{shop.availabilityReason}</span>
                </div>
                <div className="offer-strip">
                  <span>{shop.offer}</span>
                </div>
                <div className="final-price-strip">
                  <span>Final price</span>
                  <strong>Rs {bill.customerTotal}</strong>
                  <small>Full split appears on the payment review.</small>
                </div>
                <button
                  className="primary-button"
                  onClick={() => openCheckoutReview(shop)}
                  disabled={orderingId === shop.id || !shop.isOpen}
                  style={{ "--button-accent": shop.accent }}
                  type="button"
                >
                  {orderingId === shop.id ? "Processing..." : shop.isOpen ? "Review payment" : "Unavailable"}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {!visibleShops.length && (
        <div className="empty-state compact-empty">
          <h1>No matches</h1>
          <p>Try another search, mood, or service mode.</p>
        </div>
      )}

      {reviewShop && (
        <CheckoutReview
          shop={reviewShop}
          bill={calculateBill(reviewShop, tip, priorityMatch)}
          deliveryDetails={deliveryDetails}
          busy={orderingId === reviewShop.id}
          onClose={() => setReviewShopId("")}
          onConfirm={() => handleOrder(reviewShop)}
        />
      )}
    </section>
  );
}

function DeliverySwitchPanel({ profiles, activeProfile, activeProfileId, onSelect, onAdd }) {
  return (
    <section className="top-delivery-switch" aria-label="Delivery name and address">
      <div className="delivery-switch-copy">
        <p className="eyebrow">Delivering to</p>
        <h2>{activeProfile?.name?.trim() || "Customer"}</h2>
        <p>{getAddressPreview(activeProfile)}</p>
      </div>

      <div className="delivery-switch-actions">
        <label>
          <span>Name and address</span>
          <select value={activeProfileId} onChange={(event) => onSelect(event.target.value)}>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.label} - {profile.name?.trim() || "Customer"}
              </option>
            ))}
          </select>
        </label>
        <button className="secondary-button" onClick={onAdd} type="button">
          Add address
        </button>
      </div>
    </section>
  );
}

function CheckoutReview({ shop, bill, deliveryDetails, busy, onClose, onConfirm }) {
  return (
    <div className="checkout-backdrop" role="presentation">
      <section className="checkout-review" role="dialog" aria-modal="true" aria-label="Payment review">
        <div className="checkout-review-head">
          <div>
            <p className="eyebrow">Payment review</p>
            <h2>{shop.item.name}</h2>
            <span>{shop.name}</span>
          </div>
          <button className="secondary-button" onClick={onClose} disabled={busy} type="button">
            Close
          </button>
        </div>

        <div className="checkout-address-card">
          <span>Deliver to</span>
          <strong>{deliveryDetails.name?.trim() || "Customer"}</strong>
          <p>{deliveryDetails.address}</p>
        </div>

        <div className="checkout-split">
          <BillLine label="Food total" value={bill.subtotal} />
          <BillLine label="Delivery fee" value={bill.deliveryFee} />
          <BillLine label="Platform fee" value={bill.platformFee} />
          {bill.priorityMatchFee > 0 && <BillLine label="Priority partner match" value={bill.priorityMatchFee} />}
          <BillLine label="Delivery partner tip" value={bill.tip} />
          <BillLine label="Final amount" value={bill.customerTotal} strong />
        </div>

        <p className="secure-payment-note">
          Minnex does not store card, UPI, PAN, or Aadhaar full numbers in the app.
        </p>

        <button className="primary-button checkout-pay-button" onClick={onConfirm} disabled={busy} type="button">
          {busy ? "Processing..." : `Pay Rs ${bill.customerTotal}`}
        </button>
      </section>
    </div>
  );
}

function BillLine({ label, value, strong = false }) {
  const Element = strong ? "strong" : "span";

  return (
    <Element>
      <small>{label}</small>
      <b>Rs {value}</b>
    </Element>
  );
}
