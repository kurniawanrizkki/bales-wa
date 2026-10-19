const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('node:path');
const fs = require('node:fs');
require('dotenv').config();

const { UserModel, BusinessModel, ProductModel, LogModel, ContactModel, Subscription } = require('./db');
const { startSession, stopSession, getSessionState } = require('./wa');
const { SQLiteSessionStore } = require('./session-store');

const app = express();
const PORT = process.env.PORT || 3000;
app.set('trust proxy', 1);

process.on('uncaughtException', (err) => {
  console.error('[Process Error]', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const sessionStore = new SQLiteSessionStore();
sessionStore.cleanup();
app.use(
  session({
    store: sessionStore,
    name: 'balaswa.sid',
    secret: process.env.SESSION_SECRET || 'umkm_wa_bot_secret_key_123',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: 'auto',
      maxAge: 1000 * 60 * 60 * 24 * 30
    }
  })
);

const legacyRoutes = {
  '/login.html': '/login',
  '/register.html': '/register',
  '/dashboard.html': '/app',
  '/business.html': '/app/business'
};
app.use((req, res, next) => legacyRoutes[req.path] ? res.redirect(301, legacyRoutes[req.path]) : next());
app.use(express.static(path.join(__dirname, '../public'), { extensions: false }));

// Auth middleware
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Sesi habis, silakan login kembali.' });
    }
    return res.redirect('/login');
  }
  next();
}

const page = file => (_req, res) => res.sendFile(path.join(__dirname, `../public/${file}`));
app.get('/', page('index.html'));
app.get('/login', page('login.html'));
app.get('/register', page('register.html'));
app.get('/app', requireAuth, page('dashboard.html'));
app.get('/app/profile', requireAuth, page('profile.html'));
app.get('/app/products', requireAuth, page('products.html'));
app.get('/app/chats', requireAuth, page('chats.html'));
app.get('/app/history', requireAuth, page('history.html'));
app.get('/app/business', (_req, res) => res.redirect(301, '/app/profile'));

// Auth Routes
app.post('/api/auth/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || password.length < 6) {
    return res.status(400).json({ error: 'Email valid dan password minimal 6 karakter dibutuhkan.' });
  }

  const existing = UserModel.findByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'Email sudah terdaftar.' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const userId = UserModel.create(email, hash);
  req.session.userId = userId;
  req.session.save((err) => {
    if (err) return res.status(500).json({ error: 'Gagal menyimpan sesi.' });
    res.json({ message: 'Registrasi berhasil', userId });
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password wajib diisi.' });
  }

  const user = UserModel.findByEmail(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Email atau password salah.' });
  }

  req.session.userId = user.id;
  req.session.save((err) => {
    if (err) return res.status(500).json({ error: 'Gagal menyimpan sesi.' });
    res.json({ message: 'Login berhasil' });
  });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logout berhasil' });
  });
});

// User & Settings API
app.get('/api/user/me', requireAuth, (req, res) => {
  const user = UserModel.findById(req.session.userId);
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

  const trialEnd = user.trial_ends_at ? new Date(`${user.trial_ends_at}Z`) : null;
  const trialDaysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd - new Date()) / 86400000)) : 0;
  res.json({
    email: user.email,
    system_prompt: user.system_prompt,
    router9_api_key: user.router9_api_key ? '••••••••' : '',
    has_api_key: Boolean(user.router9_api_key || process.env.ROUTER9_API_KEY || process.env.DEEPSEEK_API_KEY),
    router9_base_url: user.router9_base_url || process.env.ROUTER9_BASE_URL || 'https://api.9router.com/v1',
    ai_model: user.ai_model || process.env.ROUTER9_DEFAULT_MODEL || 'openai/gpt-4o-mini',
    is_bot_active: Boolean(user.is_bot_active),
    trial_ends_at: user.trial_ends_at,
    trial_days_left: trialDaysLeft,
    subscription_status: user.subscription_status,
    plan: user.plan,
    ai_replies_used: user.ai_replies_used,
    reply_limit: Subscription.PLAN_LIMITS[user.plan] || Subscription.TRIAL_REPLY_LIMIT,
    can_use_bot: UserModel.canUseBot(user.id),
    business_complete: Boolean(BusinessModel.get(user.id)?.business_name)
  });
});

