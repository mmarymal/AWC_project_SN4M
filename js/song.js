import {
    searchSpotify,
    formatDuration,
    getReleaseYear,
    getSpotifyAccessToken,
    getArtistGenre
} from "./api.js";

import { showToast } from "./load-header.js";

/*carica dettagli completi di un brano, eseguita quando pagina si carica*/
async function loadTrackDetails() {
    //recupera id brano
    const params = new URLSearchParams(window.location.search);
    const trackId = params.get("id");

    //se non c'è id, esce da funzione
    if (!trackId) {
        showToast("Nessun brano selezionato", "danger");
        return;
    }

    try {
        // Recupera token Spotify
        const token = await getSpotifyAccessToken();

        // Recupera dettagli completi del brano
        const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
            throw new Error(`Errore API Spotify: ${res.status}`);
        }

        const track = await res.json(); //converte in JSON

        // Recupera genere dall'artista principale
        const genre = await getArtistGenre(track.artists[0].id);

        // Popola la pagina con dati
        const elements = {
            trackTitle: document.getElementById("trackTitle"),
            trackArtist: document.getElementById("trackArtist"),
            trackAlbum: document.getElementById("trackAlbum"),
            trackDuration: document.getElementById("trackDuration"),
            trackYear: document.getElementById("trackYear"),
            trackGenre: document.getElementById("trackGenre"),
            trackImage: document.getElementById("trackImage")
        };

        // Popola gli elementi
        if (elements.trackTitle) elements.trackTitle.textContent = track.name;
        if (elements.trackArtist) elements.trackArtist.textContent = track.artists.map(a => a.name).join(", ");
        if (elements.trackAlbum) elements.trackAlbum.textContent = track.album.name;
        if (elements.trackDuration) elements.trackDuration.textContent = formatDuration(track.duration_ms);
        if (elements.trackYear) elements.trackYear.textContent = getReleaseYear(track);
        if (elements.trackGenre) elements.trackGenre.textContent = genre || "Sconosciuto";

        if (elements.trackImage && track.album.images?.[0]?.url) {
            elements.trackImage.src = track.album.images[0].url;
            elements.trackImage.alt = `Cover di ${track.album.name}`;
        }

        // Salva il brano per "Aggiungi a playlist"
        const trackData = {
            id: track.id,
            title: track.name,
            name: track.name,
            artist: track.artists.map(a => a.name).join(", "),
            duration: formatDuration(track.duration_ms),
            genre: genre || "Sconosciuto",
            year: getReleaseYear(track),
            image: track.album.images?.[0]?.url
        };

        // IMPORTANTE: queste righe devono stare DENTRO il try, dopo aver creato trackData
        window.trackSelezionato = trackData;
        sessionStorage.setItem("trackSelezionato", JSON.stringify(trackData));

    } catch (error) {
        showToast(`Errore: ${error.message}`, "danger");
    }
}

document.addEventListener('headerLoaded', () => {
    // Verifica che l'utente sia loggato
    const user = JSON.parse(sessionStorage.getItem('utente'));
    console.log("Utente loggato:", user);

    if (!user) {
        showToast("Devi effettuare il login per vedere questa pagina", "warning");
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }

    // Mostra username nell'header
    const welcomeUsername = document.getElementById('welcomeUsername');
    if (welcomeUsername) {
        welcomeUsername.textContent = user.username;
        console.log("Username impostato nell'header");
    }

    // Carica i dettagli del brano
    loadTrackDetails();

    // Gestisce il bottone "Aggiungi a playlist"
    const addButton = document.getElementById("addToPlaylistFromSong");
    if (addButton) {
        addButton.addEventListener("click", () => {
            const track = window.trackSelezionato || JSON.parse(sessionStorage.getItem("trackSelezionato"));

            if (!track) {
                showToast("Nessun brano selezionato", "danger");
                return;
            }

            if (typeof window.apriModalPlaylist === 'function') {
                window.apriModalPlaylist(track);
            } else {
                showToast("Funzione non disponibile", "danger");
            }
        });
    }

    // Gestisce il logout
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            sessionStorage.removeItem("utente");
            showToast("Logout effettuato", "info");
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1000);
        });
    }
});