// Variabile globale per tracciare il brano da aggiungere a una playlist
window.trackToAdd = null;

document.addEventListener('headerLoaded', () => {
    const user = JSON.parse(sessionStorage.getItem('utente'));
    if (!user) {
        showToast("Devi effettuare il login", "warning");
        setTimeout(() => window.location.href = "login.html", 1500);
        return;
    }

    // Mostra nome utente nell'header della pagina
    document.getElementById('welcomeUsername').textContent = user.username;

    // Render iniziale
    renderPlaylists();

    // FUNZIONE CREAZIONE PLAYLIST
    function playlistCreation() {
        /* GESTIONE APERTURA MODALE "CREA PLAYLIST" */
        // Recupera bottone per aprire modale di creazione playlist
        const btn = document.getElementById("openCreateOnly");

        if (btn) {
            // click -> apre modale per creare nuova playlist
            btn.addEventListener("click", () => {
                const modal = new bootstrap.Modal(document.querySelector("#createPlaylistStandaloneModal"));
                modal.show();
            });
        }

        /* GESTIONE SUBMIT FORM CREAZIONE PLAYLIST */
        // Recupera form per creazione nuova playlist
        const standaloneForm = document.getElementById("createPlaylistStandaloneForm");

        // Procede solo se form esiste nella pagina
        if (standaloneForm) {
            standaloneForm.addEventListener("submit", (e) => {
                e.preventDefault();

                // Recupera e valida campi del form
                const name = document.getElementById("standalonePlaylistName").value.trim();
                const description = document.getElementById("standalonePlaylistDescription").value.trim();

                // Converte stringa di tag separati da virgola in un array
                const tags = document.getElementById("standalonePlaylistTags").value
                    .split(",")
                    .map(t => t.trim())
                    .filter(Boolean); // Rimuove stringhe vuote

                // Recupera dati utente corrente e playlist esistenti
                const user = JSON.parse(sessionStorage.getItem("utente"));
                const playlists = JSON.parse(localStorage.getItem("playlists")) || [];

                // Crea oggetto della nuova playlist
                const newPlaylist = {
                    id: Date.now().toString(), // ID univoco 
                    name,
                    description,
                    tags,
                    creator: user.username,
                    communities: [], // Inizialmente non è condivisa in nessuna community
                    tracks: [] // La playlist parte vuota
                };

                // Aggiunge nuova playlist all'array e salva 
                playlists.push(newPlaylist);
                localStorage.setItem("playlists", JSON.stringify(playlists));

                // Aggiorna interfaccia se funzione di render esiste
                if (typeof renderPlaylists === "function") {
                    renderPlaylists();
                }

                bootstrap.Modal.getInstance(
                    document.getElementById("createPlaylistStandaloneModal")
                ).hide();

                showToast(`Playlist "${name}" creata!`, "success");
            });
        }

        // Reset form quando modale viene chiusa
        document.getElementById('createPlaylistStandaloneModal')
            .addEventListener('hidden.bs.modal', () => {
                const standaloneForm = document.getElementById('createPlaylistStandaloneForm');
                if (standaloneForm) standaloneForm.reset();
            });
    }
    playlistCreation();

    /* FUNZIONALITÀ DI RICERCA PLAYLIST DELLE COMMUNITY */
    function communityPlaylistSearch() {
        const searchInput = document.getElementById('communityPlaylistSearch');
        if (searchInput) {
            // Ad ogni input dell'utente, filtra le playlist
            searchInput.addEventListener('input', e => {
                const query = e.target.value;

                // Recupera tutti i dati necessari
                const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
                const communities = JSON.parse(localStorage.getItem('communities')) || [];
                const user = JSON.parse(sessionStorage.getItem('utente'));

                // Trova le community a cui l'utente appartiene
                const myCommunities = communities.filter(c => c.members.includes(user.username));

                // Trova le playlist condivise nelle community dell'utente
                const communityPlaylists = playlists.filter(p =>
                    Array.isArray(p.communities) &&
                    p.communities.some(cid => myCommunities.some(c => c.id === cid))
                );

                // Filtra le playlist in base alla query di ricerca
                const filtered = searchPlaylists(query, communityPlaylists);

                // Aggiorna il container con i risultati filtrati
                const container = document.getElementById('communityPlaylists');
                container.innerHTML = '';

                if (filtered.length === 0) {
                    container.innerHTML = '<p class="text-muted">Nessuna playlist trovata.</p>';
                } else {
                    // Renderizza ogni playlist filtrata
                    filtered.forEach(p => {
                        container.appendChild(renderPlaylistCard(p, p.creator === user.username));
                    });
                }
            });
        }
    }
    communityPlaylistSearch();

});

