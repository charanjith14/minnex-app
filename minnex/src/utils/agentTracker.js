import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";

const ROUTE = [
  { lat: 17.6868, lng: 83.2185, status: "accepted" },
  { lat: 17.688, lng: 83.2197, status: "preparing" },
  { lat: 17.6893, lng: 83.2211, status: "on the way" },
  { lat: 17.6906, lng: 83.2226, status: "on the way" },
  { lat: 17.692, lng: 83.2242, status: "arriving" }
];

export const startSimulatingMovement = (orderId) => {
  let step = 0;

  const updateLocation = async () => {
    if (step >= ROUTE.length) return;

    const point = ROUTE[step];
    step += 1;

    await updateDoc(doc(db, "orders", orderId), {
      location: { lat: point.lat, lng: point.lng },
      status: point.status
    });
  };

  updateLocation();

  const interval = setInterval(() => {
    updateLocation().catch(() => clearInterval(interval));

    if (step >= ROUTE.length) {
      clearInterval(interval);
    }
  }, 4500);

  return () => clearInterval(interval);
};
