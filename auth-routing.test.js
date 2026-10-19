const assert = require('node:assert');
const { SQLiteSessionStore } = require('./src/session-store');

const store = new SQLiteSessionStore(':memory:');
const set = (sid, value) => new Promise((resolve, reject) => store.set(sid, value, err => err ? reject(err) : resolve()));
const get = sid => new Promise((resolve, reject) => store.get(sid, (err, value) => err ? reject(err) : resolve(value)));
const destroy = sid => new Promise((resolve, reject) => store.destroy(sid, err => err ? reject(err) : resolve()));

(async () => {
  const session = { userId: 42, cookie: { expires: new Date(Date.now() + 86400000) } };
  await set('persist-me', session);
  assert.strictEqual((await get('persist-me')).userId, 42);
  await destroy('persist-me');
  assert.strictEqual(await get('persist-me'), null);
  console.log('Penyimpanan sesi SQLite lolos!');
})().catch(err => { console.error(err); process.exit(1); });
