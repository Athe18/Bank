import "dotenv/config";
import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import bcrypt from "bcryptjs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initMongo, dbService, dbState } from "./db.js";

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Trust reverse proxy for Vercel HTTPS cookies
app.set("trust proxy", 1);

// Initialize MongoDB in background
initMongo().catch(() => {});

app.use(express.json());

// Session Configuration
const sessionOptions = {
  name: "securebank.sid",
  secret: process.env.SESSION_SECRET || "securebank-ultra-secret-key-change-in-production-2026",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: process.env.VERCEL ? "none" : "lax",
    secure: !!process.env.VERCEL,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

// If MongoDB URI is available, persist sessions in MongoDB
if (process.env.MONGODB_URI) {
  try {
    sessionOptions.store = MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "sessions",
      ttl: 24 * 60 * 60
    });
  } catch (err) {
    console.warn("[Session Store] Notice:", err.message);
  }
}

app.use(session(sessionOptions));

// Ensure MongoDB is ready for serverless invocations
app.use(async (req, res, next) => {
  try {
    await initMongo();
  } catch {}
  next();
});

// Customer Auth Middleware
function requireCustomer(req, res, next) {
  if (!req.session.customerId) {
    return res.status(401).json({
      message: "Session expired. Please log in again."
    });
  }
  next();
}

// Admin Auth Middleware
function requireAdmin(req, res, next) {
  if (!req.session.isAdmin) {
    return res.status(401).json({
      message: "Admin authentication required."
    });
  }
  next();
}

// ----------------------------------------------------
// Health / Status Check
// ----------------------------------------------------
app.get("/api/status", (req, res) => {
  res.json({
    status: "online",
    databaseEngine: dbState.databaseEngine,
    isMongoConnected: dbState.isMongoConnected,
    timestamp: new Date().toISOString()
  });
});

// ----------------------------------------------------
// Customer Authentication & Account Endpoints
// ----------------------------------------------------

// SIGN UP
app.post("/api/signup", async (req, res, next) => {
  try {
    const { name, email, phone, dob, accountType, password } = req.body;

    if (![name, email, phone, dob, accountType, password].every(
      value => typeof value === "string" && value.trim()
    )) {
      return res.status(400).json({ message: "Please fill in every field." });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    if (!/^\d{10}$/.test(phone.trim())) {
      return res.status(400).json({ message: "Phone number must have 10 digits." });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    if (!["Savings", "Current"].includes(accountType)) {
      return res.status(400).json({ message: "Choose a valid account type." });
    }

    if (
      Number.isNaN(Date.parse(dob)) ||
      dob > new Date().toISOString().slice(0, 10)
    ) {
      return res.status(400).json({ message: "Enter a valid date of birth." });
    }

    const existing = await dbService.findCustomerByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "This email is already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await dbService.createCustomer({
      name,
      email,
      phone,
      dob,
      accountType,
      passwordHash
    });

    res.status(201).json({
      message: "Account created successfully. Please log in.",
      customerId: result.id
    });
  } catch (error) {
    console.error("Signup error:", error);
    if (error.code === 11000 || error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ message: "This email is already registered." });
    }
    next(error);
  }
});

// LOGIN
app.post("/api/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({ message: "Enter your email and password." });
    }

    const customer = await dbService.findCustomerByEmail(email);
    if (!customer || !(await bcrypt.compare(password, customer.password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    req.session.regenerate(async error => {
      if (error) return next(error);

      req.session.customerId = customer.id;

      req.session.save(async saveError => {
        if (saveError) return next(saveError);

        const safeCustomer = await dbService.findCustomerById(customer.id);
        res.json({
          message: "Login successful.",
          customer: safeCustomer
        });
      });
    });
  } catch (error) {
    next(error);
  }
});

// CURRENT CUSTOMER PROFILE
app.get("/api/me", requireCustomer, async (req, res, next) => {
  try {
    const customer = await dbService.findCustomerById(req.session.customerId);
    if (!customer) {
      return res.status(404).json({ message: "Account not found." });
    }
    res.json({ customer });
  } catch (error) {
    next(error);
  }
});

