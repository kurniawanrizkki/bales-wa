const assert = require('node:assert');
const { UserModel, ContactModel, LogModel } = require('./src/db');

console.log('Running contacts & AI takeover tests...');

const email = `contact_test_${Date.now()}@test.com`;
const userId = UserModel.create(email, 'hash123');

// 1. Contact upsert & list
ContactModel.upsert(userId, '628999888777', { contactName: 'Budi Pelanggan', lastMessage: 'Halo mau beli' });
const contacts = ContactModel.list(userId);
assert.strictEqual(contacts.length, 1);
assert.strictEqual(contacts[0].sender_number, '628999888777');
assert.strictEqual(contacts[0].contact_name, 'Budi Pelanggan');
assert.strictEqual(contacts[0].is_ai_active, 1);

// 2. Default is_ai_active for unknown contact is true
assert.strictEqual(ContactModel.isAiActiveForContact(userId, '628000111222'), true);

// 3. Toggle AI off
ContactModel.setAIActive(userId, '628999888777', false);
assert.strictEqual(ContactModel.isAiActiveForContact(userId, '628999888777'), false);

const contactOff = ContactModel.get(userId, '628999888777');
assert.strictEqual(contactOff.is_ai_active, 0);

// 4. Toggle AI on
ContactModel.setAIActive(userId, '628999888777', true);
assert.strictEqual(ContactModel.isAiActiveForContact(userId, '628999888777'), true);

// 5. Test LogModel.getByContact
LogModel.add(userId, '628999888777', 'Pesan 1', 'Balasan 1');
LogModel.add(userId, '628999888777', 'Pesan 2', 'Balasan 2');
const messages = LogModel.getByContact(userId, '628999888777');
assert.strictEqual(messages.length, 2);
assert.strictEqual(messages[0].sender_message, 'Pesan 1');
assert.strictEqual(messages[1].bot_reply, 'Balasan 2');

console.log('Semua test ContactModel dan AI takeover per kontak lolos!');
