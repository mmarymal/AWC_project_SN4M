const SPOTIFY_CLIENT_ID = '0f460e4cafca4fe38cedb64058540320';
const SPOTIFY_CLIENT_SECRET = 'cc9a7729cae04024814091458d568814';

export async function getSpotifyAccessToken() {
    let accessToken = sessionStorage.getItem('spotify_access_token');
    const tokenExpiry = sessionStorage.getItem('spotify_token_expiry');

    if (accessToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
        return accessToken; // Token valido e non scaduto
    }

    try {
        const authResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET)
            },
            body: 'grant_type=client_credentials'
        });

        if (!authResponse.ok) {
            const errorData = await authResponse.json();
            console.error("Errore di autenticazione Spotify:", authResponse.status, errorData);
            throw new Error(`Errore di autenticazione Spotify: ${authResponse.status} - ${errorData.error_description || authResponse.statusText}`);
        }

        const authData = await authResponse.json();
        accessToken = authData.access_token;
        const expiresIn = authData.expires_in; // Tempo di validità del token in secondi

        // Salva il token e il tempo di scadenza in sessionStorage
        sessionStorage.setItem('spotify_access_token', accessToken);
        // La scadenza è in millisecondi dalla data attuale
        sessionStorage.setItem('spotify_token_expiry', Date.now() + (expiresIn * 1000));

        return accessToken;

    } catch (error) {
        console.error("Errore durante l'ottenimento del token Spotify:", error);
        return null;
    }
}


export async function searchSpotify(query) {
    const accessToken = await getSpotifyAccessToken();
    if (!accessToken) {
        console.error("Nessun token di accesso Spotify disponibile.");
        return null;
    }

    const spotifySearchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track,artist,album&market=IT&limit=20`;

    try {
        const response = await fetch(spotifySearchUrl, {
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        });

        if (response.status === 401) {
            console.warn("Token Spotify scaduto o non valido durante la ricerca. Tentativo di ri-ottenere.");
            sessionStorage.removeItem('spotify_access_token');
            sessionStorage.removeItem('spotify_token_expiry');
            // Riprova la ricerca dopo aver ottenuto un nuovo token
            return await searchSpotify(query); // Ricorsione per riprovare con un nuovo token
        }

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Errore API Spotify durante la ricerca:", response.status, errorData);
            throw new Error(`Errore HTTP! Stato: ${response.status} - ${errorData.error.message || response.statusText}`);
        }

        return await response.json();

    } catch (error) {
        console.error("Errore durante la ricerca Spotify:", error);
        return null;
    }
}

export async function getArtistTopTracks(artistId) {
    const accessToken = await getSpotifyAccessToken();
    const url = `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=IT`;

    const response = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    const data = await response.json(); return data.tracks || [];
}

export async function getPlaylistTracks(playlistId = '37i9dQZEVXbMDoHDwVN2tF') { // Global Top 50 di default
    const accessToken = await getSpotifyAccessToken();
    if (!accessToken) {
        console.error("Nessun token di accesso Spotify disponibile per le playlist.");
        return null;
    }

    const spotifyApiUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?market=IT&limit=20`;

    try {
        const response = await fetch(spotifyApiUrl, {
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        });

        if (response.status === 401) {
            console.warn("Token Spotify scaduto o non valido per le playlist. Tentativo di ri-ottenere.");
            sessionStorage.removeItem('spotify_access_token');
            sessionStorage.removeItem('spotify_token_expiry');
            return await getPlaylistTracks(playlistId);
        }

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Errore API Spotify per playlist:", response.status, errorData);
            throw new Error(`Errore HTTP! Stato: ${response.status} - ${errorData.error.message || response.statusText}`);
        }

        const data = await response.json();
        return data.items.map(item => item.track).filter(track => track); // Estrae solo i dati della traccia

    } catch (error) {
        console.error("Errore durante il recupero delle tracce della playlist:", error);
        return null;
    }
}

export function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function getReleaseYear(track) {
    if (track && track.album && track.album.release_date) {
        return track.album.release_date.split('-')[0]; // Prende solo l'anno
    }
    return 'N/A';
}

export function getImageOrDefault(images) {
    if (images && images.length > 0) {
        // Spotify restituisce in ordine decrescente di dimensione, prendiamo la prima
        return images[0].url;
    }
    return 'assets/placeholder.png';
}

export function normalizeGenre(input) {
    if (!input) return null;

    let g = input.toLowerCase().trim();

    //rimuove accenti
    g = g.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Rimuove parole inutili 
    g = g.replace(/\b(musica|anni|anno|del|degli|della|italiana|italiano)\b/g, "").trim();

    // Mapping intelligente 
    const map = [
        { keywords: ["rock", "ital"], genre: "italian rock" },
        { keywords: ["rock"], genre: "rock" },
        { keywords: ["pop", "80"], genre: "pop" },
        { keywords: ["pop"], genre: "pop" },
        { keywords: ["indie"], genre: "indie rock" },
        { keywords: ["trap"], genre: "trap italiana" },
        { keywords: ["rap"], genre: "rap" },
        { keywords: ["hip hop", "hiphop"], genre: "hip hop" },
        { keywords: ["dance", "90"], genre: "eurodance" },
        { keywords: ["dance"], genre: "dance pop" },
        { keywords: ["metal"], genre: "metal" },
        { keywords: ["sad", "triste"], genre: "sad" }
    ];

    for (const rule of map) {
        if (rule.keywords.some(k => g.includes(k))) {
            return rule.genre;
        }
    }

    // fallback: restituisce la parola principale
    return g.split(" ")[0];
}