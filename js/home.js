import {
  searchSpotify,
  formatDuration,
  getReleaseYear,
  getImageOrDefault,
  getArtistTopTracks,
  normalizeGenre,
  getArtistGenre
} from './api.js';

let scrollIndex = 0; //tiene traccia posizione corrente carosello

// aspetta che header sia caricato
document.addEventListener("headerLoaded", initHome);

// inizializza home epr controlli e suggerimenti
async function initHome() {

  /* Controllo login */
  const userDataString = sessionStorage.getItem('utente');
  if (!userDataString) {
    // se non c'è utente salvato, reindirizza al login
    showToast("Non sei loggato. Effettua il login per accedere alla home.", "danger");
    window.location.href = "login.html";
    return;
  }

  let user;
  try {
    user = JSON.parse(userDataString);
  } catch {
    // se json corrotto, reindirizza al login
    showToast("Errore nel recupero dati utente. Rieffettua il login.", "danger");
    window.location.href = "login.html";
    return;
  }

  /* Mostra nome utente nell’header */
  document.getElementById('welcomeUsername').textContent = user.username;

  /* Suggerimenti iniziali basati sulle preferenze */
  if (user.preferences) {
    await mostraSuggerimentiMusicali(user.preferences);
  }

  /* Inizializza carosello */
  initCarousel();
}

/* CAROSELLO */
function initCarousel() {
  const track = document.getElementById('musicTrack'); //container carosello
  const card = track.querySelector('.track-card');

  //se non ci sono card, esci
  if (!card) return;

  // calcola larghezza dinamica card
  const cardWidth = card.offsetWidth;
  const visibleCards = 6; //num card visibili

  function updateCarousel(direction) {
    // calcolare indice max (x non scorrere oltre)
    const maxIndex = Math.max(0, track.children.length - visibleCards);
    // aggiorna indice e che resti nei limiti
    scrollIndex = Math.min(Math.max(scrollIndex + direction, 0), maxIndex);
    // sposta il track
    track.style.transform = `translateX(-${scrollIndex * cardWidth}px)`;
  }

  document.querySelector('.music-left').addEventListener('click', () => updateCarousel(-1));
  document.querySelector('.music-right').addEventListener('click', () => updateCarousel(1));
}

/* SUGGERIMENTI MUSICALI */
async function mostraSuggerimentiMusicali(query) {
  // recupera contenitor x risultati
  const resultsContainer = document.getElementById('spotifyResults');
  const carouselContainer = document.getElementById('musicTrack');

  // pulisce i contenitori
  resultsContainer.innerHTML = '';
  carouselContainer.innerHTML = '';
  scrollIndex = 0; // reset indice carosello

  // recupera preferenze utente
  const user = JSON.parse(sessionStorage.getItem('utente'));
  const preferredGenre = normalizeGenre(user.preferences);
  const preferredArtists = user.artists?.map(a => a.toLowerCase()) || [];

  let allTracks = []; // array x tracce suggerite

  /* cerca x artisti preferiti */
  for (const artistName of preferredArtists) {
    const data = await searchSpotify(artistName);
    if (data?.artists?.items?.length > 0) {
      const artist = data.artists.items[0]; //prende risultato più rilevante

      // recupera top tracks artista
      const topTracks = await getArtistTopTracks(artist.id);
      allTracks.push(...topTracks); //aggiunge brani
    }
  }

  /* cerca artisti del genere preferito */
  if (preferredGenre) {
    const genreSearch = await searchSpotify(preferredGenre);
    if (genreSearch?.artists?.items?.length > 0) {
      // filtra artisti che corrispondono al genere
      const genreArtists = genreSearch.artists.items.filter(a =>
        a.genres.some(g => g.toLowerCase().includes(preferredGenre))
      );

      // per ogni artista del genere, recupera top tracks
      for (const artist of genreArtists) {
        const topTracks = await getArtistTopTracks(artist.id);
        allTracks.push(...topTracks);
      }
    }
  }

  /* Rimuovi duplicati  */
  const uniqueTracks = Array.from(new Map(allTracks.map(t => [t.id, t])).values());

  // se non ci sono suggerimenti, mostra messaggio
  if (!uniqueTracks.length) {
    resultsContainer.innerHTML = `<p>Nessun suggerimento disponibile.</p>`;
    return;
  }

  /* crea card nel carosello */
  uniqueTracks.forEach(track => {
    const card = document.createElement('div');
    card.classList.add('track-card');
    // costruisce card
    card.innerHTML = `
      <img src="${getImageOrDefault(track.album.images)}" 
          alt="${track.name}" 
          class="track-image"
          data-id="${track.id}"
          style="cursor:pointer;">

      <h3 class="track-title" 
          data-id="${track.id}" 
          style="cursor:pointer;">
          ${track.name}
      </h3>

      <p>${track.artists.map(a => a.name).join(', ')}</p>

      <button class="add-to-playlist btn btn-outline-primary btn-sm mt-2" data-id="${track.id}">
        ➕ Aggiungi a playlist
      </button>
    `;

    // aggiunge click su immagine e titolo per andare ai dettagli del brano
    document.querySelectorAll(".track-title, .track-image").forEach(el => {
      el.addEventListener("click", () => {
        const id = el.dataset.id;
        window.location.href = `song.html?id=${id}`;
      });
    });

    //creata card e aggiunge al carosello
    carouselContainer.appendChild(card);
  });

  /* pulsante "Aggiungi a playlist" */
  carouselContainer.querySelectorAll('.add-to-playlist').forEach(button => {
    button.addEventListener('click', async () => {
      // trova traccia completa usa id
      const fullTrack = uniqueTracks.find(t => t.id === button.dataset.id);

      // recupera genere
      const genres = await getArtistGenre(fullTrack.artists[0].id);

      // crea oggetto track con info necessarie
      const track = {
        id: fullTrack.id,
        name: fullTrack.name,
        title: fullTrack.name,
        artist: fullTrack.artists.map(a => a.name).join(', '),
        duration: formatDuration(fullTrack.duration_ms),
        genre: genres.length ? genres.join(", ") : "Genere non disponibile", //cambiata
        year: getReleaseYear(fullTrack),
        image: fullTrack.album.images?.[0]?.url
      };

      // mostra modale x aggiungere a playlist
      apriModalPlaylist(track);
    });
  });
}

/* TOAST */
function showToast(messaggio, tipo = 'success') {
  const toastEl = document.getElementById('sn4mToast');
  const toastBody = document.getElementById('toastMessage');

  toastBody.textContent = messaggio;
  toastEl.className = `toast align-items-center text-white bg-${tipo} border-0`;

  new bootstrap.Toast(toastEl).show();
}
