// app/api/server.js  (ESM version)
import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import auth from "basic-auth";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// ---------- SQLite bootstrap (same as before) ----------
const db = new Database("bank.db");

db.exec(`
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  balance_cents INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id TEXT NOT NULL,
  type TEXT CHECK(type IN ('debit','credit')) NOT NULL,
  amount_cents INTEGER NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);
`);

const seedUser = db.prepare("SELECT * FROM users WHERE email=?").get("demo@bank.test");
if (!seedUser) {
  const tx = db.transaction(() => {
    const userId = db
      .prepare("INSERT INTO users (email, password) VALUES (?, ?)")
      .run("demo@bank.test", "demo123").lastInsertRowid;
    db.prepare("INSERT INTO accounts (id, user_id, balance_cents) VALUES (?,?,?)").run("ACC-001", userId, 250000);
    db.prepare("INSERT INTO accounts (id, user_id, balance_cents) VALUES (?,?,?)").run("ACC-002", userId, 50000);
  });
  tx();
  console.log("Seeded demo user: demo@bank.test / demo123");
}

// ---------- Basic Auth (protects UI only) ----------
const BASIC_USER = process.env.BASIC_USER || "demo";
const BASIC_PASS = process.env.BASIC_PASS || "secret";

app.use((req, res, next) => {
  // Let API routes pass without Basic Auth
  if (req.path.startsWith("/api")) return next();

  const creds = auth(req);
  if (!creds || creds.name !== BASIC_USER || creds.pass !== BASIC_PASS) {
    res.set("WWW-Authenticate", 'Basic realm="qa-lab-bank"');
    return res.status(401).send("Authentication required.");
  }
  next();
});

// ---------- Serve the static UI ----------
app.use(express.static(path.join(__dirname, "../web")));

// ---------- Super-simple API auth ----------
function requireAuth(req, res, next) {
  const token = req.header("x-auth-token");
  if (token === "demo-token") return next();
  return res.status(401).json({ error: "Unauthorized" });
}

// ---------- API routes (same behavior as before) ----------
app.post("/api/login", (req, res) => {
  const { email, password } = req.body || {};
  const user = db.prepare("SELECT * FROM users WHERE email=? AND password=?").get(email, password);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  res.json({ token: "demo-token" });
});

app.get("/api/accounts", requireAuth, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE email=?").get("demo@bank.test"); // single-user demo
  const rows = db.prepare("SELECT id, balance_cents FROM accounts WHERE user_id=?").all(user.id);
  res.json(rows);
});

app.get("/api/transactions", requireAuth, (req, res) => {
  const { account_id } = req.query;
  const rows = db
    .prepare(
      "SELECT id, type, amount_cents, description, created_at FROM transactions WHERE account_id=? ORDER BY id DESC LIMIT 50"
    )
    .all(account_id);
  res.json(rows);
});

app.post("/api/transfer", requireAuth, (req, res) => {
  const { from_id, to_id, amount_cents, description } = req.body || {};
  if (!from_id || !to_id || !amount_cents || amount_cents <= 0) {
    return res.status(400).json({ error: "Invalid payload" });
  }
  const from = db.prepare("SELECT id, balance_cents FROM accounts WHERE id=?").get(from_id);
  const to = db.prepare("SELECT id, balance_cents FROM accounts WHERE id=?").get(to_id);
  if (!from || !to) return res.status(404).json({ error: "Account not found" });
  if (from.balance_cents < amount_cents) return res.status(400).json({ error: "Insufficient funds" });

  const tx = db.transaction(() => {
    db.prepare("UPDATE accounts SET balance_cents=balance_cents-? WHERE id=?").run(amount_cents, from_id);
    db.prepare("UPDATE accounts SET balance_cents=balance_cents+? WHERE id=?").run(amount_cents, to_id);
    db.prepare("INSERT INTO transactions (account_id,type,amount_cents,description) VALUES (?,?,?,?)").run(
      from_id,
      "debit",
      amount_cents,
      description || `Transfer to ${to_id}`
    );
    db.prepare("INSERT INTO transactions (account_id,type,amount_cents,description) VALUES (?,?,?,?)").run(
      to_id,
      "credit",
      amount_cents,
      description || `Transfer from ${from_id}`
    );
  });
  tx();

  const balances = db.prepare("SELECT id, balance_cents FROM accounts WHERE id IN (?,?)").all(from_id, to_id);
  res.json({ ok: true, balances });
});

// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`Server (UI+API) on http://localhost:${PORT}`);
  console.log(`UI protected by Basic Auth → user: "${BASIC_USER}"  pass: "${BASIC_PASS}"`);
});
