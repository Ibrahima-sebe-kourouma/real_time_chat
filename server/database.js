const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const db = new sqlite3.Database("chat.db");

// Création table users mise à jour
db.run(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    fullname TEXT,
    password TEXT NOT NULL,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);

// Table messages reste la même
db.run(`
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER,
    content TEXT,
    image TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
)
`);


// Inscription
function registerUser(username, email, fullname, password, avatar = null) {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) return reject(err);
            db.run(
                "INSERT INTO users(username, email, fullname, password, avatar) VALUES(?, ?, ?, ?, ?)",
                [username, email, fullname, hash, avatar],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    });
}


// Connexion
function loginUser(username, password) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
            if (err) return reject(err);
            if (!row) return resolve(null);
            bcrypt.compare(password, row.password, (err, result) => {
                if (err) reject(err);
                else if (result) resolve(row);
                else resolve(null);
            });
        });
    });
}

// Ajouter un message
function addMessage(sender_id, content, receiver_id = null, image = null) {
    return new Promise((resolve, reject) => {
        db.run(
            "INSERT INTO messages(sender_id, receiver_id, content, image) VALUES(?, ?, ?, ?)",
            [sender_id, receiver_id, content, image],
            function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });
}

// Récupérer messages (public + privés pour un user)
function getMessages(userId = null) {
    return new Promise((resolve, reject) => {
        let query = `
            SELECT m.id, m.sender_id, m.receiver_id, m.content, m.image, m.timestamp, u.username, u.avatar
            FROM messages m
            JOIN users u ON m.sender_id = u.id
        `;
        const params = [];
        if (userId) {
            query += ` WHERE m.receiver_id IS NULL OR m.receiver_id = ? OR m.sender_id = ? `;
            params.push(userId, userId);
        }
        query += " ORDER BY m.timestamp ASC";
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

module.exports = { registerUser, loginUser, addMessage, getMessages };
