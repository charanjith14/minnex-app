# Minnex Go

Delivery partner app for Minnex. It connects to the shared Firebase project, reads Minnex Biz-approved pickup orders, accepts assignments, updates status, and shares location into the shared Firestore `orders` collection.

Partners must submit PAN or Aadhaar verification before accepting orders. The app stores only the document type and last 4 characters in `agents/{agentId}` for Minnex Biz review.

Assigned partners can see delivery contact, address, notes, and customer location from `orderDeliveryDetails/{orderId}` only after accepting an order.

## Run

```bash
npm install
npm start
```

Local URL: `http://127.0.0.1:5175/`

Minnex Go is intentionally a standalone delivery-partner app. It does not link partners into the customer or Biz apps; all pickup assignment and status handoff happens through the shared Firebase backend.

## Privacy Note

The UI displays customer delivery details only inside the assigned active delivery view. Shared backend rules and indexes live in `C:/Users/chara/OneDrive/Desktop/minnex/backend/`; deploy those before public launch.
