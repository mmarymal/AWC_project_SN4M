// Carica header globale
fetch("global-header.html")
    .then(res => res.text())
    .then(html => {
        document.getElementById("global-header").innerHTML = html;
        document.dispatchEvent(new Event("headerLoaded"));
    });

// Import API
import { searchSpotify, getArtistGenres } from "./api.js";

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

/* -------------------------------------------
   LOGICA CHE DIPENDE DALL'HEADER
   (elementi dentro global-header.html)
-------------------------------------------- */
document.addEventListener("headerLoaded", () => {
    /* RICERCA SPOTIFY */
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

    /* LOGOUT */
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            sessionStorage.removeItem("utente");
            window.location.href = "login.html";
        });
    }
});

/* -------------------------------------------
   LOGICA CHE DIPENDE DAL DOM PRINCIPALE
   (modali, form, overlay, ecc.)
-------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
    /* --- MODALE PLAYLIST: APRI DA OVERLAY / BOTTONI --- */

    // Funzione globale per aprire il modale "Aggiungi a playlist"
    window.apriModalPlaylist = function (track) {
        window.trackSelezionato = track;

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

    /* --- MODALE CREA PLAYLIST APERTO DAL MODALE PLAYLIST --- */

    const openCreatePlaylistBtn = document.getElementById("openCreatePlaylist");
    if (openCreatePlaylistBtn) {
        openCreatePlaylistBtn.addEventListener("click", () => {
            const playlistModalEl = document.getElementById("playlistModal");
            const createPlaylistModalEl = document.getElementById("createPlaylistModal");
            if (!createPlaylistModalEl) return;

            const playlistModal = playlistModalEl
                ? bootstrap.Modal.getInstance(playlistModalEl)
                : null;
            playlistModal?.hide();

            const createModal = bootstrap.Modal.getOrCreateInstance(createPlaylistModalEl);
            createModal.show();
        });
    }

    /* --- RESET MODALE CREAZIONE PLAYLIST --- */

    const createPlaylistModalEl = document.getElementById("createPlaylistModal");
    if (createPlaylistModalEl) {
        createPlaylistModalEl.addEventListener("show.bs.modal", () => {
            const nameInput = document.getElementById("createPlaylistName");
            const descInput = document.getElementById("playlistDescription");
            const tagsInput = document.getElementById("playlistTags");

            if (nameInput) nameInput.value = "";
            if (descInput) descInput.value = "";
            if (tagsInput) tagsInput.value = "";

            // Se sto aggiungendo un brano, chiudo il modale playlist
            if (window.trackSelezionato) {
                const playlistModalEl = document.getElementById("playlistModal");
                if (playlistModalEl) {
                    const playlistModal = bootstrap.Modal.getInstance(playlistModalEl);
                    playlistModal?.hide();
                }
            }
        });
    }

    /* --- CREAZIONE PLAYLIST (DOM COMPLETAMENTE PRONTO) --- */
    const newPlaylistForm = document.getElementById("newPlaylistForm");

    if (!newPlaylistForm) {
        console.log("DEBUG: newPlaylistForm non trovato in questa pagina");
    } else {
        newPlaylistForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const user = JSON.parse(sessionStorage.getItem("utente"));
            if (!user) {
                mostraToast("Utente non autenticato.", "danger");
                return;
            }

            const playlists = JSON.parse(localStorage.getItem("playlists")) || [];

            const name = newPlaylistForm.querySelector("#createPlaylistName")?.value.trim();
            if (!name) {
                mostraToast("Inserisci un nome per la playlist.", "danger");
                return;
            }

            const description = newPlaylistForm.querySelector("#playlistDescription")?.value.trim() || "";
            const rawTags = newPlaylistForm.querySelector("#playlistTags")?.value || "";

            const tags = rawTags
                .split(",")
                .map(t => t.trim())
                .filter(Boolean);

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

            const modal = bootstrap.Modal.getInstance(document.getElementById("createPlaylistModal"));
            modal?.hide();

            aggiornaDropdownPlaylist();

            if (window.trackSelezionato) {
                const playlistModal = bootstrap.Modal.getOrCreateInstance(document.getElementById("playlistModal"));
                playlistModal.show();

                setTimeout(() => {
                    const select = document.getElementById("playlistSelect");
                    if (select) select.value = newPlaylist.id;
                }, 200);
            }

            newPlaylistForm.reset();
        });
    }


    /* --- AGGIUNTA BRANO ALLA PLAYLIST --- */

    document.addEventListener("click", async (e) => {
        if (e.target.id !== "confirmAddBtn") return;

        const track = window.trackSelezionato;
        if (!track || !track.id) {
            mostraToast("Nessun brano selezionato.", "danger");
            console.log("DEBUG: trackSelezionato è nullo o invalido", track);
            return;
        }

        const user = JSON.parse(sessionStorage.getItem("utente"));
        if (!user) {
            mostraToast("Utente non autenticato.", "danger");
            return;
        }

        const playlists = JSON.parse(localStorage.getItem("playlists")) || [];
        const playlistSelect = document.getElementById("playlistSelect");
        if (!playlistSelect) {
            mostraToast("Nessuna playlist disponibile.", "danger");
            return;
        }

        const playlistId = playlistSelect.value;
        const playlist = playlists.find(p => p.id === playlistId);

        if (!playlist) {
            mostraToast("Seleziona una playlist valida.", "danger");
            return;
        }

        const alreadyExist = playlist.tracks?.some(t => t.id === track.id);
        if (alreadyExist) {
            mostraToast("Questo brano è già presente nella playlist.", "warning");
        } else {
            let genres = [];
            try {
                genres = await getArtistGenres(track.artists?.[0]?.id);
            } catch (err) {
                console.log("DEBUG: errore getArtistGenres", err);
            }

            const normalizedTrack = {
                id: track.id,
                title: track.name,
                artist: track.artists?.map(a => a.name).join(", ") || "N/D",
                duration: track.duration_ms
                    ? `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}`
                    : "N/D",
                year: track.album?.release_date?.split("-")[0] || "N/D",
                genre: genres?.[0] || "N/D"
            };

            if (!Array.isArray(playlist.tracks)) {
                playlist.tracks = [];
            }

            playlist.tracks.push(normalizedTrack);
            mostraToast(`Brano aggiunto a "${playlist.name}"`, "success");
        }

        localStorage.setItem("playlists", JSON.stringify(playlists));

        const playlistModalEl = document.getElementById("playlistModal");
        if (playlistModalEl) {
            const playlistModal = bootstrap.Modal.getInstance(playlistModalEl);
            playlistModal?.hide();
        }
    });
});

/* -------------------------------------------
   OVERLAY RISULTATI RICERCA
-------------------------------------------- */
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

            window.trackSelezionato = track;

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
