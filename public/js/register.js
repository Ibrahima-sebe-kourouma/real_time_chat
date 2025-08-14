const form = document.getElementById("registerForm");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const fullname = document.getElementById("fullname").value;
    const password = document.getElementById("password").value;
    const avatarFile = document.getElementById("avatar").files[0];

    let avatarData = null;
    if (avatarFile) {
        avatarData = await fileToBase64(avatarFile);
    }

    const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, fullname, password, avatar: avatarData })
    });

    const data = await res.json();
    if (data.success) {
        alert("Inscription réussie !");
        window.location.href = "/"; // redirige vers login
    } else {
        alert("Erreur : nom déjà utilisé ou autre problème");
    }
});

// Fonction pour convertir un fichier en Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = err => reject(err);
    });
}
