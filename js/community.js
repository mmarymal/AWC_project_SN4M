// Event listener che si attiva quando l'header della pagina è stato caricato
document.addEventListener('headerLoaded', () => {
    const user = JSON.parse(sessionStorage.getItem('utente'));

    if (!user) {
        showToast("Devi effettuare il login", "warning");
        setTimeout(() => window.location.href = "login.html", 1500);
        return;
    }

    document.getElementById('welcomeUsername').textContent = user.username;

    // Render iniziale: visualizza tutte le community disponibili e quelle dell'utente
    renderCommunities();
    renderMyCommunities();

    // FUNZIONE CREAZIONE NUOVA COMMUNITY
    function communityCreation() {
        document.getElementById('newCommunityForm').addEventListener('submit', function (e) {
            e.preventDefault();

            const communities = JSON.parse(localStorage.getItem('communities')) || [];

            // Crea l'oggetto nuova community
            const newCommunity = {
                id: Date.now().toString(), // ID univoco 
                name: document.getElementById('communityName').value.trim(),
                description: document.getElementById('communityDescription').value.trim(),

                // Converte stringa di tag separati da virgola in un array pulito
                tags: document.getElementById('communityTags').value.split(',').map(t => t.trim()).filter(Boolean),
                creator: user.username,
                members: [user.username] // Il creatore è automaticamente membro
            };

            // Aggiunge nuova community e salva
            communities.push(newCommunity);
            localStorage.setItem('communities', JSON.stringify(communities));

            // Chiude modale e resetta form
            bootstrap.Modal.getInstance(document.getElementById('createCommunityModal')).hide();
            this.reset();

            // Mostra messaggio conferma
            showToast(`La community "${newCommunity.name}" è stata creata!`, "success");

            // Aggiorna entrambe le sezioni della UI
            renderCommunities();
            renderMyCommunities();
        });

        // Reset form quando modale viene chiuso
        document.getElementById('createCommunityModal')
            .addEventListener('hidden.bs.modal', () => {
                document.getElementById('newCommunityForm').reset();
            });
    }
    communityCreation();

    /* FUNZIONE RICERCA COMMUNITY */
    function communitySearch() {
        const searchInput = document.getElementById("communitySearch");
        if (searchInput) {
            // Ad ogni input dell'utente, filtra le community
            searchInput.addEventListener("input", () => {
                const q = searchInput.value.trim();

                const communities = JSON.parse(localStorage.getItem('communities')) || [];
                const results = searchCommunities(q, communities);

                // Mostra SOLO community a cui l'utente NON appartiene ancora
                const user = JSON.parse(sessionStorage.getItem('utente'));
                const filtered = results.filter(c => !c.members.includes(user.username));

                const container = document.getElementById("communityList");
                container.textContent = "";

                // Se non ci sono risultati, mostra un messaggio
                if (filtered.length === 0) {
                    const msg = document.createElement("p");
                    msg.textContent = "Nessuna community trovata...";
                    msg.style.color = "#888";
                    msg.style.fontStyle = "italic";
                    msg.style.padding = "10px 0";
                    container.appendChild(msg);
                    return;
                }

                // Renderizza ogni community filtrata
                filtered.forEach(c => {
                    container.appendChild(renderCommunityCard(c));
                });
            });
        }
    }
    communitySearch();  
});

/* FUNZIONE PER MODIFICARE UNA COMMUNITY */
function editCommunity(id) {
    const communities = JSON.parse(localStorage.getItem('communities')) || [];

    // modificare tramite ID
    const community = communities.find(c => c.id === id);
    if (!community) return; // Se non esiste, esce

    // Precompila campi del form con dati community
    document.getElementById('editCommunityName').value = community.name;
    document.getElementById('editCommunityDescription').value = community.description || '';
    document.getElementById('editCommunityTags').value = community.tags?.join(', ') || '';

    // Gestione submit del form
    const form = document.getElementById('editCommunityForm');
    form.onsubmit = function (e) {
        e.preventDefault();

        // Aggiorna campi community con nuovi valori
        community.name = document.getElementById('editCommunityName').value.trim();
        community.description = document.getElementById('editCommunityDescription').value.trim();
        community.tags = document.getElementById('editCommunityTags').value.split(',').map(t => t.trim()).filter(Boolean);

        // Salva modifiche
        localStorage.setItem('communities', JSON.stringify(communities));
        bootstrap.Modal.getInstance(document.getElementById('editCommunityModal')).hide();

        showToast(`La community "${community.name}" è stata modificata.`, "info");

        // Aggiorna la UI
        renderCommunities();
        renderMyCommunities();
    };

    new bootstrap.Modal(document.getElementById('editCommunityModal')).show();
}

