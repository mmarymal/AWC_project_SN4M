// document.addEventListener('headerLoaded', () => {
//     const btn = document.getElementById("confirmAddBtn");
//     if (btn) {
//         btn.addEventListener("click", addTrackToPlaylist);
//     }

//     const user = JSON.parse(sessionStorage.getItem('utente'));
//     if (!user) return;

//     // Mostra il nome utente
//     document.getElementById('welcomeUsername').textContent = user.username;

//     // Carica tutte le playlist salvate
//    const allPlaylists = JSON.parse(localStorage.getItem('playlists')) || [];
//     renderPlaylists();

//     // Creazione nuova playlist
//     const newForm = document.getElementById('newPlaylistForm');
//     newForm.addEventListener('submit', function (e) {
//         e.preventDefault();

//         const playlists = JSON.parse(localStorage.getItem('playlists')) || [];

//         const newPlaylist = {
//             id: Date.now().toString(),
//             name: document.getElementById('playlistName').value.trim(),
//             description: document.getElementById('playlistDescription').value.trim(),
//             tags: document.getElementById('playlistTags').value.split(',').map(t => t.trim()).filter(Boolean),
//             creator: user.username,
//             community: null,
//             tracks: []

//         };

//         playlists.push(newPlaylist);
//         localStorage.setItem('playlists', JSON.stringify(playlists));

//         // Aggiorna subito la schermata
//         document.getElementById('myPlaylists').appendChild(renderPlaylistCard(newPlaylist));

//         showToast("Playlist creata con successo!");
//         bootstrap.Modal.getInstance(document.getElementById('createPlaylistModal')).hide();
//         newForm.reset();

       

//     });

// });

// function addTrackToPlaylist() {
//     const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
//     const user = JSON.parse(sessionStorage.getItem('utente'));
//     const playlistId = document.getElementById('playlistSelect').value;
//     const playlist = playlists.find(p => p.id === playlistId);
//     if (!playlist || !trackSelezionato) return;

//     const alreadyInPlaylist = playlist.tracks.some(t => t.id === trackSelezionato.id);
//     if (alreadyInPlaylist) {
//         showToast("Brano già presente nella playlist!", "warning");
//         bootstrap.Modal.getInstance(document.getElementById("playlistModal")).hide();
//         return;
//     }

//     const track = {
//         id: trackSelezionato.id,
//         title: trackSelezionato.name,
//         artist: trackSelezionato.artists.map(a => a.name).join(', '),
//         duration: trackSelezionato.duration_ms ? Math.floor(trackSelezionato.duration_ms / 1000) + " sec" : "N/D",
//         year: trackSelezionato.album?.release_date?.slice(0, 4) || "N/D",
//         genre: "N/D" // Spotify non restituisce i generi nelle search
//     };


//     playlist.tracks.push(track);
//     localStorage.setItem('playlists', JSON.stringify(playlists));

//     showToast("Brano aggiunto alla playlist!");
//     bootstrap.Modal.getInstance(document.getElementById('playlistModal')).hide();
//     renderPlaylists();
// }

// // Funzione per mostrare tutte le playlist
// function renderPlaylists() {
//     const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
//     const user = JSON.parse(sessionStorage.getItem('utente'));

//     const myContainer = document.getElementById('myPlaylists');
//     const communityContainer = document.getElementById('communityPlaylists');

//     // Svuoto i contenitori prima di riempirli
//     myContainer.innerHTML = '';
//     communityContainer.innerHTML = '';

//     // Playlist personali
//     const myPlaylists = playlists.filter(p => p.creator === user.username);
//     myPlaylists.forEach(p => {
//         myContainer.appendChild(renderPlaylistCard(p));
//     });

//     // Playlist community
//     const communityPlaylists = playlists.filter(p => p.community && user.community?.includes(p.community));
//     communityPlaylists.forEach(p => {
//         communityContainer.appendChild(renderPlaylistCard(p));
//     });
// }

