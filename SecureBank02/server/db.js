import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ----------------------------------------------------
// MongoDB Models Definition
// ----------------------------------------------------
const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true },
  dob: { type: String, required: true },
  account_type: { type: String, default: "Savings" },
  password: { type: String, required: true },
  balance: { type: Number, default: 10000 },
  created_at: { type: Date, default: Date.now }
});

const TransactionSchema = new mongoose.Schema({
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  customer_name: { type: String },
  customer_email: { type: String },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ["credit", "debit"], required: true },
  balance_after: { type: Number },
  created_at: { type: Date, default: Date.now }
});

const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, default: "System Administrator" },
  role: { type: String, default: "admin" },
  created_at: { type: Date, default: Date.now }
});

export const CustomerModel = mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);
export const TransactionModel = mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);
export const AdminModel = mongoose.models.Admin || mongoose.model("Admin", AdminSchema);

// ----------------------------------------------------
// State & Connection Manager
// ----------------------------------------------------
export const dbState = {
  isMongoConnected: false,
  connectionError: null,
  databaseEngine: "SQLite (Fallback)",
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/securebank"
};

const DEFAULT_ADMIN_USER = process.env.ADMIN_USERNAME || "admin";
const DEFAULT_ADMIN_PASS = process.env.ADMIN_PASSWORD || "admin123";

// ----------------------------------------------------
// Fallback SQLite Database Setup (Safe for local dev & Vercel)
// ----------------------------------------------------
let sqliteDb = null;
try {
  const Database = (await import("better-sqlite3")).default;
  const sqlitePath = process.env.VERCEL
    ? path.join("/tmp", "securebank.db")
    : path.join(__dirname, "securebank.db");

  sqliteDb = new Database(sqlitePath);
  sqliteDb.pragma("journal_mode = WAL");
  sqliteDb.pragma("foreign_keys = ON");

  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      dob TEXT NOT NULL,
      account_type TEXT NOT NULL,
      password TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 10000,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Ensure default Admin in SQLite
  const existingAdmin = sqliteDb.prepare("SELECT id FROM admins WHERE username = ?").get(DEFAULT_ADMIN_USER);
  if (!existingAdmin) {
    const hash = bcrypt.hashSync(DEFAULT_ADMIN_PASS, 10);
    sqliteDb.prepare("INSERT INTO admins (username, password, name, role) VALUES (?, ?, ?, ?)").run(
      DEFAULT_ADMIN_USER,
      hash,
      "Super Administrator",
      "admin"
    );
  }
} catch (e) {
  console.warn("[SQLite Fallback] Notice:", e.message);
}

