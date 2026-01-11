document.addEventListener('headerLoaded', () => {
    const user = JSON.parse(sessionStorage.getItem('utente'));
    if (!user) return;

    // Mostra nome utente nell’header
    document.getElementById('welcomeUsername').textContent = user.username;

    // Render iniziale
    renderPlaylists();

    /* RICERCA PLAYLIST DELLE COMMUNITY */
    const searchInput = document.getElementById('communityPlaylistSearch');
    if (searchInput) {
        searchInput.addEventListener('input', e => {
            const query = e.target.value;

            const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
            const communities = JSON.parse(localStorage.getItem('communities')) || [];
            const user = JSON.parse(sessionStorage.getItem('utente'));

            const myCommunities = communities.filter(c => c.members.includes(user.username));

            const communityPlaylists = playlists.filter(p =>
                Array.isArray(p.communities) &&
                p.communities.some(cid => myCommunities.some(c => c.id === cid))
            );

            const filtered = searchPlaylists(query, communityPlaylists);

            const container = document.getElementById('communityPlaylists');
            container.innerHTML = '';

            if (filtered.length === 0) {
                container.innerHTML = '<p class="text-muted">Nessuna playlist trovata.</p>';
            } else {
                filtered.forEach(p => {
                    container.appendChild(renderPlaylistCard(p, p.creator === user.username));
                });
            }
        });
    }

    /* CREAZIONE NUOVA PLAYLIST  */
    const newForm = document.getElementById('newPlaylistForm');
    if (newForm) {
        newForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const playlists = JSON.parse(localStorage.getItem('playlists')) || [];

            const newPlaylist = {
                id: Date.now().toString(),
                name: document.getElementById('playlistName').value.trim(),
                description: document.getElementById('playlistDescription').value.trim(),
                tags: document.getElementById('playlistTags').value.split(',').map(t => t.trim()).filter(Boolean),
                creator: user.username,
                communities: [],
                tracks: []
            };

            playlists.push(newPlaylist);
            localStorage.setItem('playlists', JSON.stringify(playlists));

            document.getElementById('myPlaylists').appendChild(renderPlaylistCard(newPlaylist, true));

            showToast("Playlist creata con successo!");
            bootstrap.Modal.getInstance(document.getElementById('createPlaylistModal')).hide();
            newForm.reset();
        });
    }
});

/* RENDER PLAYLIST */
function renderPlaylists() {
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
    const communities = JSON.parse(localStorage.getItem('communities')) || [];
    const user = JSON.parse(sessionStorage.getItem('utente'));

    const myContainer = document.getElementById('myPlaylists');
    const communityContainer = document.getElementById('communityPlaylists');

    myContainer.innerHTML = '';
    communityContainer.innerHTML = '';

    playlists.forEach(p => {
        if (!Array.isArray(p.communities)) p.communities = [];
    });

    const myPlaylists = playlists.filter(p => p.creator === user.username);
    myPlaylists.forEach(p => myContainer.appendChild(renderPlaylistCard(p, true)));

    const myCommunities = communities.filter(c => c.members.includes(user.username));

    const communityPlaylistsFiltered = playlists.filter(p =>
        Array.isArray(p.communities) &&
        p.communities.some(cid => myCommunities.some(c => c.id === cid))
    );

    if (communityPlaylistsFiltered.length === 0) {
        communityContainer.innerHTML = '<p class="text-muted">Nessuna playlist condivisa nelle tue community.</p>';
    } else {
        communityPlaylistsFiltered.forEach(p => communityContainer.appendChild(renderPlaylistCard(p, false)));
    }

    localStorage.setItem('playlists', JSON.stringify(playlists));
}