// // Funzione card
// function renderPlaylistCard(playlist) {
//     const template = document.getElementById('playlistCardTemplate');
//     const clone = template.content.cloneNode(true);

//     const title = clone.querySelector('.playlist-title');
//     title.textContent = playlist.name;
//     title.addEventListener('click', () => openPlaylistDetails(playlist.id));

//     clone.querySelector('.btn-edit').addEventListener('click', (e) => {
//         e.stopPropagation();
//         editPlaylist(playlist.id);
//     });

//     clone.querySelector('.btn-delete').addEventListener('click', (e) => {
//         e.stopPropagation();
//         confirmDelete(playlist.id);
//     });

//     return clone;
// }

// // Dettagli playlist: descrizione, tag, brani
// function openPlaylistDetails(id) {
//     const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
//     const playlist = playlists.find(p => p.id === id);
//     if (!playlist) return;

//     const body = document.getElementById('viewPlaylistBody');
//     body.innerHTML = ""; // pulizia contenuto precedente

//     const header = document.createElement('div');
//     header.className = 'playlist-details-header';

//     const title = document.createElement('h2');
//     title.textContent = playlist.name;

//     const description = document.createElement('p');
//     description.textContent = playlist.description || 'Nessuna descrizione';

//     header.appendChild(title);
//     header.appendChild(description);

//     // tags
//     if (playlist.tags?.length) {
//         playlist.tags.forEach(tag => {
//             const badge = document.createElement('span');
//             badge.className = 'playlist-tag';
//             badge.textContent = tag;
//             header.appendChild(badge);
//         });
//     }

//     body.appendChild(header);

//     // separatore
//     const hr = document.createElement('hr');
//     body.appendChild(hr);

//     // titolo sezione brani
//     const trackTitle = document.createElement('h5');
//     trackTitle.textContent = "🎵 Brani nella playlist";
//     trackTitle.style.marginBottom = "1rem";
//     body.appendChild(trackTitle);

//     // lista brani
//     if (playlist.tracks?.length) {
//         playlist.tracks.forEach(track => {
//             const card = document.createElement('div');
//             card.className = 'track-card';

//             const trackName = document.createElement('h6');
//             trackName.textContent = track.title;

//             const info = document.createElement('p');
//             info.className = 'track-info';

//             info.innerHTML = `
//                 🎤 ${track.artist}<br>
//                 ⏱ ${track.duration || 'N/D'} &nbsp; | &nbsp;
//                 📅 ${track.year || 'N/D'} &nbsp; | &nbsp;
//                 🎧 ${track.genre || 'N/D'}
//             `;

//             card.appendChild(trackName);
//             card.appendChild(info);
//             body.appendChild(card);
//         });
//     } else {
//         const empty = document.createElement('p');
//         empty.className = 'text-muted';
//         empty.textContent = "Nessun brano nella playlist.";
//         body.appendChild(empty);
//     }

//     // Mostra modale
//     new bootstrap.Modal(document.getElementById('viewPlaylistModal')).show();
// }

// // Modifica playlist
// function editPlaylist(id) {
//     const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
//     const playlist = playlists.find(p => p.id === id);
//     if (!playlist) return;

//     document.getElementById('editPlaylistName').value = playlist.name;
//     document.getElementById('editPlaylistDescription').value = playlist.description || '';
//     document.getElementById('editPlaylistTags').value = playlist.tags?.join(', ') || '';

//     //mostra brani con pulsanti per rimuoverli
//     const trackList = document.getElementById('editPlaylistTracks');
//     trackList.innerHTML = '';

//     if (playlist.tracks?.length) {
//         playlist.tracks.forEach(track => {
//             const li = document.createElement('li');
//             li.classList.add("list-group-item", "p-3", "rounded", "shadow-sm", "mb-2", "bg-light");

