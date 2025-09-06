// server.js (CommonJS)
// Minimal demo server to satisfy your Playwright test:
// - Basic Auth: demo / secret
// - Page has: #email, #password, "Login" button, #token
// - #loadAccounts button renders JSON with ACC-001 & ACC-002 in <pre class="accounts">

const express = require('express');

const app = express();
const PORT = process.env.PORT || 3001;

// Basic Auth middleware: demo / secret
app.use((req, res, next) => {
  const auth = req.headers.authorization || '';
  const expected = 'Basic ' + Buffer.from('demo:secret').toString('base64');
  if (auth === expected) return next();
  res.set('WWW-Authenticate', 'Basic realm="QA Lab Bank"');
  res.status(401).send('Auth required');
});

app.use(express.json());

// Demo HTML page
app.get('/', (_req, res) => {
  res.type('html').send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>QA Lab Bank</title>
  <style>
    body { font-family: system-ui, Arial, sans-serif; max-width: 720px; margin: 40px auto; }
    label { display:block; margin: 8px 0 4px; }
    input, button { padding: 8px; }
    pre.accounts { background:#f6f8fa; padding:12px; border-radius:6px; }
    #token { font-weight:bold; color:#0a7; }
  </style>
</head>
<body>
  <h1>QA Lab Bank</h1>

  <section>
    <label for="email">Email</label>
    <input id="email" type="email" value="demo@bank.test"/>

    <label for="password">Password</label>
    <input id="password" type="password" value="demo123"/>

    <p><button id="login-btn">Login</button></p>
    <p>Token: <span id="token"></span></p>
  </section>

  <hr/>

  <section>
    <button id="loadAccounts">Load Accounts</button>
    <pre class="accounts"></pre>
  </section>

  <script>
    const byId = id => document.getElementById(id);

    document.getElementById('login-btn').addEventListener('click', async () => {
      const email = byId('email').value;
      const password = byId('password').value;
      const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      document.getElementById('token').textContent = data.token || '';
    });

    document.getElementById('loadAccounts').addEventListener('click', async () => {
      const res = await fetch('/accounts');
      const data = await res.json();
      document.querySelector('pre.accounts').textContent = JSON.stringify(data, null, 2);
    });
  </script>
</body>
</html>`);
});

// API endpoints
app.post('/login', (_req, res) => {
  res.json({ token: 'demo-token' });
});

app.get('/accounts', (_req, res) => {
  res.json([
    { id: 'ACC-001', balance: 1000 },
    { id: 'ACC-002', balance: 250 }
  ]);
});

app.listen(PORT, () => {
  console.log(\`QA Lab Bank demo listening on http://localhost:\${PORT}\`);
});
