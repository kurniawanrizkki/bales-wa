const assert = require('node:assert');
const { UserModel, LogModel } = require('./src/db');
const { isBusinessRelevant, getInstantBusinessReply } = require('./src/wa');
const bcrypt = require('bcryptjs');

console.log('Running tests...');

// 1. Test User creation & query
const testEmail = `test_${Date.now()}@toko.com`;
const passHash = bcrypt.hashSync('secret123', 8);
const userId = UserModel.create(testEmail, passHash);
assert.ok(userId, 'User ID should be generated');

const user = UserModel.findByEmail(testEmail);
assert.strictEqual(user.email, testEmail, 'Email matches');
assert.ok(bcrypt.compareSync('secret123', user.password_hash), 'Password hash verified');

// 2. Test User settings update
UserModel.updateSettings(userId, {
  system_prompt: 'Test Prompt Toko',
  router9_api_key: '9r-test-key-123',
  router9_base_url: 'https://api.9router.com/v1',
  ai_model: 'openai/gpt-4o-mini',
  is_bot_active: true
});

const updatedUser = UserModel.findById(userId);
assert.strictEqual(updatedUser.system_prompt, 'Test Prompt Toko');
assert.strictEqual(updatedUser.router9_base_url, 'https://api.9router.com/v1');
assert.strictEqual(updatedUser.is_bot_active, 1);

// 3. Test Chat Logs
LogModel.add(userId, '628123456789', 'Halo apa ready?', 'Halo! Ready kak, mau pesan berapa?');
const logs = LogModel.getRecent(userId, 5);
assert.strictEqual(logs.length, 1);
assert.strictEqual(logs[0].sender_number, '628123456789');
assert.strictEqual(logs[0].sender_message, 'Halo apa ready?');

// 4. Filter konteks usaha: pesan pribadi tidak diproses, pertanyaan toko diproses
const prompt = 'Nama Usaha Hijab Chic. Produk Pashmina Silk, Gamis Rayon, Blouse Crinkle.';
assert.strictEqual(isBusinessRelevant('berapa harga pashmina?', prompt), true);
assert.strictEqual(isBusinessRelevant('warna sage masih ready?', prompt), true);
assert.strictEqual(isBusinessRelevant('aku mau bunuh diri aja', prompt), false);
assert.strictEqual(isBusinessRelevant('duh akun signal ku gabisa dipake', prompt), false);
assert.strictEqual(isBusinessRelevant('lanjut yang tadi kak', prompt, true), true);
assert.strictEqual(getInstantBusinessReply('hai kak mau pesan produknya'), 'Hai Kak, tentu bisa. Mau pesan produk apa dan berapa jumlahnya?');
assert.strictEqual(getInstantBusinessReply('HAI KAK'), 'Hai Kak. Ada yang bisa kami bantu terkait produk atau pemesanan?');
assert.strictEqual(getInstantBusinessReply('halo admin!'), 'Hai Kak. Ada yang bisa kami bantu terkait produk atau pemesanan?');
assert.strictEqual(getInstantBusinessReply('aku sama ghanis aja dah'), null);

console.log('Semua test unit DB, Log, filter konteks, dan balasan instan lolos!');
