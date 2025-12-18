document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(sessionStorage.getItem('utente'));
    if (!user) {
        window.location.href = 'login.html'; // se non loggato, torna al login
        return;
    }

    const welcome = document.getElementById('welcomeUsername');
    if (welcome) welcome.textContent = user.username;

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('utente');
            window.location.href = 'login.html';
        });
    }
});
