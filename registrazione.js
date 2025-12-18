document.addEventListener('DOMContentLoaded', function () {
  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', registrazione);
  } else {
    console.warn("Attenzione: Il form non è stato trovato nella pagina.");
  }
});

function registrazione(event) {
  event.preventDefault();

  let utenti = JSON.parse(localStorage.getItem('utenti'));
  if (!Array.isArray(utenti)) {
    utenti = [];
  }

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const checkpassword = document.getElementById("checkpassword").value.trim();
  const preferences = document.getElementById("preferences").value.trim();
  const artists = document.getElementById("artists").value.trim();

  const nuovoUser = {
    username,
    email,
    password,
    preferences,
    artists: artists.split(",").map(artist => artist.trim())
  };

  if (utenti.some(utente => utente.email === nuovoUser.email)) {
    mostraToast("Utente già registrato con questa email.", "warning");
    return;
  }

  if (password !== checkpassword) {
    mostraToast("Le password non corrispondono.", "danger");
    return;
  }

  utenti.push(nuovoUser);
  localStorage.setItem('utenti', JSON.stringify(utenti));
  sessionStorage.clear();
  sessionStorage.setItem('utente', JSON.stringify(nuovoUser));

  mostraToast("Registrazione completata!", "success");
  setTimeout(() => window.location.href = "home.html", 1500);
}

function mostraToast(messaggio, tipo = 'success') {
  const toastEl = document.getElementById('sn4mToast');
  const toastBody = document.getElementById('toastMessage');

  toastBody.textContent = messaggio;
  toastEl.className = `toast align-items-center text-white bg-${tipo} border-0`;

  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}
