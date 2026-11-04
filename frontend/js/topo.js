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

// Menu que o botão das três linhas abre
// Abrir, fechar, clicar fora e apertar Esc agora ficam por conta do dropdown do Bootstrap
const menu = document.getElementById("menu");

// Marca no menu o link da tela que está aberta
const paginaAtual = window.location.pathname.split("/").pop() || "index.html";  // nome do arquivo no fim do endereço
menu.querySelectorAll("a").forEach(function (link)
{
  if (link.getAttribute("href") === paginaAtual)
  {
    link.classList.add("active");                // classe do Bootstrap pro item atual do menu
    link.setAttribute("aria-current", "page");  // avisa o leitor de tela que é a página aberta
  }
});

// Aviso que aparece no pé da tela depois de uma ação (usado pelas outras telas)
// Agora é um toast do Bootstrap: ele cuida de aparecer, esperar e sumir
function mostrarAviso(texto)
{
  // Caixa do aviso (toast) com o texto dentro (toast-body)
  const aviso = document.createElement("div");
  aviso.className = "toast aviso";      // toast do Bootstrap + posição e cores do .aviso no base.css
  aviso.setAttribute("role", "status");  // leitor de tela lê o aviso sem interromper a pessoa
  const corpo = document.createElement("div");
  corpo.className = "toast-body";
  corpo.textContent = texto;
  aviso.appendChild(corpo);
  document.body.appendChild(aviso);

  // Liga o toast: some sozinho depois de 2,5 segundos e, quando sumir, sai da página
  const toast = new bootstrap.Toast(aviso, { delay: 2500 });
  aviso.addEventListener("hidden.bs.toast", function ()
  {
    aviso.remove();
  });
  toast.show();
}

// Passando o mouse nas iniciais, mostra o e-mail e, embaixo, o cargo da pessoa
if (email)
{
  iniciais.title = email + "\n" + pegarCargo(email);  // pegarCargo fica no dados.js
}