// TRANSACTIONS
app.get("/api/transactions", requireCustomer, async (req, res, next) => {
  try {
    const transactions = await dbService.getTransactionsByCustomerId(req.session.customerId);
    res.json({ transactions });
  } catch (error) {
    next(error);
  }
});

// DEMO TRANSACTION (CREDIT / DEBIT)
app.post("/api/demo-transaction", requireCustomer, async (req, res, next) => {
  try {
    const { description, amount, type } = req.body;
    const value = Number(amount);
    const customerId = req.session.customerId;

    if (
      typeof description !== "string" ||
      !description.trim() ||
      amount === "" ||
      amount === null ||
      !Number.isFinite(value) ||
      value <= 0 ||
      value > 1000000 ||
      !["credit", "debit"].includes(type)
    ) {
      return res.status(400).json({
        message: "Enter a valid description, amount, and transaction type."
      });
    }

    const customer = await dbService.findCustomerById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Account not found." });
    }

    if (type === "debit" && customer.balance < value) {
      return res.status(400).json({ message: "Insufficient balance for this transaction." });
    }

    const newBalance = type === "credit"
      ? customer.balance + value
      : customer.balance - value;

    await dbService.createTransaction({
      customerId,
      customerName: customer.name,
      customerEmail: customer.email,
      description: description.trim(),
      amount: value,
      type,
      newBalance
    });

    const updatedCustomer = await dbService.findCustomerById(customerId);
    res.json({
      message: "Transaction completed successfully.",
      customer: updatedCustomer
    });
  } catch (error) {
    next(error);
  }
});

// DELETE ACCOUNT
app.delete("/api/account", requireCustomer, async (req, res, next) => {
  try {
    const customerId = req.session.customerId;
    const deleted = await dbService.deleteCustomer(customerId);

    if (!deleted) {
      return res.status(404).json({ message: "Account not found." });
    }

    req.session.destroy(error => {
      if (error) return next(error);
      res.clearCookie("securebank.sid");
      res.json({ message: "Account and transaction history deleted successfully." });
    });
  } catch (error) {
    next(error);
  }
});

// LOGOUT
app.post("/api/logout", (req, res, next) => {
  req.session.destroy(error => {
    if (error) return next(error);
    res.clearCookie("securebank.sid");
    res.json({ message: "Logged out successfully." });
  });
});

// ----------------------------------------------------
// ADMIN ENDPOINTS
// ----------------------------------------------------

// ADMIN LOGIN
app.post("/api/admin/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Admin ID / Username and Password required." });
    }

    const cleanUser = username.trim().toLowerCase();
    const admin = await dbService.findAdminByUsername(cleanUser);

    if (!admin) {
      const defaultUser = (process.env.ADMIN_USERNAME || "admin").toLowerCase();
      const defaultPass = process.env.ADMIN_PASSWORD || "admin123";

      if (cleanUser === defaultUser && password === defaultPass) {
        req.session.isAdmin = true;
        req.session.adminUser = defaultUser;
        req.session.adminRole = "Super Admin";
        return req.session.save(() => {
          res.json({
            message: "Admin authenticated successfully.",
            admin: { username: defaultUser, role: "Super Admin" }
          });
        });
      }

      return res.status(401).json({ message: "Invalid Admin ID or Password." });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid Admin ID or Password." });
    }

    req.session.isAdmin = true;
    req.session.adminUser = admin.username;
    req.session.adminRole = admin.role || "Administrator";

    req.session.save(err => {
      if (err) return next(err);
      res.json({
        message: "Admin authenticated successfully.",
        admin: {
          username: admin.username,
          name: admin.name || "Administrator",
          role: admin.role || "admin"
        }
      });
    });
  } catch (error) {
    next(error);
  }
});

