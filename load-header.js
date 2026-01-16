// Carica header globale
fetch("global-header.html")
    .then(res => res.text())
    .then(html => {
        document.getElementById("global-header").innerHTML = html;
        document.dispatchEvent(new Event("headerLoaded"));
    });

// Import API
import { searchSpotify } from "./api.js";

// Variabile globale per il brano selezionato
window.trackSelezionato = null;

/* -------------------------------------------
   FUNZIONE: POPOLA DROPDOWN PLAYLIST
-------------------------------------------- */
function aggiornaDropdownPlaylist() {
    const select = document.getElementById("playlistSelect");
    if (!select) return;

    const user = JSON.parse(sessionStorage.getItem("utente"));
    if (!user) return;

    const playlists = JSON.parse(localStorage.getItem("playlists")) || [];
    const userPlaylists = playlists.filter(p => p.creator === user.username);

    select.innerHTML = userPlaylists
        .map(p => `<option value="${p.id}">${p.name}</option>`)
        .join("");
}

document.addEventListener("headerLoaded", () => {

    /* --- RICERCA SPOTIFY --- */
    const searchForm = document.getElementById("search-form");
    const searchInput = document.getElementById("search-input");

    if (searchForm && searchInput) {
        searchForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (!query) return;

            const results = await searchSpotify(query);
            showSearchOverlay(results.tracks.items);
        });
    }

    /* --- LOGOUT --- */
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            sessionStorage.removeItem("utente");
            window.location.href = "login.html";
        });
    }

    /* --- APRI MODALE PLAYLIST (AGGIUNGI BRANO) --- */
    window.apriModalPlaylist = function (track) {
        sessionStorage.setItem("trackSelezionato", JSON.stringify(track));

        aggiornaDropdownPlaylist();

        const trackNameEl = document.getElementById("modalTrackName");
        if (trackNameEl) {
            trackNameEl.textContent = `Brano: ${track.name || track.title || "Sconosciuto"}`;
        }

        const playlistModalEl = document.getElementById("playlistModal");
        if (!playlistModalEl) return;

        const playlistModal = bootstrap.Modal.getOrCreateInstance(playlistModalEl);
        playlistModal.show();
    };

    /* --- RESET MODALE CREAZIONE PLAYLIST (solo flusso aggiungi brano) --- */
    const createPlaylistModalEl = document.getElementById("createPlaylistModal");
    if (createPlaylistModalEl) {
        createPlaylistModalEl.addEventListener("show.bs.modal", () => {
            document.getElementById("createPlaylistName").value = "";
            document.getElementById("playlistDescription").value = "";
            document.getElementById("playlistTags").value = "";
        });
    }

    /* --- CREAZIONE PLAYLIST (solo flusso aggiungi brano) --- */
    const newPlaylistForm = document.getElementById("newPlaylistForm");

    if (!newPlaylistForm) return;

    newPlaylistForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const user = JSON.parse(sessionStorage.getItem("utente"));
        if (!user) {
            mostraToast("Utente non autenticato.", "danger");
            return;
        }

        const playlists = JSON.parse(localStorage.getItem("playlists")) || [];
        const name = document.getElementById("createPlaylistName")?.value.trim();

        if (!name) {
            mostraToast("Inserisci un nome per la playlist.", "danger");
            return;
        }

        const description = document.getElementById("playlistDescription")?.value.trim() || "";
        const rawTags = document.getElementById("playlistTags")?.value || "";
        const tags = rawTags.split(",").map(t => t.trim()).filter(Boolean);

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

        // Chiudi il modale di creazione
        const createModal = bootstrap.Modal.getInstance(createPlaylistModalEl);
        createModal?.hide();

        // Se stiamo creando una playlist mentre aggiungiamo un brano
        const track = JSON.parse(sessionStorage.getItem("trackSelezionato"));
        if (track) {
            createPlaylistModalEl.addEventListener("hidden.bs.modal", () => {

                const playlistModalEl = document.getElementById("playlistModal");
                const playlistModal = bootstrap.Modal.getOrCreateInstance(playlistModalEl);

                aggiornaDropdownPlaylist();
                playlistModal.show();

                setTimeout(() => {
                    const select = document.getElementById("playlistSelect");
                    if (select) select.value = newPlaylist.id;
                }, 150);

            }, { once: true });
        }

        // Aggiorna dropdown nel modale playlist
        aggiornaDropdownPlaylist();

        newPlaylistForm.reset();
    });
});

/* --- AGGIUNGI BRANO ALLA PLAYLIST --- */
document.addEventListener("click", (e) => {
    if (e.target && e.target.id === "addToPlaylistBtn") {

        const track = JSON.parse(sessionStorage.getItem("trackSelezionato"));
        if (!track) {
            mostraToast("Nessun brano selezionato.", "danger");
            return;
        }

        const select = document.getElementById("playlistSelect");
        const selectedPlaylistId = select?.value;

        if (!selectedPlaylistId) {
            mostraToast("Seleziona una playlist.", "danger");
            return;
        }

        const playlists = JSON.parse(localStorage.getItem("playlists")) || [];
        const playlist = playlists.find(p => p.id === selectedPlaylistId);

        if (!playlist) {
            mostraToast("Playlist non trovata.", "danger");
            return;
        }

        const alreadyAdded = playlist.tracks.some(t => t.id === track.id);
        if (alreadyAdded) {
            mostraToast("Brano già presente nella playlist.", "warning");
            return;
        }

        playlist.tracks.push(track);
        localStorage.setItem("playlists", JSON.stringify(playlists));

        mostraToast(`Brano aggiunto a "${playlist.name}"`, "success");

        const playlistModalEl = document.getElementById("playlistModal");
        const playlistModal = bootstrap.Modal.getInstance(playlistModalEl);
        playlistModal?.hide();
    }
});

/* OVERLAY RISULTATI RICERCA */
function showSearchOverlay(results) {
    if (!results || results.length === 0) return;

    const overlay = document.getElementById("searchOverlay");
    const container = document.getElementById("searchResults");

    if (!overlay || !container) return;

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

            sessionStorage.setItem("trackSelezionato", JSON.stringify(track));

            overlay.style.display = "none";
            document.body.classList.remove("overlay-open");

            apriModalPlaylist(track);
        });
    });
}

/*  TOAST */
export function mostraToast(msg, tipo = "success") {
    const toastEl = document.getElementById("sn4mToast");
    const toastMessage = document.getElementById("toastMessage");
    if (!toastEl || !toastMessage) return;

    toastMessage.textContent = msg;
    toastEl.className = `toast align-items-center text-white bg-${tipo} border-0`;

    new bootstrap.Toast(toastEl).show();
}
