// SGDI | topo.js: barra do topo das telas internas (iniciais do usuário, menu e avisos)

// Bolinha das iniciais e e-mail de quem entrou
const iniciais = document.getElementById("iniciais");
const email = sessionStorage.getItem("emailUsuario");  // salvo no login

// Monta as iniciais a partir do e-mail (ex.: ana.lima@ic.ufal.br vira AL)
if (email)
{
  // Pega a parte antes do @ e quebra no ponto, no _ e no hífen
  const partes = email.split("@")[0].split(/[._-]/).filter(function (p)
  {
    return p !== "";  // descarta pedaços vazios
  });
  let letras = partes[0][0];  // primeira letra do primeiro pedaço
  if (partes.length > 1)
  {
    letras += partes[1][0];  // + primeira letra do segundo
  }

  iniciais.textContent = letras.toUpperCase();  // escreve as iniciais na bolinha
  iniciais.title = email;                       // passando o mouse, mostra o e-mail
}

// Ao sair, esquece o usuário
document.querySelector(".topo-sair").addEventListener("click", function ()
{
  sessionStorage.removeItem("emailUsuario");
});

// Botão das três linhas e o menu que ele abre
const botaoMenu = document.getElementById("botao-menu");
const menu = document.getElementById("menu");

// Marca no menu o link da tela que está aberta
const paginaAtual = window.location.pathname.split("/").pop() || "index.html";  // nome do arquivo no fim do endereço
menu.querySelectorAll("a").forEach(function (link)
{
  if (link.getAttribute("href") === paginaAtual)
  {
    link.classList.add("atual");
  }
});

// Clique no botão: abre ou fecha o menu
botaoMenu.addEventListener("click", function (evento)
{
  evento.stopPropagation();    // o clique não chega no documento (que fecharia o menu)
  menu.hidden = !menu.hidden;  // inverte: aberto fecha, fechado abre
});

// Clique dentro do menu não fecha o menu
menu.addEventListener("click", function (evento)
{
  evento.stopPropagation();
});

// Clique em qualquer outro lugar da tela fecha o menu
document.addEventListener("click", function ()
{
  menu.hidden = true;
});

// Esc também fecha o menu
document.addEventListener("keydown", function (evento)
{
  if (evento.key === "Escape")
  {
    menu.hidden = true;
  }
});

// Aviso que aparece no pé da tela depois de uma ação (usado pelas outras telas)
function mostrarAviso(texto)
{
  const aviso = document.createElement("div");
  aviso.className = "aviso";  // estilo .aviso do base.css
  aviso.textContent = texto;
  document.body.appendChild(aviso);
  setTimeout(function ()
  {
    aviso.remove();  // some sozinho...
  }, 2500);          // ...depois de 2,5 segundos
}

// Passando o mouse nas iniciais, mostra o e-mail e, embaixo, o cargo da pessoa
if (email)
{
  iniciais.title = email + "\n" + pegarCargo(email);  // pegarCargo fica no dados.js
}
