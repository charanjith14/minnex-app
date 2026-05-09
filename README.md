# Minnex

Customer ordering app for Minnex. It connects to the shared Firebase project and writes orders into the same Firestore `orders` collection used by Minnex Go and Minnex Biz.

Customers add delivery contact, address, optional notes, and optional current location before placing an order. Those private delivery details are written to `orderDeliveryDetails/{orderId}` so the assigned agent app can use them for delivery.

After an order is delivered, the customer can submit food and delivery-partner ratings. Feedback is written back to the order for Minnex Biz.

## Run

```bash
npm install
npm start
```

Local URL: `http://127.0.0.1:5174/`

Minnex is intentionally a standalone customer app. It does not link users into Minnex Go or Minnex Biz; all handoff happens through the shared Firebase backend.

## Privacy Note

The app code separates delivery contact/address from the public order record. Shared backend rules and indexes are in `backend/`; deploy those before public launch.
