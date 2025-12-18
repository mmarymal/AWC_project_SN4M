document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(sessionStorage.getItem('utente'));
    if (!user) return;

    // Mostra il nome utente
    document.getElementById('welcomeUsername').textContent = user.username;

    // Carica tutte le playlist salvate
    const allPlaylists = JSON.parse(localStorage.getItem('playlists')) || [];
    renderPlaylists(allPlaylists, user);

    // ✅ Creazione nuova playlist
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

// ✅ Funzione per mostrare tutte le playlist
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
            ? playlist.tracks.map(t => `<li>${t.title} - ${t.artist}</li>`).join('')
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

    const form = document.getElementById('editPlaylistForm');
    form.onsubmit = function (e) {
        e.preventDefault();
        playlist.name = document.getElementById('editPlaylistName').value.trim();
        playlist.description = document.getElementById('editPlaylistDescription').value.trim();
        playlist.tags = document.getElementById('editPlaylistTags').value.split(',').map(t => t.trim()).filter(Boolean);

        localStorage.setItem('playlists', JSON.stringify(playlists));
        showToast("Playlist modificata con successo!");
        bootstrap.Modal.getInstance(document.getElementById('editPlaylistModal')).hide();
        renderPlaylists(playlists, JSON.parse(sessionStorage.getItem('utente')));
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
        renderPlaylists(playlists, JSON.parse(sessionStorage.getItem('utente')));
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

