-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    fullname TEXT,                  -- Nom complet (facultatif)
    password TEXT NOT NULL,
    avatar TEXT,                    -- URL ou chemin vers la photo de profil
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des messages
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,      -- ID de l'utilisateur qui envoie
    receiver_id INTEGER,             -- ID de l'utilisateur destinataire (NULL = message public)
    content TEXT,                    -- Texte du message
    image TEXT,                      -- URL ou chemin d'une image jointe
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
);