// ----------------------------------------------------
// Serverless-Aware Cached MongoDB Connection
// ----------------------------------------------------
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function initMongo() {
  const uri = process.env.MONGODB_URI || dbState.mongoUri;
  dbState.mongoUri = uri;

  if (cached.conn && mongoose.connection.readyState === 1) {
    dbState.isMongoConnected = true;
    dbState.databaseEngine = "MongoDB (Mongoose)";
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000
    }).then(async m => {
      dbState.isMongoConnected = true;
      dbState.connectionError = null;
      dbState.databaseEngine = "MongoDB (Mongoose)";
      console.log(`[MongoDB] ✅ Connected successfully! Database engine: ${dbState.databaseEngine}`);

      // Seed default admin in MongoDB
      try {
        const existingMongoAdmin = await AdminModel.findOne({ username: DEFAULT_ADMIN_USER });
        if (!existingMongoAdmin) {
          const hash = await bcrypt.hash(DEFAULT_ADMIN_PASS, 10);
          await AdminModel.create({
            username: DEFAULT_ADMIN_USER,
            password: hash,
            name: "Super Administrator",
            role: "admin"
          });
          console.log(`[MongoDB] Seeded default admin account: ${DEFAULT_ADMIN_USER}`);
        }
      } catch (err) {
        console.warn("[MongoDB] Admin check:", err.message);
      }

      return m;
    }).catch(err => {
      cached.promise = null;
      dbState.isMongoConnected = false;
      dbState.connectionError = err.message;
      dbState.databaseEngine = sqliteDb ? "SQLite (Fallback mode)" : "Offline";
      console.warn(`[MongoDB] ⚠️ Could not connect to MongoDB: ${err.message}`);
      return null;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch {
    return null;
  }
}

// ----------------------------------------------------
// Unified Database Operations Service (MongoDB primary, SQLite fallback)
// ----------------------------------------------------
export const dbService = {
  // --- Admin ---
  async findAdminByUsername(username) {
    const cleanUser = username.trim().toLowerCase();
    if (dbState.isMongoConnected) {
      const doc = await AdminModel.findOne({ username: cleanUser }).lean();
      if (doc) return { ...doc, id: doc._id.toString() };
    }
    if (sqliteDb) {
      const row = sqliteDb.prepare("SELECT * FROM admins WHERE username = ?").get(cleanUser);
      return row ? { ...row, id: row.id.toString() } : null;
    }
    return null;
  },

  // --- Customers ---
  async findCustomerByEmail(email) {
    const cleanEmail = email.trim().toLowerCase();
    if (dbState.isMongoConnected) {
      const doc = await CustomerModel.findOne({ email: cleanEmail }).lean();
      if (doc) return { ...doc, id: doc._id.toString() };
      return null;
    }
    if (sqliteDb) {
      const row = sqliteDb.prepare("SELECT * FROM customers WHERE email = ?").get(cleanEmail);
      return row ? { ...row, id: row.id.toString() } : null;
    }
    return null;
  },

  async findCustomerById(id) {
    if (!id) return null;
    if (dbState.isMongoConnected) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const doc = await CustomerModel.findById(id).lean();
        if (doc) {
          const { password, ...safe } = doc;
          return { ...safe, id: doc._id.toString() };
        }
      }
    }
    if (sqliteDb) {
      const row = sqliteDb.prepare(
        "SELECT id, name, email, phone, dob, account_type, balance, created_at FROM customers WHERE id = ?"
      ).get(id);
      return row ? { ...row, id: row.id.toString() } : null;
    }
    return null;
  },

  async createCustomer({ name, email, phone, dob, accountType, passwordHash }) {
    const cleanEmail = email.trim().toLowerCase();
    if (dbState.isMongoConnected) {
      const doc = await CustomerModel.create({
        name: name.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        dob,
        account_type: accountType,
        password: passwordHash,
        balance: 10000
      });
      return { id: doc._id.toString(), doc };
    }

    if (sqliteDb) {
      const result = sqliteDb.prepare(`
        INSERT INTO customers (name, email, phone, dob, account_type, password)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(name.trim(), cleanEmail, phone.trim(), dob, accountType, passwordHash);

      return { id: result.lastInsertRowid.toString() };
    }

    throw new Error("No database connected.");
  },

  async getAllCustomers() {
    if (dbState.isMongoConnected) {
      const docs = await CustomerModel.find().sort({ created_at: -1 }).lean();
      return docs.map(d => {
        const { password, ...safe } = d;
        return { ...safe, id: d._id.toString() };
      });
    }
    if (sqliteDb) {
      const rows = sqliteDb.prepare(
        "SELECT id, name, email, phone, dob, account_type, balance, created_at FROM customers ORDER BY id DESC"
      ).all();
      return rows.map(r => ({ ...r, id: r.id.toString() }));
    }
    return [];
  },

  async updateCustomerBalance(customerId, newBalance) {
    if (dbState.isMongoConnected && mongoose.Types.ObjectId.isValid(customerId)) {
      await CustomerModel.findByIdAndUpdate(customerId, { balance: newBalance });
      return;
    }
    if (sqliteDb) {
      sqliteDb.prepare("UPDATE customers SET balance = ? WHERE id = ?").run(newBalance, customerId);
    }
  },

  async deleteCustomer(customerId) {
    if (dbState.isMongoConnected && mongoose.Types.ObjectId.isValid(customerId)) {
      await TransactionModel.deleteMany({ customer_id: customerId });
      const res = await CustomerModel.findByIdAndDelete(customerId);
      return !!res;
    }
    if (sqliteDb) {
      const runDelete = sqliteDb.transaction(() => {
        sqliteDb.prepare("DELETE FROM transactions WHERE customer_id = ?").run(customerId);
        const res = sqliteDb.prepare("DELETE FROM customers WHERE id = ?").run(customerId);
        return res.changes > 0;
      });
      return runDelete();
    }
    return false;
  },

  // --- Transactions ---
  async getTransactionsByCustomerId(customerId, limit = 50) {
    if (dbState.isMongoConnected && mongoose.Types.ObjectId.isValid(customerId)) {
      const docs = await TransactionModel.find({ customer_id: customerId })
        .sort({ created_at: -1 })
        .limit(limit)
        .lean();
      return docs.map(d => ({
        id: d._id.toString(),
        description: d.description,
        amount: d.amount,
        type: d.type,
        created_at: d.created_at.toISOString()
      }));
    }
    if (sqliteDb) {
      const rows = sqliteDb.prepare(`
        SELECT id, description, amount, type, created_at
        FROM transactions
        WHERE customer_id = ?
        ORDER BY id DESC
        LIMIT ?
      `).all(customerId, limit);
      return rows.map(r => ({ ...r, id: r.id.toString() }));
    }
    return [];
  },

  async getAllTransactions(limit = 100) {
    if (dbState.isMongoConnected) {
      const docs = await TransactionModel.find()
        .sort({ created_at: -1 })
        .limit(limit)
        .populate("customer_id", "name email")
        .lean();
      return docs.map(d => ({
        id: d._id.toString(),
        customer_id: d.customer_id?._id ? d.customer_id._id.toString() : d.customer_id,
        customer_name: d.customer_id?.name || d.customer_name || "Unknown",
        customer_email: d.customer_id?.email || d.customer_email || "Unknown",
        description: d.description,
        amount: d.amount,
        type: d.type,
        created_at: d.created_at ? d.created_at.toISOString() : new Date().toISOString()
      }));
    }
    if (sqliteDb) {
      const rows = sqliteDb.prepare(`
        SELECT t.id, t.customer_id, c.name as customer_name, c.email as customer_email,
               t.description, t.amount, t.type, t.created_at
        FROM transactions t
        LEFT JOIN customers c ON t.customer_id = c.id
        ORDER BY t.id DESC
        LIMIT ?
      `).all(limit);
      return rows.map(r => ({ ...r, id: r.id.toString() }));
    }
    return [];
  },

  async createTransaction({ customerId, customerName, customerEmail, description, amount, type, newBalance }) {
    if (dbState.isMongoConnected && mongoose.Types.ObjectId.isValid(customerId)) {
      await CustomerModel.findByIdAndUpdate(customerId, { balance: newBalance });
      const tx = await TransactionModel.create({
        customer_id: customerId,
        customer_name: customerName,
        customer_email: customerEmail,
        description: description.trim(),
        amount,
        type,
        balance_after: newBalance
      });
      return { id: tx._id.toString() };
    }

    if (sqliteDb) {
      const run = sqliteDb.transaction(() => {
        sqliteDb.prepare("UPDATE customers SET balance = ? WHERE id = ?").run(newBalance, customerId);
        const res = sqliteDb.prepare(`
          INSERT INTO transactions (customer_id, description, amount, type)
          VALUES (?, ?, ?, ?)
        `).run(customerId, description.trim(), amount, type);
        return res.lastInsertRowid;
      });

      const txId = run();
      return { id: txId.toString() };
    }

    throw new Error("No database connected.");
  },

  // --- Admin Stats ---
  async getAdminStats() {
    const customers = await this.getAllCustomers();
    const transactions = await this.getAllTransactions(500);

    const totalCustomers = customers.length;
    const totalBalance = customers.reduce((sum, c) => sum + (Number(c.balance) || 0), 0);
    const totalTransactions = transactions.length;

    return {
      totalCustomers,
      totalBalance,
      totalTransactions,
      databaseEngine: dbState.databaseEngine,
      isMongoConnected: dbState.isMongoConnected,
      mongoUri: dbState.mongoUri.replace(/:([^@]+)@/, ":****@"),
      connectionError: dbState.connectionError,
      recentTransactions: transactions.slice(0, 8)
    };
  }
};