/* FUNZIONE PER RENDERIZZARE TUTTE LE PLAYLIST */
function renderPlaylists() {
    // Recupera tutti i dati necessari
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
    const communities = JSON.parse(localStorage.getItem('communities')) || [];
    const user = JSON.parse(sessionStorage.getItem('utente'));

    // Recupera i container dove visualizzare le playlist
    const myContainer = document.getElementById('myPlaylists');
    const communityContainer = document.getElementById('communityPlaylists');

    // Pulisce i container prima di ri-renderizzare
    myContainer.innerHTML = '';
    communityContainer.innerHTML = '';

    // Assicura che ogni playlist abbia l'array communities
    playlists.forEach(p => {
        if (!Array.isArray(p.communities)) p.communities = [];
    });

    // SEZIONE 1: Playlist personali dell'utente
    const myPlaylists = playlists.filter(p => p.creator === user.username);
    myPlaylists.forEach(p => myContainer.appendChild(renderPlaylistCard(p, true)));

    // SEZIONE 2: Playlist condivise nelle community
    // Trova le community dell'utente
    const myCommunities = communities.filter(c => c.members.includes(user.username));

    // Filtra le playlist che sono condivise in almeno una delle community dell'utente
    const communityPlaylistsFiltered = playlists.filter(p =>
        Array.isArray(p.communities) &&
        p.communities.some(cid => myCommunities.some(c => c.id === cid))
    );

    // Se non ci sono playlist condivise, mostra un messaggio
    if (communityPlaylistsFiltered.length === 0) {
        communityContainer.innerHTML = `
            <p style="color:#bd93f9; font-style:italic; padding:10px 0;">
                Nessuna playlist condivisa nelle community...
            </p>
        `;
    } else {
        // Renderizza ogni playlist condivisa
        communityPlaylistsFiltered.forEach(p => communityContainer.appendChild(renderPlaylistCard(p, false)));
    }

    // Salva eventuali modifiche 
    localStorage.setItem('playlists', JSON.stringify(playlists));
}

