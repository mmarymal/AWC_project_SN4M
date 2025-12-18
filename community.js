document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(sessionStorage.getItem('utente'));
    if (!user) return;

    document.getElementById('welcomeUsername').textContent = user.username;

    renderCommunities();
    renderMyCommunities();

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
        renderCommunities();
        renderMyCommunities();
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
        renderCommunities();
        renderMyCommunities();
    };

    new bootstrap.Modal(document.getElementById('editCommunityModal')).show();
}

function confirmDeleteCommunity(id) {
    const btn = document.getElementById('confirmDeleteCommunityBtn');
    btn.onclick = function () {
        let communities = JSON.parse(localStorage.getItem('communities')) || [];
        communities = communities.filter(c => c.id !== id);
        localStorage.setItem('communities', JSON.stringify(communities));
        bootstrap.Modal.getInstance(document.getElementById('confirmDeleteCommunityModal')).hide();
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
    others.forEach(c => otherContainer.appendChild(renderCommunityCard(c)));
}

function joinCommunity(id) {
    const user = JSON.parse(sessionStorage.getItem('utente'));
    const communities = JSON.parse(localStorage.getItem('communities')) || [];
    const community = communities.find(c => c.id === id);
    if (!community || community.members.includes(user.username)) return;

    community.members.push(user.username);
    localStorage.setItem('communities', JSON.stringify(communities));
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

    const sharedPlaylists = playlists.filter(p => p.community === id);

    const body = document.getElementById('viewCommunityBody');
    body.textContent = '';

    const title = document.createElement('h4');
    title.textContent = community.name;
    body.appendChild(title);

    const desc = document.createElement('p');
    const descLabel = document.createElement('strong');
    descLabel.textContent = 'Descrizione: ';
    desc.appendChild(descLabel);
    desc.appendChild(document.createTextNode(community.description || 'Nessuna descrizione'));
    body.appendChild(desc);

    const tags = document.createElement('p');
    const tagsLabel = document.createElement('strong');
    tagsLabel.textContent = 'Tag: ';
    tags.appendChild(tagsLabel);
    tags.appendChild(document.createTextNode(community.tags?.join(', ') || 'Nessuno'));
    body.appendChild(tags);

    body.appendChild(document.createElement('hr'));

    body.appendChild(document.createElement('hr'));

    // Membri
    const membersTitle = document.createElement('h5');
    membersTitle.textContent = 'Membri:';
    body.appendChild(membersTitle);

    const membersList = document.createElement('ul');
    if (community.members?.length) {
        community.members.forEach(m => {
            const li = document.createElement('li');
            li.textContent = m;
            membersList.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = 'Nessun membro';
        membersList.appendChild(li);
    }
    body.appendChild(membersList);

    body.appendChild(document.createElement('hr'));

    // Playlist condivise
    const playlistsTitle = document.createElement('h5');
    playlistsTitle.textContent = 'Playlist condivise:';
    body.appendChild(playlistsTitle);

    const playlistsList = document.createElement('ul');
    if (sharedPlaylists.length) {
        sharedPlaylists.forEach(p => {
            const li = document.createElement('li');
            li.textContent = p.name;
            playlistsList.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = 'Nessuna playlist';
        playlistsList.appendChild(li);
    }
    body.appendChild(playlistsList);

    // Mostra modale
    new bootstrap.Modal(document.getElementById('viewCommunityModal')).show();
}