// CURRENT ADMIN SESSION
app.get("/api/admin/me", (req, res) => {
  if (!req.session.isAdmin) {
    return res.status(401).json({ message: "Not logged in as admin." });
  }
  res.json({
    isAdmin: true,
    username: req.session.adminUser,
    role: req.session.adminRole,
    databaseEngine: dbState.databaseEngine,
    isMongoConnected: dbState.isMongoConnected
  });
});

// ADMIN STATS OVERVIEW
app.get("/api/admin/stats", requireAdmin, async (req, res, next) => {
  try {
    const stats = await dbService.getAdminStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// ADMIN GET ALL CUSTOMERS
app.get("/api/admin/customers", requireAdmin, async (req, res, next) => {
  try {
    const customers = await dbService.getAllCustomers();
    res.json({ customers });
  } catch (error) {
    next(error);
  }
});

// ADMIN GET ALL TRANSACTIONS
app.get("/api/admin/transactions", requireAdmin, async (req, res, next) => {
  try {
    const transactions = await dbService.getAllTransactions(200);
    res.json({ transactions });
  } catch (error) {
    next(error);
  }
});

// ADMIN ADJUST BALANCE (CREDIT / DEBIT ANY ACCOUNT)
app.post("/api/admin/adjust-balance", requireAdmin, async (req, res, next) => {
  try {
    const { customerId, amount, type, description } = req.body;
    const value = Number(amount);

    if (!customerId || !Number.isFinite(value) || value <= 0 || !["credit", "debit"].includes(type)) {
      return res.status(400).json({ message: "Provide valid customer ID, positive amount, and type (credit/debit)." });
    }

    const customer = await dbService.findCustomerById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer account not found." });
    }

    if (type === "debit" && customer.balance < value) {
      return res.status(400).json({ message: "Cannot debit more than customer's current balance." });
    }

    const newBalance = type === "credit" ? customer.balance + value : customer.balance - value;
    const txDesc = description?.trim() || `Admin manual ${type} adjustment`;

    await dbService.createTransaction({
      customerId,
      customerName: customer.name,
      customerEmail: customer.email,
      description: txDesc,
      amount: value,
      type,
      newBalance
    });

    const updated = await dbService.findCustomerById(customerId);
    res.json({
      message: `Successfully ${type === "credit" ? "credited" : "debited"} ₹${value.toLocaleString()} to ${customer.name}.`,
      customer: updated
    });
  } catch (error) {
    next(error);
  }
});

// ADMIN DELETE CUSTOMER
app.delete("/api/admin/customers/:id", requireAdmin, async (req, res, next) => {
  try {
    const deleted = await dbService.deleteCustomer(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Customer not found." });
    }
    res.json({ message: "Customer account and transaction history deleted successfully." });
  } catch (error) {
    next(error);
  }
});

// ADMIN LOGOUT
app.post("/api/admin/logout", (req, res, next) => {
  req.session.isAdmin = false;
  req.session.adminUser = null;
  req.session.adminRole = null;
  req.session.save(err => {
    if (err) return next(err);
    res.json({ message: "Admin logged out successfully." });
  });
});

// ERROR HANDLER
app.use((error, req, res, next) => {
  console.error("Server error:", error);
  if (res.headersSent) return next(error);
  res.status(500).json({
    message: error.message || "Internal server error."
  });
});

// Export app for Vercel Serverless
export default app;

// Only listen when running standalone / local dev
if (!process.env.VERCEL) {
  app.listen(PORT, "127.0.0.1", () => {
    console.log(`=================================================`);
    console.log(`🚀 SecureBank Server running at http://127.0.0.1:${PORT}`);
    console.log(`🍃 Database Status: ${dbState.databaseEngine}`);
    console.log(`🔑 Default Admin credentials:`);
    console.log(`   ID / Username: ${process.env.ADMIN_USERNAME || "admin"}`);
    console.log(`   Password:      ${process.env.ADMIN_PASSWORD || "admin123"}`);
    console.log(`=================================================`);
  });
}