/* CARD PLAYLIST */
function renderPlaylistCard(playlist, isOwner) {
    const template = document.getElementById('playlistCardTemplate');
    const clone = template.content.cloneNode(true);
    const user = JSON.parse(sessionStorage.getItem('utente'));
    const communities = JSON.parse(localStorage.getItem('communities')) || [];

    if (!Array.isArray(playlist.communities)) playlist.communities = [];

    const card = clone.querySelector('.playlist-card');
    const title = clone.querySelector('.playlist-title');
    const dropdownMenu = clone.querySelector('.dropdown-menu');

    dropdownMenu.innerHTML = '';

    title.textContent = playlist.name;
    title.addEventListener('click', () => openPlaylistDetails(playlist.id));

    if (playlist.communities.length > 0) {
        const badge = document.createElement('span');
        badge.className = 'badge bg-success ms-2';
        badge.textContent = `📢`;
        title.appendChild(badge);
    }

    if (isOwner) {
        const editItem = document.createElement('li');
        editItem.innerHTML = `<a class="dropdown-item" href="#">Modifica</a>`;
        editItem.addEventListener('click', e => {
            e.preventDefault();
            editPlaylist(playlist.id);
        });
        dropdownMenu.appendChild(editItem);

        if (playlist.communities.length > 0) {
            const shareMoreItem = document.createElement('li');
            shareMoreItem.innerHTML = `<a class="dropdown-item text-info" href="#">Condividi in una community</a>`;
            shareMoreItem.addEventListener('click', e => {
                e.preventDefault();
                sharePlaylist(playlist.id);
            });
            dropdownMenu.appendChild(shareMoreItem);

            const unshareItem = document.createElement('li');
            unshareItem.innerHTML = `<a class="dropdown-item text-warning" href="#">Rimuovi da una community...</a>`;
            unshareItem.addEventListener('click', e => {
                e.preventDefault();
                openUnshareModal(playlist.id);
            });
            dropdownMenu.appendChild(unshareItem);

            const unshareAllItem = document.createElement('li');
            unshareAllItem.innerHTML = `<a class="dropdown-item text-warning" href="#">Rimuovi da tutte le community</a>`;
            unshareAllItem.addEventListener('click', e => {
                e.preventDefault();
                unsharePlaylist(playlist.id);
            });
            dropdownMenu.appendChild(unshareAllItem);

        } else {
            const shareItem = document.createElement('li');
            shareItem.innerHTML = `<a class="dropdown-item text-info" href="#">Condividi in community</a>`;
            shareItem.addEventListener('click', e => {
                e.preventDefault();
                sharePlaylist(playlist.id);
            });
            dropdownMenu.appendChild(shareItem);
        }

        const deleteItem = document.createElement('li');
        deleteItem.innerHTML = `<a class="dropdown-item text-danger" href="#">Elimina</a>`;
        deleteItem.addEventListener('click', e => {
            e.preventDefault();
            confirmDelete(playlist.id);
        });
        dropdownMenu.appendChild(deleteItem);

    } else {
        const importItem = document.createElement('li');
        importItem.innerHTML = `<a class="dropdown-item text-primary" href="#">Importa nel mio profilo</a>`;
        importItem.addEventListener('click', e => {
            e.preventDefault();
            importPlaylist(playlist.id);
        });
        dropdownMenu.appendChild(importItem);
    }

    return clone;
}

/* RICERCA PLAYLIST */
function searchPlaylists(query, playlists) {
    const q = query.trim().toLowerCase();

    return playlists.filter(p => {
        const nameMatch = p.name?.toLowerCase().includes(q);
        const descMatch = p.description?.toLowerCase().includes(q);
        const tagMatch = p.tags?.some(tag => tag.toLowerCase().includes(q));
        return nameMatch || descMatch || tagMatch;
    });
}

