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

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    mostraToast("Inserisci sia email che password.", "warning");
    return;
  }

  let utenti;
  try {
    utenti = JSON.parse(localStorage.getItem('utenti')) || [];
  } catch (error) {
    console.error("Errore durante il parsing del localStorage:", error);
    mostraToast("Errore interno. Riprova più tardi.", "danger");
    return;
  }

  if (!Array.isArray(utenti) || utenti.length === 0) {
    mostraToast("Nessun utente registrato. Registrati prima di effettuare il login.", "warning");
    return;
  }

  const found = utenti.find(utente => utente.email === email && utente.password === password);

  if (found) {
    sessionStorage.clear();
    sessionStorage.setItem('utente', JSON.stringify(found));
    mostraToast(`Benvenuto ${found.username}!`, "success");
    setTimeout(() => window.location.href = "home.html", 1500);
  } else {
    mostraToast("Email o password errate. Riprova.", "danger");
  }
}

function logoutUser() {
  sessionStorage.removeItem("utente");
  mostraToast("Hai effettuato il logout!", "info");
  setTimeout(() => window.location.href = "login.html", 1500);
}

function mostraToast(messaggio, tipo = 'success') {
  const toastEl = document.getElementById('sn4mToast');
  const toastBody = document.getElementById('toastMessage');

  toastBody.textContent = messaggio;
  toastEl.className = `toast align-items-center text-white bg-${tipo} border-0`;

  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}
