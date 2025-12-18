const SPOTIFY_CLIENT_ID = '0f460e4cafca4fe38cedb64058540320';    
const SPOTIFY_CLIENT_SECRET = 'cc9a7729cae04024814091458d568814'; 

/**
 * Ottiene un Access Token da Spotify usando il Client Credentials Flow.
 * Cerca di recuperarlo dalla sessione se ancora valido.
 * @returns {Promise<string|null>} Il token di accesso o null in caso di errore.
 */
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

/**
 * Esegue una ricerca nell'API Spotify per tracce, artisti e album.
 * @param {string} query Il termine di ricerca.
 * @returns {Promise<object|null>} I dati della ricerca o null in caso di errore.
 */
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

/**
 * Ottiene le top track di una playlist specifica (es. Global Top 50).
 * @param {string} playlistId L'ID della playlist Spotify.
 * @returns {Promise<Array<object>|null>} Un array di oggetti traccia o null.
 */
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

/**
 * Funzione helper per formattare la durata da millisecondi a MM:SS.
 * @param {number} ms Durata in millisecondi.
 * @returns {string} Durata formattata.
 */
export function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}


/**
 * Funzione helper per ottenere l'anno di pubblicazione.
 * @param {object} track Oggetto traccia Spotify.
 * @returns {string} Anno di pubblicazione.
 */
export function getReleaseYear(track) {
    if (track && track.album && track.album.release_date) {
        return track.album.release_date.split('-')[0]; // Prende solo l'anno
    }
    return 'N/A';
}

/**
 * Funzione helper per ottenere un'immagine da un array di immagini Spotify.
 * @param {Array<object>} images Array di oggetti immagine.
 * @returns {string} URL dell'immagine o placeholder.
 */
export function getImageOrDefault(images) {
    if (images && images.length > 0) {
        // Spotify restituisce in ordine decrescente di dimensione, prendiamo la prima
        return images[0].url;
    }
    return 'assets/placeholder.png'; // Assicurati di avere un'immagine placeholder
}