/* CONDIVISIONE / RIMOZIONE COMMUNITY */
function sharePlaylist(playlistId) {
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
    const communities = JSON.parse(localStorage.getItem('communities')) || [];
    const user = JSON.parse(sessionStorage.getItem('utente'));
    const playlist = playlists.find(p => p.id === playlistId);

    if (!playlist) return;

    // Community in cui l'utente è membro
    const myCommunities = communities.filter(c => c.members.includes(user.username));

    if (myCommunities.length === 0) {
        showToast("Non fai parte di nessuna community!", "info");
        return;
    }

    // Crea modal per scegliere la community
    const modalHtml = `
            <div class="modal fade" id="shareCommunityModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Condividi in una community</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p>Scegli in quale community condividere "<strong>${playlist.name}</strong>":</p>
                            <select id="shareCommunitySelect" class="form-select">
                                ${myCommunities.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                            </select>
                            <small class="text-muted d-block mt-2">
                                Puoi ripetere l'operazione per condividerla in più community.
                            </small>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" id="confirmShareBtn">Condividi</button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

    // Rimuovi modal precedente se esiste
    const oldModal = document.getElementById('shareCommunityModal');
    if (oldModal) oldModal.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('shareCommunityModal'));
    modal.show();

    document.getElementById('confirmShareBtn').addEventListener('click', () => {
        const communityId = document.getElementById('shareCommunitySelect').value;

        if (!playlist.communities) playlist.communities = [];

        // Se è già condivisa → avvisa e interrompi
        if (playlist.communities.includes(communityId)) {
            showToast("Playlist già presente in questa community!", "warning");
            bootstrap.Modal.getInstance(document.getElementById('shareCommunityModal')).hide();
            return;
        }

        // Altrimenti condividila
        playlist.communities.push(communityId);

        localStorage.setItem('playlists', JSON.stringify(playlists));

        const community = communities.find(c => c.id === communityId);
        showToast(`Playlist condivisa in "${community?.name || 'Community'}"!`, "success");
        modal.hide();
        renderPlaylists();
    });
}
function openUnshareModal(playlistId) {
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
    const communities = JSON.parse(localStorage.getItem('communities')) || [];
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist || !Array.isArray(playlist.communities)) return;

    const sharedCommunities = communities.filter(c => playlist.communities.includes(c.id));
    if (sharedCommunities.length === 0) {
        showToast("Questa playlist non è condivisa con nessuna community.", "warning");
        return;
    }

    const modalHtml = `
            <div class="modal fade" id="unshareCommunityModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Rimuovi condivisione</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p>Scegli da quale community rimuovere "<strong>${playlist.name}</strong>":</p>
                            <select id="unshareCommunitySelect" class="form-select">
                                ${sharedCommunities.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-danger" id="confirmUnshareBtn">Rimuovi</button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

    const oldModal = document.getElementById('unshareCommunityModal');
    if (oldModal) oldModal.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('unshareCommunityModal'));
    modal.show();

    document.getElementById('confirmUnshareBtn').addEventListener('click', () => {
        const communityId = document.getElementById('unshareCommunitySelect').value;
        playlist.communities = playlist.communities.filter(cid => cid !== communityId);
        localStorage.setItem('playlists', JSON.stringify(playlists));

        const community = communities.find(c => c.id === communityId);
        showToast(`Playlist rimossa da "${community?.name || 'Community'}"`, "warning");
        modal.hide();
        renderPlaylists();
    });
}

function unsharePlaylist(playlistId) {
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
    const playlist = playlists.find(p => p.id === playlistId);

    if (!playlist) return;

    // Rimuove la condivisione da tutte le community
    playlist.communities = [];
    localStorage.setItem('playlists', JSON.stringify(playlists));

    showToast("Condivisione rimossa da tutte le community!", "primary");
    renderPlaylists();
}

/* IMPORTA PLAYLIST */
function importPlaylist(playlistId) {
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
    const user = JSON.parse(sessionStorage.getItem('utente'));
    const originalPlaylist = playlists.find(p => p.id === playlistId);

    if (!originalPlaylist) return;

    // Crea una copia della playlist
    const importedPlaylist = {
        id: Date.now().toString(),
        name: `${originalPlaylist.name} (importata)`,
        description: originalPlaylist.description,
        tags: [...originalPlaylist.tags],
        creator: user.username,
        communities: [], // Le playlist importate sono private
        tracks: JSON.parse(JSON.stringify(originalPlaylist.tracks)) // Deep copy
    };

    playlists.push(importedPlaylist);
    localStorage.setItem('playlists', JSON.stringify(playlists));

    showToast(`Playlist "${originalPlaylist.name}" importata con successo!`, "success");
    renderPlaylists();
}