/* FUNZIONE PER CONFERMARE L'ELIMINAZIONE DI UNA COMMUNITY */
function confirmDeleteCommunity(id) {
    // Recupera pulsante conferma 
    const btn = document.getElementById('confirmDeleteCommunityBtn');

    // Associa azione eliminazione al click
    btn.onclick = function () {
        // Rimuove community dalla lista
        let communities = JSON.parse(localStorage.getItem('communities')) || [];
        communities = communities.filter(c => c.id !== id);
        localStorage.setItem('communities', JSON.stringify(communities));

        // Rimuove riferimento della community da tutte le playlist condivise
        const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
        playlists.forEach(p => {
            // Se playlist era condivisa nella community, rimosso riferimento
            if (p.communities?.includes(id)) {
                p.communities = p.communities.filter(cid => cid !== id);
            }
        });
        localStorage.setItem('playlists', JSON.stringify(playlists));

        bootstrap.Modal.getInstance(document.getElementById('confirmDeleteCommunityModal')).hide();

        showToast("Community eliminata con successo.", "danger");

        // Aggiorna la UI
        renderCommunities();
        renderMyCommunities();
    };

    new bootstrap.Modal(document.getElementById('confirmDeleteCommunityModal')).show();
}

/* FUNZIONE PER RENDERIZZARE LE COMMUNITY DISPONIBILI (non appartenenti all'utente) */
function renderCommunities() {
    const user = JSON.parse(sessionStorage.getItem('utente'));
    const communities = JSON.parse(localStorage.getItem('communities')) || [];
    const container = document.getElementById('communityList');
    container.textContent = '';

    // Filtra solo community a cui l'utente NON appartiene
    const others = communities.filter(c => !c.members.includes(user.username));

    others.forEach(c => {
        // Clona template della card
        const template = document.getElementById('communityCardTemplate');
        const clone = template.content.cloneNode(true);

        // click titolo per aprire i dettagli
        const title = clone.querySelector('.community-title');
        title.textContent = c.name;
        title.addEventListener('click', () => openCommunityDetails(c.id));

        // Svuota menu dropdown (nessuna azione per chi non è membro)
        const dropdownMenu = clone.querySelector('.dropdown-menu');
        dropdownMenu.textContent = '';

        // Aggiunge il bottone "Unisciti"
        const joinBtn = document.createElement('button');
        joinBtn.className = 'btn btn-outline-light btn-sm mt-2';
        joinBtn.textContent = 'Unisciti';
        joinBtn.addEventListener('click', () => joinCommunity(c.id));
        clone.querySelector('.community-card').appendChild(joinBtn);

        container.appendChild(clone);
    });
}

/* FUNZIONE PER RENDERIZZARE LE COMMUNITY DELL'UTENTE */
function renderMyCommunities() {
    const user = JSON.parse(sessionStorage.getItem('utente'));
    const communities = JSON.parse(localStorage.getItem('communities')) || [];
    const container = document.getElementById('myCommunities');
    container.textContent = '';

    // mie community (quelle a cui l'utente appartiene)
    const mine = communities.filter(c => c.members.includes(user.username));
    mine.forEach(c => {
        container.appendChild(renderCommunityCard(c));
    });

    // community disponibili (a cui l'utente NON appartiene)
    const otherContainer = document.getElementById('communityList');
    otherContainer.textContent = '';

    const others = communities.filter(c => !c.members.includes(user.username));

    // Se non ci sono community disponibili, mostra un messaggio
    if (others.length === 0) {
        otherContainer.innerHTML = `
            <p style="color:#bd93f9; font-style:italic; padding:10px 0;">
                Nessuna community disponibile...
            </p>
        `;
        return;
    }

    // Altrimenti renderizza le card delle community disponibili
    others.forEach(c => otherContainer.appendChild(renderCommunityCard(c)));
}

