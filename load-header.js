// Carica header globale
fetch("global-header.html")
    .then(res => res.text())
    .then(html => {
        document.getElementById("global-header").innerHTML = html;

        // Notifica che l’header è pronto
        document.dispatchEvent(new Event("headerLoaded"));
    });

// Import API
import { searchSpotify } from "./api.js";

// Variabile globale per il brano selezionato
window.trackSelezionato = null;

/* LOGICA RICERCA SPOTIFY */
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

/* FUNZIONE PER APRIRE IL MODALE PLAYLIST */
window.apriModalPlaylist = function (track) {
    window.trackSelezionato = track;

    const select = document.getElementById("playlistSelect");
    const user = JSON.parse(sessionStorage.getItem("utente"));
    const playlists = JSON.parse(localStorage.getItem("playlists")) || [];

    const userPlaylists = playlists.filter(p => p.creator === user.username);

    select.innerHTML = userPlaylists
        .map(p => `<option value="${p.id}">${p.name}</option>`)
        .join("");

    document.getElementById("modalTrackName").textContent = `Brano: ${track.name || track.title}`;

    new bootstrap.Modal(document.getElementById("playlistModal")).show();
};

/* LOGICA CREAZIONE PLAYLIST (MODALE 2) */
document.addEventListener("submit", (e) => {
    if (e.target.id !== "newPlaylistForm") return;

    e.preventDefault();

    const user = JSON.parse(sessionStorage.getItem("utente"));
    const playlists = JSON.parse(localStorage.getItem("playlists")) || [];

    const name = document.getElementById("playlistName").value.trim();
    const description = document.getElementById("playlistDescription").value.trim();
    const tags = document.getElementById("playlistTags").value.split(",").map(t => t.trim());

    const newPlaylist = {
        id: Date.now().toString(),
        name,
        description,
        tags,
        creator: user.username,
        community: null,
        tracks: []
    };

    playlists.push(newPlaylist);
    localStorage.setItem("playlists", JSON.stringify(playlists));

    mostraToast(`Playlist "${name}" creata`, "success");

    // Chiudi modale creazione
    bootstrap.Modal.getInstance(document.getElementById("createPlaylistModal")).hide();

    // Aggiorna select nel primo modale
    const select = document.getElementById("playlistSelect");
    select.innerHTML = playlists
        .filter(p => p.creator === user.username)
        .map(p => `<option value="${p.id}">${p.name}</option>`)
        .join("");

    // Seleziona la playlist appena creata
    select.value = newPlaylist.id;

    // Riapri il modale principale
    new bootstrap.Modal(document.getElementById("playlistModal")).show();
});

/* LOGICA AGGIUNTA BRANO ALLA PLAYLIST */
document.addEventListener("click", (e) => {
    if (e.target.id !== "confirmAddBtn") return;

    const user = JSON.parse(sessionStorage.getItem('utente'));
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];

    const playlistId = document.getElementById('playlistSelect').value;
    const playlist = playlists.find(p => p.id === playlistId);

    if (!playlist) {
        mostraToast("Seleziona una playlist valida.", "danger");
        return;
    }

    const track = window.trackSelezionato;

    const alreadyExist = playlist.tracks.some(t => t.id === track.id);
    if (alreadyExist) {
        mostraToast("Questo brano è già presente nella playlist.", "warning");
    } else {
        playlist.tracks.push(track);
        mostraToast(`Brano aggiunto a "${playlist.name}"`, "success");
    }

    localStorage.setItem('playlists', JSON.stringify(playlists));

    bootstrap.Modal.getInstance(document.getElementById('playlistModal')).hide();
});

/* CHIUDI PRIMO MODALE QUANDO APRI IL SECONDO */
document.addEventListener("click", (e) => {
    if (e.target.matches('[data-bs-target="#createPlaylistModal"]')) {
        const modal = bootstrap.Modal.getInstance(document.getElementById("playlistModal"));
        if (modal) modal.hide();
    }
});

/* OVERLAY RISULTATI RICERCA */
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

    overlay.style.display = "flex";
    document.body.classList.add("overlay-open");

    container.querySelectorAll(".add-track").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            const track = results.find(t => t.id === id);

            window.trackSelezionato = track;

            overlay.style.display = "none";
            document.body.classList.remove("overlay-open");

            apriModalPlaylist(track);
        });
    });
}

/* LOGOUT */
document.addEventListener("headerLoaded", () => {
    const logoutBtn = document.getElementById("logoutBtn");
    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", () => {
        sessionStorage.removeItem("utente");
        window.location.href = "login.html";
    });
});

/* TOAST */
export function mostraToast(msg, tipo = "success") {
    const toastEl = document.getElementById('sn4mToast');
    const toastMessage = document.getElementById('toastMessage');
    if (!toastEl || !toastMessage) return;

    toastMessage.textContent = msg;
    toastEl.className = `toast align-items-center text-white bg-${tipo} border-0`;

    new bootstrap.Toast(toastEl).show();
}
