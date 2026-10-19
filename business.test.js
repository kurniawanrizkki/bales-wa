const assert = require('node:assert');
const bcrypt = require('bcryptjs');
const { UserModel, BusinessModel, ProductModel } = require('./src/db');
const { buildBusinessContext } = require('./src/business');

const email = `business_${Date.now()}@example.com`;
const userId = UserModel.create(email, bcrypt.hashSync('secret123', 8));

const trial = UserModel.findById(userId);
assert.strictEqual(trial.subscription_status, 'trialing');
assert.ok(trial.trial_ends_at, 'trial end wajib tersedia');
assert.strictEqual(UserModel.canUseBot(userId), true);

BusinessModel.upsert(userId, {
  business_name: 'Hijab Cantik',
  category: 'Fashion',
  description: 'Toko hijab harian',
  admin_phone: '08123456789',
  address: 'Jl. Melati 12, Malang',
  maps_url: 'https://maps.google.com/?q=Malang',
  operating_hours: '08.00-20.00 WIB',
  payment_methods: 'BCA dan QRIS',
  shipping_policy: 'JNE dan J&T'
});
assert.strictEqual(BusinessModel.get(userId).business_name, 'Hijab Cantik');

const productId = ProductModel.create(userId, {
  name: 'Pashmina Silk', sku: 'PS-01', category: 'Hijab', description: 'Bahan lembut',
  price: 45000, stock: 3, unit: 'pcs', is_active: true
});
assert.ok(productId);
assert.strictEqual(ProductModel.list(userId).length, 1);

ProductModel.update(userId, productId, {
  name: 'Pashmina Silk', sku: 'PS-01', category: 'Hijab', description: 'Bahan lembut',
  price: 45000, stock: 0, unit: 'pcs', is_active: true
});
assert.strictEqual(ProductModel.list(userId)[0].stock, 0);
assert.throws(() => ProductModel.update(userId + 1, productId, { name: 'Bajak', price: 1, stock: 1 }), /Produk tidak ditemukan/);

const context = buildBusinessContext(BusinessModel.get(userId), ProductModel.list(userId));
assert.match(context, /Hijab Cantik/);
assert.match(context, /Pashmina Silk/);
assert.match(context, /HABIS/);
assert.match(context, /JNE dan J&T/);

UserModel.incrementUsage(userId);
assert.strictEqual(UserModel.findById(userId).ai_replies_used, 1);

console.log('Semua test trial, profil bisnis, katalog, stok, dan konteks lolos!');
