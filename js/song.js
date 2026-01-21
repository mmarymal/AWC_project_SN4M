import {
    searchSpotify,
    formatDuration,
    getReleaseYear,
    getSpotifyAccessToken,
    getArtistGenre
} from "./api.js";

async function loadTrackDetails() {
    const params = new URLSearchParams(window.location.search);
    const trackId = params.get("id");

    if (!trackId) return;

    // Recupera token Spotify
    const token = await getSpotifyAccessToken();

    // Recupera dettagli completi del brano
    const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    const track = await res.json();

    // Recupera genere dall'artista principale
    const genre = await getArtistGenre(track.artists[0].id);

    // Popola la pagina
    document.getElementById("trackTitle").textContent = track.name;
    document.getElementById("trackArtist").textContent = track.artists.map(a => a.name).join(", ");
    document.getElementById("trackAlbum").textContent = track.album.name;
    document.getElementById("trackDuration").textContent = formatDuration(track.duration_ms);
    document.getElementById("trackYear").textContent = getReleaseYear(track);
    document.getElementById("trackGenre").textContent = genre || "Sconosciuto";

    document.getElementById("trackImage").src = track.album.images?.[0]?.url;

    // Salva il brano per "Aggiungi a playlist"
    sessionStorage.setItem("trackSelezionato", JSON.stringify( {
        id: track.id,
        title: track.name,
        artist: track.artists.map(a => a.name).join(", "),
        duration: formatDuration(track.duration_ms),
        genre: genre,
        year: getReleaseYear(track)
    }));
}

loadTrackDetails();

document.getElementById("addToPlaylistFromSong").addEventListener("click", () => {
    const track = JSON.parse(sessionStorage.getItem("trackSelezionato"));
    apriModalPlaylist(track);
});