/* FUNZIONE PER UNIRSI A UNA COMMUNITY */
function joinCommunity(id) {
    const user = JSON.parse(sessionStorage.getItem('utente'));
    const communities = JSON.parse(localStorage.getItem('communities')) || [];
    const community = communities.find(c => c.id === id);

    // Se community non esiste o utente è già membro, esce
    if (!community || community.members.includes(user.username)) return;

    // Aggiunge utente a lista dei membri
    community.members.push(user.username);
    localStorage.setItem('communities', JSON.stringify(communities));

    showToast(`Ti sei unita a "${community.name}"!`, "success")

    // Aggiorna la UI
    renderCommunities();
    renderMyCommunities();
}

/* FUNZIONE PER LASCIARE UNA COMMUNITY */
function leaveCommunity(id) {
    const user = JSON.parse(sessionStorage.getItem('utente'));
    let communities = JSON.parse(localStorage.getItem('communities')) || [];
    const community = communities.find(c => c.id === id);
    if (!community) return;

    // Rimuove utente dalla lista dei membri
    community.members = community.members.filter(m => m !== user.username);
    localStorage.setItem('communities', JSON.stringify(communities));

    // Rimuove anche le playlist dell'utente condivise in quella community
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
    playlists.forEach(p => {
        if (p.communities?.includes(id)) {
            p.communities = p.communities.filter(cid => cid !== id);
        }
    });
    localStorage.setItem('playlists', JSON.stringify(playlists));

    showToast(`Hai lasciato "${community.name}".`, "warning");

    // Aggiorna la UI
    renderCommunities();
    renderMyCommunities();
}

/* FUNZIONE PER CREARE UNA CARD DI UNA COMMUNITY */
function renderCommunityCard(c) {
    // Clona template della card
    const template = document.getElementById('communityCardTemplate');
    const clone = template.content.cloneNode(true);

    // click su titolo per aprire i dettagli
    const title = clone.querySelector('.community-title');
    title.textContent = c.name;
    title.addEventListener('click', () => openCommunityDetails(c.id));

    // Recupera menu dropdown
    const dropdownMenu = clone.querySelector('.dropdown-menu');
    dropdownMenu.textContent = '';

    // Determina ruolo dell'utente rispetto alla community
    const user = JSON.parse(sessionStorage.getItem('utente'));
    const isCreator = c.creator === user.username; 
    const isMember = c.members.includes(user.username); 

    /* MENU DROPDOWN BASATO SUL RUOLO */
    if (isCreator) {
        // CREATORE: può modificare ed eliminare

        // Opzione: Modifica
        const editItem = document.createElement('li');
        const editLink = document.createElement('a');
        editLink.className = 'dropdown-item';
        editLink.textContent = 'Modifica';
        editLink.href = '#';
        editLink.addEventListener('click', (e) => {
            e.preventDefault();
            editCommunity(c.id);
        });
        editItem.appendChild(editLink);
        dropdownMenu.appendChild(editItem);

        // Opzione: Elimina
        const deleteItem = document.createElement('li');
        const deleteLink = document.createElement('a');
        deleteLink.className = 'dropdown-item text-danger';
        deleteLink.textContent = 'Elimina';
        deleteLink.href = '#';
        deleteLink.addEventListener('click', (e) => {
            e.preventDefault();
            confirmDeleteCommunity(c.id);
        });
        deleteItem.appendChild(deleteLink);
        dropdownMenu.appendChild(deleteItem);

    } else if (isMember) {
        // MEMBRO (non creatore): può solo uscire

        // Opzione: Esci
        const leaveItem = document.createElement('li');
        const leaveLink = document.createElement('a');
        leaveLink.className = 'dropdown-item text-warning';
        leaveLink.textContent = 'Esci';
        leaveLink.href = '#';
        leaveLink.addEventListener('click', (e) => {
            e.preventDefault();
            leaveCommunity(c.id);
        });
        leaveItem.appendChild(leaveLink);
        dropdownMenu.appendChild(leaveItem);

    } else {
        // NON MEMBRO: può solo unirsi

        // Opzione: Unisciti
        const joinItem = document.createElement('li');
        const joinLink = document.createElement('a');
        joinLink.className = 'dropdown-item text-success';
        joinLink.textContent = 'Unisciti';
        joinLink.href = '#';
        joinLink.addEventListener('click', (e) => {
            e.preventDefault();
            joinCommunity(c.id);
        });
        joinItem.appendChild(joinLink);
        dropdownMenu.appendChild(joinItem);
    }

    return clone;
}

