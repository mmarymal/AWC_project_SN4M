window.trackToAdd = null;

document.addEventListener('headerLoaded', () => {
    const user = JSON.parse(sessionStorage.getItem('utente'));
    if (!user) return;

    // Mostra nome utente nell'header
    document.getElementById('welcomeUsername').textContent = user.username;

    // Render iniziale
    renderPlaylists();

    /* APRI MODALE CREA PLAYLIST DAL BOTTONE DELLA PAGINA */
    const btn = document.getElementById("openCreateOnly");

    if (btn) {
        btn.addEventListener("click", () => {
            const modal = new bootstrap.Modal(document.querySelector("#createPlaylistStandaloneModal"));
            modal.show();
        });
    }

    /* CREAZIONE PLAYLIST - STANDALONE */
    const standaloneForm = document.getElementById("createPlaylistStandaloneForm");

    if (standaloneForm) {
        standaloneForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const name = document.getElementById("standalonePlaylistName").value.trim();
            const description = document.getElementById("standalonePlaylistDescription").value.trim();
            const tags = document.getElementById("standalonePlaylistTags").value
                .split(",")
                .map(t => t.trim())
                .filter(Boolean);

            if (!name) {
                showToast("Inserisci un nome per la playlist.", "danger");
                return;
            }

            const user = JSON.parse(sessionStorage.getItem("utente"));
            const playlists = JSON.parse(localStorage.getItem("playlists")) || [];

            const newPlaylist = {
                id: Date.now().toString(),
                name,
                description,
                tags,
                creator: user.username,
                communities: [],
                tracks: []
            };

            playlists.push(newPlaylist);
            localStorage.setItem("playlists", JSON.stringify(playlists));

            // Aggiorna UI
            if (typeof renderPlaylists === "function") {
                renderPlaylists();
            }

            // Chiudi modale
            bootstrap.Modal.getInstance(
                document.getElementById("createPlaylistStandaloneModal")
            ).hide();

            showToast(`Playlist "${name}" creata!`, "success");

            standaloneForm.reset();
        });
    }

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
    const newForm = document.querySelector('#newPlaylistForm');
    if (newForm) {
        newForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
            const trackToAddCopy = window.trackToAdd; // Salva una copia

            const newPlaylist = {
                id: Date.now().toString(),
                name: document.querySelector('#createPlaylistName').value.trim(),
                description: document.querySelector('#playlistDescription').value.trim(),
                tags: document.querySelector('#playlistTags').value
                    .split(',')
                    .map(t => t.trim())
                    .filter(Boolean),
                creator: user.username,
                communities: [],
                tracks: []
            };

            // Se stiamo creando la playlist mentre aggiungiamo un brano
            if (trackToAddCopy) {
                newPlaylist.tracks.push(trackToAddCopy);

                playlists.push(newPlaylist);
                localStorage.setItem('playlists', JSON.stringify(playlists));

                const myPlaylistsContainer = document.getElementById('myPlaylists');
                if (myPlaylistsContainer && typeof renderPlaylistCard === 'function') {
                    myPlaylistsContainer.appendChild(renderPlaylistCard(newPlaylist, true));
                }

                showToast(`Playlist "${newPlaylist.name}" creata e brano "${trackToAddCopy.title}" aggiunto!`, "success");

                // Chiudi modale e reset
                bootstrap.Modal.getInstance(document.getElementById('createPlaylistStandaloneModal')).hide();
                newForm.reset();
                window.trackToAdd = null; // Reset solo alla fine

                return;
            }

            // Creazione normale (senza brano da aggiungere)
            playlists.push(newPlaylist);
            localStorage.setItem('playlists', JSON.stringify(playlists));

            const myPlaylistsContainer = document.getElementById('myPlaylists');
            if (myPlaylistsContainer && typeof renderPlaylistCard === 'function') {
                myPlaylistsContainer.appendChild(renderPlaylistCard(newPlaylist, true));
            }

            showToast("Playlist creata con successo!", "success");
            bootstrap.Modal.getInstance(document.getElementById('createPlaylistStandaloneModal')).hide();
            newForm.reset();
        });
    }

    // Reset modale "Crea Playlist" quando viene chiuso
    document.getElementById('createPlaylistModal')
        .addEventListener('hidden.bs.modal', () => {
            document.getElementById('newPlaylistForm').reset();
        });

    // Reset modale "Modifica Playlist" quando viene chiuso
    document.getElementById('editPlaylistModal')
        .addEventListener('hidden.bs.modal', () => {
            document.getElementById('editPlaylistForm').reset();
        });

});