//             li.innerHTML = ` 
//                 <div class="d-flex justify-content-between align-items-center">
//                     <div>
//                         <h6 class="mb-1">${track.title}</h6> 
//                         <p class="mb-0 text-muted" style="font-size: 0.9em;">
//                             🎤 ${track.artist} &nbsp; | &nbsp; 
//                             🎧 ${track.genre || 'N/D'} &nbsp; | &nbsp; 
//                             ⏱ ${track.duration || 'N/D'} &nbsp; | &nbsp; 
//                             📅 ${track.year || 'N/D'} 
//                         </p> 
//                     </div>
//                     <button class="btn btn-outline-danger btn-sm remove-track" data-id="${track.id}" title="Rimuovi brano"> 
//                         <i class="bi bi-x-circle"></i>
//                     </button>
//                 </div>
//             `;

//             trackList.appendChild(li);
//         });
//     } else {
//         trackList.innerHTML = '<li>Nessun brano nella playlist.</li>';
//     }

//     //rimozione brano
//     trackList.querySelectorAll(".remove-track").forEach(button => {
//         button.addEventListener('click', () => {
//             const trackId = button.dataset.id;

//             //rimuovo brano dalla playlist
//             playlist.tracks = playlist.tracks.filter(t => t.id !== trackId);

//             //salvo
//             localStorage.setItem('playlists', JSON.stringify(playlists));

//             //aggiorno ui della modale
//             setTimeout(() => editPlaylist(id), 50);

//         });
//     });

//     // salvataggio modifiche
//     const form = document.getElementById('editPlaylistForm');
//     form.onsubmit = function (e) {
//         e.preventDefault();
//         playlist.name = document.getElementById('editPlaylistName').value.trim();
//         playlist.description = document.getElementById('editPlaylistDescription').value.trim();
//         playlist.tags = document.getElementById('editPlaylistTags').value.split(',').map(t => t.trim()).filter(Boolean);

//         localStorage.setItem('playlists', JSON.stringify(playlists));

//         showToast("Playlist modificata con successo!");
//         bootstrap.Modal.getInstance(document.getElementById('editPlaylistModal')).hide();
//         renderPlaylists();
//     };

//     new bootstrap.Modal(document.getElementById('editPlaylistModal')).show();
// }

// function confirmDelete(id) {
//     const btn = document.getElementById('confirmDeleteBtn');
//     btn.onclick = function () {
//         let playlists = JSON.parse(localStorage.getItem('playlists')) || [];
//         playlists = playlists.filter(p => p.id !== id);
//         localStorage.setItem('playlists', JSON.stringify(playlists));
//         showToast("Playlist eliminata!");
//         bootstrap.Modal.getInstance(document.getElementById('confirmDeleteModal')).hide();
//         renderPlaylists();
//     };

//     new bootstrap.Modal(document.getElementById('confirmDeleteModal')).show();
// }

// function showToast(message, tipo = "success") {
//     const toastEl = document.getElementById('sn4mToast');
//     const toastMessage = document.getElementById('toastMessage');
//     if (!toastEl || !toastMessage) return;

//     toastMessage.textContent = message;

//     // Cambia il colore del toast
//     toastEl.className = `toast align-items-center text-white bg-${tipo} border-0`;

//     new bootstrap.Toast(toastEl).show();
// }

