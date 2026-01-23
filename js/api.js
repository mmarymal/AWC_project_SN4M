const SPOTIFY_CLIENT_ID = '0f460e4cafca4fe38cedb64058540320';
const SPOTIFY_CLIENT_SECRET = 'cc9a7729cae04024814091458d568814';

// OTTINE/RINNOVA IL TOKEN DI ACCESSO
export async function getSpotifyAccessToken() {
    // controlla se esiste un token valido in sessionStorage
    let accessToken = sessionStorage.getItem('spotify_access_token');
    const tokenExpiry = sessionStorage.getItem('spotify_token_expiry');

    // se token esiste e ancora valido, lo riutilizza
    if (accessToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
        return accessToken; // Token valido e non scaduto
    }

    // se non c'è token valido, ne chiede un altro
    try {
        // chiama endpoint di autenticazione Spotify
        const authResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                // autenticazione con client id e secret condificati Base64(btoa)
                'Authorization': 'Basic ' + btoa(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET)
            },
            // otteniamo un token per l'app, non per utente. Solo accesso a risorse pubbliche di Spotify.
            body: 'grant_type=client_credentials'
        });

        // verifica che risposta sia ok
        if (!authResponse.ok) {
            const errorData = await authResponse.json();
            console.error("Errore di autenticazione Spotify:", authResponse.status, errorData);
            throw new Error(`Errore di autenticazione Spotify: ${authResponse.status} - ${errorData.error_description || authResponse.statusText}`);
        }

        // estrae il token dalla risposta
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

// RICERCA SPOTIFY
export async function searchSpotify(query) {
    // ottiene token accesso
    const accessToken = await getSpotifyAccessToken();
    if (!accessToken) {
        console.error("Nessun token di accesso Spotify disponibile.");
        return null;
    }

    // costruisce URL di ricerca con parametri
    const spotifySearchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track,artist,album&market=IT&limit=20`;

    try {
        const response = await fetch(spotifySearchUrl, {
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        });

        // gestisce token scaduto
        if (response.status === 401) {
            console.warn("Token Spotify scaduto o non valido durante la ricerca. Tentativo di ri-ottenere.");
            // rimuove token scaduto
            sessionStorage.removeItem('spotify_access_token');
            sessionStorage.removeItem('spotify_token_expiry');
            // Riprova la ricerca dopo aver ottenuto un nuovo token
            return await searchSpotify(query);
        }

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Errore API Spotify durante la ricerca:", response.status, errorData);
            throw new Error(`Errore HTTP! Stato: ${response.status} - ${errorData.error.message || response.statusText}`);
        }

        // ritorna i dati della ricerca
        return await response.json();

    } catch (error) {
        console.error("Errore durante la ricerca Spotify:", error);
        return null;
    }
}

// TOP TRACKS ARTISTA
export async function getArtistTopTracks(artistId) {
    const accessToken = await getSpotifyAccessToken();
    // costruisce URL per top tracks
    const url = `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=IT`;

    const response = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    const data = await response.json();
    // ritorna solo le tracce o nulla se non ci sono
    return data.tracks || [];
}

// GENERE ARTISTA
export async function getArtistGenre(artistId) {
    const token = await getSpotifyAccessToken();
    if (!token) return 'N/D';

    try {
        // chiama endpoint artista x avere dettagli
        const res = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
            console.error('Errore nel recupero artista:', res.status);
            return 'N/D';
        }

        const data = await res.json();

        return data.genres?.[0] || 'N/D';
    } catch (error) {
        console.error('Errore nel recupero del genere dell\'artista:', error);
        return 'N/D';
    }
}

// converte dura brano da millisecondi a mm:ss
export function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000); // millesecondi -> minuti
    const seconds = Math.floor((ms % 60000) / 1000); //secondi rimanenti
    return `${minutes}:${seconds.toString().padStart(2, '0')}`; //asseconda che secondi sono 2 cifre
}

// estrae anno rilasco oggetto track
export function getReleaseYear(track) {
    //verifica esistenza campi necessari
    if (track && track.album && track.album.release_date) {
        return track.album.release_date.split('-')[0]; // Prende solo l'anno
    }
    return 'N/A';
}

// ottiene url img copertina
export function getImageOrDefault(images) {
    if (images && images.length > 0) {
        // Spotify restituisce in ordine decrescente di dimensione, prendiamo la prima
        return images[0].url;
    }
    // se non ci sono immagini, ritorna placeholder
    return 'assets/placeholder.png';
}

// normalizza e mappa genere, converte input in generi riconosciuti
export function normalizeGenre(input) {
    if (!input) return null;

    let g = input.toLowerCase().trim(); //converte in lowercase e rimuove spazi

    //rimuove accenti
    g = g.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Rimuove parole inutili 
    g = g.replace(/\b(musica|anni|anno|del|degli|della|italiana|italiano)\b/g, "").trim();

    // Mapping genere basato su parole chiave 
    const map = [
        { keywords: ["kpop", "k-pop", "k pop"], genre: "k-pop" },
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

    // cerca corrispondenza nelle parole
    for (const rule of map) {
        // some -> true se almeno una parola chiave è presente
        if (rule.keywords.some(k => g.includes(k))) {
            return rule.genre;
        }
    }

    // restituisce la parola principale se nessuna corrispondenza trovata
    return g.split(" ")[0];
}