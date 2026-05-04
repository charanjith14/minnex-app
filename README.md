# Minnex

A full-stack food delivery platform with three apps — customer ordering, delivery partner management, and business admin dashboard. Built with React, Firebase, Razorpay, and Google Maps.

## Apps

### Minnex (Customer App)
The main customer-facing app for browsing restaurants, placing orders, making payments, and tracking deliveries in real time.

- Restaurant browsing with filters, search, and food-first discovery
- Razorpay checkout with full billing breakdown
- Live order tracking with Google Maps
- Delivery address profiles with GPS location
- Order feedback and AI-powered support tickets
- No-contact delivery, group orders, priority matching

### Minnex Go (Agent/Delivery Partner App)
The delivery partner app for accepting orders, sharing live GPS location, and managing earnings.

- PAN/Aadhaar verification flow
- Real-time order queue with priority scoring
- GPS location sharing (live + auto mode)
- Order status management (picked up, on the way, delivered)
- Earnings breakdown (base, distance, surge, tips)
- Route assist and delivery details

### Minnex Biz (Admin Dashboard)
The business admin panel for managing orders, restaurants, agents, and settlements.

- Live order management with status controls
- Restaurant profile and menu management
- Agent verification approval
- Settlement and revenue tracking
- Customer feedback review

## Tech Stack

- **Frontend:** React 18, Vite
- **Backend:** Firebase (Firestore, Authentication)
- **Payments:** Razorpay
- **Maps:** Google Maps JavaScript API
- **Auth:** Firebase Phone Authentication (OTP)

## Project Structure

```
minnex-app/
├── minnex/              # Customer app (port 5174)
├── minnex agent/        # Delivery partner app (port 5175)
├── minnex admin/        # Admin dashboard (port 5176)
└── README.md
```

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/charanjith14/minnex-app.git
cd minnex-app
```

### 2. Install dependencies

```bash
cd minnex && npm install
cd "../minnex agent" && npm install
cd "../minnex admin" && npm install
```

### 3. Configure environment

Copy `.env.example` to `.env` in each app folder and fill in your keys:

```bash
cp minnex/.env.example minnex/.env
cp "minnex agent/.env.example" "minnex agent/.env"
cp "minnex admin/.env.example" "minnex admin/.env"
```

Required keys:
- Firebase config (API key, project ID, etc.)
- Google Maps API key
- Razorpay key ID

### 4. Firebase setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable **Phone Authentication**
3. Create a **Firestore Database**
4. Upgrade to **Blaze plan** (required for phone auth, still free tier)
5. Set Firestore rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. Run the apps

```bash
# Customer app
cd minnex && npm start

# Agent app (in a new terminal)
cd "minnex agent" && npm start

# Admin app (in a new terminal)
cd "minnex admin" && npm start
```

- Customer app: http://127.0.0.1:5174
- Agent app: http://127.0.0.1:5175
- Admin app: http://127.0.0.1:5176

## How It Works

1. **Customer** places an order and pays via Razorpay
2. **Admin** sees the order, restaurant accepts and starts preparing
3. **Agent** sees the order in the pickup queue, accepts it after verification
4. **Agent** shares live GPS location as they pick up and deliver
5. **Customer** tracks the agent on the map in real time
6. **Agent** marks the order as delivered
7. **Customer** leaves feedback (food, restaurant, and agent ratings)

## License

Private project. All rights reserved.
