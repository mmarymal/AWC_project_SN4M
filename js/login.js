document.addEventListener('DOMContentLoaded', function () {
  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', loginUser);
  } else {
    console.warn("Attenzione: Il form non è stato trovato nella pagina.");
  }
});

function loginUser(event) {
  event.preventDefault();

  // recupera email e password dai campi input, rimuovendo eventuali spazi
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  // controllo se uno dei due campi è vuoto e mostra avviso
  if (!email || !password) {
    showToast("Inserisci sia email che password.", "warning");
    return;
  }

  let utenti;
  try {
    //recupera lista utenti salvata nel localStorage e se non esiste inizializza array vuoto
    utenti = JSON.parse(localStorage.getItem('utenti')) || [];
  } catch (error) {
    // se JSON è corrotto o non leggibile, gestisce errore
    console.error("Errore durante il parsing del localStorage:", error);
    showToast("Errore interno. Riprova più tardi.", "danger");
    return;
  }

  // se non ci sono utenti registrati, avvisa utente
  if (!Array.isArray(utenti) || utenti.length === 0) {
    showToast("Nessun utente registrato. Registrati prima di effettuare il login.", "warning");
    return;
  }

  //cera un utente con email e password corrispondenti
  const found = utenti.find(utente => utente.email === email && utente.password === password);

  if (found) {
    // login riuscito: pulisce sessione e salva utente loggato
    sessionStorage.clear();
    sessionStorage.setItem('utente', JSON.stringify(found));

    showToast(`Benvenuto ${found.username}!`, "success");
    setTimeout(() => window.location.href = "home.html", 1500);
  } else {
    // login fallito: credenziali errate
    showToast("Email o password errate. Riprova.", "danger");
  }
}

function logoutUser() {
  sessionStorage.removeItem("utente");
  showToast("Hai effettuato il logout!", "info");
  setTimeout(() => window.location.href = "login.html", 1500);
}

function showToast(messaggio, tipo = 'success') {
  const toastEl = document.getElementById('sn4mToast');
  const toastBody = document.getElementById('toastMessage');

  toastBody.textContent = messaggio;
  toastEl.className = `toast align-items-center text-white bg-${tipo} border-0`;

  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}
