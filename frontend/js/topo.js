// SGDI | topo.js: iniciais do usuário logado na barra do topo

const iniciais = document.getElementById("iniciais");
const email = sessionStorage.getItem("emailUsuario"); // salvo no login

if (email) 
{
  const partes = email.split("@")[0].split(/[._-]/).filter(function (p) { return p !== ""; });
  let letras = partes[0][0]; // primeira letra do primeiro pedaço
  if (partes.length > 1) 
  {
    letras += partes[1][0]; // + primeira letra do segundo
  }

  iniciais.textContent = letras.toUpperCase();
  iniciais.title = email; // passando o mouse, mostra o e-mail
}

// Ao sair, esquece o usuário
document.querySelector(".topo-sair").addEventListener("click", function () 
{
  sessionStorage.removeItem("emailUsuario");
});

const botaoMenu = document.getElementById("botao-menu");
const menu = document.getElementById("menu");

const paginaAtual = window.location.pathname.split("/").pop() || "index.html";
menu.querySelectorAll("a").forEach(function (link) {
  if (link.getAttribute("href") === paginaAtual) {
    link.classList.add("atual");
  }
});

botaoMenu.addEventListener("click", function (evento) {
  evento.stopPropagation();
  menu.hidden = !menu.hidden;
});

menu.addEventListener("click", function (evento) {
  evento.stopPropagation();
});

document.addEventListener("click", function () {
  menu.hidden = true;
});

document.addEventListener("keydown", function (evento) {
  if (evento.key === "Escape") {
    menu.hidden = true;
  }
});

function mostrarAviso(texto) {
  const aviso = document.createElement("div");
  aviso.className = "aviso";
  aviso.textContent = texto;
  document.body.appendChild(aviso);
  setTimeout(function () {
    aviso.remove();
  }, 2500);
}