/* FUNZIONE PER CREARE UNA CARD DI UNA PLAYLIST */
function renderPlaylistCard(playlist, isOwner) {
    // Clona template HTML della card
    const template = document.getElementById('playlistCardTemplate');
    const clone = template.content.cloneNode(true);

    // Recupera dati necessari
    const user = JSON.parse(sessionStorage.getItem('utente'));
    const communities = JSON.parse(localStorage.getItem('communities')) || [];

    // Assicura che la playlist abbia l'array communities
    if (!Array.isArray(playlist.communities)) playlist.communities = [];

    // Recupera elementi dalla card clonata
    const card = clone.querySelector('.playlist-card');
    const title = clone.querySelector('.playlist-title');
    const dropdownMenu = clone.querySelector('.dropdown-menu');

    // Pulisce il menu dropdown
    dropdownMenu.innerHTML = '';

    // Imposta il titolo e il click per aprire i dettagli
    title.textContent = playlist.name;
    title.addEventListener('click', () => openPlaylistDetails(playlist.id));

    // Se la playlist è condivisa, aggiunge un badge
    if (playlist.communities.length > 0) {
        const badge = document.createElement('span');
        badge.className = 'badge bg-success ms-2';
        badge.textContent = `📢`; // Icona megafono
        title.appendChild(badge);
    }

    /* CREA MENU DROPDOWN IN BASE AL PROPRIETARIO */
    if (isOwner) {
        // OPZIONE: Modifica playlist
        const editItem = document.createElement('li');
        editItem.innerHTML = `<a class="dropdown-item" href="#">Modifica</a>`;
        editItem.addEventListener('click', e => {
            e.preventDefault();
            editPlaylist(playlist.id);
        });
        dropdownMenu.appendChild(editItem);

        // Se la playlist è già condivisa, mostra opzioni avanzate
        if (playlist.communities.length > 0) {
            // OPZIONE: Condividi in un'altra community
            const shareMoreItem = document.createElement('li');
            shareMoreItem.innerHTML = `<a class="dropdown-item text-info" href="#">Condividi in una community</a>`;
            shareMoreItem.addEventListener('click', e => {
                e.preventDefault();
                sharePlaylist(playlist.id);
            });
            dropdownMenu.appendChild(shareMoreItem);

            // OPZIONE: Rimuovi da una community specifica
            const unshareItem = document.createElement('li');
            unshareItem.innerHTML = `<a class="dropdown-item text-warning" href="#">Rimuovi da una community...</a>`;
            unshareItem.addEventListener('click', e => {
                e.preventDefault();
                unsharePlaylistSingleCommunity(playlist.id);
            });
            dropdownMenu.appendChild(unshareItem);

            // OPZIONE: Rimuovi da tutte le community
            const unshareAllItem = document.createElement('li');
            unshareAllItem.innerHTML = `<a class="dropdown-item text-warning" href="#">Rimuovi da tutte le community</a>`;
            unshareAllItem.addEventListener('click', e => {
                e.preventDefault();
                unsharePlaylist(playlist.id);
            });
            dropdownMenu.appendChild(unshareAllItem);
        } else {
            // Se non è ancora condivisa, mostra solo l'opzione di condivisione base
            const shareItem = document.createElement('li');
            shareItem.innerHTML = `<a class="dropdown-item text-info" href="#">Condividi in community</a>`;
            shareItem.addEventListener('click', e => {
                e.preventDefault();
                sharePlaylist(playlist.id);
            });
            dropdownMenu.appendChild(shareItem);
        }

        // OPZIONE: Elimina playlist
        const deleteItem = document.createElement('li');
        deleteItem.innerHTML = `<a class="dropdown-item text-danger" href="#">Elimina</a>`;
        deleteItem.addEventListener('click', e => {
            e.preventDefault();
            confirmDelete(playlist.id);
        });
        dropdownMenu.appendChild(deleteItem);

    } else {
        // Se NON è il proprietario, mostra solo opzione di importazione
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

/* FUNZIONE FILTRO RICERCA PLAYLIST */
function searchPlaylists(query, playlists) {
    const q = query.trim().toLowerCase();

    // Filtra le playlist in base a nome, descrizione o tag
    return playlists.filter(p => {
        const nameMatch = p.name?.toLowerCase().includes(q);
        const descMatch = p.description?.toLowerCase().includes(q);
        const tagMatch = p.tags?.some(tag => tag.toLowerCase().includes(q));
        return nameMatch || descMatch || tagMatch;
    });
}

/* FUNZIONE PER CONDIVIDERE UNA PLAYLIST IN UNA COMMUNITY */
function sharePlaylist(playlistId) {
    // Recupera tutti i dati necessari
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
    const communities = JSON.parse(localStorage.getItem('communities')) || [];
    const user = JSON.parse(sessionStorage.getItem('utente'));
    const playlist = playlists.find(p => p.id === playlistId);

    if (!playlist) return;

    // Trova le community a cui l'utente appartiene
    const myCommunities = communities.filter(c => c.members.includes(user.username));

    // Se l'utente non fa parte di nessuna community, avvisa
    if (myCommunities.length === 0) {
        showToast("Non fai parte di nessuna community!", "info");
        return;
    }

    // Popola il testo della modale
    document.getElementById("shareCommunityText").innerHTML =
        `Scegli in quale community condividere "<strong>${playlist.name}</strong>":`;

    // Popola il select con le community disponibili
    const select = document.getElementById("shareCommunitySelect");
    select.innerHTML = myCommunities
        .map(c => `<option value="${c.id}">${c.name}</option>`)
        .join('');

    const modal = new bootstrap.Modal(document.getElementById('shareCommunityModal'));
    modal.show();

    // Gestisce il click sul pulsante di conferma
    document.getElementById('confirmShareBtn').onclick = () => {
        const communityId = select.value;

        // Assicura che la playlist abbia l'array communities
        if (!playlist.communities) playlist.communities = [];

        // Controlla se la playlist è già condivisa in questa community
        if (playlist.communities.includes(communityId)) {
            showToast("Playlist già presente in questa community!", "warning");
            modal.hide();
            return;
        }

        // Aggiunge la community alla playlist e salva
        playlist.communities.push(communityId);
        localStorage.setItem('playlists', JSON.stringify(playlists));

        const community = communities.find(c => c.id === communityId);
        showToast(`Playlist condivisa in "${community?.name || 'Community'}"!`, "success");

        modal.hide();
        renderPlaylists();
    };
}

/* FUNZIONE PER RIMUOVERE UNA PLAYLIST DA UNA SINGOLA COMMUNITY */
function unsharePlaylistSingleCommunity(playlistId) {
    // Recupera playlist e community
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
    const communities = JSON.parse(localStorage.getItem('communities')) || [];
    const playlist = playlists.find(p => p.id === playlistId);

    // Se playlist non esiste o non è condivisa, esce
    if (!playlist || !Array.isArray(playlist.communities)) return;

    // Recupera le community con cui è condivisa
    const sharedCommunities = communities.filter(c =>
        playlist.communities.includes(c.id)
    );

    // Se non è condivisa con nessuna, avvisa e esci
    if (sharedCommunities.length === 0) {
        showToast("Questa playlist non è condivisa con nessuna community.", "warning");
        return;
    }

    // Popola il testo della modale
    document.getElementById("unshareCommunityText").innerHTML =
        `Scegli da quale community rimuovere "<strong>${playlist.name}</strong>":`;

    // Popola il select con le community condivise
    const select = document.getElementById("unshareCommunitySelect");
    select.innerHTML = sharedCommunities
        .map(c => `<option value="${c.id}">${c.name}</option>`)
        .join('');

    const modal = new bootstrap.Modal(document.getElementById('unshareCommunityModal'));
    modal.show();

    // Gestisce il click sul bottone conferma
    document.getElementById('confirmUnshareBtn').onclick = () => {
        const communityId = select.value; // Recupera ID selezionato

        // Rimuove community da playlist
        playlist.communities = playlist.communities.filter(cid => cid !== communityId);
        localStorage.setItem('playlists', JSON.stringify(playlists));

        // Recupera nome per messaggio
        const community = communities.find(c => c.id === communityId);
        showToast(`Playlist rimossa da "${community?.name || 'Community'}"`, "warning");

        modal.hide();
        renderPlaylists(); // Aggiorna la UI
    };
}

/* FUNZIONE PER RIMUOVERE UNA PLAYLIST DA TUTTE LE COMMUNITY */
function unsharePlaylist(playlistId) {
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];

    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    // Svuota l'array delle community associate
    playlist.communities = [];
    localStorage.setItem('playlists', JSON.stringify(playlists));

    showToast("Condivisione rimossa da tutte le community!", "primary");
    renderPlaylists();
}

/* FUNZIONE PER IMPORTARE UNA PLAYLIST NEL PROFILO PERSONALE */
function importPlaylist(playlistId) {
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
    const user = JSON.parse(sessionStorage.getItem('utente'));

    const originalPlaylist = playlists.find(p => p.id === playlistId);
    if (!originalPlaylist) return;

    // Crea una nuova playlist clonando i dati dell'originale
    const importedPlaylist = {
        id: Date.now().toString(), // Nuovo ID univoco
        name: `${originalPlaylist.name} (importata)`, // Nome modificato per distinguerla
        description: originalPlaylist.description,
        tags: [...originalPlaylist.tags], // Clona tag
        creator: user.username, // Chi importa diventa il creatore
        communities: [], // Non è condivisa in nessuna community
        tracks: JSON.parse(JSON.stringify(originalPlaylist.tracks)) // clona tracce
    };

    // Aggiunge la playlist importata e salva
    playlists.push(importedPlaylist);
    localStorage.setItem('playlists', JSON.stringify(playlists));

    showToast(`Playlist "${originalPlaylist.name}" importata con successo!`, "success");
    renderPlaylists(); // Aggiorna la UI
}

/* FUNZIONE PER VISUALIZZARE I DETTAGLI DI UNA PLAYLIST */
function openPlaylistDetails(id) {
    // Recupera playlist e community
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
    const communities = JSON.parse(localStorage.getItem('communities')) || [];

    // Trova la playlist tramite ID
    const playlist = playlists.find(p => p.id === id);
    if (!playlist) return;

    // Recupera il body della modale
    const body = document.getElementById('viewPlaylistBody');
    body.innerHTML = "";

    // Info generali della playlist
    const header = document.createElement('div');
    header.className = 'playlist-details-header';

    const title = document.createElement('h2');
    title.textContent = playlist.name;
    header.appendChild(title);

    // Mostra chi ha creato la playlist
    const creatorRow = document.createElement('p');
    creatorRow.className = 'detail-row';
    creatorRow.innerHTML = `<span class="detail-label">Creata da:</span> ${playlist.creator}`;
    header.appendChild(creatorRow);

    // Mostra la descrizione
    const descriptionRow = document.createElement('p');
    descriptionRow.className = 'detail-row';
    descriptionRow.innerHTML = `<span class="detail-label">Descrizione:</span> ${playlist.description || 'Nessuna descrizione'}`;
    header.appendChild(descriptionRow);

    // Mostra i tag 
    if (playlist.tags?.length) {
        const tagsRow = document.createElement('p');
        tagsRow.className = 'detail-row';
        tagsRow.innerHTML = `<span class="detail-label">Tags:</span> ${playlist.tags.join(', ')}`;
        header.appendChild(tagsRow);
    }

    // Mostra le community in cui è condivisa
    if (playlist.communities && playlist.communities.length > 0) {
        const community = document.createElement('p');

        // Recupera i dati delle community
        const communitiesData = communities.filter(c =>
            playlist.communities.includes(c.id)
        );

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

    // lista dei brani nella playlist
    const trackTitle = document.createElement('h5');
    trackTitle.textContent = "🎵 Brani nella playlist";
    trackTitle.className = "playlist-section-title";
    trackTitle.style.marginBottom = "1rem";
    body.appendChild(trackTitle);

    // Se ci sono tracce, le mostra
    if (playlist.tracks?.length) {
        playlist.tracks.forEach(track => {
            const card = document.createElement('div');
            card.className = 'track-card';

            const img = document.createElement('img');
            img.className = "track-cover";
            img.src = track.image;
            img.alt = `Cover di ${track.title}`;
            img.addEventListener("click", () => {
                window.location.href = `song.html?id=${track.id}`;
            });

            const textBlock = document.createElement('div');
            textBlock.className = 'track-text';

            const trackName = document.createElement('h6');
            trackName.className = "track-link";
            trackName.textContent = track.title;
            // Quando clicchi, vai alla pagina song.html 
            trackName.addEventListener("click", () => {
                window.location.href = `song.html?id=${track.id}`;
            });


            // Mostra tutte le informazioni del brano
            const info = document.createElement('p');
            info.className = 'track-info';
            info.innerHTML = `
                🎤 ${track.artist} &nbsp; | &nbsp;
                ⏱ ${track.duration || 'Sconosciuto'} &nbsp; 
            `;

            textBlock.appendChild(trackName);
            textBlock.appendChild(info);

            card.appendChild(img);
            card.appendChild(textBlock);
            body.appendChild(card);
        });
    } else {
        // Se non ci sono tracce, mostra un messaggio
        const empty = document.createElement('p');
        empty.className = 'playlist-empty-message';
        empty.textContent = "Nessun brano nella playlist.";
        body.appendChild(empty);
    }

    new bootstrap.Modal(document.getElementById('viewPlaylistModal')).show();
}

/* FUNZIONE PER MODIFICARE UNA PLAYLIST */
function editPlaylist(id) {
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];

    // Trova playlist da modificare con ID
    const playlist = playlists.find(p => p.id === id);
    if (!playlist) return;

    // Precompila campi del form con dati della playlist
    document.getElementById('editPlaylistName').value = playlist.name;
    document.getElementById('editPlaylistDescription').value = playlist.description || '';
    document.getElementById('editPlaylistTags').value = playlist.tags?.join(', ') || '';

    // SEZIONE LISTA TRACCE
    const trackList = document.getElementById('editPlaylistTracks');
    trackList.innerHTML = '';

    // Se playlist ha tracce, le mostra
    if (playlist.tracks?.length) {
        playlist.tracks.forEach(track => {
            const li = document.createElement('li');
            li.className = "list-group-item";

            // Mostra info della traccia con pulsante di rimozione
            li.innerHTML = `
                <div class="track-info">
                    <img src="${track.image || 'assets/placeholder-music.png'}" class="edit-track-cover" alt="Cover brano">

                    <div class="track-text">
                        <div class="track-title">${track.title || 'undefined'}</div>
                        <div class="track-meta">
                            <span class="meta-badge">${track.artist || 'Artista: Sconosciuto'}</span>
                            <span class="meta-badge">${track.duration || 'Durata: Sconosciuto'}</span>
                        </div>
                    </div>

                    <button class="btn-remove-track" data-id="${track.id}" title="Rimuovi brano">
                        <i class="bi bi-x-circle"></i>
                    </button>
                </div>
            `;
            trackList.appendChild(li);
        });
    } else {
        // Se non ci sono tracce, mostra un messaggio
        trackList.innerHTML = `
            <li class="no-tracks-msg">
                <i class="bi bi-music-note-beamed"></i>
                Nessun brano nella playlist
            </li>
        `;
    }

    // GESTIONE RIMOZIONE TRACCE
    trackList.querySelectorAll(".btn-remove-track").forEach(button => {
        button.addEventListener('click', () => {
            const trackId = button.dataset.id;

            // Filtra traccia da rimuovere
            playlist.tracks = playlist.tracks.filter(t => t.id !== trackId);

            // Aggiorna storage
            localStorage.setItem('playlists', JSON.stringify(playlists));

            // Riapre modale per vedere modifiche
            setTimeout(() => editPlaylist(id), 50);
        });
    });

    // GESTIONE SUBMIT DEL FORM
    const form = document.getElementById('editPlaylistForm');
    form.onsubmit = function (e) {
        e.preventDefault();

        // Aggiorna campi della playlist con nuovi valori
        playlist.name = document.getElementById('editPlaylistName').value.trim();
        playlist.description = document.getElementById('editPlaylistDescription').value.trim();
        playlist.tags = document.getElementById('editPlaylistTags').value
            .split(',')
            .map(t => t.trim())
            .filter(Boolean);

        localStorage.setItem('playlists', JSON.stringify(playlists));

        showToast("Playlist modificata con successo!");
        bootstrap.Modal.getInstance(document.getElementById('editPlaylistModal')).hide();

        renderPlaylists(); // Aggiorna la UI principale
    };

    new bootstrap.Modal(document.getElementById('editPlaylistModal')).show();
}

/* FUNZIONE PER CONFERMARE L'ELIMINAZIONE DI UNA PLAYLIST */
function confirmDelete(id) {
    // Recupera pulsante di conferma 
    const btn = document.getElementById('confirmDeleteBtn');

    // Associa azione eliminazione al click
    btn.onclick = function () {
        let playlists = JSON.parse(localStorage.getItem('playlists')) || [];

        // Filtra playlist da eliminare
        playlists = playlists.filter(p => p.id !== id);

        // Aggiorna storage
        localStorage.setItem('playlists', JSON.stringify(playlists));

        showToast("Playlist eliminata!");
        bootstrap.Modal.getInstance(document.getElementById('confirmDeletePlaylistModal')).hide();

        renderPlaylists(); // Aggiorna la UI principale
    };

    new bootstrap.Modal(document.getElementById('confirmDeletePlaylistModal')).show();
}

/* FUNZIONE PER MOSTRARE MESSAGGI TOAST (NOTIFICHE) */
function showToast(message, tipo = "success") {
    const toastEl = document.getElementById('sn4mToast');
    const toastMessage = document.getElementById('toastMessage');
    if (!toastEl || !toastMessage) return;

    toastMessage.textContent = message;
    toastEl.className = `toast align-items-center text-white bg-${tipo} border-0`;

    new bootstrap.Toast(toastEl).show();
}