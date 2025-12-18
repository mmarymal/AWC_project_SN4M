import {
  searchSpotify,
  formatDuration,
  getReleaseYear,
  getImageOrDefault
} from './api.js';

let scrollIndex = 0;
let selectedTrack = null;

function openPlaylistModal(track) {
  selectedTrack = track;
  document.getElementById('modalTrackName').textContent = `Brano: ${track.title} - ${track.artist}`;

  const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
  const user = JSON.parse(sessionStorage.getItem('utente'));
  const userPlaylists = playlists.filter(p => p.creator === user.username);

  const select = document.getElementById('playlistSelect');
  select.innerHTML = '<option value="">Seleziona una playlist</option>';
  userPlaylists.forEach(p => {
    const option = document.createElement('option');
    option.value = p.id;
    option.textContent = p.name;
    select.appendChild(option);
  });

  new bootstrap.Modal(document.getElementById('playlistModal')).show();
}

document.addEventListener('DOMContentLoaded', async function () {
  const userDataString = sessionStorage.getItem('utente');
  const utenti = JSON.parse(localStorage.getItem('utenti')) || [];

  if (!userDataString) {
    mostraToast("Non sei loggato. Effettua il login per accedere alla home.", "danger");
    window.location.href = "login.html";
    return;
  }

  let user;
  try {
    user = JSON.parse(userDataString);
  } catch (error) {
    mostraToast("Riprova il login.", "danger");
    window.location.href = "login.html";
    return;
  }

  document.getElementById('welcomeUsername').textContent = user.username;

  document.getElementById("search-form").addEventListener("submit", async function (event) {
    event.preventDefault();
    const query = document.getElementById("search-input").value.trim();
    if (query) {
      await mostraSuggerimentiMusicali(query);
    }
  });

  if (user.preferences) {
    await mostraSuggerimentiMusicali(user.preferences);
  }

  const cardWidth = 180;
  const visibleCards = 6;
  const track = document.getElementById('musicTrack');

  function updateCarousel(direction) {
    const maxIndex = Math.max(0, track.children.length - visibleCards);
    scrollIndex = Math.min(Math.max(scrollIndex + direction, 0), maxIndex);
    track.style.transform = `translateX(-${scrollIndex * cardWidth}px)`;
  }

  document.querySelector('.music-left').addEventListener('click', () => updateCarousel(-1));
  document.querySelector('.music-right').addEventListener('click', () => updateCarousel(1));
});

async function mostraSuggerimentiMusicali(query) {
  const data = await searchSpotify(query);
  const resultsContainer = document.getElementById('spotifyResults');
  resultsContainer.innerHTML = '';

  if (!data || !data.tracks?.items?.length) {
    resultsContainer.innerHTML = `<p>Nessun risultato trovato per "${query}".</p>`;
    return;
  }

  const carouselContainer = document.getElementById('musicTrack');
  carouselContainer.innerHTML = '';
  scrollIndex = 0;
  carouselContainer.style.transform = `translateX(0px)`;

  data.tracks.items.forEach(track => {
    const card = document.createElement('div');
    card.classList.add('track-card');
    card.innerHTML = `
      <img src="${getImageOrDefault(track.album.images)}" alt="${track.name}" class="track-image">
      <h3>${track.name}</h3>
      <p>${track.artists.map(a => a.name).join(', ')}</p>
      <button class="add-to-playlist btn btn-outline-primary btn-sm mt-2"
        data-id="${track.id}"
        data-name="${track.name}"
        data-artists="${track.artists.map(a => a.name).join(',')}"
        data-url="${track.external_urls.spotify}">
        ➕ Aggiungi a playlist
      </button>
    `;
    carouselContainer.appendChild(card);
  });

  carouselContainer.querySelectorAll('.add-to-playlist').forEach(button => {
    button.addEventListener('click', () => {
      const fullTrack = data.tracks.items.find(t => t.id === button.dataset.id);
      

      const track = {
        id: fullTrack.id,
        title: fullTrack.name,
        artist: fullTrack.artists.map(a => a.name).join(', '),
        duration: formatDuration(fullTrack.duration_ms),
        year: getReleaseYear(fullTrack)
      };

      scegliPlaylistEInserisci(track);
    });
  });
}

let trackSelezionato = null;

function scegliPlaylistEInserisci(track) {
  trackSelezionato = track;

  const user = JSON.parse(sessionStorage.getItem('utente'));
  const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
  const userPlaylists = playlists.filter(p => p.creator === user.username);

  const select = document.getElementById('playlistSelect');
  select.innerHTML = userPlaylists.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

  document.getElementById('modalTrackName').textContent = `Brano: ${track.name}`;
  document.getElementById('newPlaylistName').value = '';

  const modal = new bootstrap.Modal(document.getElementById('playlistModal'));
  modal.show();
}

document.getElementById('confirmAddBtn').addEventListener('click', () => {
  const user = JSON.parse(sessionStorage.getItem('utente'));
  const playlists = JSON.parse(localStorage.getItem('playlists')) || [];


  const playlistId = document.getElementById('playlistSelect').value;
  const newName = document.getElementById('newPlaylistName').value.trim();  let index = parseInt(document.getElementById('playlistSelect').value);

  let playlist;

  if (newName) {
    playlist = {
      id: Date.now().toString(),
      name: newName,
      creator: user.username,
      description: '',
      tags: [],
      community: null,
      tracks: []
    };
    playlists.push(playlist);
    mostraToast(`Playlist "${newName}" creata`, "info");
  } else {
    playlist = playlists.find(p => p.id === playlistId);
  }

  if (!playlist) {
    mostraToast("Seleziona una playlist valida.", "danger");
    return;
  }

  const giàPresente = playlist.tracks.some(t => t.id === trackSelezionato.id);
  if (giàPresente) {
    mostraToast("Questo brano è già presente nella playlist.", "warning");
  } else {
    playlist.tracks.push(trackSelezionato);
    mostraToast(`Brano aggiunto a "${playlist.name}"`, "success");
  }

  localStorage.setItem('playlists', JSON.stringify(playlists));

  const modal = bootstrap.Modal.getInstance(document.getElementById('playlistModal'));
  modal.hide();
});


function mostraToast(messaggio, tipo = 'success') {
  const toastEl = document.getElementById('sn4mToast');
  const toastBody = document.getElementById('toastMessage');

  toastBody.textContent = messaggio;
  toastEl.className = `toast align-items-center text-white bg-${tipo} border-0`;

  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}
