const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const bodyParser = require("body-parser");
const db = require("./database");
const os = require("os");
const session = require("express-session");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, "../public")));
app.use(bodyParser.json({ limit: '10mb' }));      // accepte jusqu'à 10 Mo
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(session({
    secret: "monsecret123",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Pages HTML
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "../public/login.html")));
app.get("/register", (req, res) => res.sendFile(path.join(__dirname, "../public/register.html")));
app.get("/home", authMiddleware, (req, res) => res.sendFile(path.join(__dirname, "../public/index.html")));

function authMiddleware(req, res, next) {
    if(req.session.user) next();
    else res.redirect("/login");
}

// Inscription
app.post("/api/register", async (req, res) => {
    const { username, email, fullname, password, avatar } = req.body;
    try {
        const success = await db.registerUser(username, email, fullname, password, avatar);
        res.json({ success: true });
    } catch(err) {
        console.error(err);
        res.json({ success: false, error: "Nom ou email déjà utilisé" });
    }
});

// Connexion
app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await db.loginUser(username, password);

    if(user){
        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            fullname: user.fullname,
            avatar: user.avatar
        };
        res.json({ success: true, user });
    } else {
        res.json({ success: false, error: "Identifiants invalides" });
    }
});

// Stockage des clients connectés
let clients = new Map(); // ws -> user

wss.on("connection", (ws) => {
    ws.on("message", async (message) => {
        try {
            const msg = JSON.parse(message);

            // Identification initiale
            if(msg.type === "init"){
                clients.set(ws, msg.user);
                broadcastUsers();

                // Historique filtré pour ce client
                const allMessages = await db.getMessages();
                const userId = msg.user.id;
                const filtered = allMessages.filter(m =>
                    m.receiver_id === null ||         // messages publics
                    m.sender_id === userId ||         // messages envoyés par cet utilisateur
                    m.receiver_id === userId           // messages reçus par cet utilisateur
                );
                ws.send(JSON.stringify({ type: "history", data: filtered }));
                return;
            }

            // Nouveau message (texte ou image)
            if(msg.sender_id && (msg.content || msg.image)){
                await db.addMessage(msg.sender_id, msg.content, msg.receiver_id, msg.image);

                const formatted = {
                    sender_id: msg.sender_id,
                    username: msg.username,
                    avatar: msg.avatar || null,
                    content: msg.content || null,
                    receiver_id: msg.receiver_id || null,
                    image: msg.image || null
                };

                // Envoi aux clients concernés
                wss.clients.forEach(client => {
                    if(client.readyState === WebSocket.OPEN){
                        const cUser = clients.get(client);
                        if(formatted.receiver_id !== null){
                            // message privé → seulement expéditeur et destinataire
                            const rid = Number(formatted.receiver_id);
                            if(cUser && (cUser.id === rid || cUser.id === formatted.sender_id)){
                                client.send(JSON.stringify({ type: "message", data: formatted }));
                            }
                        } else {
                            // message public → tout le monde
                            client.send(JSON.stringify({ type: "message", data: formatted }));
                        }
                    }
                });
            }

        } catch(err){
            console.error("Erreur WebSocket:", err);
        }
    });

    ws.on("close", () => {
        clients.delete(ws);
        broadcastUsers();
    });
});

// Diffuser la liste des utilisateurs connectés
function broadcastUsers(){
    const users = Array.from(clients.values());
    const msg = JSON.stringify({ type: "users", data: users });
    wss.clients.forEach(client => {
        if(client.readyState === WebSocket.OPEN) client.send(msg);
    });
}

function getLocalIP(){
    const interfaces = os.networkInterfaces();
    for(let name in interfaces){
        for(let iface of interfaces[name]){
            if(iface.family === "IPv4" && !iface.internal) return iface.address;
        }
    }
    return "127.0.0.1";
}

const localIP = getLocalIP();
server.listen(3000, "0.0.0.0", () => {
    console.log("✅ Serveur démarré !");
    console.log(`🌐 Local :    http://localhost:3000`);
    console.log(`📡 Réseau :   http://${localIP}:3000`);
});