/* NUOVA FUNZIONE: APRI MODALE AGGIUNTA BRANO */
function openAddTrackModal(track) {
    window.trackToAdd = track;

    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
    const user = JSON.parse(sessionStorage.getItem('utente'));

    const myPlaylists = playlists.filter(p => p.creator === user.username);

    // Popola il select con le playlist
    const playlistSelect = document.getElementById('playlistSelect');
    playlistSelect.innerHTML = '<option value="">-- Seleziona playlist --</option>';

    myPlaylists.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = p.name;
        playlistSelect.appendChild(option);
    });

    // Mostra nome brano nel modale
    document.getElementById('modalTrackName').textContent =
        `Stai aggiungendo: ${track.title} - ${track.artist}`;

    // Apri il modale
    const modal = new bootstrap.Modal(document.getElementById('playlistModal'));
    modal.show();

    // Gestione bottone "Crea nuova playlist"
    const openCreateBtn = document.getElementById('openCreatePlaylist');
    openCreateBtn.onclick = () => {
        // Chiudi modale di selezione
        bootstrap.Modal.getInstance(document.getElementById('playlistModal')).hide();

        // Apri modale di creazione
        const createModal = new bootstrap.Modal(document.getElementById('createPlaylistStandaloneModal'));
        createModal.show();
    };

    // Gestione bottone "Aggiungi"
    const confirmBtn = document.getElementById('confirmAddBtn');
    confirmBtn.onclick = () => {
        const selectedPlaylistId = playlistSelect.value;

        if (!selectedPlaylistId) {
            showToast("Seleziona una playlist!", "warning");
            return;
        }

        const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
        const playlist = playlists.find(p => p.id === selectedPlaylistId);

        if (!playlist) {
            showToast("Playlist non trovata!", "danger");
            return;
        }

        // Controlla se il brano è già presente
        if (playlist.tracks.some(t => t.id === track.id)) {
            showToast("Brano già presente in questa playlist!", "info");
            bootstrap.Modal.getInstance(document.getElementById('playlistModal')).hide();
            window.trackToAdd = null;
            return;
        }

        // Aggiungi il brano
        playlist.tracks.push(track);
        localStorage.setItem('playlists', JSON.stringify(playlists));

        showToast(`Brano aggiunto a "${playlist.name}"!`, "success");
        bootstrap.Modal.getInstance(document.getElementById('playlistModal')).hide();
        window.trackToAdd = null;

        if (typeof renderPlaylists === 'function') {
            renderPlaylists();
        }
    };

}

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
        communityContainer.innerHTML = `
            <p style="color:#bd93f9; font-style:italic; padding:10px 0;">
                Nessuna playlist condivisa nelle community...
            </p>
        `;
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

    const myCommunities = communities.filter(c => c.members.includes(user.username));

    if (myCommunities.length === 0) {
        showToast("Non fai parte di nessuna community!", "info");
        return;
    }

    // RIEMPI IL MODALE HTML
    document.getElementById("shareCommunityText").innerHTML =
        `Scegli in quale community condividere "<strong>${playlist.name}</strong>":`;

    const select = document.getElementById("shareCommunitySelect");
    select.innerHTML = myCommunities
        .map(c => `<option value="${c.id}">${c.name}</option>`)
        .join('');

    // MOSTRA IL MODALE
    const modal = new bootstrap.Modal(document.getElementById('shareCommunityModal'));
    modal.show();

    // GESTISCI IL CLICK
    document.getElementById('confirmShareBtn').onclick = () => {
        const communityId = select.value;

        if (!playlist.communities) playlist.communities = [];

        if (playlist.communities.includes(communityId)) {
            showToast("Playlist già presente in questa community!", "warning");
            modal.hide();
            return;
        }

        playlist.communities.push(communityId);
        localStorage.setItem('playlists', JSON.stringify(playlists));

        const community = communities.find(c => c.id === communityId);
        showToast(`Playlist condivisa in "${community?.name || 'Community'}"!`, "success");

        modal.hide();
        renderPlaylists();
    };
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

    // ⭐ RIEMPI IL TESTO
    document.getElementById("unshareCommunityText").innerHTML =
        `Scegli da quale community rimuovere "<strong>${playlist.name}</strong>":`;

    // ⭐ RIEMPI LA SELECT
    const select = document.getElementById("unshareCommunitySelect");
    select.innerHTML = sharedCommunities
        .map(c => `<option value="${c.id}">${c.name}</option>`)
        .join('');

    // ⭐ MOSTRA IL MODALE
    const modal = new bootstrap.Modal(document.getElementById('unshareCommunityModal'));
    modal.show();

    // ⭐ GESTISCI IL CLICK
    document.getElementById('confirmUnshareBtn').onclick = () => {
        const communityId = select.value;

        playlist.communities = playlist.communities.filter(cid => cid !== communityId);
        localStorage.setItem('playlists', JSON.stringify(playlists));

        const community = communities.find(c => c.id === communityId);
        showToast(`Playlist rimossa da "${community?.name || 'Community'}"`, "warning");

        modal.hide();
        renderPlaylists();
    };
}


