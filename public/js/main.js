// Récupère l'utilisateur connecté
const user = JSON.parse(localStorage.getItem("user"));
if (!user) window.location.href = "/login";

const ws = new WebSocket(`ws://${window.location.host}`);

const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const messagesDiv = document.getElementById("messages");
const logoutBtn = document.getElementById("logoutBtn");
const receiverSelect = document.getElementById("receiverSelect");
const imageInput = document.getElementById("imageInput");

let users = [];

// Logout
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => window.location.href = "/logout");
}

// Convertir fichier en Base64
function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Afficher un message
function displayMessage(msg) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message");

    msgDiv.innerHTML = `
        <img src="${msg.avatar || 'default-avatar.png'}" width="30">
        <strong>${msg.username}</strong>${msg.receiver_id ? ` ➜ <em>privé</em>` : ""}: 
        ${msg.content || ""}
        ${msg.image ? `<br><img src="${msg.image}" width="150">` : ""}
    `;

    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Mettre à jour la liste des utilisateurs
function updateUserList() {
    receiverSelect.innerHTML = '<option value="">Chat public</option>';
    users.forEach(u => {
        if (u.id !== user.id) {
            const opt = document.createElement("option");
            opt.value = u.id;
            opt.textContent = u.username;
            receiverSelect.appendChild(opt);
        }
    });
}

// WebSocket
ws.onopen = () => {
    ws.send(JSON.stringify({ type: "init", user }));
};

ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    switch(msg.type){
        case "message":
            displayMessage(msg.data);
            break;
        case "history":
            msg.data.forEach(m => displayMessage(m));
            break;
        case "users":
            users = msg.data;
            updateUserList();
            break;
        default:
            console.warn("Type de message inconnu:", msg.type);
    }
};

// Envoyer un message
messageForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const content = messageInput.value.trim();
    if (!content && !imageInput.files.length) return;

    let imageData = null;
    if (imageInput.files.length > 0) {
        const file = imageInput.files[0];
        imageData = await toBase64(file);
    }

    const message = {
        sender_id: user.id,
        username: user.username,
        avatar: user.avatar || null,
        content: content || null,
        receiver_id: receiverSelect.value ? parseInt(receiverSelect.value) : null,
        image: imageData
    };

    ws.send(JSON.stringify(message));

    messageInput.value = "";
    imageInput.value = "";
});
