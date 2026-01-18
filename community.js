document.addEventListener('headerLoaded', () => {
    const user = JSON.parse(sessionStorage.getItem('utente'));
    if (!user) return;

    document.getElementById('welcomeUsername').textContent = user.username;

    renderCommunities();
    renderMyCommunities();

    const searchInput = document.getElementById("communitySearch");
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            const q = searchInput.value.trim();

            const communities = JSON.parse(localStorage.getItem('communities')) || [];
            const results = searchCommunities(q, communities);
            
            // Mostra SOLO le community non mie (come fa già renderCommunities) 
            const user = JSON.parse(sessionStorage.getItem('utente'));
            const filtered = results.filter(c => !c.members.includes(user.username));
            
            const container = document.getElementById("communityList");
            container.textContent = "";

            if (filtered.length === 0) {
                const msg = document.createElement("p");
                msg.textContent = "Nessuna community trovata...";
                msg.style.color = "#888";
                msg.style.fontStyle = "italic";
                msg.style.padding = "10px 0";
                container.appendChild(msg);
                return;
            }
            
            filtered.forEach(c => {
                container.appendChild(renderCommunityCard(c));
            });
        });
    }

    document.getElementById('newCommunityForm').addEventListener('submit', function (e) {
        e.preventDefault();

        const communities = JSON.parse(localStorage.getItem('communities')) || [];

        const newCommunity = {
            id: Date.now().toString(),
            name: document.getElementById('communityName').value.trim(),
            description: document.getElementById('communityDescription').value.trim(),
            tags: document.getElementById('communityTags').value.split(',').map(t => t.trim()).filter(Boolean),
            creator: user.username,
            members: [user.username]
        };

        communities.push(newCommunity);
        localStorage.setItem('communities', JSON.stringify(communities));

        bootstrap.Modal.getInstance(document.getElementById('createCommunityModal')).hide();
        this.reset();
        
        showToast(`La community "${newCommunity.name}" è stata creata!`, "success");
        renderCommunities();
        renderMyCommunities();
    });

    // Reset modale "Crea Community" quando viene chiuso
    document.getElementById('createCommunityModal')
        .addEventListener('hidden.bs.modal', () => {
            document.getElementById('newCommunityForm').reset();
        });

});

function editCommunity(id) {
    const communities = JSON.parse(localStorage.getItem('communities')) || [];
    const community = communities.find(c => c.id === id);
    if (!community) return;

    document.getElementById('editCommunityName').value = community.name;
    document.getElementById('editCommunityDescription').value = community.description || '';
    document.getElementById('editCommunityTags').value = community.tags?.join(', ') || '';

    const form = document.getElementById('editCommunityForm');
    form.onsubmit = function (e) {
        e.preventDefault();
        community.name = document.getElementById('editCommunityName').value.trim();
        community.description = document.getElementById('editCommunityDescription').value.trim();
        community.tags = document.getElementById('editCommunityTags').value.split(',').map(t => t.trim()).filter(Boolean);

        localStorage.setItem('communities', JSON.stringify(communities));
        bootstrap.Modal.getInstance(document.getElementById('editCommunityModal')).hide();
        showToast(`La community "${community.name}" è stata modificata.`, "info");
        renderCommunities();
        renderMyCommunities();
    };

    new bootstrap.Modal(document.getElementById('editCommunityModal')).show();
}

function confirmDeleteCommunity(id) {
    const btn = document.getElementById('confirmDeleteCommunityBtn');
    btn.onclick = function () {
        // Rimuovi la community dalla lista 
        let communities = JSON.parse(localStorage.getItem('communities')) || [];
        communities = communities.filter(c => c.id !== id);
        localStorage.setItem('communities', JSON.stringify(communities));

        // Rimuovi il riferimento da tutte le playlist 
        const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
        playlists.forEach(p => {
            if (p.communities?.includes(id)) {
                p.communities = p.communities.filter(cid => cid !== id);
            }
        }); localStorage.setItem('playlists', JSON.stringify(playlists));

        bootstrap.Modal.getInstance(document.getElementById('confirmDeleteCommunityModal')).hide();

        showToast("Community eliminata con successo.", "danger");

        renderCommunities();
        renderMyCommunities();
    };

    new bootstrap.Modal(document.getElementById('confirmDeleteCommunityModal')).show();
}

