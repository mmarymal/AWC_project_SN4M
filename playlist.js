document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(sessionStorage.getItem('utente'));
    if (!user) return;

    // Mostra il nome utente
    document.getElementById('welcomeUsername').textContent = user.username;

    // Carica tutte le playlist salvate
    const allPlaylists = JSON.parse(localStorage.getItem('playlists')) || [];
    renderPlaylists();

    // Creazione nuova playlist
    const newForm = document.getElementById('newPlaylistForm');
    newForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const playlists = JSON.parse(localStorage.getItem('playlists')) || [];

        const newPlaylist = {
            id: Date.now().toString(),
            name: document.getElementById('playlistName').value.trim(),
            description: document.getElementById('playlistDescription').value.trim(),
            tags: document.getElementById('playlistTags').value.split(',').map(t => t.trim()).filter(Boolean),
            creator: user.username,
            community: null,
            tracks: []
        };

        playlists.push(newPlaylist);
        localStorage.setItem('playlists', JSON.stringify(playlists));

        // Aggiorna subito la schermata
        document.getElementById('myPlaylists').appendChild(renderPlaylistCard(newPlaylist));

        showToast("Playlist creata con successo!");
        bootstrap.Modal.getInstance(document.getElementById('createPlaylistModal')).hide();
        newForm.reset();
    });
});

function addTrackToPlaylist() {
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
    const user = JSON.parse(sessionStorage.getItem('utente'));
    const playlistId = document.getElementById('playlistSelect').value;
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist || !trackSelezionato) return;

    const track = {
        id: trackSelezionato.id,
        title: trackSelezionato.name,
        artist: trackSelezionato.artists.map(a => a.name).join(', '),
        genre: trackSelezionato.genres?.[0] || 'N/D',
        duration: formatDuration(trackSelezionato.duration_ms),
        year: getReleaseYear(trackSelezionato)
    };

    playlist.tracks.push(track);
    localStorage.setItem('playlists', JSON.stringify(playlists));

    showToast("Brano aggiunto alla playlist!");
    bootstrap.Modal.getInstance(document.getElementById('playlistModal')).hide();
    renderPlaylists();
}

// Funzione per mostrare tutte le playlist
function renderPlaylists() {
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
    const user = JSON.parse(sessionStorage.getItem('utente'));

    const myContainer = document.getElementById('myPlaylists');
    const communityContainer = document.getElementById('communityPlaylists');

    // Svuoto i contenitori prima di riempirli
    myContainer.innerHTML = '';
    communityContainer.innerHTML = '';

    // Playlist personali
    const myPlaylists = playlists.filter(p => p.creator === user.username);
    myPlaylists.forEach(p => {
        myContainer.appendChild(renderPlaylistCard(p));
    });

    // Playlist community
    const communityPlaylists = playlists.filter(p => p.community && user.community?.includes(p.community));
    communityPlaylists.forEach(p => {
        communityContainer.appendChild(renderPlaylistCard(p));
    });
}

// Funzione card
function renderPlaylistCard(playlist) {
    const template = document.getElementById('playlistCardTemplate');
    const clone = template.content.cloneNode(true);

    const title = clone.querySelector('.playlist-title');
    title.textContent = playlist.name;
    title.addEventListener('click', () => openPlaylistDetails(playlist.id));

    clone.querySelector('.btn-edit').addEventListener('click', (e) => {
        e.stopPropagation();
        editPlaylist(playlist.id);
    });

    clone.querySelector('.btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        confirmDelete(playlist.id);
    });

    return clone;
}

// Dettagli playlist: descrizione, tag, brani
function openPlaylistDetails(id) {
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
    const playlist = playlists.find(p => p.id === id);
    if (!playlist) return;

    const body = document.getElementById('viewPlaylistBody');
    body.innerHTML = `
    <h4>${playlist.name}</h4>
    <p><strong>Descrizione:</strong> ${playlist.description || 'Nessuna descrizione'}</p>
    <p><strong>Tag:</strong> ${playlist.tags?.join(', ') || 'Nessuno'}</p>
    <hr>
    <h5>Brani:</h5>
    <ul>
        ${playlist.tracks?.length
        ? playlist.tracks.map(t => `
            <li>
                <strong>${t.title}</strong><br>
                <small>
                    Cantante: ${t.artist}<br>
                    Genere: ${t.genre || 'N/D'}<br>
                    Durata: ${t.duration || 'N/D'}<br>
                    Anno: ${t.year || 'N/D'}
                </small>
            </li>
        `).join('')
        : '<li>Nessun brano</li>'}
    </ul>
  `;
    new bootstrap.Modal(document.getElementById('viewPlaylistModal')).show();
}

