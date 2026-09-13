const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Railway note: this file lives on ephemeral storage by default and will
// reset on redeploy. Attach a Railway Volume mounted at /data (or wherever
// DB_PATH points) if you want playlists/DJ settings to survive redeploys.
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'ballet.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS guild_settings (
    guildId TEXT PRIMARY KEY,
    djRoleId TEXT,
    djOnly INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS playlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    guildId TEXT NOT NULL,
    name TEXT NOT NULL,
    tracks TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    UNIQUE(userId, name)
  );
`);

// ---------- Guild settings (DJ role) ----------

const getSettingsStmt = db.prepare('SELECT * FROM guild_settings WHERE guildId = ?');
const upsertSettingsStmt = db.prepare(`
  INSERT INTO guild_settings (guildId, djRoleId, djOnly) VALUES (@guildId, @djRoleId, @djOnly)
  ON CONFLICT(guildId) DO UPDATE SET djRoleId = excluded.djRoleId, djOnly = excluded.djOnly
`);

function getGuildSettings(guildId) {
  return getSettingsStmt.get(guildId) || { guildId, djRoleId: null, djOnly: 0 };
}

function setDjRole(guildId, roleId) {
  const current = getGuildSettings(guildId);
  upsertSettingsStmt.run({ guildId, djRoleId: roleId, djOnly: current.djOnly });
}

function setDjOnly(guildId, enabled) {
  const current = getGuildSettings(guildId);
  upsertSettingsStmt.run({ guildId, djRoleId: current.djRoleId, djOnly: enabled ? 1 : 0 });
}

// ---------- Playlists ----------

const savePlaylistStmt = db.prepare(`
  INSERT INTO playlists (userId, guildId, name, tracks, createdAt) VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(userId, name) DO UPDATE SET tracks = excluded.tracks, createdAt = excluded.createdAt
`);
const getPlaylistStmt = db.prepare('SELECT * FROM playlists WHERE userId = ? AND name = ?');
const listPlaylistsStmt = db.prepare('SELECT name, tracks, createdAt FROM playlists WHERE userId = ? ORDER BY createdAt DESC');
const deletePlaylistStmt = db.prepare('DELETE FROM playlists WHERE userId = ? AND name = ?');

function savePlaylist(userId, guildId, name, tracks) {
  savePlaylistStmt.run(userId, guildId, name, JSON.stringify(tracks), Date.now());
}

function getPlaylist(userId, name) {
  const row = getPlaylistStmt.get(userId, name);
  if (!row) return null;
  return { ...row, tracks: JSON.parse(row.tracks) };
}

function listPlaylists(userId) {
  return listPlaylistsStmt.all(userId).map((row) => ({ ...row, tracks: JSON.parse(row.tracks) }));
}

function deletePlaylist(userId, name) {
  const result = deletePlaylistStmt.run(userId, name);
  return result.changes > 0;
}

module.exports = {
  db,
  getGuildSettings,
  setDjRole,
  setDjOnly,
  savePlaylist,
  getPlaylist,
  listPlaylists,
  deletePlaylist
};