function unsharePlaylist(playlistId) {
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
    const playlist = playlists.find(p => p.id === playlistId);

    if (!playlist) return;

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

    const importedPlaylist = {
        id: Date.now().toString(),
        name: `${originalPlaylist.name} (importata)`,
        description: originalPlaylist.description,
        tags: [...originalPlaylist.tags],
        creator: user.username,
        communities: [],
        tracks: JSON.parse(JSON.stringify(originalPlaylist.tracks))
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

    header.appendChild(title);

    header.appendChild(title);

    // CREATA DA
    const creatorRow = document.createElement('p');
    creatorRow.className = 'detail-row';
    creatorRow.innerHTML = `<span class="detail-label">Creata da:</span> ${playlist.creator}`;
    header.appendChild(creatorRow);

    // DESCRIZIONE
    const descriptionRow = document.createElement('p');
    descriptionRow.className = 'detail-row';
    descriptionRow.innerHTML = `<span class="detail-label">Descrizione:</span> ${playlist.description || 'Nessuna descrizione'}`;
    header.appendChild(descriptionRow);

    // TAGS
    if (playlist.tags?.length) {
        const tagsRow = document.createElement('p');
        tagsRow.className = 'detail-row';
        tagsRow.innerHTML = `<span class="detail-label">Tags:</span> ${playlist.tags.join(', ')}`;
        header.appendChild(tagsRow);
    }


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

    body.appendChild(header);

    const hr = document.createElement('hr');
    body.appendChild(hr);

    const trackTitle = document.createElement('h5');
    trackTitle.textContent = "🎵 Brani nella playlist";
    trackTitle.className = "playlist-section-title";
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
        empty.className = 'playlist-empty-message';
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
            li.className = "list-group-item"; // stile base, il resto lo gestisce il CSS

            li.innerHTML = `
                <div class="track-info">
                    <div class="track-title">${track.title || 'undefined'}</div>
                    <div class="track-meta">
                        <span class="meta-badge">${track.artist || 'Artista: N/D'}</span>
                        <span class="meta-badge">${track.genre || 'Genere: N/D'}</span>
                        <span class="meta-badge">${track.duration || 'Durata: N/D'}</span>
                        <span class="meta-badge">${track.year || 'Anno: N/D'}</span>
                    </div>
                </div>
                <button class="btn-remove-track" data-id="${track.id}" title="Rimuovi brano">
                    <i class="bi bi-x-circle"></i>
                </button>
            `;
            trackList.appendChild(li);
        });
    } else {
        trackList.innerHTML = `
            <li class="no-tracks-msg">
                <i class="bi bi-music-note-beamed"></i>
                Nessun brano nella playlist
            </li>
        `;

    }

    trackList.querySelectorAll(".btn-remove-track").forEach(button => {
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
        bootstrap.Modal.getInstance(document.getElementById('confirmDeletePlaylistModal')).hide();
        renderPlaylists();
    };

    new bootstrap.Modal(document.getElementById('confirmDeletePlaylistModal')).show();
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