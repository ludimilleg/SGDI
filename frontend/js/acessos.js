const processo = abrirProcessoAtual();
const listaPessoas = document.getElementById("lista-pessoas");
const confirmacao = document.getElementById("confirmacao");
const confirmacaoNome = document.getElementById("confirmacao-nome");
const botaoCancelar = document.getElementById("botao-cancelar");
const botaoConfirmar = document.getElementById("botao-confirmar");
const formAcesso = document.getElementById("form-acesso");
const campoNovoNome = document.getElementById("novo-nome");
const campoNovoEmail = document.getElementById("novo-email");
const campoNovaSenha = document.getElementById("nova-senha");
const erroNovoNome = document.getElementById("erro-novo-nome");
const erroNovoEmail = document.getElementById("erro-novo-email");
const campoNovoCargo = document.getElementById("novo-cargo");
const erroNovoCargo = document.getElementById("erro-novo-cargo");
const erroNovaSenha = document.getElementById("erro-nova-senha");
let pessoaParaRemover = null;
let cartaoParaRemover = null;

function pegarIniciais(nome) {
  const partes = nome.split(" ").filter(function (parte) {
    return parte !== "";
  });
  let letras = partes[0][0];
  if (partes.length > 1) {
    letras += partes[partes.length - 1][0];
  }
  return letras.toUpperCase();
}

function montarPessoa(nome, email, papel, iniciais) {
  const cartao = copiarModelo("modelo-pessoa");
  cartao.querySelector(".pessoa-iniciais").textContent = iniciais;
  cartao.querySelector(".pessoa-nome").textContent = nome;
  cartao.querySelector(".pessoa-email").textContent = email;
  cartao.querySelector(".pessoa-papel").textContent = papel;
  return cartao;
}

function mostrarPessoas() {
  listaPessoas.innerHTML = "";

  processo.acessos.forEach(function (pessoa) {
    const cartao = montarPessoa(pessoa.nome, pessoa.email, pessoa.cargo || "Banca Avaliadora", pegarIniciais(pessoa.nome));
    cartao.querySelector(".pessoa-remover").addEventListener("click", function () {
      abrirConfirmacao(cartao, pessoa);
    });
    listaPessoas.appendChild(cartao);
  });

  const emailUsuario = sessionStorage.getItem("emailUsuario") || "Usuário sem login";
  const voce = montarPessoa("Você", emailUsuario, "Gerente do processo", document.getElementById("iniciais").textContent);
  voce.querySelector(".pessoa-remover").remove();
  listaPessoas.appendChild(voce);
}

function abrirConfirmacao(cartao, pessoa) {
  pessoaParaRemover = pessoa;
  cartaoParaRemover = cartao;
  cartao.classList.add("removendo");
  confirmacaoNome.textContent = pessoa.nome;
  confirmacao.hidden = false;
}

function fecharConfirmacao() {
  confirmacao.hidden = true;
  if (cartaoParaRemover) {
    cartaoParaRemover.classList.remove("removendo");
  }
  pessoaParaRemover = null;
  cartaoParaRemover = null;
}

botaoCancelar.addEventListener("click", fecharConfirmacao);

confirmacao.addEventListener("click", function (evento) {
  if (evento.target === confirmacao) {
    fecharConfirmacao();
  }
});

document.addEventListener("keydown", function (evento) {
  if (evento.key === "Escape" && !confirmacao.hidden) {
    fecharConfirmacao();
  }
});

botaoConfirmar.addEventListener("click", function () {
  const nome = pessoaParaRemover.nome;
  processo.acessos = processo.acessos.filter(function (pessoa) {
    return pessoa !== pessoaParaRemover;
  });
  salvarProcesso(processo);
  fecharConfirmacao();
  mostrarPessoas();
  mostrarAviso("Acesso de " + nome + " removido.");
});

function mostrarErro(campo, areaErro, mensagem) {
  areaErro.textContent = mensagem;
  campo.classList.add("campo-erro");
}

function limparErro(campo, areaErro) {
  areaErro.textContent = "";
  campo.classList.remove("campo-erro");
}

formAcesso.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const nome = campoNovoNome.value.trim();
  const email = campoNovoEmail.value.trim().toLowerCase();
  const cargo = campoNovoCargo.value.trim();
  const senha = campoNovaSenha.value;
  const jaTemAcesso = processo.acessos.some(function (pessoa) {
    return pessoa.email === email;
  });
  let tudoCerto = true;

  if (nome === "") {
    mostrarErro(campoNovoNome, erroNovoNome, "Informe o nome da pessoa.");
    tudoCerto = false;
  } else {
    limparErro(campoNovoNome, erroNovoNome);
  }

  if (!email.includes("@") || !email.includes(".")) {
    mostrarErro(campoNovoEmail, erroNovoEmail, "Digite um e-mail válido, como nome@ic.ufal.br.");
    tudoCerto = false;
  } else if (jaTemAcesso) {
    mostrarErro(campoNovoEmail, erroNovoEmail, "Essa pessoa já tem acesso a este processo.");
    tudoCerto = false;
  } else {
    limparErro(campoNovoEmail, erroNovoEmail);
  }

  if (cargo === "") {
    mostrarErro(campoNovoCargo, erroNovoCargo, "Descreva o cargo que a pessoa vai exercer.");
    tudoCerto = false;
  } else {
    limparErro(campoNovoCargo, erroNovoCargo);
  }


  if (senha.length < 8) {
    mostrarErro(campoNovaSenha, erroNovaSenha, "A senha precisa ter pelo menos 8 caracteres.");
    tudoCerto = false;
  } else {
    limparErro(campoNovaSenha, erroNovaSenha);
  }

  if (!tudoCerto) {
    return;
  }

  processo.acessos.push({ nome: nome, email: email, cargo: cargo });
  salvarProcesso(processo);
  formAcesso.reset();
  mostrarPessoas();
  mostrarAviso("Acesso criado para " + nome + ".");
});

if (processo) {
  document.getElementById("subtitulo-acessos").textContent =
    "Pessoas que podem abrir e revisar o processo " + processo.nome + ".";
  document.getElementById("confirmacao-processo").textContent = processo.nome;
  mostrarPessoas();
}
