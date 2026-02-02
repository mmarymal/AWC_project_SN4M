import {
    formatDuration,
    getReleaseYear,
    getSpotifyAccessToken,
    getTrackGenres //aggiunta
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

        if (!res.ok) { //verifica che risposta ok
            throw new Error(`Errore API Spotify: ${res.status}`);
        }

        const track = await res.json(); //converte in JSON

        // Recupera genere dall'artista principale (cambiata)
        const genres = await getTrackGenres(track.id);

        // recupera tutti elementi da popolare
        const elements = {
            trackTitle: document.getElementById("trackTitle"),
            trackArtist: document.getElementById("trackArtist"),
            trackAlbum: document.getElementById("trackAlbum"),
            trackDuration: document.getElementById("trackDuration"),
            trackYear: document.getElementById("trackYear"),
            trackGenre: document.getElementById("trackGenre"),
            trackImage: document.getElementById("trackImage")
        };

        // controlla che ogni elemento esista prima di popolare
        if (elements.trackTitle) elements.trackTitle.textContent = track.name;
        if (elements.trackArtist) elements.trackArtist.textContent = track.artists.map(a => a.name).join(", ");
        if (elements.trackAlbum) elements.trackAlbum.textContent = track.album.name;
        if (elements.trackDuration) elements.trackDuration.textContent = formatDuration(track.duration_ms);
        if (elements.trackYear) elements.trackYear.textContent = getReleaseYear(track);
        if (elements.trackGenre) elements.trackGenre.textContent = genres.join(", ") || "Sconosciuto";

        // imposta immagine di copertina se disponibile
        if (elements.trackImage && track.album.images?.[0]?.url) {
            elements.trackImage.src = track.album.images[0].url;
            elements.trackImage.alt = `Cover di ${track.album.name}`;
        }

        // crea oggetto con dati del brano da salvare
        const trackData = {
            id: track.id,
            title: track.name,
            name: track.name,
            artist: track.artists.map(a => a.name).join(", "),
            duration: formatDuration(track.duration_ms),
            genre: genres.join(", ") || "Sconosciuto",
            year: getReleaseYear(track),
            image: track.album.images?.[0]?.url
        };

        // salva brano selezionato in variabile globale e sessionStorage
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

    if (!user) { //se non c'è utente, messaggio + reindirizza a login
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
    }

    // Carica i dettagli del brano
    loadTrackDetails();

    // Gestisce il bottone "Aggiungi a playlist"
    const addButton = document.getElementById("addToPlaylistFromSong");
    if (addButton) {
        // recupera brano selezionato dalla variabile globale o sessionStorage
        addButton.addEventListener("click", () => {
            const track = window.trackSelezionato || JSON.parse(sessionStorage.getItem("trackSelezionato"));

            // verifica che il brano sia selezionato
            if (!track) {
                showToast("Nessun brano selezionato", "danger");
                return;
            }

            // verifica che funzone per aprire modale
            if (typeof window.apriModalPlaylist === 'function') {
                // apre modale per selezionare playlist
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