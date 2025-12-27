// CARICA HEADER GLOBALE
fetch("global-header.html")
    .then(res => res.text())
    .then(html => {
        document.getElementById("global-header").innerHTML = html;

        // Notifica che l’header è pronto
        document.dispatchEvent(new Event("headerLoaded"));
    });

// LOGICA RICERCA SPOTIFY
import { searchSpotify } from "./api.js";

window.trackSelezionato = null;

// Attendi che l’header sia caricato
document.addEventListener("headerLoaded", () => {
    const form = document.getElementById("search-form");
    const input = document.getElementById("search-input");

    if (!form || !input) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const query = input.value.trim();
        if (!query) return;

        const results = await searchSpotify(query);
        showSearchOverlay(results.tracks.items);

    });
});

// APRI MODAL PLAYLIST
function apriModalPlaylist(track) {
    const select = document.getElementById("playlistSelect");
    const user = JSON.parse(sessionStorage.getItem("utente"));
    const playlists = JSON.parse(localStorage.getItem("playlists")) || [];

    const userPlaylists = playlists.filter(p => p.creator === user.username);

    select.innerHTML = userPlaylists
        .map(p => `<option value="${p.id}">${p.name}</option>`)
        .join("");

    document.getElementById("modalTrackName").textContent = `Brano: ${track.name}`;

    new bootstrap.Modal(document.getElementById("playlistModal")).show();
}

// TOAST
export function mostraToast(msg, tipo = "success") {
    const toastEl = document.getElementById('sn4mToast');
    const toastMessage = document.getElementById('toastMessage');
    if (!toastEl || !toastMessage) return;
    
    toastMessage.textContent = msg;
    
    // Cambia colore in base al tipo 
    toastEl.className = `toast align-items-center text-white bg-${tipo} border-0`;
    
    new bootstrap.Toast(toastEl).show();
}

function showSearchOverlay(results) {
    if (!results || results.length === 0) return;

    const overlay = document.getElementById("searchOverlay");
    const container = document.getElementById("searchResults");

    container.innerHTML = "";

    results.forEach(track => {
        const img = track.album.images?.[0]?.url || "default.jpg";
        const artists = track.artists.map(a => a.name).join(", ");

        const div = document.createElement("div");
        div.classList.add("spotify-result");

        div.innerHTML = `
            <img src="${img}" class="spotify-img">
            <div class="spotify-info">
                <h4>${track.name}</h4>
                <p>${artists}</p>
                <button class="btn btn-primary btn-sm add-track" data-id="${track.id}">
                    ➕ Aggiungi a playlist
                </button>
            </div>
        `;

        container.appendChild(div);
    });

    // Attiva il pannello
    overlay.style.display = "flex";

    // Eventi pulsanti "Aggiungi"
    container.querySelectorAll(".add-track").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            const track = results.find(t => t.id === id);

            window.trackSelezionato = track;

            //chiudi subito overlay
            document.getElementById("searchOverlay").style.display = "none";

            //apri modale
            apriModalPlaylist(track);
        });
    });
}

