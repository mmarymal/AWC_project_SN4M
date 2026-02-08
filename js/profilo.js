document.addEventListener('headerLoaded', function () {
  // recupera dati dell'utente dalla sessione
  const userDataString = sessionStorage.getItem('utente');

  // se non loggato, reindirizza al login
  if (!userDataString) {
    showToast("Non sei loggato. Effettua il login.");
    setTimeout(() => window.location.href = "login.html", 1500);
    return;
  }

  let user;
  try {
    // prova a convertire la stringa JSON in oggetto
    user = JSON.parse(userDataString);
  } catch (error) {
    // se JSON è corrotto, fa logout
    showToast("Dati sbagliati. Riprova il login.");
    setTimeout(() => window.location.href = "login.html", 1500);
    return;
  }

  // FUNZIONE MODIFICA PROFILO
  function editProfile() {
    // Mostra nome utente
    document.getElementById('welcomeUsername').textContent = user.username;

    // Precompila il form del profilo con i dati salvati
    document.getElementById('username').value = user.username;
    document.getElementById('email').value = user.email;
    document.getElementById('preferences').value = user.preferences || '';
    document.getElementById('artists').value = user.artists?.join(', ') || '';

    // Salva modifiche
    document.getElementById('profileForm').addEventListener('submit', function (event) {
      event.preventDefault();

      //leggo nuova password (se presente)
      const newPassword = document.getElementById('newPassword').value.trim();
      const confirmNewPassword = document.getElementById('confirmNewPassword').value.trim();

      //se l'utente vuole cambiare password, verifica che coincidono
      if (newPassword || confirmNewPassword) {
        if (newPassword !== confirmNewPassword) {
          showToast("Le nuove password non corrispondono.", "danger");
          return;
        }
      }

      // crea oggetto utente aggiornato
      const updatedUser = {
        username: document.getElementById('username').value.trim(),
        email: user.email, // l'email non è modificabile
        preferences: document.getElementById('preferences').value.trim(),
        artists: document.getElementById('artists').value.trim().split(',').map(a => a.trim()),
        password: newPassword || user.password // mantieni la vecchia password se non viene cambiata
      };

      // Aggiorna utente nel localStorage
      let utenti = JSON.parse(localStorage.getItem('utenti')) || [];
      const index = utenti.findIndex(u => u.email === user.email);

      if (index !== -1) {
        utenti[index] = updatedUser;
        localStorage.setItem('utenti', JSON.stringify(utenti));
      }

      // Aggiorna anche sessionStorage
      sessionStorage.setItem('utente', JSON.stringify(updatedUser));

      showToast("Profilo aggiornato con successo!");
      setTimeout(() => window.location.href = "profilo.html", 2000);
    });
  }
  editProfile();

  // FUNZIONE ELIMINAZIONE ACCOUNT
  function deleteAccount(user) {
    const deleteBtn = document.getElementById('deleteAccountBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteAccount');

    // apre modale di conferma eliminazione
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function () {
        const modal = new bootstrap.Modal(document.getElementById('deleteAccountModal'));
        modal.show();
      });
    }

    // conferma eliminazione account
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', function () {

        // Rimuovi utente da localStorage
        let utenti = JSON.parse(localStorage.getItem('utenti')) || [];
        utenti = utenti.filter(u => u.email !== user.email);
        localStorage.setItem('utenti', JSON.stringify(utenti));

        // Rimuovi playlist dell’utente
        let playlists = JSON.parse(localStorage.getItem('playlists')) || [];
        const deletedPlaylistIds = playlists.filter(p => p.creator === user.username).map(p => p.id);
        playlists = playlists.filter(p => p.creator !== user.username);
        localStorage.setItem('playlists', JSON.stringify(playlists));

        // Rimuovi communities create dall’utente
        let communities = JSON.parse(localStorage.getItem('communities')) || [];
        communities = communities.filter(c => c.creator !== user.username);

        // Rimuovi utente dai membri delle altre communities
        communities.forEach(c => {
          c.members = c.members.filter(m => m !== user.username);
        });

        // Rimuovi playlist eliminate dalle community 
        communities.forEach(c => {
          if (c.playlists) {
            c.playlists = c.playlists.filter(pid => !deletedPlaylistIds.includes(pid));
          }
        });

        localStorage.setItem('communities', JSON.stringify(communities));

        // Rimuovi utente da sessionStorage
        sessionStorage.removeItem('utente');

        // Notifica e redirect
        showToast("Account eliminato con successo.");
        setTimeout(() => window.location.href = "login.html", 1500);
      });
    }
  }
  deleteAccount();

});

function showToast(message) {
  const toastEl = document.getElementById('sn4mToast');
  const toastMessage = document.getElementById('toastMessage');
  if (!toastEl || !toastMessage) return;

  toastMessage.textContent = message;
  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}
