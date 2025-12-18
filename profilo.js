document.addEventListener('DOMContentLoaded', function () {
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
    
    const updatedUser = {
      username: document.getElementById('username').value.trim(),
      email: document.getElementById('email').value.trim(),
      preferences: document.getElementById('preferences').value.trim(),
      artists: document.getElementById('artists').value.trim().split(',').map(a => a.trim()),
      password: user.password // manteniamo la password originale
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

});

function mostraTost(message) {
  const toastEl = document.getElementById('sn4mToast');
  const toastMessage = document.getElementById('toastMessage');
  if (!toastEl || !toastMessage) return;

  toastMessage.textContent = message;
  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}
