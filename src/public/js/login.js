// src/public/js/login.js

// ano no rodapé
const yearSpan = document.getElementById('yearSpan');
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

// toggle de senha
const toggleBtn = document.querySelector('.toggle-password');
const senhaInput = document.getElementById('senha');

if (toggleBtn && senhaInput) {
  toggleBtn.addEventListener('click', () => {
    const tipo = senhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
    senhaInput.setAttribute('type', tipo);
  });
}