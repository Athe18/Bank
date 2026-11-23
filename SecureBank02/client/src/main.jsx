import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Shield,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  User,
  Users,
  CreditCard,
  TrendingUp,
  CheckCircle2,
  DollarSign,
  Activity,
  Layers,
  Search,
  Plus,
  Trash2,
  LogOut,
  ExternalLink,
  ChevronRight,
  Sliders,
  Sparkles,
  Laptop,
  Code,
  Eye,
  AlertCircle,
  X,
  RefreshCw,
  Server
} from "lucide-react";
import "./style.css";

// Helper for API calls
async function api(url, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      credentials: "include",
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers
      }
    });
  } catch {
    throw new Error("Unable to reach backend server. Please verify port 5000 is running.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}

const money = amount =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(amount || 0);

function App() {
  // Navigation & Page State
  // Pages: "home", "process", "showcase", "reviews", "login", "signup", "dashboard", "profile", "admin-login", "admin-dashboard"
  const [page, setPage] = useState("home");
  
  // Auth States
  const [customer, setCustomer] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [dbInfo, setDbInfo] = useState({ databaseEngine: "Detecting...", isMongoConnected: false });
  
  // Customer Data
  const [transactions, setTransactions] = useState([]);
  const [payment, setPayment] = useState({ description: "", amount: "", type: "debit" });
  
  // Admin Data
  const [adminStats, setAdminStats] = useState(null);
  const [allCustomers, setAllCustomers] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedAdjustCustomer, setSelectedAdjustCustomer] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ amount: "", type: "credit", description: "" });
  
  // Forms
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    accountType: "Savings",
    password: ""
  });
  const [adminLoginForm, setAdminLoginForm] = useState({ username: "admin", password: "admin123" });
  
  // Interactive UI states
  const [showcaseTab, setShowcaseTab] = useState("security");
  const [mockBalance, setMockBalance] = useState(25000);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  function notify(msg) {
    setNotice(msg);
    setError("");
    setTimeout(() => setNotice(""), 4500);
  }

  function reportError(err) {
    setError(err);
    setNotice("");
    setTimeout(() => setError(""), 6000);
  }

  // Initial load: check customer and admin sessions, check status
  useEffect(() => {
    // Health / DB status
    api("/api/status")
      .then(res => setDbInfo(res))
      .catch(() => {});

    // Check Customer Session
    api("/api/me")
      .then(async res => {
        if (res && res.customer) {
          setCustomer(res.customer);
          const txRes = await api("/api/transactions");
          setTransactions(txRes.transactions || []);
        }
      })
      .catch(() => {});

    // Check Admin Session
    api("/api/admin/me")
      .then(res => {
        if (res && res.isAdmin) {
          setAdmin({ username: res.username, role: res.role });
          loadAdminDashboard();
        }
      })
      .catch(() => {});
  }, []);

  async function loadCustomerDashboard() {
    try {
      const meRes = await api("/api/me");
      setCustomer(meRes.customer);
      const txRes = await api("/api/transactions");
      setTransactions(txRes.transactions || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadAdminDashboard() {
    try {
      const stats = await api("/api/admin/stats");
      setAdminStats(stats);
      setDbInfo({ databaseEngine: stats.databaseEngine, isMongoConnected: stats.isMongoConnected });
      
      const custRes = await api("/api/admin/customers");
      setAllCustomers(custRes.customers || []);

      const txRes = await api("/api/admin/transactions");
      setAllTransactions(txRes.transactions || []);
    } catch (e) {
      console.error("Admin load error:", e);
    }
  }

  // Customer Login
  async function handleCustomerLogin(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api("/api/login", {
        method: "POST",
        body: JSON.stringify(loginForm)
      });
      setCustomer(res.customer);
      await loadCustomerDashboard();
      setPage("dashboard");
      notify("Welcome back, " + res.customer.name.split(" ")[0] + "!");
    } catch (err) {
      reportError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Customer Signup
  async function handleCustomerSignup(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api("/api/signup", {
        method: "POST",
        body: JSON.stringify(signupForm)
      });
      notify(res.message);
      setLoginForm({ email: signupForm.email, password: "" });
      setPage("login");
    } catch (err) {
      reportError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Customer Transaction
  async function handleCustomerTransaction(e) {
    e.preventDefault();
    if (!payment.description.trim() || !payment.amount || Number(payment.amount) <= 0) {
      reportError("Please enter a valid description and positive amount.");
      return;
    }
    setBusy(true);
    try {
      const res = await api("/api/demo-transaction", {
        method: "POST",
        body: JSON.stringify({
          description: payment.description,
          amount: Number(payment.amount),
          type: payment.type
        })
      });
      setCustomer(res.customer);
      await loadCustomerDashboard();
      setPayment({ description: "", amount: "", type: "debit" });
      notify("Transaction completed successfully!");
    } catch (err) {
      reportError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Customer Logout
  async function handleCustomerLogout() {
    setBusy(true);
    try {
      await api("/api/logout", { method: "POST" });
      setCustomer(null);
      setTransactions([]);
      setPage("home");
      notify("Logged out successfully.");
    } catch (err) {
      reportError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Delete Customer Account
  async function handleDeleteCustomerAccount() {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete your account and transaction ledger? This cannot be undone."
    );
    if (!confirmDelete) return;

    setBusy(true);
    try {
      const res = await api("/api/account", { method: "DELETE" });
      setCustomer(null);
      setTransactions([]);
      setPage("home");
      notify(res.message || "Account permanently deleted.");
    } catch (err) {
      reportError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Admin Login
  async function handleAdminLogin(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify(adminLoginForm)
      });
      setAdmin(res.admin);
      await loadAdminDashboard();
      setPage("admin-dashboard");
      notify("Admin authenticated successfully.");
    } catch (err) {
      reportError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Admin Logout
  async function handleAdminLogout() {
    setBusy(true);
    try {
      await api("/api/admin/logout", { method: "POST" });
      setAdmin(null);
      setPage("home");
      notify("Admin session ended.");
    } catch (err) {
      reportError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Admin Adjust Customer Balance
  async function handleAdminBalanceAdjust(e) {
    e.preventDefault();
    if (!selectedAdjustCustomer || !adjustForm.amount || Number(adjustForm.amount) <= 0) {
      reportError("Please enter a valid amount.");
      return;
    }
    setBusy(true);
    try {
      const res = await api("/api/admin/adjust-balance", {
        method: "POST",
        body: JSON.stringify({
          customerId: selectedAdjustCustomer.id,
          amount: Number(adjustForm.amount),
          type: adjustForm.type,
          description: adjustForm.description || `Admin ${adjustForm.type} adjustment`
        })
      });
      notify(res.message);
      setSelectedAdjustCustomer(null);
      setAdjustForm({ amount: "", type: "credit", description: "" });
      await loadAdminDashboard();
    } catch (err) {
      reportError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Admin Delete Customer
  async function handleAdminDeleteCustomer(customerId, customerName) {
    const ok = window.confirm(`Permanently remove customer "${customerName}" and all associated transactions?`);
    if (!ok) return;

    setBusy(true);
    try {
      const res = await api(`/api/admin/customers/${customerId}`, { method: "DELETE" });
      notify(res.message);
      await loadAdminDashboard();
    } catch (err) {
      reportError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Filter customers for admin table
  const filteredCustomers = allCustomers.filter(c => {
    const q = customerSearch.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.phone && c.phone.includes(q));
  });

  return (
    <div>
      {/* Mountain Top Photo Backdrop (Screenshot 1) */}
      <div className="mountain-backdrop" />

      {/* Floating Notifications */}
      {notice && (
        <div className="alert-toast success">
          <CheckCircle2 size={18} />
          <span>{notice}</span>
          <button onClick={() => setNotice("")}><X size={14} /></button>
        </div>
      )}
      {error && (
        <div className="alert-toast error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError("")}><X size={14} /></button>
        </div>
      )}

      {/* Floating Aceternity Pill Navbar (Screenshot 1) */}
      <header className="navbar-wrapper">
        <nav className="pill-navbar">
          <button className="nav-brand" onClick={() => setPage("home")}>
            <div className="nav-brand-logo">
              <Shield size={16} />
            </div>
            <span>Secure<strong>Bank</strong></span>
          </button>

          <div className="nav-links-cluster">
            <button
              className={`nav-link-btn ${page === "home" ? "active" : ""}`}
              onClick={() => setPage("home")}
            >
              Overview
            </button>
            <span className="nav-dot">·</span>
            <button
              className={`nav-link-btn ${page === "process" ? "active" : ""}`}
              onClick={() => setPage("process")}
            >
              Process
            </button>
            <span className="nav-dot">·</span>
            <button
              className={`nav-link-btn ${page === "showcase" ? "active" : ""}`}
              onClick={() => setPage("showcase")}
            >
              Showcase
            </button>
            <span className="nav-dot">·</span>
            <button
              className={`nav-link-btn ${page === "reviews" ? "active" : ""}`}
              onClick={() => setPage("reviews")}
            >
              Reviews
            </button>

            {customer && (
              <>
                <span className="nav-dot">·</span>
                <button
                  className={`nav-link-btn ${page === "dashboard" ? "active" : ""}`}
                  onClick={() => setPage("dashboard")}
                >
                  My Bank
                </button>
              </>
            )}

            <span className="nav-dot">·</span>
            <button
              className={`nav-admin-badge ${page.startsWith("admin") ? "active" : ""}`}
              onClick={() => setPage(admin ? "admin-dashboard" : "admin-login")}
            >
              <Lock size={12} />
              <span>Admin</span>
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {admin ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  className="nav-admin-badge"
                  style={{ background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" }}
                  onClick={() => setPage("admin-dashboard")}
                >
                  ⚡ Admin Panel
                </button>
                <button className="nav-link-btn" onClick={handleAdminLogout} title="Exit Admin">
                  <LogOut size={16} />
                </button>
              </div>
            ) : customer ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button className="nav-user-pill" onClick={() => setPage("profile")}>
                  <div className="nav-avatar">{customer.name.charAt(0)}</div>
                  <span>{customer.name.split(" ")[0]}</span>
                </button>
                <button className="nav-link-btn" onClick={handleCustomerLogout} title="Sign Out">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button className="nav-link-btn" onClick={() => setPage("login")}>
                  Sign in
                </button>
                <button className="nav-cta-blue" onClick={() => setPage("signup")}>
                  Open Account
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Main Page Framing with Architectural Dashed Lines */}
      <div className="page-container">
        <main className="dashed-frame">

          {/* ==================================================== */}
          {/* VIEW: HOME & STUDIO OVERVIEW (Screenshots 1, 2, 3, 4) */}
          {/* ==================================================== */}
          {page === "home" && (
            <>
              {/* HERO SECTION (Screenshot 1) */}
              <section className="hero-section">
                <div className="hero-pill-tag">
                  <Sparkles size={13} color="#2563eb" />
                  <span>Next-Generation Financial Architecture · 2026</span>
                </div>

                <h1 className="hero-title">
                  Modern digital banking that <span className="highlight-pill">earns trust</span> in the first scroll
                </h1>

                <p className="hero-desc">
                  SecureBank is engineered with precision design and enterprise financial architecture. 
                  Experience frictionless account management, real-time double-entry ledgers, and an intuitive administrative control plane.
                </p>

                <div className="hero-actions">
                  <button className="btn-primary-pill" onClick={() => setPage(customer ? "dashboard" : "signup")}>
                    <span>{customer ? "Go to Dashboard" : "Open Free Account"}</span>
                    <ArrowUpRight size={16} />
                  </button>
                  <button className="btn-secondary-pill" onClick={() => setPage(admin ? "admin-dashboard" : "admin-login")}>
                    <Lock size={15} />
                    <span>Admin Control Plane</span>
                  </button>
                </div>
              </section>

              <div className="dashed-divider" />

              {/* SECTION: A PROCESS TUNED FOR MOMENTUM (Screenshot 2) */}
              <section className="section-wrapper">
                <div className="section-header">
                  <h2>A process tuned for momentum</h2>
                  <p>Design, build, polish, and stay in sync. Nothing gets lost in the handoff.</p>
                </div>

                <div className="split-cards-grid">
                  {/* Card 1: Design with attention to detail */}
                  <div className="feature-box">
                    <div className="feature-box-preview">
                      <div className="mock-dashboard">
                        <div className="mock-topbar">
                          <span>SecureBank Core v2.4</span>
                          <span style={{ color: "#10b981", fontWeight: 600 }}>● Online</span>
                        </div>
                        <div className="mock-balance-pill">
                          <div>
                            <small style={{ fontSize: "10px", color: "#15803d", display: "block" }}>LIVE ACCOUNT LEDGER</small>
                            <strong>₹ {mockBalance.toLocaleString("en-IN")}</strong>
                          </div>
                          <button
                            onClick={() => setMockBalance(b => b + 5000)}
                            style={{
                              background: "#22c55e",
                              color: "white",
                              borderRadius: "6px",
                              padding: "4px 8px",
                              fontSize: "11px",
                              fontWeight: 600
                            }}
                          >
                            + Quick Test ₹5k
                          </button>
                        </div>
                        <div className="mock-row">
                          <div className="mock-btn">Double-Entry Ledger</div>
                          <div className="mock-btn">Session Guard</div>
                          <div className="mock-btn">Bcrypt 12 Rounds</div>
                        </div>
                      </div>
                    </div>
                    <div className="feature-step-footer">
                      <div className="step-badge blue">1</div>
                      <p>Designing with top notch attention to detail for every pixel and transaction flow.</p>
                    </div>
                  </div>

                  {/* Card 2: Development with the latest stack */}
                  <div className="feature-box">
                    <div className="feature-box-preview">
                      <div className="stack-tags-grid">
                        <div className="stack-tag">
                          <span className="stack-dot green" />
                          <span>Cloud Ledger Architecture</span>
                        </div>
                        <div className="stack-tag">
                          <span className="stack-dot blue" />
                          <span>React 19 + Vite Bundler</span>
                        </div>
                        <div className="stack-tag">
                          <span className="stack-dot amber" />
                          <span>Express REST Services</span>
                        </div>
                        <div className="stack-tag">
                          <span className="stack-dot purple" />
                          <span>Admin Control Plane</span>
                        </div>
                      </div>
                      <div style={{ marginTop: "14px", padding: "10px 12px", background: "white", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px", color: "#475569" }}>
                        <strong>System Reliability:</strong>{" "}
                        <span style={{ color: "#10b981", fontWeight: 600 }}>
                          99.99% Uptime · Enterprise Tier
                        </span>
                      </div>
                    </div>
                    <div className="feature-step-footer">
                      <div className="step-badge amber">2</div>
                      <p>Development with the latest stack and tools, performance optimized and scalable.</p>
                    </div>
                  </div>
                </div>
              </section>

              <div className="dashed-divider" />

              {/* SHOWCASE CAROUSEL (Screenshot 3) */}
              <section className="showcase-section">
                <h2 className="showcase-title">
                  We've worked with some of the <span className="highlight-blue">best companies</span> around the world.
                </h2>

                <div className="showcase-tabs">
                  <button
                    className={`showcase-tab-btn ${showcaseTab === "security" ? "active" : ""}`}
                    onClick={() => setShowcaseTab("security")}
                  >
                    Autonomous Security
                  </button>
                  <button
                    className={`showcase-tab-btn ${showcaseTab === "ledger" ? "active" : ""}`}
                    onClick={() => setShowcaseTab("ledger")}
                  >
                    Real-Time Ledger
                  </button>
                  <button
                    className={`showcase-tab-btn ${showcaseTab === "vault" ? "active" : ""}`}
                    onClick={() => setShowcaseTab("vault")}
                  >
                    Vault Architecture
                  </button>
                  <button
                    className={`showcase-tab-btn ${showcaseTab === "admin" ? "active" : ""}`}
                    onClick={() => setShowcaseTab("admin")}
                  >
                    Admin Oversight
                  </button>
                </div>

                <div className="showcase-card">
                  {showcaseTab === "security" && (
                    <div>
                      <div style={{ display: "inline-block", padding: "3px 10px", background: "#eff6ff", color: "#2563eb", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, marginBottom: "12px" }}>
                        Autonomous AI & Cryptographic Guardrails
                      </div>
                      <h3>End-to-End Financial Hardening</h3>
                      <p>
                        Every customer account is sealed with 12-round salted bcrypt key derivation. 
                        HTTP-only cookie session tokens safeguard against XSS attacks, preventing unauthorized session hijacking.
                      </p>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button className="btn-primary-pill" onClick={() => setPage("signup")}>
                          Create Protected Account
                        </button>
                      </div>
                    </div>
                  )}

                  {showcaseTab === "ledger" && (
                    <div>
                      <div style={{ display: "inline-block", padding: "3px 10px", background: "#f0fdf4", color: "#16a34a", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, marginBottom: "12px" }}>
                        Instant Transaction Ledger
                      </div>
                      <h3>Atomic Double-Entry Simulation</h3>
                      <p>
                        Simulate debit and credit operations in real-time. Balance recalculation and audit trail records are created synchronously, guaranteeing zero balance drift.
                      </p>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button className="btn-primary-pill" onClick={() => setPage(customer ? "dashboard" : "login")}>
                          Open Banking Console
                        </button>
                      </div>
                    </div>
                  )}

                  {showcaseTab === "vault" && (
                    <div>
                      <div style={{ display: "inline-block", padding: "3px 10px", background: "#ecfdf5", color: "#059669", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, marginBottom: "12px" }}>
                        Cloud Vault Infrastructure
                      </div>
                      <h3>High-Availability Distributed Vault</h3>
                      <p>
                        Engineered for enterprise scale with automated failover, cryptographic audit replication, and guaranteed transaction consistency across all customer operations.
                      </p>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button className="btn-secondary-pill" onClick={() => setPage("process")}>
                          Explore Architecture
                        </button>
                      </div>
                    </div>
                  )}

                  {showcaseTab === "admin" && (
                    <div>
                      <div style={{ display: "inline-block", padding: "3px 10px", background: "#fffbeb", color: "#d97706", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, marginBottom: "12px" }}>
                        Enterprise Governance
                      </div>
                      <h3>Super Admin Management Console</h3>
                      <p>
                        Inspect every customer record, monitor global bank vault totals, manually credit/debit balances, and view the global audit stream with dedicated administrative authorization.
                      </p>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button className="btn-primary-pill" onClick={() => setPage(admin ? "admin-dashboard" : "admin-login")}>
                          Open Admin Portal ⚡
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <div className="dashed-divider" />

              {/* TESTIMONIALS BENTO GRID (Screenshot 4) */}
              <section className="testimonials-section">
                <div className="section-header">
                  <h2>Industry Leaders on SecureBank</h2>
                  <p>Read why financial engineering teams and founders choose SecureBank.</p>
                </div>

                <div className="testimonials-grid">
                  {/* Card 1 */}
                  <div className="testimonial-card">
                    <p className="testimonial-quote">
                      "Excellent communication and craft. Open to ideas, calm under scope changes, and delivered exceptional digital banking reliability."
                    </p>
                    <div className="testimonial-author">
                      <div className="testimonial-avatar">MC</div>
                      <div className="testimonial-meta">
                        <strong>Marcus Chen</strong>
                        <span>CTO at Harbor Labs</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: HERO BLUE CARD (Screenshot 4) */}
                  <div className="testimonial-card hero-blue-card">
                    <div>
                      <div className="company-pill">
                        <Sparkles size={13} />
                        <span>Orbit Inference</span>
                      </div>
                      <p className="testimonial-quote">
                        “I'd highly recommend SecureBank for a site redesign. They turned our rough shell into a polished product with impeccable taste, real partnership, and the adaptability you need in a startup. We scoped a few pages; they delivered so well we expanded the engagement.”
                      </p>
                    </div>
                    <div className="testimonial-author">
                      <div className="testimonial-avatar">DC</div>
                      <div className="testimonial-meta">
                        <strong>Daniel Cho</strong>
                        <span>Head of Product at Orbit Inference</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="testimonial-card">
                    <p className="testimonial-quote">
                      "The best front-end partner we've had. They took the brief and shipped a product our team is thoroughly proud of."
                    </p>
                    <div className="testimonial-author">
                      <div className="testimonial-avatar">EV</div>
                      <div className="testimonial-meta">
                        <strong>Elena Vargas</strong>
                        <span>Founder at Northline</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 4 */}
                  <div className="testimonial-card">
                    <p className="testimonial-quote">
                      "Quick to respond, very professional, and shipped the whole banking flow within record time. Looking forward to the next collaboration."
                    </p>
                    <div className="testimonial-author">
                      <div className="testimonial-avatar">KS</div>
                      <div className="testimonial-meta">
                        <strong>Kenji Sato</strong>
                        <span>Founder / CTO at Parallax AI</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 5 */}
                  <div className="testimonial-card">
                    <p className="testimonial-quote">
                      "Talented, communicative, and fast across the board. The architecture, ledger speed, and admin controls are clean and powerful."
                    </p>
                    <div className="testimonial-author">
                      <div className="testimonial-avatar">SA</div>
                      <div className="testimonial-meta">
                        <strong>Sofia Almeida</strong>
                        <span>Founder at Atelier Peak</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* ==================================================== */}
          {/* VIEW: PROCESS PAGE (Screenshot 2 Deep Dive) */}
          {/* ==================================================== */}
          {page === "process" && (
            <section className="section-wrapper">
              <div className="section-header">
                <h2>Our Architecture & Development Process</h2>
                <p>Engineered for high performance, maximum security, and developer clarity.</p>
              </div>

              <div className="split-cards-grid" style={{ marginBottom: "28px" }}>
                <div className="feature-box">
                  <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "10px" }}>1. Modern UI / UX Architecture</h3>
                  <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.6", marginBottom: "16px" }}>
                    Inspired by the Aceternity Design & Development Studio philosophy: high-contrast typography, subtle dashed grid framing, floating pill navigation, and responsive bento cards.
                  </p>
                  <div className="mock-btn" style={{ textAlign: "left", padding: "10px" }}>
                    ✦ Plus Jakarta Sans typography<br />
                    ✦ Floating glassmorphic navbar<br />
                    ✦ Architectural dashed container grids
                  </div>
                </div>

                <div className="feature-box">
                  <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "10px" }}>2. Enterprise Ledger Architecture</h3>
                  <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.6", marginBottom: "16px" }}>
                    Engineered with atomic transactional consistency for customer profiles, transactions, and administrator actions. High-availability redundancy guarantees uninterrupted zero-downtime execution.
                  </p>
                  <div className="mock-btn" style={{ textAlign: "left", padding: "10px" }}>
                    ✦ Atomic transaction consistency<br />
                    🔒 Hash-salted bcrypt credentials<br />
                    🛡️ High-availability resilient storage
                  </div>
                </div>
              </div>

              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <button className="btn-primary-pill" onClick={() => setPage("home")}>
                  ← Back to Main Page
                </button>
              </div>
            </section>
          )}

          {/* ==================================================== */}
          {/* VIEW: SHOWCASE / REVIEWS SECTIONS */}
          {/* ==================================================== */}
          {page === "showcase" && (
            <section className="section-wrapper">
              <div className="section-header">
                <h2>Platform Showcase & Capabilities</h2>
                <p>Everything you need in a modern fintech application.</p>
              </div>
              <div className="showcase-card" style={{ maxWidth: "100%" }}>
                <h3>Complete Full-Stack Banking Stack</h3>
                <p>Includes customer registration, session authorization, debit/credit transactions, and real-time administrative auditing.</p>
                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                  <button className="btn-primary-pill" onClick={() => setPage("signup")}>Open Demo Account</button>
                  <button className="btn-secondary-pill" onClick={() => setPage("admin-login")}>Open Admin Portal</button>
                </div>
              </div>
            </section>
          )}

          {page === "reviews" && (
            <section className="testimonials-section">
              <div className="section-header">
                <h2>Client Testimonials</h2>
                <p>See why founders love our design and development quality.</p>
              </div>
              <div className="testimonials-grid">
                <div className="testimonial-card hero-blue-card">
                  <div className="company-pill"><Sparkles size={13} /> Orbit Inference</div>
                  <p className="testimonial-quote">
                    “They turned our rough shell into a polished product with impeccable taste, real partnership, and ironclad security.”
                  </p>
                  <div className="testimonial-author">
                    <div className="testimonial-avatar">DC</div>
                    <div className="testimonial-meta">
                      <strong>Daniel Cho</strong>
                      <span>Head of Product</span>
                    </div>
                  </div>
                </div>
                <div className="testimonial-card">
                  <p className="testimonial-quote">"Top notch attention to detail. Fast, reliable, and secure."</p>
                  <div className="testimonial-author">
                    <div className="testimonial-avatar">MC</div>
                    <div className="testimonial-meta">
                      <strong>Marcus Chen</strong>
                      <span>CTO at Harbor Labs</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ==================================================== */}
          {/* VIEW: ADMIN LOGIN (ID & PASSWORD) */}
          {/* ==================================================== */}
          {page === "admin-login" && (
            <section className="section-wrapper" style={{ display: "flex", justifyContent: "center" }}>
              <div className="modal-content" style={{ maxWidth: "440px" }}>
                <div className="modal-header">
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", letterSpacing: "0.05em" }}>
                      AUTHENTICATED ACCESS
                    </span>
                    <h3>Admin Control Center</h3>
                  </div>
                  <Lock size={20} color="#2563eb" />
                </div>

                {/* Preset Credentials Box with 1-Click Auto-fill */}
                <div className="admin-demo-creds">
                  <div>
                    <strong>Default Credentials:</strong><br />
                    <span>ID: <code>admin</code> | Pass: <code>admin123</code></span>
                  </div>
                  <button
                    type="button"
                    className="btn-fill-creds"
                    onClick={() => setAdminLoginForm({ username: "admin", password: "admin123" })}
                  >
                    Auto Fill
                  </button>
                </div>

                <form onSubmit={handleAdminLogin}>
                  <div className="form-group">
                    <label>Admin ID / Username</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="Enter admin ID"
                      value={adminLoginForm.username}
                      onChange={e => setAdminLoginForm({ ...adminLoginForm, username: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Admin Password</label>
                    <input
                      type="password"
                      className="form-control"
                      required
                      placeholder="Enter admin password"
                      value={adminLoginForm.password}
                      onChange={e => setAdminLoginForm({ ...adminLoginForm, password: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary-pill"
                    style={{ width: "100%", justifyContent: "center", marginTop: "10px" }}
                    disabled={busy}
                  >
                    <Lock size={15} />
                    <span>{busy ? "Authenticating..." : "Sign In to Admin Portal →"}</span>
                  </button>

                  <div style={{ textAlign: "center", marginTop: "18px" }}>
                    <button
                      type="button"
                      style={{ fontSize: "12px", color: "#64748b" }}
                      onClick={() => setPage("home")}
                    >
                      ← Return to Public Site
                    </button>
                  </div>
                </form>
              </div>
            </section>
          )}

          {/* ==================================================== */}
          {/* VIEW: ADMIN DASHBOARD (ADMIN PAGE) */}
          {/* ==================================================== */}
          {page === "admin-dashboard" && (
            <section className="admin-view-container">
              {/* Header */}
              <div className="admin-header">
                <div className="admin-title-area">
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", letterSpacing: "0.06em" }}>
                    ENTERPRISE CONTROL PLANE
                  </span>
                  <h1>Admin Management Dashboard</h1>
                  <p>Full administrative oversight across customer accounts, balances, and system audit ledgers.</p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div className="db-status-pill mongo">
                    <span className="pulse-dot" />
                    <span>System Operational · 256-Bit SSL</span>
                  </div>

                  <button
                    className="btn-secondary-pill"
                    onClick={loadAdminDashboard}
                    title="Refresh Live Data"
                  >
                    <RefreshCw size={14} />
                    <span>Refresh</span>
                  </button>

                  <button
                    className="btn-secondary-pill"
                    style={{ color: "#ef4444" }}
                    onClick={handleAdminLogout}
                  >
                    <LogOut size={14} />
                    <span>Exit Admin</span>
                  </button>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="admin-metrics-grid">
                <div className="admin-metric-card">
                  <div className="metric-label">
                    <span>Total Customers</span>
                    <Users size={16} color="#2563eb" />
                  </div>
                  <div className="metric-value">{adminStats ? adminStats.totalCustomers : allCustomers.length}</div>
                  <div className="metric-sub">Registered accounts</div>
                </div>

                <div className="admin-metric-card">
                  <div className="metric-label">
                    <span>Total Vault Balance</span>
                    <DollarSign size={16} color="#10b981" />
                  </div>
                  <div className="metric-value">
                    {adminStats ? money(adminStats.totalBalance) : "₹ 0.00"}
                  </div>
                  <div className="metric-sub">Sum of all customer balances</div>
                </div>

                <div className="admin-metric-card">
                  <div className="metric-label">
                    <span>Total Transactions</span>
                    <Activity size={16} color="#f59e0b" />
                  </div>
                  <div className="metric-value">{adminStats ? adminStats.totalTransactions : allTransactions.length}</div>
                  <div className="metric-sub">Audit records logged</div>
                </div>

                <div className="admin-metric-card">
                  <div className="metric-label">
                    <span>System Status</span>
                    <Shield size={16} color="#10b981" />
                  </div>
                  <div className="metric-value" style={{ fontSize: "18px", paddingTop: "3px", color: "#10b981" }}>
                    100% Active
                  </div>
                  <div className="metric-sub">All ledger services verified</div>
                </div>
              </div>

              {/* Customer Management Table */}
              <div className="data-table-card">
                <div className="table-toolbar">
                  <div className="table-title">
                    <Users size={18} color="#2563eb" />
                    <span>Customer Accounts</span>
                    <span style={{ fontSize: "11px", background: "#eff6ff", color: "#2563eb", padding: "2px 8px", borderRadius: "9999px" }}>
                      {filteredCustomers.length}
                    </span>
                  </div>

                  <div className="table-search">
                    <Search size={14} color="#94a3b8" />
                    <input
                      type="text"
                      placeholder="Search by name, email..."
                      value={customerSearch}
                      onChange={e => setCustomerSearch(e.target.value)}
                    />
                  </div>
                </div>

                {filteredCustomers.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                    <p>No customer accounts found matching your query.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="modern-table">
                      <thead>
                        <tr>
                          <th>Account ID</th>
                          <th>Customer Name</th>
                          <th>Email Address</th>
                          <th>Phone</th>
                          <th>Type</th>
                          <th>Balance</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCustomers.map(cust => (
                          <tr key={cust.id}>
                            <td style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#64748b" }}>
                              SB-{String(cust.id).slice(-6)}
                            </td>
                            <td>
                              <strong>{cust.name}</strong>
                            </td>
                            <td style={{ color: "#64748b" }}>{cust.email}</td>
                            <td style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>{cust.phone}</td>
                            <td>
                              <span className="table-badge" style={{ background: "#f1f5f9", color: "#334155" }}>
                                {cust.account_type || "Savings"}
                              </span>
                            </td>
                            <td>
                              <strong style={{ fontFamily: "var(--font-mono)", color: "#0f172a" }}>
                                {money(cust.balance)}
                              </strong>
                            </td>
                            <td>
                              <div className="table-actions">
                                <button
                                  className="btn-table-action"
                                  onClick={() => {
                                    setSelectedAdjustCustomer(cust);
                                    setAdjustForm({ amount: "", type: "credit", description: "Admin manual credit" });
                                  }}
                                >
                                  Adjust Funds
                                </button>
                                <button
                                  className="btn-table-action danger"
                                  onClick={() => handleAdminDeleteCustomer(cust.id, cust.name)}
                                  title="Delete Account"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Global Transactions Audit Ledger */}
              <div className="data-table-card">
                <div className="table-toolbar">
                  <div className="table-title">
                    <Activity size={18} color="#10b981" />
                    <span>Global Transaction Audit Ledger</span>
                  </div>
                </div>

                {allTransactions.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                    <p>No system transactions recorded yet.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="modern-table">
                      <thead>
                        <tr>
                          <th>Tx ID</th>
                          <th>Customer</th>
                          <th>Description</th>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allTransactions.map(tx => (
                          <tr key={tx.id}>
                            <td style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#64748b" }}>
                              TX-{String(tx.id).slice(-6)}
                            </td>
                            <td>
                              <strong>{tx.customer_name || "Account"}</strong><br />
                              <small style={{ color: "#94a3b8" }}>{tx.customer_email}</small>
                            </td>
                            <td>{tx.description}</td>
                            <td>
                              <span className={`table-badge ${tx.type}`}>
                                {tx.type === "credit" ? "↙ Credit" : "↗ Debit"}
                              </span>
                            </td>
                            <td>
                              <strong style={{
                                fontFamily: "var(--font-mono)",
                                color: tx.type === "credit" ? "#16a34a" : "#dc2626"
                              }}>
                                {tx.type === "credit" ? "+" : "−"}{money(tx.amount)}
                              </strong>
                            </td>
                            <td style={{ fontSize: "11px", color: "#94a3b8" }}>
                              {new Date(tx.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ADMIN ADJUST BALANCE MODAL */}
          {selectedAdjustCustomer && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb" }}>ADMIN ACTION</span>
                    <h3>Adjust Customer Balance</h3>
                  </div>
                  <button onClick={() => setSelectedAdjustCustomer(null)}><X size={18} /></button>
                </div>

                <div style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: "8px", marginBottom: "16px", fontSize: "13px" }}>
                  <strong>{selectedAdjustCustomer.name}</strong> ({selectedAdjustCustomer.email})<br />
                  <span>Current Balance: <strong>{money(selectedAdjustCustomer.balance)}</strong></span>
                </div>

                <form onSubmit={handleAdminBalanceAdjust}>
                  <div className="form-group">
                    <label>Adjustment Type</label>
                    <select
                      className="form-control"
                      value={adjustForm.type}
                      onChange={e => setAdjustForm({ ...adjustForm, type: e.target.value })}
                    >
                      <option value="credit">Credit Funds (Deposit +)</option>
                      <option value="debit">Debit Funds (Withdrawal −)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Amount (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      className="form-control"
                      required
                      placeholder="e.g. 5000"
                      value={adjustForm.amount}
                      onChange={e => setAdjustForm({ ...adjustForm, amount: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Description / Reason</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Bonus credit or manual adjustment"
                      value={adjustForm.description}
                      onChange={e => setAdjustForm({ ...adjustForm, description: e.target.value })}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                    <button
                      type="button"
                      className="btn-secondary-pill"
                      style={{ flex: 1, justifyContent: "center" }}
                      onClick={() => setSelectedAdjustCustomer(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary-pill"
                      style={{ flex: 1, justifyContent: "center" }}
                      disabled={busy}
                    >
                      {busy ? "Applying..." : "Confirm Adjustment"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW: CUSTOMER SIGNUP */}
          {/* ==================================================== */}
          {page === "signup" && (
            <section className="section-wrapper" style={{ display: "flex", justifyContent: "center" }}>
              <div className="modal-content" style={{ maxWidth: "520px" }}>
                <div className="modal-header">
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", letterSpacing: "0.05em" }}>
                      START YOUR JOURNEY
                    </span>
                    <h3>Open Your SecureBank Account</h3>
                  </div>
                  <User size={20} color="#2563eb" />
                </div>

                <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>
                  Join thousands of users experiencing modern digital banking with instant ₹10,000 demo funds.
                </p>

                <form onSubmit={handleCustomerSignup}>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="Enter your full name"
                      value={signupForm.name}
                      onChange={e => setSignupForm({ ...signupForm, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      required
                      placeholder="you@domain.com"
                      value={signupForm.email}
                      onChange={e => setSignupForm({ ...signupForm, email: e.target.value })}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className="form-group">
                      <label>10-Digit Phone</label>
                      <input
                        type="tel"
                        maxLength="10"
                        pattern="[0-9]{10}"
                        className="form-control"
                        required
                        placeholder="9876543210"
                        value={signupForm.phone}
                        onChange={e => setSignupForm({ ...signupForm, phone: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Date of Birth</label>
                      <input
                        type="date"
                        max={new Date().toISOString().slice(0, 10)}
                        className="form-control"
                        required
                        value={signupForm.dob}
                        onChange={e => setSignupForm({ ...signupForm, dob: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Account Type</label>
                    <select
                      className="form-control"
                      value={signupForm.accountType}
                      onChange={e => setSignupForm({ ...signupForm, accountType: e.target.value })}
                    >
                      <option value="Savings">Savings Account (Default ₹10,000)</option>
                      <option value="Current">Current Commercial Account</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Password (min 8 characters)</label>
                    <input
                      type="password"
                      minLength="8"
                      className="form-control"
                      required
                      placeholder="••••••••"
                      value={signupForm.password}
                      onChange={e => setSignupForm({ ...signupForm, password: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary-pill"
                    style={{ width: "100%", justifyContent: "center", marginTop: "12px" }}
                    disabled={busy}
                  >
                    <span>{busy ? "Creating Account..." : "Create Free Account →"}</span>
                  </button>

                  <div style={{ textAlign: "center", marginTop: "18px", fontSize: "12.5px", color: "#64748b" }}>
                    Already have an account?{" "}
                    <button
                      type="button"
                      style={{ color: "#2563eb", fontWeight: 600 }}
                      onClick={() => setPage("login")}
                    >
                      Sign In
                    </button>
                  </div>
                </form>
              </div>
            </section>
          )}

          {/* ==================================================== */}
          {/* VIEW: CUSTOMER LOGIN */}
          {/* ==================================================== */}
          {page === "login" && (
            <section className="section-wrapper" style={{ display: "flex", justifyContent: "center" }}>
              <div className="modal-content" style={{ maxWidth: "440px" }}>
                <div className="modal-header">
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", letterSpacing: "0.05em" }}>
                      SECURE SIGN IN
                    </span>
                    <h3>Welcome Back</h3>
                  </div>
                  <Lock size={20} color="#2563eb" />
                </div>

                <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>
                  Sign in with your registered email and password to access your dashboard.
                </p>

                <form onSubmit={handleCustomerLogin}>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      required
                      placeholder="you@domain.com"
                      value={loginForm.email}
                      onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      className="form-control"
                      required
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary-pill"
                    style={{ width: "100%", justifyContent: "center", marginTop: "12px" }}
                    disabled={busy}
                  >
                    <span>{busy ? "Signing in..." : "Sign In Securely →"}</span>
                  </button>

                  <div style={{ textAlign: "center", marginTop: "18px", fontSize: "12.5px", color: "#64748b" }}>
                    Don't have an account yet?{" "}
                    <button
                      type="button"
                      style={{ color: "#2563eb", fontWeight: 600 }}
                      onClick={() => setPage("signup")}
                    >
                      Open an Account
                    </button>
                  </div>
                </form>
              </div>
            </section>
          )}

          {/* ==================================================== */}
          {/* VIEW: CUSTOMER DASHBOARD */}
          {/* ==================================================== */}
          {page === "dashboard" && customer && (
            <section className="customer-portal">
              <div className="dashboard-hero-card">
                <div>
                  <span className="balance-label">TOTAL AVAILABLE BALANCE</span>
                  <div className="balance-amount">{money(customer.balance)}</div>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                    Account ID: SB-{String(customer.id).slice(-6)} · {customer.account_type}
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ display: "inline-block", padding: "4px 10px", background: "rgba(16, 185, 129, 0.2)", color: "#34d399", borderRadius: "9999px", fontSize: "12px", fontWeight: 600 }}>
                    ● Active Session
                  </span>
                </div>
              </div>

              <div className="customer-quick-grid">
                {/* Make a Transaction Form */}
                <div className="feature-box">
                  <div className="table-title" style={{ marginBottom: "14px" }}>
                    <CreditCard size={18} color="#2563eb" />
                    <span>Make a Simulated Transaction</span>
                  </div>

                  <form onSubmit={handleCustomerTransaction}>
                    <div className="form-group">
                      <label>Description / Note</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        placeholder="e.g. Studio invoice or grocery"
                        value={payment.description}
                        onChange={e => setPayment({ ...payment, description: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Amount (₹)</label>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        className="form-control"
                        required
                        placeholder="Enter amount"
                        value={payment.amount}
                        onChange={e => setPayment({ ...payment, amount: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Transaction Type</label>
                      <select
                        className="form-control"
                        value={payment.type}
                        onChange={e => setPayment({ ...payment, type: e.target.value })}
                      >
                        <option value="debit">Debit (Withdrawal / Spend −)</option>
                        <option value="credit">Credit (Deposit / Receive +)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="btn-primary-pill"
                      style={{ width: "100%", justifyContent: "center", marginTop: "8px" }}
                      disabled={busy}
                    >
                      {busy ? "Processing..." : "Submit Transaction →"}
                    </button>
                  </form>
                </div>

                {/* Recent Transactions List */}
                <div className="feature-box">
                  <div className="table-title" style={{ marginBottom: "14px" }}>
                    <Activity size={18} color="#10b981" />
                    <span>Recent Activity</span>
                  </div>

                  {transactions.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                      <p>No transactions yet. Try submitting your first credit or debit!</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "320px", overflowY: "auto" }}>
                      {transactions.map(tx => (
                        <div
                          key={tx.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "10px 14px",
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: "10px"
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: "13px", display: "block" }}>{tx.description}</strong>
                            <small style={{ color: "#94a3b8", fontSize: "11px" }}>
                              {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </small>
                          </div>
                          <strong
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "14px",
                              color: tx.type === "credit" ? "#16a34a" : "#dc2626"
                            }}
                          >
                            {tx.type === "credit" ? "+" : "−"}{money(tx.amount)}
                          </strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ==================================================== */}
          {/* VIEW: CUSTOMER PROFILE & SETTINGS */}
          {/* ==================================================== */}
          {page === "profile" && customer && (
            <section className="section-wrapper" style={{ display: "flex", justifyContent: "center" }}>
              <div className="modal-content" style={{ maxWidth: "500px" }}>
                <div className="modal-header">
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb" }}>SETTINGS</span>
                    <h3>Account Profile</h3>
                  </div>
                  <User size={20} color="#2563eb" />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                  <div className="nav-avatar" style={{ width: "52px", height: "52px", fontSize: "20px" }}>
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <h4 style={{ fontSize: "18px", fontWeight: 700 }}>{customer.name}</h4>
                    <p style={{ color: "#64748b", fontSize: "13px" }}>{customer.email}</p>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", marginBottom: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <span style={{ color: "#64748b" }}>Account Number:</span>
                    <strong>SB-{String(customer.id).slice(-6)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <span style={{ color: "#64748b" }}>Phone:</span>
                    <strong>{customer.phone}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <span style={{ color: "#64748b" }}>Account Type:</span>
                    <strong>{customer.account_type}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <span style={{ color: "#64748b" }}>Available Balance:</span>
                    <strong style={{ color: "#16a34a" }}>{money(customer.balance)}</strong>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <button className="btn-secondary-pill" onClick={() => setPage("dashboard")}>
                    ← Return to Dashboard
                  </button>
                  <button
                    className="btn-secondary-pill"
                    style={{ color: "#ef4444", borderColor: "#fecaca" }}
                    onClick={handleDeleteCustomerAccount}
                    disabled={busy}
                  >
                    <Trash2 size={14} />
                    <span>Delete Account & Ledger Permanently</span>
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ==================================================== */}
          {/* FOOTER */}
          {/* ==================================================== */}
          <footer className="site-footer">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div className="nav-brand-logo" style={{ width: "22px", height: "22px" }}>
                <Shield size={13} />
              </div>
              <strong style={{ color: "#0f172a" }}>SecureBank</strong>
              <span>· Built with Aceternity Studio Aesthetic</span>
            </div>
            <div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#94a3b8" }}>
                All Systems Operational · 256-Bit SSL Encryption
              </span>
            </div>
          </footer>
        </main>
      </div>

      {/* ==================================================== */}
      {/* BOTTOM FLOATING TOOLBAR DOCK (Screenshot 1) */}
      {/* ==================================================== */}
      <div className="bottom-floating-dock">
        <button
          className={`dock-btn ${page === "home" ? "active" : ""}`}
          onClick={() => setPage("home")}
          title="Studio Home View"
        >
          <Laptop size={14} />
          <span>Studio</span>
        </button>

        <button
          className={`dock-btn ${page === "dashboard" || page === "login" || page === "signup" ? "active" : ""}`}
          onClick={() => setPage(customer ? "dashboard" : "login")}
          title="Customer Banking Portal"
        >
          <CreditCard size={14} />
          <span>Customer</span>
        </button>

        <div className="dock-divider" />

        <button
          className={`dock-btn ${page.startsWith("admin") ? "active" : ""}`}
          onClick={() => setPage(admin ? "admin-dashboard" : "admin-login")}
          title="Admin Control Center"
          style={{ color: page.startsWith("admin") ? "white" : "#60a5fa" }}
        >
          <Lock size={14} />
          <span>Admin Portal ⚡</span>
        </button>

        <div className="dock-divider" />

        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#94a3b8", padding: "0 6px" }}>
          <span style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#10b981"
          }} />
          <span>Vault Active</span>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
