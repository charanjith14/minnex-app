# Minnex Biz

Business control app for Minnex. It connects to the shared Firebase project, monitors all orders, updates status, manages availability, and releases orders back to the shared Minnex Go queue.

Minnex Biz can view customer feedback, food ratings, delivery-partner ratings, and Go partner PAN/Aadhaar verification submissions. Full PAN/Aadhaar numbers are not stored by the app; Biz sees document type, last 4 characters, and approval status.

Customer delivery address, contact, and location are intentionally not shown in Minnex Biz.

## Run

```bash
npm install
npm start
```

Local URL: `http://127.0.0.1:5176/`

Minnex Biz is intentionally a standalone business app. It does not link users into the customer or Go apps; all order and delivery handoff happens through the shared Firebase backend.

## Privacy Note

Minnex Biz avoids delivery contact/address/location. Shared backend rules and indexes live in `C:/Users/chara/OneDrive/Desktop/minnex/backend/`; deploy those before public launch.