document.addEventListener('headerLoaded', () => {
    const btn = document.getElementById("confirmAddBtn");
    if (btn) {
        btn.addEventListener("click", addTrackToPlaylist);
    }

    const user = JSON.parse(sessionStorage.getItem('utente'));
    if (!user) return;

    document.getElementById('welcomeUsername').textContent = user.username;

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

    const alreadyInPlaylist = playlist.tracks.some(t => t.id === trackSelezionato.id);
    if (alreadyInPlaylist) {
        showToast("Brano già presente nella playlist!", "warning");
        bootstrap.Modal.getInstance(document.getElementById("playlistModal")).hide();
        return;
    }

    const track = {
        id: trackSelezionato.id,
        title: trackSelezionato.name,
        artist: trackSelezionato.artists.map(a => a.name).join(', '),
        duration: trackSelezionato.duration_ms ? Math.floor(trackSelezionato.duration_ms / 1000) + " sec" : "N/D",
        year: trackSelezionato.album?.release_date?.slice(0, 4) || "N/D",
        genre: "N/D"
    };

    playlist.tracks.push(track);
    localStorage.setItem('playlists', JSON.stringify(playlists));

    showToast("Brano aggiunto alla playlist!");
    bootstrap.Modal.getInstance(document.getElementById('playlistModal')).hide();
    renderPlaylists();
}

function renderPlaylists() {
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
    const communities = JSON.parse(localStorage.getItem('communities')) || [];
    const user = JSON.parse(sessionStorage.getItem('utente'));

    const myContainer = document.getElementById('myPlaylists');
    const communityContainer = document.getElementById('communityPlaylists');

    myContainer.innerHTML = '';
    communityContainer.innerHTML = '';

    // Playlist personali (non condivise)
    const myPlaylists = playlists.filter(p => p.creator === user.username);
    myPlaylists.forEach(p => {
        myContainer.appendChild(renderPlaylistCard(p, true));
    });

    // Playlist condivise nelle community di cui fa parte l'utente
    const myCommunities = communities.filter(c => c.members.includes(user.username));
    const communityPlaylistsFiltered = playlists.filter(p =>
        p.community && myCommunities.some(c => c.id === p.community)
    );

    if (communityPlaylistsFiltered.length === 0) {
        communityContainer.innerHTML = '<p class="text-muted">Nessuna playlist condivisa nelle tue community.</p>';
    } else {
        communityPlaylistsFiltered.forEach(p => {
            communityContainer.appendChild(renderPlaylistCard(p, false));
        });
    }
}

function renderPlaylistCard(playlist, isOwner) {
    const template = document.getElementById('playlistCardTemplate');
    const clone = template.content.cloneNode(true);
    const user = JSON.parse(sessionStorage.getItem('utente'));

    const card = clone.querySelector('.playlist-card');
    const title = clone.querySelector('.playlist-title');
    title.textContent = playlist.name;
    title.addEventListener('click', () => openPlaylistDetails(playlist.id));

    // Badge se condivisa
    if (playlist.community) {
        const communities = JSON.parse(localStorage.getItem('communities')) || [];
        const community = communities.find(c => c.id === playlist.community);
        const badge = document.createElement('span');
        badge.className = 'badge bg-success ms-2';
        badge.textContent = `📢 ${community?.name || 'Community'}`;
        title.appendChild(badge);
    }

    // Info creator se non è la propria
    if (playlist.creator !== user.username) {
        const creatorInfo = document.createElement('small');
        creatorInfo.className = 'text-muted d-block';
        creatorInfo.textContent = `di ${playlist.creator}`;
        title.parentElement.appendChild(creatorInfo);
    }

    const dropdownMenu = clone.querySelector('.dropdown-menu');
    dropdownMenu.innerHTML = '';

    // Se è il proprietario
    if (isOwner && playlist.creator === user.username) {
        // Modifica
        const editItem = document.createElement('li');
        const editLink = document.createElement('a');
        editLink.className = 'dropdown-item';
        editLink.textContent = 'Modifica';
        editLink.href = '#';
        editLink.addEventListener('click', (e) => {
            e.preventDefault();
            editPlaylist(playlist.id);
        });
        editItem.appendChild(editLink);
        dropdownMenu.appendChild(editItem);

        // Condividi/Rimuovi condivisione
        if (playlist.community) {
            const unshareItem = document.createElement('li');
            const unshareLink = document.createElement('a');
            unshareLink.className = 'dropdown-item text-warning';
            unshareLink.textContent = 'Rimuovi condivisione';
            unshareLink.href = '#';
            unshareLink.addEventListener('click', (e) => {
                e.preventDefault();
                unsharePlaylist(playlist.id);
            });
            unshareItem.appendChild(unshareLink);
            dropdownMenu.appendChild(unshareItem);
        } else {
            const shareItem = document.createElement('li');
            const shareLink = document.createElement('a');
            shareLink.className = 'dropdown-item text-info';
            shareLink.textContent = 'Condividi in community';
            shareLink.href = '#';
            shareLink.addEventListener('click', (e) => {
                e.preventDefault();
                sharePlaylist(playlist.id);
            });
            shareItem.appendChild(shareLink);
            dropdownMenu.appendChild(shareItem);
        }

        // Elimina
        const deleteItem = document.createElement('li');
        const deleteLink = document.createElement('a');
        deleteLink.className = 'dropdown-item text-danger';
        deleteLink.textContent = 'Elimina';
        deleteLink.href = '#';
        deleteLink.addEventListener('click', (e) => {
            e.preventDefault();
            confirmDelete(playlist.id);
        });
        deleteItem.appendChild(deleteLink);
        dropdownMenu.appendChild(deleteItem);
    } else {
        // Se non è il proprietario, può solo importare
        const importItem = document.createElement('li');
        const importLink = document.createElement('a');
        importLink.className = 'dropdown-item text-primary';
        importLink.textContent = 'Importa nel mio profilo';
        importLink.href = '#';
        importLink.addEventListener('click', (e) => {
            e.preventDefault();
            importPlaylist(playlist.id);
        });
        importItem.appendChild(importLink);
        dropdownMenu.appendChild(importItem);
    }

    return clone;
}

function sharePlaylist(playlistId) {
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
    const communities = JSON.parse(localStorage.getItem('communities')) || [];
    const user = JSON.parse(sessionStorage.getItem('utente'));
    const playlist = playlists.find(p => p.id === playlistId);

    if (!playlist) return;

    // Community in cui l'utente è membro
    const myCommunities = communities.filter(c => c.members.includes(user.username));

    if (myCommunities.length === 0) {
        showToast("Non fai parte di nessuna community!", "warning");
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
        playlist.community = communityId;
        localStorage.setItem('playlists', JSON.stringify(playlists));

        const community = communities.find(c => c.id === communityId);
        showToast(`Playlist condivisa in "${community.name}"!`, "success");
        modal.hide();
        renderPlaylists();
    });
}