app.get('/api/business', requireAuth, (req, res) => {
  res.json({ profile: BusinessModel.get(req.session.userId), products: ProductModel.list(req.session.userId) });
});

app.post('/api/business', requireAuth, (req, res) => {
  try { res.json({ profile: BusinessModel.upsert(req.session.userId, req.body) }); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/products', requireAuth, (req, res) => {
  try { res.status(201).json({ id: Number(ProductModel.create(req.session.userId, req.body)) }); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/products/:id', requireAuth, (req, res) => {
  try { ProductModel.update(req.session.userId, Number(req.params.id), req.body); res.json({ message: 'Produk diperbarui' }); }
  catch (err) { res.status(err.message === 'Produk tidak ditemukan' ? 404 : 400).json({ error: err.message }); }
});

app.delete('/api/products/:id', requireAuth, (req, res) => {
  try { ProductModel.remove(req.session.userId, Number(req.params.id)); res.json({ message: 'Produk dihapus' }); }
  catch (err) { res.status(404).json({ error: err.message }); }
});

app.post('/api/user/settings', requireAuth, (req, res) => {
  const { system_prompt, router9_api_key, router9_base_url, ai_model, is_bot_active } = req.body;
  const current = UserModel.findById(req.session.userId);

  // If user left router9_api_key empty or masked, keep current
  let finalKey = router9_api_key;
  if (finalKey === '••••••••' || finalKey === undefined) {
    // keep old key from raw db query
    const rawUser = UserModel.findByEmail(current.email);
    finalKey = rawUser ? rawUser.router9_api_key : '';
  }

  UserModel.updateSettings(req.session.userId, {
    system_prompt: system_prompt || '',
    router9_api_key: finalKey || '',
    router9_base_url: router9_base_url || '',
    ai_model: ai_model || '',
    is_bot_active: Boolean(is_bot_active)
  });

  res.json({ message: 'Pengaturan berhasil disimpan' });
});

// Contact & Chat Takeover API
app.get('/api/chats', requireAuth, (req, res) => {
  res.json({ contacts: ContactModel.list(req.session.userId) });
});

app.get('/api/chats/:senderNumber', requireAuth, (req, res) => {
  const { senderNumber } = req.params;
  const contact = ContactModel.get(req.session.userId, senderNumber);
  const messages = LogModel.getByContact(req.session.userId, senderNumber, 100);
  res.json({
    contact: contact || { sender_number: senderNumber, is_ai_active: 1 },
    messages
  });
});

app.post('/api/chats/:senderNumber/toggle', requireAuth, (req, res) => {
  const { senderNumber } = req.params;
  const { is_ai_active } = req.body;
  const updated = ContactModel.setAIActive(req.session.userId, senderNumber, is_ai_active);
  res.json({ success: true, contact: updated });
});

// WhatsApp Management API
app.get('/api/wa/status', requireAuth, (req, res) => {
  const state = getSessionState(req.session.userId);
  const logs = LogModel.getRecent(req.session.userId, 10);
  res.json({
    ...state,
    logs
  });
});

app.post('/api/wa/start', requireAuth, async (req, res) => {
  try {
    const state = await startSession(req.session.userId);
    res.json({ message: 'Inisialisasi WhatsApp dimulai', state });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/wa/stop', requireAuth, async (req, res) => {
  try {
    await stopSession(req.session.userId);
    res.json({ message: 'Sesi WhatsApp dimatikan' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server WA Bot UMKM aktif di http://localhost:${PORT}`);

  // Auto-restore saved sessions on startup
  const authDir = path.join(__dirname, '../.wwebjs_auth');
  if (fs.existsSync(authDir)) {
    const entries = fs.readdirSync(authDir);
    for (const d of entries) {
      const match = d.match(/^session-user_(\d+)$/);
      if (match) {
        const userId = parseInt(match[1], 10);
        console.log(`[Auto-Restore] Memuat ulang sesi WhatsApp user ${userId}...`);
        startSession(userId).catch(err => console.error(`[Auto-Restore] Gagal user ${userId}:`, err.message));
      }
    }
  }
});