/* FUNZIONE PER VISUALIZZARE I DETTAGLI DI UNA COMMUNITY */
function openCommunityDetails(id) {
    // Recupera tutti dati necessari
    const communities = JSON.parse(localStorage.getItem('communities')) || [];
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
    const community = communities.find(c => c.id === id);
    if (!community) return;

    // Trova tutte playlist condivise nella community
    const sharedPlaylists = playlists.filter(p => p.communities?.includes(id));

    const body = document.getElementById('viewCommunityBody');

    // Costruisce modale con tutte informazioni
    body.innerHTML = `
        <h4 class="community-name">${community.name}</h4>

        <p class="detail-row">
            <span class="detail-label">Descrizione:</span> ${community.description || 'Nessuna descrizione'}
        </p>

        <p class="detail-row">
            <span class="detail-label">Tag:</span> ${community.tags?.join(', ') || 'Nessuno'}
        </p>

        <div class="detail-section">
            <h5 class="detail-title">Membri</h5>
            <ul class="detail-list">
                ${community.members?.length
            ? community.members.map(m => `
                        <li>
                            <i class="bi bi-person"></i>
                            <span class="member-item" data-username="${m}" style="cursor:pointer; color:#bd93f9;"> ${m}</span>
                        </li>
                    `).join('')
            : '<li>Nessun membro</li>'
        }
            </ul>
        </div>

        <div class="detail-section">
            <h5 class="detail-title">Playlist condivise</h5>
            <ul class="detail-list playlists">
                ${sharedPlaylists.length ? sharedPlaylists.map(p =>
                    `<li onclick="importSharedPlaylist('${p.id}')">
                    <i class="bi bi-music-note-list"></i> ${p.name}
                    </li>`).join('') : '<li>Nessuna playlist</li>'}
            </ul>
        </div>
    `;

    // Attacca event listener ai nomi dei membri per renderli cliccabili
    memberClickEvents();

    new bootstrap.Modal(document.getElementById('viewCommunityModal')).show();
}

/* FUNZIONE PER GESTIRE IL CLICK SUI NOMI DEI MEMBRI */
function memberClickEvents() {
    // Recupera tutti elementi cliccabili dei membri
    const memberItems = document.querySelectorAll('.member-item');

    memberItems.forEach(item => {
        item.addEventListener('click', () => {
            // Recupera username 
            const username = item.dataset.username;

            // Cerca info complete dell'utente
            const utenti = JSON.parse(localStorage.getItem('utenti')) || [];
            const membro = utenti.find(u => u.username === username);

            if (!membro) return;

            // Popola modale con info del membro
            document.getElementById('modalUsername').textContent = membro.username;
            document.getElementById('modalPreferences').textContent = membro.preferences || "Nessuna preferenza";
            document.getElementById('modalArtists').textContent = membro.artists?.join(', ') || "Nessun artista";

            // Mostra modale con info del membro
            const modal = new bootstrap.Modal(document.getElementById('memberInfoModal'));
            modal.show();
        });
    });
}

/* FUNZIONE FILTRO RICERCA COMMUNITY */
function searchCommunities(query, allCommunities) {
    query = query.toLowerCase();

    // Filtra community per nome, descrizione o tag
    return allCommunities.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.tags.some(tag => tag.toLowerCase().includes(query))
    );
}