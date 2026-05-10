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

const VIBES = [
  { id: "all", label: "All Vibes", icon: "✨" },
  { id: "stress", label: "Stress Relief", icon: "🍛", tags: ["biryani", "north indian"] },
  { id: "workout", label: "Post-Workout", icon: "💪", tags: ["healthy", "protein"] },
  { id: "cheat", label: "Cheat Day", icon: "🍔", tags: ["burgers", "fried"] },
  { id: "wellness", label: "Wellness", icon: "🧘", tags: ["kerala", "millet", "veg"] },
  { id: "quick", label: "Quick Energy", icon: "⚡", tags: ["express", "dosa"] }
];

const MACROS = {
  "classic-burger": { p: "22g", k: "14g", c: "420" },
  "appam-stew": { p: "8g", k: "12g", c: "280" },
  "tandoori-thali": { p: "28g", k: "18g", c: "520" },
  "fish-curry-meal": { p: "32g", k: "15g", c: "480" },
  "hyderabadi-biryani": { p: "24g", k: "22g", c: "650" },
  "millet-power-bowl": { p: "18g", k: "9g", c: "310" }
};

const FILTERS = ["Recommended", "Offers", "Express", "Pure veg", "Healthy", "Top rated", "Near you"];
const TIP_OPTIONS = [0, 20, 40, 60];
const FOOD_MOODS = ["All", "Kerala", "Biryani", "Dosa", "Burgers", "Healthy"];
const PAYMENT_OPTIONS = [
  { id: "upi", label: "UPI" },
  { id: "card", label: "Card" }
];
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
const CONTACT_BOT_TOPICS = [
  { id: "late", label: "Late order", message: "My order is late" },
  { id: "payment", label: "Payment issue", message: "I have a payment issue" },
  { id: "missing", label: "Missing item", message: "Something is missing from my order" },
  { id: "address", label: "Address change", message: "I need to change my address" }
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

const createDemoPayment = (mode = "upi") => ({
  paymentId: `demo-pay-${Date.now()}`,
  provider: mode === "upi" ? "upi" : "demo",
  providerOrderId: "",
  mode,
  verificationStatus: "demo_payment",
  paidAt: Date.now()
});

const calculateBill = (shop, tip = 0, priorityMatch = false, quantity = 1) => {
  const itemPrice = Number(shop.item?.price || shop.price || 0);
  const itemQuantity = Math.max(1, Number(quantity) || 1);
  const subtotal = itemPrice * itemQuantity;
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

  // Sustainability tracking
  const carbonGrams = Math.round(Number(shop.distanceKm || 0) * 120);
  const ecoScore = carbonGrams < 400 ? "A+" : carbonGrams < 800 ? "A" : "B";

  return {
    subtotal,
    itemTotal: subtotal,
    deliveryFee,
    platformFee,
    priorityMatchFee,
    tip: Number(tip || 0),
    customerTotal,
    unitPrice: itemPrice,
    quantity: itemQuantity,
    carbonGrams,
    ecoScore,
    items: [
      {
        id: shop.item?.id || shop.id,
        name: shop.item?.name || shop.name,
        description: shop.item?.description || "",
        price: itemPrice,
        quantity: itemQuantity,
        total: subtotal,
        shopId: shop.id,
        shopName: shop.name
      }
    ],
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

const collectPayment = async (shop, bill, user, paymentMode = "upi") => {
  const key = appEnv.razorpayKeyId;

  if (!key || key.includes("your_")) {
    return createDemoPayment(paymentMode);
  }

  const loaded = await loadRazorpay();

  if (!loaded || !window.Razorpay) {
    return createDemoPayment(paymentMode);
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const options = {
      key,
      amount: Number(bill.customerTotal) * 100,
      currency: "INR",
      name: "Minnex",
      description: shop.name,
      method: {
        upi: paymentMode === "upi",
        card: paymentMode === "card",
        netbanking: paymentMode !== "upi",
        wallet: paymentMode !== "upi"
      },
      prefill: {
        contact: user.phoneNumber || ""
      },
      handler: (response) => {
        settled = true;
        resolve({
          paymentId: response.razorpay_payment_id || `razorpay-${Date.now()}`,
          provider: "razorpay",
          providerOrderId: response.razorpay_order_id || "",
          mode: paymentMode,
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

const getHumanBotReply = (message) => {
  const text = String(message || "").toLowerCase();

  if (text.includes("pay") || text.includes("upi") || text.includes("card") || text.includes("money")) {
    return "I understand. Payment glitches are stressful. If money was debited, please do not pay again right away. Wait about 2 minutes, then check whether the order appeared. If it did not, keep the UPI reference or card transaction ID ready so support can verify it.";
  }

  if (text.includes("missing") || text.includes("wrong") || text.includes("item") || text.includes("food")) {
    return "That is frustrating, especially after waiting for food. Once the order is delivered, keep a clear photo of the package and the items you received. I can help you raise it as a restaurant verification issue from Contact us.";
  }

  if (text.includes("address") || text.includes("location") || text.includes("landmark")) {
    return "No problem. If you have not ordered yet, update Saved addresses from the menu before checkout. If the order is already placed, add the clearest landmark in the notes and use tracking to coordinate with the delivery partner.";
  }

  if (text.includes("late") || text.includes("where") || text.includes("track") || text.includes("delay")) {
    return "I get it. Waiting without clarity is annoying. After checkout, tracking will open automatically and show the current order step. If the ETA is already crossed, come back here and I will help mark it for delay review.";
  }

  return "I am here with you. Tell me what happened in one line, like payment failed, order is late, wrong item, or address change. I will keep the next step simple.";
};

export default function Home({ user, goTrack, onOrderPlaced, cartRequest = 0 }) {
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
  const [selectedMood, setSelectedMood] = useState("All");
  const [selectedFoodId, setSelectedFoodId] = useState("all");
  const [activeMode, setActiveMode] = useState("food");
  const [searchTerm, setSearchTerm] = useState("");
  const [orderingId, setOrderingId] = useState(null);
  const [reviewShopId, setReviewShopId] = useState("");
  const [cart, setCart] = useState({ shopId: "", quantities: {} });
  const [addressOpen, setAddressOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactBotOpen, setContactBotOpen] = useState(false);
  const [botMessages, setBotMessages] = useState([
    {
      role: "ai",
      text: "Hey, I am Minnex AI. Tell me what went wrong, or tap one of the common issues below. I will help you sort it out."
    }
  ]);
  const [paymentMode, setPaymentMode] = useState("upi");
  const [message, setMessage] = useState("");
  const [locating, setLocating] = useState(false);
  const [restaurantProfiles, setRestaurantProfiles] = useState({});
  const [tip, setTip] = useState(0);
  const [scheduleSlot, setScheduleSlot] = useState("asap");
  const [noContact, setNoContact] = useState(true);
  const [groupOrder, setGroupOrder] = useState(false);
  const [priorityMatch, setPriorityMatch] = useState(true);
  const [dietMode, setDietMode] = useState(false);
  const [selectedVibe, setSelectedVibe] = useState("all");
  const [weather, setWeather] = useState("sunny"); // Simulated weather
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

    // Diet Mode Filtering (High Protein focus for now)
    if (dietMode) {
      shops = shops.filter(shop => {
        const macro = MACROS[shop.item.id];
        return macro && parseInt(macro.p) >= 15; // Only show high protein
      });
    }

    // Vibe Filtering
    if (selectedVibe !== "all") {
      const vibe = VIBES.find(v => v.id === selectedVibe);
      if (vibe) {
        shops = shops.filter(shop => 
          vibe.tags.some(tag => 
            shop.tags.some(st => st.toLowerCase().includes(tag)) || 
            shop.cuisine.toLowerCase().includes(tag) ||
            (vibe.id === "quick" && shop.deliveryMode === "Express")
          )
        );
      }
    }

    return [...shops].sort((a, b) => {
      const aScore =
        (a.isOpen ? 50 : 0) + Number(a.rating) * 10 + a.sponsoredBoost * 5 - a.distanceKm + (a.offer ? 4 : 0);
      const bScore =
        (b.isOpen ? 50 : 0) + Number(b.rating) * 10 + b.sponsoredBoost * 5 - b.distanceKm + (b.offer ? 4 : 0);
      return bScore - aScore;
    });
  }, [activeFilter, activeMode, effectiveShops, searchTerm, selectedFoodId, selectedMood, dietMode, selectedVibe]);

  const reviewShop = useMemo(
    () => effectiveShops.find((shop) => shop.id === reviewShopId) || null,
    [effectiveShops, reviewShopId]
  );

  const cartItems = useMemo(
    () =>
      Object.entries(cart.quantities)
        .map(([shopId, quantity]) => {
          const shop = effectiveShops.find((item) => item.id === shopId);
          return shop ? { shop, quantity } : null;
        })
        .filter(Boolean),
    [cart.quantities, effectiveShops]
  );
  const cartQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartShop = cartItems[0]?.shop || null;
  const cartBill = cartShop ? calculateBill(cartShop, tip, priorityMatch, cartQuantity) : null;

  const getCartQuantity = (shopId) => cart.quantities[shopId] || 0;

  const setShopQuantity = (shop, nextQuantity) => {
    if (!shop.isOpen) {
      setMessage(`${shop.name} is unavailable: ${shop.availabilityReason}.`);
      return;
    }

    const quantity = Math.max(0, Number(nextQuantity) || 0);

    setCart(
      quantity
        ? {
            shopId: shop.id,
            quantities: { [shop.id]: quantity }
          }
        : { shopId: "", quantities: {} }
    );
    setMessage("");
  };

  const openCartReview = () => {
    if (!cartShop) {
      setMessage("Add food to cart first.");
      return;
    }

    if (deliveryDetails.phone.length !== 10 || !deliveryDetails.address.trim()) {
      setMessage("Add delivery address and contact.");
      setAddressOpen(true);
      return;
    }

    setReviewShopId(cartShop.id);
  };

  const openContactBot = () => {
    setMenuOpen(false);
    setContactBotOpen(true);
  };

  const askBot = (topic) => {
    const selectedTopic = CONTACT_BOT_TOPICS.find((item) => item.id === topic) || CONTACT_BOT_TOPICS[0];

    setBotMessages((current) => [
      ...current,
      { role: "user", text: selectedTopic.message },
      { role: "ai", text: getHumanBotReply(selectedTopic.id) }
    ]);
  };

  const sendBotMessage = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setBotMessages((current) => [
      ...current,
      { role: "user", text: trimmed },
      { role: "ai", text: getHumanBotReply(trimmed) }
    ]);
  };

  useEffect(() => {
    if (!cartRequest) return;
    openCartReview();
  }, [cartRequest]);

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
      const quantity = getCartQuantity(shop.id) || 1;
      const bill = calculateBill(shop, tip, priorityMatch, quantity);
      const payment = await collectPayment(shop, bill, user, paymentMode);
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
      setCart({ shopId: "", quantities: {} });
      (onOrderPlaced || goTrack)?.();
    } catch (error) {
      setMessage(error.message || "Could not place and pay for this order.");
    } finally {
      setOrderingId(null);
    }
  };

  return (
    <section className="page page-order mobile-storefront">
      <section className="swiggy-stage">
        <div className="mobile-location-row">
          <button className="location-button" onClick={() => setAddressOpen(true)} type="button">
            <strong>{deliveryDetails.label || "Home"}</strong>
            <span>{getAddressPreview(deliveryDetails)}</span>
          </button>
          <button className="menu-top-button" onClick={() => setMenuOpen(true)} type="button" aria-label="Open menu">
            <span />
            <span />
            <span />
          </button>
        </div>

        <div className={`weather-header ${weather}`}>
          <div className="hero-premium-section">
            <span className="premium-badge">⚡ AI POWERED</span>
            <h1>India's Smartest Delivery</h1>
            <p>We batch orders with AI to save you 40% on delivery fees and 15 mins on every order.</p>
            <div className="trust-badges">
              <span className="trust-pill">🚀 22m Avg</span>
              <span className="trust-pill">🛡️ Insured</span>
              <span className="trust-pill">💎 Premium</span>
            </div>
          </div>
        </div>

        {groupOrder && (
          <div className="party-presence">
            <div className="avatar-stack">
              <div className="avatar" style={{background: 'var(--coral)'}}>A</div>
              <div className="avatar" style={{background: 'var(--green)'}}>M</div>
              <div className="avatar" style={{background: 'var(--purple)'}}>S</div>
              <div className="avatar">+2</div>
            </div>
            <span style={{fontSize: '0.8rem', fontWeight: 700, color: 'var(--purple)'}}>
              3 friends are adding items to the cart
            </span>
          </div>
        )}

        <div className={`diet-toggle-bar ${dietMode ? 'is-active' : ''}`}>
          <div className="diet-icon">🥗</div>
          <div className="diet-info">
            <strong>Diet Mode</strong>
            <span>{dietMode ? 'Showing only High Protein (15g+)' : 'Personalize your nutrition'}</span>
          </div>
          <label className="switch">
            <input type="checkbox" checked={dietMode} onChange={e => setDietMode(e.target.checked)} />
            <span className="slider"></span>
          </label>
        </div>

        <div className="vibe-search-container">
          <p className="eyebrow" style={{marginLeft: 0}}>What's your vibe today?</p>
          <div className="vibe-chip-row">
            {VIBES.map(vibe => (
              <button 
                key={vibe.id} 
                className={`vibe-chip ${selectedVibe === vibe.id ? 'is-active' : ''}`}
                onClick={() => setSelectedVibe(vibe.id)}
              >
                {vibe.icon} {vibe.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mobile-service-tabs" aria-label="Minnex services">
          {SERVICE_MODES.slice(0, 3).map((mode) => (
            <button
              key={mode.id}
              className={activeMode === mode.id ? "is-active" : ""}
              onClick={() => setActiveMode(mode.id)}
              type="button"
            >
              <strong>{mode.title.replace(" delivery", "")}</strong>
              <span>{mode.id === "express" ? "AI Smart Batching ⚡" : mode.id === "party" ? "Group Meals" : "Food Delivery"}</span>
            </button>
          ))}
        </div>

        <div className="mobile-search-row">
          <label className="mobile-search">
            <span>Search</span>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search for biryani"
            />
          </label>
          <button
            className={`veg-switch ${activeFilter === "Pure veg" ? "is-active" : ""}`}
            onClick={() => setActiveFilter(activeFilter === "Pure veg" ? FILTERS[0] : "Pure veg")}
            type="button"
          >
            VEG
          </button>
        </div>

        <div className="deal-rail" aria-label="Deals">
          {OFFER_RAIL.map((offer) => (
            <article key={offer.title} className="deal-card">
              <span>{offer.title}</span>
              <strong>{offer.copy}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="category-rail" aria-label="Food categories">
        <button
          className={`category-pill ${selectedFoodId === "all" ? "is-active" : ""}`}
          onClick={() => setSelectedFoodId("all")}
          type="button"
        >
          <span>All</span>
        </button>
        {foodCatalog.map((food) => (
          <button
            key={food.id}
            className={`category-pill ${selectedFoodId === food.id ? "is-active" : ""}`}
            onClick={() => setSelectedFoodId(food.id)}
            type="button"
          >
            <img src={food.image} alt="" />
            <span>{food.name.split(" ").slice(0, 2).join(" ")}</span>
          </button>
        ))}
      </section>

      <div className="mobile-filter-row" aria-label="Restaurant filters">
        {FILTERS.slice(0, 5).map((filter) => (
          <button
            key={filter}
            className={activeFilter === filter ? "is-active" : ""}
            onClick={() => setActiveFilter(filter)}
            type="button"
          >
            {filter}
          </button>
        ))}
      </div>

      {message && <p className="notice notice-error mobile-notice">{message}</p>}

      <div className="mobile-section-head">
        <h2>Recommended for you</h2>
        <span>{visibleShops.length} options</span>
      </div>

      <div className="restaurant-feed">
        {visibleShops.map((shop) => {
          const quantity = getCartQuantity(shop.id);
          const bill = calculateBill(shop, tip, priorityMatch, Math.max(quantity, 1));

          return (
            <article className={`feed-card ${shop.isOpen ? "" : "is-closed"}`} key={shop.id}>
              <div className="feed-image-wrap">
                <img src={shop.image} alt={shop.name} />
                <span>{shop.offer}</span>
              </div>
              <div className="feed-card-body">
                <div>
                  <div className="feed-title-row">
                    <h3>{shop.name}</h3>
                    <span className="rating-pill">{shop.rating}</span>
                  </div>
                  <div style={{display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px'}}>
                    <p style={{margin: 0}}>{shop.cuisine}</p>
                    {shop.isOpen && <span className="kitchen-live-tag"><span className="live-pulse" /> Kitchen Live</span>}
                  </div>
                  <small>
                    {shop.eta} - {shop.distanceKm.toFixed(1)} km - {shop.availabilityReason}
                  </small>
                  {MACROS[shop.item.id] && (
                    <div className="macro-badges">
                      <span className="macro-badge macro-p">P: {MACROS[shop.item.id].p}</span>
                      <span className="macro-badge macro-k">K: {MACROS[shop.item.id].k}</span>
                      <span className="macro-badge macro-c">CAL: {MACROS[shop.item.id].c}</span>
                    </div>
                  )}
                </div>
                <div className="menu-order-row">
                  <div>
                    <strong>{shop.item.name}</strong>
                    <span>Rs {shop.item.price}</span>
                  </div>
                  <QuantityControl
                    quantity={quantity}
                    disabled={!shop.isOpen}
                    onDecrease={() => setShopQuantity(shop, quantity - 1)}
                    onIncrease={() => setShopQuantity(shop, quantity + 1)}
                  />
                </div>
                {quantity > 0 && (
                  <div className="line-total">
                    <span>{quantity} selected</span>
                    <strong>Rs {bill.subtotal}</strong>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {!visibleShops.length && (
        <div className="empty-state compact-empty">
          <h1>No matches</h1>
          <p>Try another search or filter.</p>
        </div>
      )}

      {cartShop && cartBill && (
        <CartBar
          shop={cartShop}
          quantity={cartQuantity}
          bill={cartBill}
          onOpen={openCartReview}
          onClear={() => setShopQuantity(cartShop, 0)}
        />
      )}

      {addressOpen && (
        <AddressSheet
          profiles={deliveryProfiles}
          activeProfile={deliveryDetails}
          activeProfileId={activeProfileId}
          locating={locating}
          noContact={noContact}
          groupOrder={groupOrder}
          priorityMatch={priorityMatch}
          scheduleSlot={scheduleSlot}
          tip={tip}
          onSelect={setActiveProfileId}
          onAdd={addDeliveryProfile}
          onClose={() => setAddressOpen(false)}
          onFieldChange={updateDeliveryDetails}
          onLocate={useCurrentLocation}
          onNoContactChange={setNoContact}
          onGroupOrderChange={setGroupOrder}
          onPriorityMatchChange={setPriorityMatch}
          onScheduleChange={setScheduleSlot}
          onTipChange={setTip}
        />
      )}

      {menuOpen && (
        <MobileMenuSheet
          cartQuantity={cartQuantity}
          onClose={() => setMenuOpen(false)}
          onAddress={() => {
            setMenuOpen(false);
            setAddressOpen(true);
          }}
          onCart={() => {
            setMenuOpen(false);
            openCartReview();
          }}
          onContact={openContactBot}
        />
      )}

      {contactBotOpen && (
        <ContactBotSheet
          messages={botMessages}
          onAsk={askBot}
          onSend={sendBotMessage}
          onClose={() => setContactBotOpen(false)}
        />
      )}

      {reviewShop && (
        <CheckoutReview
          shop={reviewShop}
          bill={calculateBill(reviewShop, tip, priorityMatch, getCartQuantity(reviewShop.id) || 1)}
          deliveryDetails={deliveryDetails}
          quantity={getCartQuantity(reviewShop.id) || 1}
          paymentMode={paymentMode}
          busy={orderingId === reviewShop.id}
          onPaymentModeChange={setPaymentMode}
          onClose={() => setReviewShopId("")}
          onConfirm={() => handleOrder(reviewShop)}
        />
      )}

      <nav className="bottom-nav">
        <button className={`bottom-nav-item ${activeMode === 'food' ? 'is-active' : ''}`} onClick={() => setActiveMode('food')}>
          <div className="bottom-nav-icon">🏠</div>
          <span>Home</span>
        </button>
        <button className={`bottom-nav-item ${activeMode === 'express' ? 'is-active' : ''}`} onClick={() => setActiveMode('express')}>
          <div className="bottom-nav-icon">⚡</div>
          <span>Express</span>
        </button>
        <button className="bottom-nav-item" onClick={goTrack}>
          <div className="bottom-nav-icon">📍</div>
          <span>Track</span>
        </button>
        <button className="bottom-nav-item" onClick={() => setAddressOpen(true)}>
          <div className="bottom-nav-icon">👤</div>
          <span>Account</span>
        </button>
      </nav>
    </section>
  );
}

function MobileMenuSheet({ cartQuantity, onClose, onAddress, onCart, onContact }) {
  return (
    <div className="menu-sheet-backdrop" role="presentation" onClick={onClose}>
      <section
        className="mobile-menu-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Minnex menu"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" />
        <div className="mobile-menu-head">
          <div>
            <p className="eyebrow">Menu</p>
            <h2>Minnex</h2>
          </div>
          <button className="secondary-button" onClick={onClose} type="button">
            Close
          </button>
        </div>
        <div className="mobile-menu-options">
          <button onClick={onAddress} type="button">
            <span className="menu-option-icon menu-option-address" aria-hidden="true" />
            <strong>Saved addresses</strong>
          </button>
          <button onClick={onCart} type="button">
            <span className="cart-glyph" aria-hidden="true" />
            <strong>{cartQuantity ? `View cart (${cartQuantity})` : "View cart"}</strong>
          </button>
          <button onClick={onContact} type="button">
            <span className="menu-option-icon menu-option-support" aria-hidden="true" />
            <strong>Contact us</strong>
          </button>
        </div>
      </section>
    </div>
  );
}

function ContactBotSheet({ messages, onAsk, onSend, onClose }) {
  const [draft, setDraft] = useState("");

  const submitDraft = () => {
    const nextDraft = draft.trim();
    if (!nextDraft) return;
    onSend(nextDraft);
    setDraft("");
  };

  return (
    <div className="menu-sheet-backdrop" role="presentation" onClick={onClose}>
      <section
        className="contact-bot-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Minnex AI contact support"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" />
        <div className="mobile-menu-head">
          <div>
            <p className="eyebrow">Contact us</p>
            <h2>Minnex AI</h2>
          </div>
          <button className="secondary-button" onClick={onClose} type="button">
            Close
          </button>
        </div>
        <div className="bot-chat">
          {messages.map((message, index) => (
            <div
              className={`bot-bubble ${message.role === "user" ? "bot-bubble-user" : "bot-bubble-ai"}`}
              key={`${message.role}-${index}`}
            >
              <span>{message.role === "user" ? "You" : "Minnex AI"}</span>
              <p>{message.text}</p>
            </div>
          ))}
        </div>
        <div className="bot-topic-grid" aria-label="Choose issue">
          {CONTACT_BOT_TOPICS.map((topic) => (
            <button key={topic.id} onClick={() => onAsk(topic.id)} type="button">
              {topic.label}
            </button>
          ))}
        </div>
        <div className="bot-composer">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submitDraft();
              }
            }}
            placeholder="Type your issue"
          />
          <button onClick={submitDraft} type="button">
            Send
          </button>
        </div>
      </section>
    </div>
  );
}

function QuantityControl({ quantity, disabled, onDecrease, onIncrease }) {
  if (!quantity) {
    return (
      <button className="add-button" onClick={onIncrease} disabled={disabled} type="button">
        {disabled ? "Closed" : "ADD"}
      </button>
    );
  }

  return (
    <div className="quantity-control" aria-label="Food quantity">
      <button onClick={onDecrease} type="button" aria-label="Decrease quantity">
        -
      </button>
      <strong>{quantity}</strong>
      <button onClick={onIncrease} type="button" aria-label="Increase quantity">
        +
      </button>
    </div>
  );
}

function CartBar({ shop, quantity, bill, onOpen, onClear }) {
  return (
    <aside className="floating-cart" aria-label="Cart summary">
      <div>
        <strong>{shop.name}</strong>
        <span>
          {quantity} {quantity === 1 ? "item" : "items"} - Rs {bill.customerTotal}
        </span>
      </div>
      <button className="view-cart-button" onClick={onOpen} type="button">
        <span className="cart-glyph" aria-hidden="true" />
        View Cart
      </button>
      <button className="cart-clear-button" onClick={onClear} type="button" aria-label="Clear cart">
        x
      </button>
    </aside>
  );
}

function AddressSheet({
  profiles,
  activeProfile,
  activeProfileId,
  locating,
  noContact,
  groupOrder,
  priorityMatch,
  scheduleSlot,
  tip,
  onSelect,
  onAdd,
  onClose,
  onFieldChange,
  onLocate,
  onNoContactChange,
  onGroupOrderChange,
  onPriorityMatchChange,
  onScheduleChange,
  onTipChange
}) {
  return (
    <div className="checkout-backdrop address-backdrop" role="presentation">
      <section className="address-sheet" role="dialog" aria-modal="true" aria-label="Delivery address">
        <div className="sheet-handle" />
        <div className="checkout-review-head">
          <div>
            <p className="eyebrow">Saved address</p>
            <h2>{activeProfile?.label || "Home"}</h2>
          </div>
          <button className="secondary-button" onClick={onClose} type="button">
            Done
          </button>
        </div>

        <div className="delivery-switch-actions address-picker">
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
            Add
          </button>
        </div>

        <div className="delivery-form compact-delivery-form">
          <label>
            <span>Name</span>
            <input
              value={activeProfile.name}
              onChange={(event) => onFieldChange("name", event.target.value)}
              placeholder="Receiver name"
            />
          </label>
          <label>
            <span>Contact</span>
            <input
              value={activeProfile.phone}
              onChange={(event) => onFieldChange("phone", event.target.value)}
              inputMode="numeric"
              placeholder="9876543210"
            />
          </label>
          <label className="delivery-address-field">
            <span>Address</span>
            <textarea
              value={activeProfile.address}
              onChange={(event) => onFieldChange("address", event.target.value)}
              placeholder="House, street, area, landmark"
              rows="3"
            />
          </label>
          <label>
            <span>Notes</span>
            <input
              value={activeProfile.notes}
              onChange={(event) => onFieldChange("notes", event.target.value)}
              placeholder="Gate code or landmark"
            />
          </label>
        </div>

        <button className="location-enable-button" onClick={onLocate} disabled={locating} type="button">
          {locating ? "Locating..." : activeProfile.location ? "Update location" : "Enable location"}
        </button>

        <div className="checkout-preferences">
          <label className="preference-card">
            <input type="checkbox" checked={noContact} onChange={(event) => onNoContactChange(event.target.checked)} />
            <span>No-contact</span>
          </label>
          <label className="preference-card">
            <input type="checkbox" checked={groupOrder} onChange={(event) => onGroupOrderChange(event.target.checked)} />
            <span>Group order</span>
          </label>
          <label className="preference-card">
            <input
              type="checkbox"
              checked={priorityMatch}
              onChange={(event) => onPriorityMatchChange(event.target.checked)}
            />
            <span>Priority</span>
          </label>
        </div>

        <div className="schedule-row" aria-label="Schedule order">
          {SCHEDULE_SLOTS.map((slot) => (
            <button
              key={slot.id}
              className={`filter-chip ${scheduleSlot === slot.id ? "is-active" : ""}`}
              onClick={() => onScheduleChange(slot.id)}
              type="button"
            >
              {slot.label}
            </button>
          ))}
        </div>

        <div className="tip-row" aria-label="Delivery tip">
          <span>Delivery tip</span>
          <div>
            {TIP_OPTIONS.map((amount) => (
              <button
                key={amount}
                className={`filter-chip ${tip === amount ? "is-active" : ""}`}
                onClick={() => onTipChange(amount)}
                type="button"
              >
                {amount ? `Rs ${amount}` : "No tip"}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
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

function CheckoutReview({
  shop,
  bill,
  deliveryDetails,
  quantity,
  paymentMode,
  busy,
  onPaymentModeChange,
  onClose,
  onConfirm
}) {
  return (
    <div className="checkout-backdrop" role="presentation">
      <section className="checkout-review" role="dialog" aria-modal="true" aria-label="Payment review">
        <div className="checkout-review-head">
          <div>
            <p className="eyebrow">Cart</p>
            <h2>Final list</h2>
            <span>{shop.name}</span>
          </div>
          <button className="secondary-button" onClick={onClose} disabled={busy} type="button">
            Close
          </button>
        </div>

        <div className="cart-review-item">
          <img src={shop.image} alt={shop.item.name} />
          <div>
            <strong>{shop.item.name}</strong>
            <span>{shop.item.description}</span>
          </div>
          <b>
            {quantity} x Rs {bill.unitPrice}
          </b>
        </div>

        <div className="checkout-address-card">
          <span>Deliver to</span>
          <strong>{deliveryDetails.name?.trim() || "Customer"}</strong>
          <p>{deliveryDetails.address}</p>
        </div>

        <div className="eco-tracker">
          <div className="eco-icon">🌱</div>
          <div className="eco-info">
            <span>Sustainability Impact</span>
            <strong>Eco Score: {bill.ecoScore} ({bill.carbonGrams}g CO2e)</strong>
          </div>
        </div>

        <div className="payment-options" aria-label="Payment option">
          {PAYMENT_OPTIONS.map((option) => (
            <button
              key={option.id}
              className={paymentMode === option.id ? "is-active" : ""}
              onClick={() => onPaymentModeChange(option.id)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="checkout-split">
          <BillLine label="Food total" value={bill.subtotal} />
          <BillLine label="Delivery fee" value={bill.deliveryFee} />
          <BillLine label="Platform fee" value={bill.platformFee} />
          {bill.priorityMatchFee > 0 && <BillLine label="Priority partner match" value={bill.priorityMatchFee} />}
          <BillLine label="Delivery partner tip" value={bill.tip} />
          <BillLine label="Final amount" value={bill.customerTotal} strong />
        </div>

        <button className="primary-button checkout-pay-button" onClick={onConfirm} disabled={busy} type="button">
          {busy ? "Processing..." : `Pay by ${paymentMode.toUpperCase()} Rs ${bill.customerTotal}`}
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
