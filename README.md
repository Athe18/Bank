# SecureBank — Modern Digital Banking & Studio Platform

A next-generation digital banking web application redesigned with the **Aceternity UI Design & Development Studio** aesthetic, full **Admin Control Center**, and **MongoDB (Mongoose)** document persistence.

---

## 🌟 Key Features & Updates

### 1. Aceternity Studio UI Design
Inspired by [Aceternity Design & Development Studio Template](https://ui.aceternity.com/template-preview/design-development-studio-template):
- **Floating Pill Navbar**: Centered glassmorphic navigation bar with brand badge, quick sections (`Overview`, `Process`, `Showcase`, `Reviews`), and quick access to customer and admin portals.
- **Hero Section**: Mountain landscape backdrop, prominent blue highlight pill (`earns trust`), clear typography, and a ribbon of partner logos (Apple, Google, Stripe, MongoDB, Visa).
- **Process & Momentum Section**: Step `[1]` interactive mini-ledger mockup + Step `[2]` tech stack architecture showcase.
- **Showcase Carousel**: Interactive feature preview covering Autonomous Security, Real-time Ledger, MongoDB Cloud, and Enterprise Governance.
- **Testimonial Bento Grid**: Features the signature **Electric Blue Hero Card** (*Orbit Inference / Daniel Cho*) alongside companion founder testimonials.
- **Bottom Floating Dock**: Quick device and view switcher (`Studio`, `Customer`, `Admin Portal ⚡`, `Database Status`).

---

### 2. Admin Control Center & Oversight
- **Admin Authentication**:
  - **Admin ID / Username:** `admin`
  - **Password:** `admin123`
  - Includes a 1-click **"Auto Fill"** button on the login screen.
- **Key Metrics Dashboard**:
  - Total registered customers
  - Total bank vault balance (sum of all accounts in ₹)
  - Total system transactions logged
  - Live database engine indicator
- **Customer Management**:
  - Live search filter by customer name, email, or phone.
  - Credit / Debit balance adjustment modal with custom notes.
  - Delete customer account and associated ledger.
- **Global Transaction Audit Stream**:
  - Real-time audit log of every debit, credit, and administrative adjustment across all accounts.

---

### 3. MongoDB Integration
- Powered by **Mongoose ODM (`mongoose v9`)** with full schema validation:
  - `CustomerModel` (name, email, phone, dob, account type, password hash, balance, timestamps)
  - `TransactionModel` (customer reference, description, amount, type, audit metadata)
  - `AdminModel` (admin username, password hash, role)
- **Configuration**:
  - Configured in `.env` via `MONGODB_URI`.
  - Default: `mongodb://127.0.0.1:27017/securebank`
  - For MongoDB Atlas, simply paste your connection string into `server/.env`:
    ```env
    MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/securebank?retryWrites=true&w=majority
    ```
- **Zero-Downtime Fallback**:
  - If a local MongoDB daemon is not running yet, the built-in resilient SQLite adapter automatically takes over so you can develop and test without server crashes. Once MongoDB connects, data persists directly to MongoDB.

---

## 🚀 How to Run

### Option 1: From the Root Folder
```powershell
npm run dev
```

### Option 2: From the `SecureBank02` Subfolder
```powershell
cd SecureBank02
npm run dev
```

The application runs:
- **Client (Frontend):** `http://127.0.0.1:5173`
- **Server (Backend API):** `http://127.0.0.1:5000`

---

## 🔑 Login Credentials

| Role | Username / ID | Password | Access |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Full control center, user balances, transaction audit log |
| **Demo Customer** | Register new account or sign in | Set during registration | Customer banking dashboard, balance simulator |

