// app/api/server.js  — ESM, memory-only demo, serves UI + Basic Auth
import express from "express";
import cors from "cors";
import auth from "basic-auth";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// ---------- Demo data (memory) ----------
let accounts = [
  { id: "ACC-001", balance_cents: 250000 },
  { id: "ACC-002", balance_cents: 50000 }
];
let transactions = [];
let lastId = 0;

// ---------- Basic Auth (protects UI only) ----------
const BASIC_USER = process.env.BASIC_USER || "demo";
const BASIC_PASS = process.env.BASIC_PASS || "secret";

app.use((req, res, next) => {
  if (req.path.startsWith("/api")) return next(); // don’t protect API (token covers it)
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

// ---------- API routes ----------
app.post("/api/login", (req, res) => {
  const { email, password } = req.body || {};
  if (email === "demo@bank.test" && password === "demo123") {
    return res.json({ token: "demo-token" });
  }
  return res.status(401).json({ error: "Invalid credentials" });
});

app.get("/api/accounts", requireAuth, (_req, res) => {
  res.json(accounts);
});

app.get("/api/transactions", requireAuth, (req, res) => {
  const { account_id } = req.query;
  const rows = transactions
    .filter(t => !account_id || t.account_id === account_id)
    .slice(-50)
    .reverse();
  res.json(rows);
});

app.post("/api/transfer", requireAuth, (req, res) => {
  const { from_id, to_id, amount_cents, description } = req.body || {};
  if (!from_id || !to_id || !amount_cents || amount_cents <= 0) {
    return res.status(400).json({ error: "Invalid payload" });
  }
  const from = accounts.find(a => a.id === from_id);
  const to = accounts.find(a => a.id === to_id);
  if (!from || !to) return res.status(404).json({ error: "Account not found" });
  if (from.balance_cents < amount_cents) return res.status(400).json({ error: "Insufficient funds" });

  from.balance_cents -= amount_cents;
  to.balance_cents += amount_cents;

  transactions.push({
    id: ++lastId,
    account_id: from_id,
    type: "debit",
    amount_cents,
    description: description || `Transfer to ${to_id}`,
    created_at: new Date().toISOString()
  });
  transactions.push({
    id: ++lastId,
    account_id: to_id,
    type: "credit",
    amount_cents,
    description: description || `Transfer from ${from_id}`,
    created_at: new Date().toISOString()
  });

  res.json({ ok: true, balances: accounts });
});

// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`Server (UI+API) on http://localhost:${PORT}`);
  console.log(`UI protected by Basic Auth → user: "${BASIC_USER}"  pass: "${BASIC_PASS}"`);
});
