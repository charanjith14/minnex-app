import { addDoc, collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export const createOrder = async (user, shop, deliveryDetails, payment = {}, bill = {}) => {
  const createdAtMs = Date.now();
  const customerTotal = Number(bill.customerTotal || shop.price || 0);
  const paymentStatus = payment.mode === "razorpay" ? "client_confirmed" : "demo_confirmed";

  const orderRef = await addDoc(collection(db, "orders"), {
    backendContractVersion: "2026-05-launch",
    dataPlane: "firestore_backend",
    appAccess: {
      createdBy: "customer",
      customerApp: true,
      bizApp: false,
      goApp: false,
      directAppSwitching: false
    },
    userId: user.uid,
    customerRef: `customer-${user.uid.slice(0, 6)}`,
    customerPrivacy: {
      deliveryDetailsVisibleTo: "assigned-agent",
      deliveryDetailsStoredIn: "orderDeliveryDetails",
      contactStoredIn: "orderDeliveryDetails",
      adminCanReadDeliveryAddress: false
    },
    shopId: shop.id,
    shopName: shop.name,
    cuisine: shop.cuisine,
    eta: shop.eta,
    itemId: shop.item?.id || shop.id,
    itemName: shop.item?.name || shop.name,
    itemPrice: Number(shop.item?.price || shop.price || 0),
    price: customerTotal,
    image: shop.image,
    distanceKm: Number(bill.distanceKm || shop.distanceKm || 0),
    availabilitySnapshot: {
      restaurantOpen: Boolean(shop.isOpen),
      reason: shop.availabilityReason || "Open",
      schedule: shop.schedule || null,
      capturedAt: createdAtMs
    },
    billing: {
      subtotal: Number(bill.subtotal || shop.price || 0),
      deliveryFee: Number(bill.deliveryFee || 0),
      platformFee: Number(bill.platformFee || 0),
      priorityMatchFee: Number(bill.priorityMatchFee || 0),
      tip: Number(bill.tip || 0),
      customerTotal,
      paymentStatus
    },
    settlement: {
      commissionRate: Number(bill.commissionRate || shop.commissionRate || 0.2),
      restaurantCommission: Number(bill.restaurantCommission || 0),
      restaurantSettlement: Number(bill.restaurantSettlement || 0),
      agentBasePay: Number(bill.agentBasePay || 0),
      distancePay: Number(bill.distancePay || 0),
      surgePay: Number(bill.surgePay || 0),
      tip: Number(bill.tip || 0),
      agentTotal: Number(bill.agentTotal || 0),
      platformRevenue: Number(bill.platformRevenue || 0),
      status: "pending"
    },
    revenueStreams: {
      restaurantCommission: Number(bill.restaurantCommission || 0),
      deliveryFee: Number(bill.deliveryFee || 0),
      platformFee: Number(bill.platformFee || 0),
      priorityMatchFee: Number(bill.priorityMatchFee || 0),
      adsBoost: Number(shop.sponsoredBoost || 0)
    },
    matching: {
      status: "waiting_for_restaurant",
      priorityScore: 0,
      assignedBy: "backend_queue"
    },
    status: "order placed",
    paid: true,
    paymentStatus,
    paymentId: payment.paymentId || "",
    paymentMode: payment.mode || "demo",
    payment: {
      provider: payment.mode === "razorpay" ? "razorpay" : "demo",
      providerPaymentId: payment.paymentId || "",
      providerOrderId: payment.providerOrderId || "",
      status: paymentStatus,
      verificationStatus: payment.verificationStatus || "demo_payment",
      amountPaise: Math.round(customerTotal * 100),
      currency: "INR",
      capturedAt: payment.paidAt || createdAtMs,
      sensitivePaymentDataStored: false
    },
    paymentSecurity: {
      checkoutProvider: payment.mode === "razorpay" ? "razorpay_checkout" : "demo_checkout",
      cardDataStoredByMinnex: false,
      fullUpiOrCardDetailsStored: false,
      serverWebhookVerificationRequired: payment.mode === "razorpay"
    },
    paidAt: payment.paidAt || createdAtMs,
    restaurantStatus: "new",
    restaurantAcceptedAt: null,
    restaurantRejectedAt: null,
    dispatchStatus: "waiting_for_restaurant",
    agentId: "",
    agentName: "",
    location: null,
    timeline: [
      {
        key: "order_paid",
        label: "Order created and payment confirmed",
        at: createdAtMs,
        by: "customer"
      }
    ],
    createdAtMs,
    createdAt: serverTimestamp()
  });

  await setDoc(doc(db, "orderDeliveryDetails", orderRef.id), {
    orderId: orderRef.id,
    userId: user.uid,
    assignedAgentId: "",
    privacyTier: "restricted_delivery_details",
    readableBy: {
      customerUid: user.uid,
      assignedAgentOnly: true,
      bizApp: false
    },
    deliveryContact: {
      name: deliveryDetails.name.trim() || "Customer",
      phone: deliveryDetails.phone,
      address: deliveryDetails.address.trim(),
      notes: deliveryDetails.notes.trim(),
      location: deliveryDetails.location || null,
      preferences: deliveryDetails.smartPreferences || {
        noContact: Boolean(deliveryDetails.noContact),
        groupOrder: Boolean(deliveryDetails.groupOrder),
        scheduleSlot: deliveryDetails.scheduleSlot || "ASAP",
        deliveryMode: deliveryDetails.deliveryMode || "Food delivery",
        priorityMatch: Boolean(deliveryDetails.priorityMatch)
      }
    },
    createdAtMs,
    createdAt: serverTimestamp()
  });

  return orderRef;
};
