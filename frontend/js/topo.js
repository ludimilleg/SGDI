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