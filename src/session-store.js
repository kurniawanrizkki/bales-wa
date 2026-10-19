const session = require('express-session');
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

class SQLiteSessionStore extends session.Store {
  constructor(filename = path.join(__dirname, '../data/sessions.db')) {
    super();
    this.db = new DatabaseSync(filename);
    this.db.exec('CREATE TABLE IF NOT EXISTS sessions (sid TEXT PRIMARY KEY, data TEXT NOT NULL, expires_at INTEGER NOT NULL)');
    this.getStmt = this.db.prepare('SELECT data, expires_at FROM sessions WHERE sid = ?');
    this.setStmt = this.db.prepare('INSERT INTO sessions (sid, data, expires_at) VALUES (?, ?, ?) ON CONFLICT(sid) DO UPDATE SET data=excluded.data, expires_at=excluded.expires_at');
    this.destroyStmt = this.db.prepare('DELETE FROM sessions WHERE sid = ?');
    this.cleanupStmt = this.db.prepare('DELETE FROM sessions WHERE expires_at <= ?');
  }

  get(sid, callback) {
    try {
      const row = this.getStmt.get(sid);
      if (!row || row.expires_at <= Date.now()) {
        if (row) this.destroyStmt.run(sid);
        return callback(null, null);
      }
      callback(null, JSON.parse(row.data));
    } catch (err) { callback(err); }
  }

  set(sid, value, callback = () => {}) {
    try {
      const expiresAt = value.cookie?.expires ? new Date(value.cookie.expires).getTime() : Date.now() + 604800000;
      this.setStmt.run(sid, JSON.stringify(value), expiresAt);
      callback(null);
    } catch (err) { callback(err); }
  }

  destroy(sid, callback = () => {}) {
    try { this.destroyStmt.run(sid); callback(null); }
    catch (err) { callback(err); }
  }

  touch(sid, value, callback = () => {}) { this.set(sid, value, callback); }
  cleanup() { this.cleanupStmt.run(Date.now()); }
}

module.exports = { SQLiteSessionStore };
