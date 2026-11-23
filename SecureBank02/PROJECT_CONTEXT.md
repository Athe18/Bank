# SecureBank — Complete Project Context & Technical Dossier

> **Single Source of Truth** for developers, architects, and evaluators detailing the origin, architectural decisions, feature implementations, API references, database mechanisms, and deployment specifications for **SecureBank**.

---

## 1. Executive Summary

**SecureBank** is a full-stack digital banking simulation and financial architecture platform. It pairs the high-craft aesthetics of the **Aceternity UI Design & Development Studio** with a secure **Node.js/Express** backend, **MongoDB (Mongoose ODM)** document storage, an **Administrative Control Plane**, and a serverless deployment pipeline ready for **Vercel**.

* **Frontend:** React 19 SPA, bundled by Vite, styled with custom architectural CSS (dashed grid boundaries, floating glassmorphic pill navbar, responsive bento grid).
* **Backend:** Express 5 REST API, `express-session` with `connect-mongo`, 12-round `bcryptjs` encryption, resilient dual-engine persistence (MongoDB primary with local SQLite fallback).
* **Live GitHub Repository:** [https://github.com/Athe18/Bank](https://github.com/Athe18/Bank)

---

## 2. Project Evolution & Changelog

### Phase 1: Environment Audit & Dependency Resolution
* Audited Node.js (`v24.16.0`) and npm (`11.13.0`) runtimes.
* Verified native C++ bindings for `better-sqlite3`.
* Created root proxy runner scripts so `npm run dev` works from either the workspace root or the project subfolder.

### Phase 2: Design Overhaul — Aceternity Studio UI
* Replaced standard banking UI with the minimalist design language from `ui.aceternity.com/template-preview/design-development-studio-template`.
* Added the **Floating Pill Navbar** with section anchors and session indicators.
* Built the **Hero Section** with mountain landscape background, geometric typography (*Plus Jakarta Sans*), and the signature blue highlight pill:
  > **Modern digital banking that `earns trust` in the first scroll**
* Developed the **Process Section** (Step 1 interactive mini-ledger mockup + Step 2 live tech stack card).
* Added the **Showcase Carousel** (Autonomous Security, Real-Time Ledger, MongoDB Cloud, Enterprise Oversight).
* Built the **Testimonials Bento Grid** featuring the prominent **Electric Blue Hero Card** (*Orbit Inference / Daniel Cho*).
* Added the **Bottom Floating Toolbar Dock** for switching between Studio, Customer Portal, Admin Console, and live database status.
* Polished form inputs (removed hardcoded placeholder text, normalized labels).

### Phase 3: Administrative Control Plane
* Built an isolated admin authentication system (`POST /api/admin/login`).
* **Default Admin Credentials:**
  * **Admin ID:** `admin`
  * **Password:** `admin123`
  * Added 1-click **"Auto Fill"** for instant evaluation.
* Built **Admin Management Dashboard**:
  * Live system metrics: Total registered accounts, total bank vault balance (₹), total transactions, active database engine.
  * Searchable and filterable Customer Accounts table.
  * **Balance Adjustment Modal**: Admin can manually deposit (credit) or withdraw (debit) funds to any account with an audit memo.
  * Customer account termination with cascading transaction purge.
  * Global transaction audit ledger tracking all user and admin actions.

### Phase 4: MongoDB Database Integration & Resilient Fallback
* Implemented Mongoose ODM models for `Customer`, `Transaction`, and `Admin`.
* Integrated `.env` configuration for local MongoDB and remote **MongoDB Atlas** connection strings.
* Engineered a **Zero-Downtime Fallback Adapter** in `server/db.js`:
  * If MongoDB is online $\to$ Full Mongoose document persistence. If an empty MongoDB database connects, it automatically migrates local accounts into MongoDB.
  * If MongoDB is offline $\to$ Seamlessly switches to local embedded `better-sqlite3` (WAL mode), preventing server crashes.

### Phase 5: Vercel Serverless Architecture & Deployment
* Converted Express from a long-running daemon to an exportable serverless function via `api/index.js`.
* Added `vercel.json` with rewrite rules routing `/api/*` to the serverless handler and all other routes to Vite's `dist/index.html`.
* Configured `app.set("trust proxy", 1)` for HTTPS cookie transmission across Vercel reverse proxies.
* Integrated `connect-mongo` so serverless Lambda containers share persistent session states in MongoDB.
* Initialized clean git repository, committed project history, and pushed to GitHub (`Athe18/Bank`).

---

## 3. Repository File Anatomy

```text
SecureBank02/
├── .gitignore                   # Excludes node_modules, dist, .env, *.db
├── ARCHITECTURE.md              # Technical end-to-end architecture guide
├── PROJECT_CONTEXT.md           # This comprehensive project context dossier
├── README.md                    # Quickstart and overview documentation
├── package.json                 # Root script runner (proxies to SecureBank02/)
├── api/
│   └── index.js                 # Root-level Vercel serverless entry point
└── SecureBank02/                # Core application directory
    ├── .env                     # Local environment variables
    ├── .gitignore               # Subdirectory git exclusions
    ├── ARCHITECTURE.md          # Architecture guide mirror
    ├── PROJECT_CONTEXT.md       # Project context mirror
    ├── README.md                # Subdirectory README
    ├── index.html               # SPA entry point with Google Fonts
    ├── package.json             # Application dependencies and build scripts
    ├── vercel.json              # Vercel deployment and rewrite configuration
    ├── vite.config.js           # Vite bundler and local /api proxy configuration
    ├── api/
    │   └── index.js             # Subdirectory Vercel serverless entry point
    ├── client/
    │   └── src/
    │       ├── main.jsx         # Full React 19 application (UI, State, Routing)
    │       └── style.css        # Aceternity Studio CSS design system
    └── server/
        ├── .env                 # Backend environment variables
        ├── db.js                # Mongoose schemas, SQLite fallback, dbService
        └── index.js             # Express application, routes, auth middleware
```

---

## 4. Environment Variables Reference

Stored in [`server/.env`](file:///C:/Users/athar/Downloads/SecureBank02/SecureBank02/server/.env):

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Local Express listening port. |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/securebank` | MongoDB connection string (local or MongoDB Atlas `mongodb+srv://...`). |
| `SESSION_SECRET` | `securebank-ultra-secret-key-change-in-production-2026` | Cryptographic secret used to sign the `securebank.sid` cookie. |
| `ADMIN_USERNAME` | `admin` | Admin control center login identifier. |
| `ADMIN_PASSWORD` | `admin123` | Admin control center login password. |

---

## 5. Security & Authentication Architecture

### Credential Handling
* **Customer Passwords:** Hashed with `bcryptjs` using **12 salt rounds** ($2^{12} = 4096$ iterations). Plaintext passwords are never saved, logged, or exposed in API responses.
* **Admin Authentication:** Seeded on server initialization with bcrypt hash. Can also authenticate via fallback environment credentials.

### Session Hardening
* **Cookie Name:** `securebank.sid`
* **Security Flags:**
  * `httpOnly: true`: Blocks client-side JavaScript access via `document.cookie` (XSS mitigation).
  * `sameSite: "lax"` (local) / `"none"` (cross-origin cloud): Protects against CSRF attacks.
  * `secure: true` when running on production HTTPS.
  * `maxAge`: 24 hours.
* **Session Fixation Prevention:** Calls `req.session.regenerate()` upon login to issue a fresh session token.

### Role-Based Authorization
* **`requireCustomer` Middleware:** Inspects `req.session.customerId`. Blocks unauthenticated requests with HTTP `401 Unauthorized`.
* **`requireAdmin` Middleware:** Inspects `req.session.isAdmin === true`. Prevents standard customers from accessing administrative APIs.

---

## 6. Complete API Specification

### Status & Health
* **`GET /api/status`**
  * **Auth:** None
  * **Response:** `{ status: "online", databaseEngine: string, isMongoConnected: boolean, timestamp: string }`

### Customer Endpoints
* **`POST /api/signup`**
  * **Auth:** None
  * **Body:** `{ name, email, phone, dob, accountType, password }`
  * **Response:** `{ message: string, customerId: string }` (HTTP 201)
* **`POST /api/login`**
  * **Auth:** None
  * **Body:** `{ email, password }`
  * **Response:** `{ message: string, customer: CustomerObject }` (HTTP 200, Sets session cookie)
* **`GET /api/me`**
  * **Auth:** Customer Session
  * **Response:** `{ customer: CustomerObject }`
* **`GET /api/transactions`**
  * **Auth:** Customer Session
  * **Response:** `{ transactions: TransactionObject[] }`
* **`POST /api/demo-transaction`**
  * **Auth:** Customer Session
  * **Body:** `{ description: string, amount: number, type: "credit" | "debit" }`
  * **Response:** `{ message: string, customer: CustomerObject }`
* **`DELETE /api/account`**
  * **Auth:** Customer Session
  * **Response:** `{ message: string }` (Deletes account and purges transactions)
* **`POST /api/logout`**
  * **Auth:** None
  * **Response:** `{ message: string }` (Destroys session and clears cookie)

### Admin Endpoints
* **`POST /api/admin/login`**
  * **Auth:** None
  * **Body:** `{ username, password }`
  * **Response:** `{ message: string, admin: { username, role } }`
* **`GET /api/admin/me`**
  * **Auth:** Admin Session
  * **Response:** `{ isAdmin: true, username, role, databaseEngine, isMongoConnected }`
* **`GET /api/admin/stats`**
  * **Auth:** Admin Session
  * **Response:** `{ totalCustomers, totalBalance, totalTransactions, databaseEngine, isMongoConnected, recentTransactions }`
* **`GET /api/admin/customers`**
  * **Auth:** Admin Session
  * **Response:** `{ customers: CustomerObject[] }`
* **`GET /api/admin/transactions`**
  * **Auth:** Admin Session
  * **Response:** `{ transactions: TransactionObject[] }`
* **`POST /api/admin/adjust-balance`**
  * **Auth:** Admin Session
  * **Body:** `{ customerId, amount, type: "credit" | "debit", description }`
  * **Response:** `{ message: string, customer: CustomerObject }`
* **`DELETE /api/admin/customers/:id`**
  * **Auth:** Admin Session
  * **Response:** `{ message: string }`
* **`POST /api/admin/logout`**
  * **Auth:** Admin Session
  * **Response:** `{ message: string }`

---

## 7. Frontend State & Navigation Architecture

The client application is contained in [`client/src/main.jsx`](file:///C:/Users/athar/Downloads/SecureBank02/SecureBank02/client/src/main.jsx) and operates as a stateful Single Page Application:

### Active Views (`page` state)
1. **`home`:** Public studio landing page (Hero with *earns trust* highlight pill, Process cards, Showcase tabs, Testimonials bento grid).
2. **`process`:** Architectural breakdown of design standards and database layers.
3. **`showcase`:** Feature highlights of security, double-entry ledger, MongoDB, and governance.
4. **`reviews`:** Customer and client feedback cards with electric blue hero card.
5. **`signup`:** Customer onboarding form (validates name, email, 10-digit phone, DOB, password).
6. **`login`:** Customer authentication form.
7. **`dashboard`:** Customer banking portal (available balance card, debit/credit transaction simulator, transaction history).
8. **`profile`:** Account settings, user metadata, and permanent account deletion button.
9. **`admin-login`:** Admin portal authentication screen with 1-click credential auto-fill.
10. **`admin-dashboard`:** Full administrative control center (metrics, searchable customer table, balance adjust modal, global transaction audit stream).

### Client UI Helpers
* **`money(amount)`:** Uses `Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })` to format currency into ₹ values (e.g., `₹ 25,000.00`).
* **`api(url, options)`:** Universal fetch wrapper automatically injecting `Content-Type: application/json` and `credentials: "include"`.

---

## 8. Database Architecture: MongoDB & SQLite

### Data Models

#### 1. Customer (`CustomerModel`)
```javascript
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true },
  dob: { type: String, required: true },
  account_type: { type: String, default: "Savings" },
  password: { type: String, required: true }, // 12-round bcrypt hash
  balance: { type: Number, default: 10000 },
  created_at: { type: Date, default: Date.now }
}
```

#### 2. Transaction (`TransactionModel`)
```javascript
{
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  customer_name: { type: String },
  customer_email: { type: String },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ["credit", "debit"], required: true },
  balance_after: { type: Number },
  created_at: { type: Date, default: Date.now }
}
```

#### 3. Admin (`AdminModel`)
```javascript
{
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, default: "System Administrator" },
  role: { type: String, default: "admin" },
  created_at: { type: Date, default: Date.now }
}
```

---

## 9. Runbook & Deployment Guide

### Local Development
```powershell
# 1. Install dependencies (if not already installed)
npm install

# 2. Start both frontend and backend concurrently
npm run dev
```
* **Frontend:** `http://127.0.0.1:5173`
* **Backend:** `http://127.0.0.1:5000`

### Vercel Cloud Deployment
1. Go to [vercel.com/new](https://vercel.com/new).
2. Import **`Athe18/Bank`**.
3. Set **Root Directory** to `SecureBank02`.
4. Add Environment Variables:
   * `MONGODB_URI`: your MongoDB Atlas connection string.
   * `SESSION_SECRET`: your custom production secret.
   * `ADMIN_USERNAME`: `admin`
   * `ADMIN_PASSWORD`: `admin123`
5. Click **Deploy**.

