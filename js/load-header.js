// Carica header globale
fetch("global-header.html")
    .then(res => res.text())
    .then(html => {
        // inserisce html dell'header nel div con id "global-header"
        document.getElementById("global-header").innerHTML = html;

        // evento
        document.dispatchEvent(new Event("headerLoaded"));
    });

// Import API
import {
    searchSpotify,
    formatDuration,
    getReleaseYear,
    getSpotifyAccessToken,
    getArtistGenre
} from "./api.js";

// Variabile globale per il brano selezionato
window.trackSelezionato = null;

/* FUNZIONE: POPOLA DROPDOWN PLAYLIST */
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
    function search() {
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
    }
    search();

    /* --- LOGOUT --- */
    function logout() {
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => {
                sessionStorage.removeItem("utente");
                window.location.href = "login.html";
            });
        }
    }
    logout();

    const addBtn = document.getElementById("addToPlaylistFromSong");
    if (addBtn) {
        addBtn.addEventListener("click", () => {
            if (window.trackSelezionato) {
                window.apriModalPlaylist(window.trackSelezionato);
            }
        });
    }

    /* --- APRI MODALE PLAYLIST (AGGIUNGI BRANO) --- */
    function apriModalPlaylist() {
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
    }
    apriModalPlaylist();

    /* --- CREAZIONE PLAYLIST (solo flusso aggiungi brano) --- */
    function createPlaylist() {
        const newPlaylistForm = document.getElementById("newPlaylistForm");

        if (!newPlaylistForm) return;

        newPlaylistForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const user = JSON.parse(sessionStorage.getItem("utente"));
            if (!user) {
                showToast("Utente non autenticato.", "danger");
                return;
            }

            const playlists = JSON.parse(localStorage.getItem("playlists")) || [];
            const name = document.getElementById("createPlaylistName")?.value.trim();

            if (!name) {
                showToast("Inserisci un nome per la playlist.", "danger");
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

            document.dispatchEvent(new CustomEvent("playlistCreated", {
                detail: { playlist: newPlaylist }
            }));

            showToast(`Playlist "${name}" creata`, "success");

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
    }
    createPlaylist();

});

/* --- AGGIUNGI BRANO ALLA PLAYLIST --- */
function addTrackToPlaylist() {
    document.addEventListener("click", (e) => {
        if (e.target && e.target.id === "addToPlaylistBtn") {

            const track = JSON.parse(sessionStorage.getItem("trackSelezionato"));
            if (!track) {
                showToast("Nessun brano selezionato.", "danger");
                return;
            }

            const select = document.getElementById("playlistSelect");
            const selectedPlaylistId = select?.value;

            if (!selectedPlaylistId) {
                showToast("Seleziona una playlist.", "danger");
                return;
            }

            const playlists = JSON.parse(localStorage.getItem("playlists")) || [];
            const playlist = playlists.find(p => p.id === selectedPlaylistId);

            if (!playlist) {
                showToast("Playlist non trovata.", "danger");
                return;
            }

            const alreadyAdded = playlist.tracks.some(t => t.id === track.id);
            if (alreadyAdded) {
                showToast("Brano già presente nella playlist.", "warning");
                return;
            }

            playlist.tracks.push(track);
            localStorage.setItem("playlists", JSON.stringify(playlists));

            showToast(`Brano aggiunto a "${playlist.name}"`, "success");

            const playlistModalEl = document.getElementById("playlistModal");
            const playlistModal = bootstrap.Modal.getInstance(playlistModalEl);
            playlistModal?.hide();
        }
    });
}
addTrackToPlaylist();

/* OVERLAY RISULTATI RICERCA */
function showSearchOverlay(results) {
    if (!results || results.length === 0) return;

    const overlay = document.getElementById("searchOverlay");
    const container = document.getElementById("searchResults");

    if (!overlay || !container) return;

    container.innerHTML = "";

    results.forEach(track => {
        const img = track.album.images?.[0]?.url;
        const artists = track.artists.map(a => a.name).join(", ");

        const div = document.createElement("div");
        div.classList.add("spotify-result");

        div.innerHTML = `
            <img src="${img}" class="spotify-img" data-id="${track.id}" style="cursor:pointer;">
            <div class="spotify-info">
                <h4 class="track-link" data-id="${track.id}" style="cursor:pointer; color:#bd93f9;">
                    ${track.name}
                </h4>
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

    // listener per titolo + immagine -> apri dettagli brano
    container.querySelectorAll(".track-link, .spotify-img").forEach(el => {
        el.addEventListener("click", () => {
            const id = el.dataset.id;

            if (!id || id === "undefined") {
                showToast("ID brano non valido", "danger");
                return;
            } window.location.href = `song.html?id=${encodeURIComponent(id)}`;
        });
    });

    // listener per i pulsanti "aggiungi a playlist"
    container.querySelectorAll(".add-track").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.id;
            const fullTrack = results.find(t => t.id === id);
            const genre = await getArtistGenre(fullTrack.artists[0].id);
            const track = {
                id: fullTrack.id,
                name: fullTrack.name,
                title: fullTrack.name,
                artist: fullTrack.artists.map(a => a.name).join(", "),
                duration: formatDuration(fullTrack.duration_ms),
                genre: genre, year: getReleaseYear(fullTrack).Boolean,
                image: fullTrack.album.images?.[0]?.url
            };

            sessionStorage.setItem("trackSelezionato", JSON.stringify(track));

            overlay.style.display = "none";
            document.body.classList.remove("overlay-open");

            apriModalPlaylist(track);
        });
    });

}

/*  TOAST */
export function showToast(msg, tipo = "success") {
    const toastEl = document.getElementById("sn4mToast");
    const toastMessage = document.getElementById("toastMessage");
    if (!toastEl || !toastMessage) return;

    toastMessage.textContent = msg;
    toastEl.className = `toast align-items-center text-white bg-${tipo} border-0`;

    new bootstrap.Toast(toastEl).show();
}
