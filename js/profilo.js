document.addEventListener('headerLoaded', function () {
  const userDataString = sessionStorage.getItem('utente');
  if (!userDataString) {
    mostraTost("Non sei loggato. Effettua il login.");
    setTimeout(() => window.location.href = "login.html", 1500);
    return;
  }

  let user;
  try {
    user = JSON.parse(userDataString);
  } catch (error) {
    mostraTost("Dati sbagliati. Riprova il login.");
    setTimeout(() => window.location.href = "login.html", 1500);
    return;
  }

  // Mostra nome utente
  document.getElementById('welcomeUsername').textContent = user.username;

  // Precompila il form
  document.getElementById('username').value = user.username;
  document.getElementById('email').value = user.email;
  document.getElementById('preferences').value = user.preferences || '';
  document.getElementById('artists').value = user.artists?.join(', ') || '';

  // Salva modifiche
  document.getElementById('profileForm').addEventListener('submit', function (event) {
    event.preventDefault();

    //leggo nuova password (se presenti)
    const newPassword = document.getElementById('newPassword').value.trim();
    const confirmNewPassword = document.getElementById('confirmNewPassword').value.trim();
    
    //validazione cambio password
    if (newPassword || confirmNewPassword) {
      if (newPassword !== confirmNewPassword) {
        mostraTost("Le nuove password non corrispondono.", "danger"); ùreturn;
      }
    }

    const updatedUser = {
      username: document.getElementById('username').value.trim(),
      email: user.email, // l'email non è modificabile
      preferences: document.getElementById('preferences').value.trim(),
      artists: document.getElementById('artists').value.trim().split(',').map(a => a.trim()),
      password: newPassword || user.password // mantieni la vecchia password se non viene cambiata
    };

    // Aggiorna localStorage
    let utenti = JSON.parse(localStorage.getItem('utenti')) || [];
    const index = utenti.findIndex(u => u.email === user.email && u.password === user.password);
    if (index !== -1) {
      utenti[index] = updatedUser;
      localStorage.setItem('utenti', JSON.stringify(utenti));
    }

    // Aggiorna sessionStorage
    sessionStorage.setItem('utente', JSON.stringify(updatedUser));

    mostraTost("Profilo aggiornato con successo!");
    setTimeout(() => window.location.href = "profilo.html", 2000);
  });

  const deleteBtn = document.getElementById('deleteAccountBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteAccount');

  if (deleteBtn) {
    deleteBtn.addEventListener('click', function () {
      const modal = new bootstrap.Modal(document.getElementById('deleteAccountModal'));
      modal.show();
    });
  }

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', function () {

      // Rimuovi utente da localStorage
      let utenti = JSON.parse(localStorage.getItem('utenti')) || [];
      utenti = utenti.filter(u => u.email !== user.email);
      localStorage.setItem('utenti', JSON.stringify(utenti));

      // Rimuovi playlist dell’utente
      let playlists = JSON.parse(localStorage.getItem('playlists')) || [];
      playlists = playlists.filter(p => p.creator !== user.username);
      localStorage.setItem('playlists', JSON.stringify(playlists));

      // Rimuovi communities create dall’utente
      let communities = JSON.parse(localStorage.getItem('communities')) || [];
      communities = communities.filter(c => c.creator !== user.username);
      localStorage.setItem('communities', JSON.stringify(communities));

      // Rimuovi utente da sessionStorage
      sessionStorage.removeItem('utente');

      // Notifica e redirect
      mostraTost("Account eliminato con successo.");
      setTimeout(() => window.location.href = "login.html", 1500);
    });
  }

});

function mostraTost(message) {
  const toastEl = document.getElementById('sn4mToast');
  const toastMessage = document.getElementById('toastMessage');
  if (!toastEl || !toastMessage) return;

  toastMessage.textContent = message;
  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}
