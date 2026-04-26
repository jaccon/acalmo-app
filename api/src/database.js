const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = path.resolve(__dirname, '..', process.env.DATABASE_FILE || 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

db.serialize(() => {
  // Users table for JWT authentication and Social Login
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    name TEXT,
    avatar TEXT,
    email TEXT UNIQUE,
    google_id TEXT UNIQUE,
    role TEXT DEFAULT 'customer',
    points INTEGER DEFAULT 0,
    listen_hours REAL DEFAULT 0.0,
    plan_id TEXT DEFAULT 'free',
    plan_expiry DATETIME,
    cpf TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Coupons table
  db.run(`CREATE TABLE IF NOT EXISTS coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    discount_percent INTEGER,
    is_active INTEGER DEFAULT 1,
    expires_at DATETIME
  )`);

  // Migrations for existing database
  db.run("ALTER TABLE users ADD COLUMN name TEXT", (err) => {});
  db.run("ALTER TABLE users ADD COLUMN avatar TEXT", (err) => {});
  db.run("ALTER TABLE users ADD COLUMN total_minutes INTEGER DEFAULT 0", (err) => {});
  
  // Plans table migrations
  db.run("ALTER TABLE plans ADD COLUMN period TEXT", (err) => {});
  db.run("ALTER TABLE plans ADD COLUMN features TEXT", (err) => {});
  db.run("ALTER TABLE plans ADD COLUMN highlight INTEGER DEFAULT 0", (err) => {});
  db.run("ALTER TABLE plans ADD COLUMN badge TEXT", (err) => {});
  db.run("ALTER TABLE plans ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP", (err) => {});

  // Categories table
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    uuid TEXT PRIMARY KEY,
    name TEXT UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Musics table
  db.run(`CREATE TABLE IF NOT EXISTS musics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE,
    title TEXT,
    description TEXT,
    thumbnail TEXT,
    content TEXT,
    status TEXT,
    category_id TEXT,
    application TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories (uuid)
  )`);

  // Remote Configurations table
  db.run(`CREATE TABLE IF NOT EXISTS configurations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE,
    value TEXT,
    is_enabled INTEGER DEFAULT 1,
    description TEXT
  )`);

  // Plans table
  db.run(`CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name TEXT,
    price REAL,
    period TEXT,
    duration_days INTEGER,
    features TEXT,
    highlight INTEGER DEFAULT 0,
    badge TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Applications table (Client Auth)
  db.run(`CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT UNIQUE,
    client_secret TEXT,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

module.exports = db;