/* DETTAGLI PLAYLIST */
function openPlaylistDetails(id) {
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
    const communities = JSON.parse(localStorage.getItem('communities')) || [];
    const playlist = playlists.find(p => p.id === id);
    if (!playlist) return;

    const body = document.getElementById('viewPlaylistBody');
    body.innerHTML = "";

    const header = document.createElement('div');
    header.className = 'playlist-details-header';

    const title = document.createElement('h2');
    title.textContent = playlist.name;

    const creatorInfo = document.createElement('p');
    creatorInfo.className = 'text-muted';
    creatorInfo.innerHTML = `<strong>Creata da:</strong> ${playlist.creator}`;

    const description = document.createElement('p');
    description.innerHTML = `<strong>Descrizione:</strong> ${playlist.description || 'Nessuna descrizione'}`;

    header.appendChild(title);
    header.appendChild(creatorInfo);
    header.appendChild(description);

    // Community badge (una o più)
    if (playlist.communities && playlist.communities.length > 0) {
        const community = document.createElement('p');
        const communitiesData = communities.filter(c => playlist.communities.includes(c.id));
        community.innerHTML = `
                <span class="badge bg-success">
                    📢 Condivisa in: ${communitiesData.map(c => c.name).join(', ')}
                </span>
            `;
        header.appendChild(community);
    }

    // Tags
    if (playlist.tags?.length) {
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'mt-2';
        playlist.tags.forEach(tag => {
            const badge = document.createElement('span');
            badge.className = 'playlist-tag';
            badge.textContent = tag;
            tagsContainer.appendChild(badge);
        });
        header.appendChild(tagsContainer);
    }

    body.appendChild(header);

    const hr = document.createElement('hr');
    body.appendChild(hr);

    const trackTitle = document.createElement('h5');
    trackTitle.textContent = "🎵 Brani nella playlist";
    trackTitle.style.marginBottom = "1rem";
    body.appendChild(trackTitle);

    if (playlist.tracks?.length) {
        playlist.tracks.forEach(track => {
            const card = document.createElement('div');
            card.className = 'track-card';

            const trackName = document.createElement('h6');
            trackName.textContent = track.title;

            const info = document.createElement('p');
            info.className = 'track-info';

            info.innerHTML = `
                    🎤 ${track.artist}<br>
                    ⏱ ${track.duration || 'N/D'} &nbsp; | &nbsp;
                    📅 ${track.year || 'N/D'} &nbsp; | &nbsp;
                    🎧 ${track.genre || 'N/D'}
                `;

            card.appendChild(trackName);
            card.appendChild(info);
            body.appendChild(card);
        });
    } else {
        const empty = document.createElement('p');
        empty.className = 'text-muted';
        empty.textContent = "Nessun brano nella playlist.";
        body.appendChild(empty);
    }

    new bootstrap.Modal(document.getElementById('viewPlaylistModal')).show();
}

/* MODIFICA PLAYLIST */
function editPlaylist(id) {
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
    const playlist = playlists.find(p => p.id === id);
    if (!playlist) return;

    document.getElementById('editPlaylistName').value = playlist.name;
    document.getElementById('editPlaylistDescription').value = playlist.description || '';
    document.getElementById('editPlaylistTags').value = playlist.tags?.join(', ') || '';

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

    trackList.querySelectorAll(".remove-track").forEach(button => {
        button.addEventListener('click', () => {
            const trackId = button.dataset.id;
            playlist.tracks = playlist.tracks.filter(t => t.id !== trackId);
            localStorage.setItem('playlists', JSON.stringify(playlists));
            setTimeout(() => editPlaylist(id), 50);
        });
    });

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

/* ELIMINA PLAYLIST */
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

/* TOAST */
function showToast(message, tipo = "success") {
    const toastEl = document.getElementById('sn4mToast');
    const toastMessage = document.getElementById('toastMessage');
    if (!toastEl || !toastMessage) return;

    toastMessage.textContent = message;
    toastEl.className = `toast align-items-center text-white bg-${tipo} border-0`;

    new bootstrap.Toast(toastEl).show();
}