function renderCommunities() {
    const user = JSON.parse(sessionStorage.getItem('utente'));
    const communities = JSON.parse(localStorage.getItem('communities')) || [];
    const container = document.getElementById('communityList');
    container.textContent = '';

    const others = communities.filter(c => !c.members.includes(user.username));
    others.forEach(c => {
        const template = document.getElementById('communityCardTemplate');
        const clone = template.content.cloneNode(true);

        const title = clone.querySelector('.community-title');
        title.textContent = c.name;
        title.addEventListener('click', () => openCommunityDetails(c.id));

        const dropdownMenu = clone.querySelector('.dropdown-menu');
        dropdownMenu.textContent = ''; // nessuna voce per chi non è membro

        // Bottone "Unisciti"
        const joinBtn = document.createElement('button');
        joinBtn.className = 'btn btn-outline-light btn-sm mt-2';
        joinBtn.textContent = 'Unisciti';
        joinBtn.addEventListener('click', () => joinCommunity(c.id));
        clone.querySelector('.community-card').appendChild(joinBtn);

        container.appendChild(clone);
    });
}

function renderMyCommunities() {
    const user = JSON.parse(sessionStorage.getItem('utente'));
    const communities = JSON.parse(localStorage.getItem('communities')) || [];
    const container = document.getElementById('myCommunities');
    container.textContent = '';

    const mine = communities.filter(c => c.members.includes(user.username));
    mine.forEach(c => {
        container.appendChild(renderCommunityCard(c));
    });

    const otherContainer = document.getElementById('communityList');
    otherContainer.textContent = '';

    const others = communities.filter(c => !c.members.includes(user.username));

    // se non ci sono community disponibili
    if (others.length === 0) {
        otherContainer.innerHTML = `
            <p style="color:#bd93f9; font-style:italic; padding:10px 0;">
                Nessuna community disponibile...
            </p>
        `;
        return; 
    }

    // Altrimenti mostra le card
    others.forEach(c => otherContainer.appendChild(renderCommunityCard(c)));
}

function joinCommunity(id) {
    const user = JSON.parse(sessionStorage.getItem('utente'));
    const communities = JSON.parse(localStorage.getItem('communities')) || [];
    const community = communities.find(c => c.id === id);
    if (!community || community.members.includes(user.username)) return;

    community.members.push(user.username);
    localStorage.setItem('communities', JSON.stringify(communities));

    showToast(`Ti sei unita a "${community.name}"!`, "success")

    renderCommunities();
    renderMyCommunities();
}

function leaveCommunity(id) {
    const user = JSON.parse(sessionStorage.getItem('utente'));
    let communities = JSON.parse(localStorage.getItem('communities')) || [];
    const community = communities.find(c => c.id === id);
    if (!community) return;

    community.members = community.members.filter(m => m !== user.username);
    localStorage.setItem('communities', JSON.stringify(communities));

    // Rimuovi playlist condivise da quella community
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
    playlists.forEach(p => {
        if (p.communities?.includes(id)) {
            p.communities = p.communities.filter(cid => cid !== id);
        }
    });
    localStorage.setItem('playlists', JSON.stringify(playlists));

    showToast(`Hai lasciato "${community.name}".`, "warning");

    renderCommunities();
    renderMyCommunities();
}

function renderCommunityCard(c) {
    const template = document.getElementById('communityCardTemplate');
    const clone = template.content.cloneNode(true);

    const title = clone.querySelector('.community-title');
    title.textContent = c.name;
    title.addEventListener('click', () => openCommunityDetails(c.id));

    const dropdownMenu = clone.querySelector('.dropdown-menu');
    dropdownMenu.textContent = '';

    const user = JSON.parse(sessionStorage.getItem('utente'));
    const isCreator = c.creator === user.username;
    const isMember = c.members.includes(user.username);

    if (isCreator) {
        // Modifica
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

        // Elimina
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
        // Esci
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
        // Unisciti
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

function openCommunityDetails(id) {
    const communities = JSON.parse(localStorage.getItem('communities')) || [];
    const playlists = JSON.parse(localStorage.getItem('playlists')) || [];
    const community = communities.find(c => c.id === id);
    if (!community) return;

    const sharedPlaylists = playlists.filter(p => p.communities?.includes(id));

    const body = document.getElementById('viewCommunityBody');

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
            ${community.members?.length ? community.members.map(m => `<li><i class="bi bi-person"></i> ${m}</li>`).join('') : '<li>Nessun membro</li>'}
        </ul>
    </div>

    <div class="detail-section">
        <h5 class="detail-title">Playlist condivise</h5>
        <ul class="detail-list playlists">
            ${sharedPlaylists.length ? sharedPlaylists.map(p => `<li onclick="importSharedPlaylist('${p.id}')"><i class="bi bi-music-note-list"></i> ${p.name}</li>`).join('') : '<li>Nessuna playlist</li>'}
        </ul>
    </div>
`;


    new bootstrap.Modal(document.getElementById('viewCommunityModal')).show();
}

function searchCommunities(query, allCommunities) {
    query = query.toLowerCase();

    return allCommunities.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.tags.some(tag => tag.toLowerCase().includes(query))
    );
}
