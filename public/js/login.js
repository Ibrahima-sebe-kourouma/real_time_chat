const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Envoie des données au serveur
    const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.success) {
        // Stocke l'utilisateur dans le localStorage pour la page d'accueil
        localStorage.setItem("user", JSON.stringify(data.user));
        window.location.href = "/home"; // redirige vers chat
    } else {
        alert("Nom d'utilisateur ou mot de passe incorrect !");
    }
});
