const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const dbDir = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new DatabaseSync(path.join(dbDir, 'app.db'));

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    system_prompt TEXT DEFAULT 'Kamu adalah admin customer service UMKM yang ramah, santun, dan solutif. Jawab pertanyaan seputar produk, harga, jam operasional, dan tata cara pemesanan dengan singkat dan padat. Jika pembeli ingin pesan atau transfer, arahkan rekening dan minta kirim bukti transfer agar admin manusia memverifikasi.',
    router9_api_key TEXT DEFAULT '',
    router9_base_url TEXT DEFAULT '',
    ai_model TEXT DEFAULT '',
    is_bot_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS chat_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    sender_number TEXT NOT NULL,
    sender_message TEXT NOT NULL,
    bot_reply TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS business_profiles (
    user_id INTEGER PRIMARY KEY,
    business_name TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    admin_phone TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    maps_url TEXT NOT NULL DEFAULT '',
    operating_hours TEXT NOT NULL DEFAULT '',
    payment_methods TEXT NOT NULL DEFAULT '',
    shipping_policy TEXT NOT NULL DEFAULT '',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    sku TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    price INTEGER NOT NULL DEFAULT 0 CHECK(price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
    unit TEXT NOT NULL DEFAULT 'pcs',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

for (const migration of [
  "ALTER TABLE users ADD COLUMN trial_ends_at DATETIME",
  "ALTER TABLE users ADD COLUMN subscription_status TEXT NOT NULL DEFAULT 'trialing'",
  "ALTER TABLE users ADD COLUMN plan TEXT NOT NULL DEFAULT 'trial'",
  "ALTER TABLE users ADD COLUMN ai_replies_used INTEGER NOT NULL DEFAULT 0"
]) {
  try { db.exec(migration); } catch (err) {
    if (!err.message.includes('duplicate column')) throw err;
  }
}
db.exec("UPDATE users SET trial_ends_at = datetime(created_at, '+7 days') WHERE trial_ends_at IS NULL");
// Existing development accounts remain usable; new accounts enforce the 7-day trial.
db.exec("UPDATE users SET subscription_status = 'active', plan = 'starter' WHERE created_at < datetime('now', '-7 days') AND subscription_status = 'trialing'");
 
const TRIAL_REPLY_LIMIT = 100;
const PLAN_LIMITS = { trial: 100, starter: 3000, growth: 10000 };

function normalizeProduct(input) {
  const price = Number(input.price);
  const stock = Number(input.stock);
  if (!String(input.name || '').trim()) throw new Error('Nama produk wajib diisi');
  if (!Number.isInteger(price) || price < 0) throw new Error('Harga produk tidak valid');
  if (!Number.isInteger(stock) || stock < 0) throw new Error('Stok produk tidak valid');
  return {
    name: String(input.name).trim(), sku: String(input.sku || '').trim(),
    category: String(input.category || '').trim(), description: String(input.description || '').trim(),
    price, stock, unit: String(input.unit || 'pcs').trim(), is_active: input.is_active === false ? 0 : 1
  };
}

const BusinessModel = {
  get(userId) { return db.prepare('SELECT * FROM business_profiles WHERE user_id = ?').get(userId) || null; },
  upsert(userId, input) {
    const values = ['business_name','category','description','admin_phone','address','maps_url','operating_hours','payment_methods','shipping_policy'].map(k => String(input[k] || '').trim());
    if (!values[0]) throw new Error('Nama usaha wajib diisi');
    db.prepare(`INSERT INTO business_profiles (user_id,business_name,category,description,admin_phone,address,maps_url,operating_hours,payment_methods,shipping_policy)
      VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET business_name=excluded.business_name,category=excluded.category,description=excluded.description,admin_phone=excluded.admin_phone,address=excluded.address,maps_url=excluded.maps_url,operating_hours=excluded.operating_hours,payment_methods=excluded.payment_methods,shipping_policy=excluded.shipping_policy,updated_at=CURRENT_TIMESTAMP`).run(userId, ...values);
    return this.get(userId);
  }
};

const ProductModel = {
  list(userId) { return db.prepare('SELECT * FROM products WHERE user_id = ? ORDER BY is_active DESC, name').all(userId); },
  create(userId, input) {
    const p = normalizeProduct(input);
    return db.prepare('INSERT INTO products (user_id,name,sku,category,description,price,stock,unit,is_active) VALUES (?,?,?,?,?,?,?,?,?)').run(userId,p.name,p.sku,p.category,p.description,p.price,p.stock,p.unit,p.is_active).lastInsertRowid;
  },
  update(userId, id, input) {
    const p = normalizeProduct(input);
    const result = db.prepare('UPDATE products SET name=?,sku=?,category=?,description=?,price=?,stock=?,unit=?,is_active=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?').run(p.name,p.sku,p.category,p.description,p.price,p.stock,p.unit,p.is_active,id,userId);
    if (!result.changes) throw new Error('Produk tidak ditemukan');
  },
  remove(userId, id) {
    const result = db.prepare('DELETE FROM products WHERE id=? AND user_id=?').run(id,userId);
    if (!result.changes) throw new Error('Produk tidak ditemukan');
  }
};

const Subscription = { TRIAL_REPLY_LIMIT, PLAN_LIMITS };

function botAccess(user) {
  if (!user || !user.is_bot_active) return false;
  if (user.subscription_status === 'active') return user.ai_replies_used < (PLAN_LIMITS[user.plan] || PLAN_LIMITS.starter);
  return user.subscription_status === 'trialing' && new Date(`${user.trial_ends_at}Z`) > new Date() && user.ai_replies_used < TRIAL_REPLY_LIMIT;
}

const UserModel = {
  findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  },
  findById(id) {
    return db.prepare('SELECT id, email, system_prompt, router9_api_key, router9_base_url, ai_model, is_bot_active, trial_ends_at, subscription_status, plan, ai_replies_used, created_at FROM users WHERE id = ?').get(id);
  },
  create(email, passwordHash) {
    const stmt = db.prepare("INSERT INTO users (email, password_hash, trial_ends_at, subscription_status, plan) VALUES (?, ?, datetime('now', '+7 days'), 'trialing', 'trial')");
    const res = stmt.run(email.toLowerCase().trim(), passwordHash);
    return res.lastInsertRowid;
  },
  canUseBot(id) { return botAccess(this.findById(id)); },
  incrementUsage(id) { db.prepare('UPDATE users SET ai_replies_used = ai_replies_used + 1 WHERE id = ?').run(id); },
  updateSettings(id, { system_prompt, router9_api_key, router9_base_url, ai_model, is_bot_active }) {
    const stmt = db.prepare(`
      UPDATE users
      SET system_prompt = ?,
          router9_api_key = ?,
          router9_base_url = ?,
          ai_model = ?,
          is_bot_active = ?
      WHERE id = ?
    `);
    stmt.run(
      system_prompt,
      router9_api_key || '',
      router9_base_url || '',
      ai_model || '',
      is_bot_active ? 1 : 0,
      id
    );
  }
};

const LogModel = {
  add(userId, senderNumber, senderMessage, botReply) {
    const stmt = db.prepare(`
      INSERT INTO chat_logs (user_id, sender_number, sender_message, bot_reply)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(userId, senderNumber, senderMessage, botReply);
  },
  getRecent(userId, limit = 10) {
    return db.prepare(`
      SELECT sender_number, sender_message, bot_reply, created_at
      FROM chat_logs
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT ?
    `).all(userId, limit);
  }
};

module.exports = {
  db,
  UserModel,
  BusinessModel,
  ProductModel,
  LogModel,
  Subscription
};
