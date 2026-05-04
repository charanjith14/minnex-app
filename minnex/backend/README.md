# Minnex Shared Backend

Minnex, Minnex Go, and Minnex Biz remain separate frontends. They connect only through the shared Firebase backend:

- `orders`: order state, public order metadata, payment status, settlement metadata, and delivery assignment state.
- `orderDeliveryDetails`: restricted customer name, phone, address, notes, and customer location.
- `restaurants`: restaurant availability, schedule, boosts, and menu stock.
- `agents`: Go partner profile and verification status.
- `supportTickets`: customer support cases for Minnex Biz review.

## Launch Security Contract

- Deploy `firestore.rules` before public launch so privacy is enforced by Firebase, not only by UI code.
- Assign Firebase custom claims before enabling production rules:
  - customers: no role claim needed; ownership is checked with `request.auth.uid`.
  - delivery partners: `minnexRole: "go"`.
  - business/admin users: `minnexRole: "biz"`.
- Keep delivery contact data in `orderDeliveryDetails/{orderId}`. Minnex Biz should not read that collection.
- Store only verification type and last 4 digits for PAN/Aadhaar. Never store full document numbers.
- Use Razorpay Checkout only for tokenized payment collection. Production capture and refunds should be verified by a trusted server or Cloud Function webhook before marking payments as fully settled.

## Deploy

From `C:/Users/chara/OneDrive/Desktop/minnex`:

```bash
firebase deploy --only firestore
```

The included `firestore.indexes.json` supports the current customer tracking, Biz order desk, Go queue, and support-ticket queries.
