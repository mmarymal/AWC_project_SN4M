document.addEventListener('DOMContentLoaded', function () {
  const form = document.querySelector('form'); //selezione form nella pagina
  if (form) { //controllo se il form esiste
    form.addEventListener('submit', registrazione);
  } else {
    console.warn("Attenzione: Il form non è stato trovato nella pagina.");
  }
});

//funzione chiamata al submit del form
function registrazione(event) {
  event.preventDefault(); 

  //recupera utenti 
  let utenti = JSON.parse(localStorage.getItem('utenti'));
  if (!Array.isArray(utenti)) {
    utenti = [];
  }

  //recupera dati dal form
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const checkpassword = document.getElementById("checkpassword").value.trim();
  const preferences = document.getElementById("preferences").value.trim();
  const artists = document.getElementById("artists").value.trim();

  //oggetto utente
  const nuovoUser = {
    username,
    email,
    password,
    preferences,
    artists: artists.split(",").map(artist => artist.trim())
  };

  // controllo se esiste utente con stessa email
  if (utenti.some(utente => utente.email === nuovoUser.email)) {
    showToast("Utente già registrato con questa email.", "warning");
    return;
  }

  //controllo se password coincidono
  if (password !== checkpassword) {
    showToast("Le password non corrispondono.", "danger");
    return;
  }

  utenti.push(nuovoUser);
  localStorage.setItem('utenti', JSON.stringify(utenti));

  //pulisce sessione e salva utente
  sessionStorage.clear();
  sessionStorage.setItem('utente', JSON.stringify(nuovoUser));

  showToast("Registrazione completata!", "success");
  setTimeout(() => window.location.href = "home.html", 1500);
}

//funzione per mostrare toast
function showToast(messaggio, tipo = 'success') {
  const toastEl = document.getElementById('sn4mToast');
  const toastBody = document.getElementById('toastMessage');

  toastBody.textContent = messaggio;
  toastEl.className = `toast align-items-center text-white bg-${tipo} border-0`;

  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}
