// Central constants & data shared across screens
export const SHOPS = [
  {
    id: 's1', name: 'The Burger Joint', cuisine: 'American', rating: '4.5', eta: '22 min',
    distanceKm: 1.2, price: 149, offer: '20% OFF', accent: '#ff5a1f',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    item: { id: 'classic-burger', name: 'Classic Smash Burger', price: 149, description: 'Double patty, cheddar, lettuce' },
    schedule: { openHour: 9, closeHour: 23 }, isOpen: true, availabilityReason: 'Open now', sponsoredBoost: 0,
  },
  {
    id: 's2', name: 'Malabar Appam House', cuisine: 'Kerala', rating: '4.7', eta: '30 min',
    distanceKm: 2.1, price: 89, offer: '₹30 OFF', accent: '#10b981',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400',
    item: { id: 'appam-stew', name: 'Appam with Veg Stew', price: 89, description: 'Soft appam with coconut milk stew' },
    schedule: { openHour: 7, closeHour: 22 }, isOpen: true, availabilityReason: 'Open now', sponsoredBoost: 1,
  },
  {
    id: 's3', name: 'Tandoor Table', cuisine: 'North Indian', rating: '4.3', eta: '25 min',
    distanceKm: 0.8, price: 199, offer: 'Free delivery', accent: '#f59e0b',
    image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400',
    item: { id: 'tandoori-thali', name: 'Tandoori Thali', price: 199, description: 'Roti, dal, sabzi, raita, dessert' },
    schedule: { openHour: 10, closeHour: 23 }, isOpen: true, availabilityReason: 'Open now', sponsoredBoost: 2,
  },
  {
    id: 's4', name: 'Kerala Meals Club', cuisine: 'Kerala', rating: '4.8', eta: '35 min',
    distanceKm: 3.4, price: 120, offer: '₹50 OFF 1st order', accent: '#22c55e',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400',
    item: { id: 'fish-curry-meal', name: 'Fish Curry Meal', price: 120, description: 'Rice, fish curry, coconut chutney' },
    schedule: { openHour: 11, closeHour: 22 }, isOpen: true, availabilityReason: 'Open now', sponsoredBoost: 0,
  },
  {
    id: 's5', name: 'Biryani League', cuisine: 'Hyderabadi', rating: '4.6', eta: '28 min',
    distanceKm: 1.9, price: 179, offer: '2+1 deal', accent: '#8b5cf6',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400',
    item: { id: 'hyderabadi-biryani', name: 'Hyderabadi Chicken Biryani', price: 179, description: 'Slow-cooked dum biryani' },
    schedule: { openHour: 10, closeHour: 23 }, isOpen: true, availabilityReason: 'Open now', sponsoredBoost: 3,
  },
  {
    id: 's6', name: 'Green Bowl Studio', cuisine: 'Healthy', rating: '4.4', eta: '20 min',
    distanceKm: 0.6, price: 159, offer: 'Sugar-free', accent: '#06b6d4',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
    item: { id: 'millet-power-bowl', name: 'Millet Power Bowl', price: 159, description: 'High protein, millet base' },
    schedule: { openHour: 8, closeHour: 21 }, isOpen: false, availabilityReason: 'Closed', sponsoredBoost: 0,
  },
];

export const FILTERS = ['All', 'Rating 4.5+', 'Under ₹150', 'Fast (< 25 min)', 'Pure veg'];

export const COLORS = {
  bg: '#0f0f14',
  surface: '#1a1a24',
  surfaceAlt: '#23232f',
  border: 'rgba(255,255,255,0.08)',
  primary: '#ff5a1f',
  primaryLight: 'rgba(255,90,31,0.15)',
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  green: '#22c55e',
  purple: '#8b5cf6',
  amber: '#f59e0b',
};