function unsharePlaylist(playlistId) {
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
    const playlist = playlists.find(p => p.id === playlistId);

    if (!playlist) return;

    playlist.community = null;
    localStorage.setItem('playlists', JSON.stringify(playlists));

    showToast("Condivisione rimossa!", "info");
    renderPlaylists();
}

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
        community: null, // Le playlist importate sono private
        tracks: JSON.parse(JSON.stringify(originalPlaylist.tracks)) // Deep copy
    };

    playlists.push(importedPlaylist);
    localStorage.setItem('playlists', JSON.stringify(playlists));

    showToast(`Playlist "${originalPlaylist.name}" importata con successo!`, "success");
    renderPlaylists();
}

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

    // Community badge
    if (playlist.community) {
        const community = communities.find(c => c.id === playlist.community);
        const communityBadge = document.createElement('p');
        communityBadge.innerHTML = `<span class="badge bg-success">📢 Condivisa in: ${community?.name || 'Community'}</span>`;
        header.appendChild(communityBadge);
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

function showToast(message, tipo = "success") {
    const toastEl = document.getElementById('sn4mToast');
    const toastMessage = document.getElementById('toastMessage');
    if (!toastEl || !toastMessage) return;

    toastMessage.textContent = message;
    toastEl.className = `toast align-items-center text-white bg-${tipo} border-0`;

    new bootstrap.Toast(toastEl).show();
}