// Modifica playlist
function editPlaylist(id) {
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
    const playlist = playlists.find(p => p.id === id);
    if (!playlist) return;

    document.getElementById('editPlaylistName').value = playlist.name;
    document.getElementById('editPlaylistDescription').value = playlist.description || '';
    document.getElementById('editPlaylistTags').value = playlist.tags?.join(', ') || '';

    //mostra brani con pulsanti per rimuoverli
    const trackList = document.getElementById('editPlaylistTracks');
    trackList.innerHTML = '';

    if (playlist.tracks?.length) {
        playlist.tracks.forEach(track => {
            const li = document.createElement('li');
            li.classList.add("list-group-item", "p-3", "rounded", "shadow-sm", "mb-2", "bg-light");
            
            li.innerHTML = ` 
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${track.title}</h6> 
                        <p class="mb-0 text-muted" style="font-size: 0.9em;">
                            🎤 ${track.artist} &nbsp; | &nbsp; 
                            🎧 ${track.genre || 'N/D'} &nbsp; | &nbsp; 
                            ⏱ ${track.duration || 'N/D'} &nbsp; | &nbsp; 
                            📅 ${track.year || 'N/D'} 
                        </p> 
                    </div>
                    <button class="btn btn-outline-danger btn-sm remove-track" data-id="${track.id}" title="Rimuovi brano"> 
                        <i class="bi bi-x-circle"></i>
                    </button>
                </div>
            `;

            trackList.appendChild(li);
        });
    } else {
        trackList.innerHTML = '<li>Nessun brano nella playlist.</li>';
    }

    //rimozione brano
    trackList.querySelectorAll(".remove-track").forEach(button => {
        button.addEventListener('click', () => {
            const trackId = button.dataset.id;

            //rimuovo brano dalla playlist
            playlist.tracks = playlist.tracks.filter(t => t.id !== trackId);

            //salvo
            localStorage.setItem('playlists', JSON.stringify(playlists));

            //aggiorno ui della modale
            setTimeout(() => editPlaylist(id), 50);
            
        });
    });

    // salvataggio modifiche
    const form = document.getElementById('editPlaylistForm');
    form.onsubmit = function (e) {
        e.preventDefault();
        playlist.name = document.getElementById('editPlaylistName').value.trim();
        playlist.description = document.getElementById('editPlaylistDescription').value.trim();
        playlist.tags = document.getElementById('editPlaylistTags').value.split(',').map(t => t.trim()).filter(Boolean);

        localStorage.setItem('playlists', JSON.stringify(playlists));

        showToast("Playlist modificata con successo!");
        bootstrap.Modal.getInstance(document.getElementById('editPlaylistModal')).hide();
        renderPlaylists();
    };

    new bootstrap.Modal(document.getElementById('editPlaylistModal')).show();
}

function confirmDelete(id) {
    const btn = document.getElementById('confirmDeleteBtn');
    btn.onclick = function () {
        let playlists = JSON.parse(localStorage.getItem('playlists')) || [];
        playlists = playlists.filter(p => p.id !== id);
        localStorage.setItem('playlists', JSON.stringify(playlists));
        showToast("Playlist eliminata!");
        bootstrap.Modal.getInstance(document.getElementById('confirmDeleteModal')).hide();
        renderPlaylists();
    };

    new bootstrap.Modal(document.getElementById('confirmDeleteModal')).show();
}

function showToast(message) {
    const toastEl = document.getElementById('sn4mToast');
    const toastMessage = document.getElementById('toastMessage');
    if (!toastEl || !toastMessage) return;
    toastMessage.textContent = message;
    new bootstrap.Toast(toastEl).show();
}

