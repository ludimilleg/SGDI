// SGDI | acessos.js: pessoas com acesso ao processo, criar e remover acesso e distribuir as inscrições

// Processo aberto (sem processo, o dados.js manda de volta pra tela de importar)
const processo = abrirProcessoAtual();

// Pega os elementos da página pelo id
const listaPessoas = document.getElementById("lista-pessoas");
const confirmacao = document.getElementById("confirmacao");
const janelaConfirmacao = new bootstrap.Modal(confirmacao);  // liga a janela (modal) do Bootstrap
const confirmacaoNome = document.getElementById("confirmacao-nome");
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
const botaoDistribuir = document.getElementById("botao-distribuir");
const resumoDistribuicao = document.getElementById("resumo-distribuicao");

// Pessoa e cartão que vão ser removidos (enquanto a janela de confirmação está aberta)
let pessoaParaRemover = null;
let cartaoParaRemover = null;

// Distribui as inscrições entre quem tem cargo de banca ou comissão avaliadora
// Vai uma pra cada avaliador, em rodízio, e devolve quantos avaliadores entraram
function distribuirInscricoesLocal()
{
  const avaliadores = processo.acessos.filter(function (pessoa)
  {
    const cargo = normalizar(pessoa.cargo || "");  // sem acento e em minúsculas, pra comparar
    return cargo.includes("banca avaliadora") || cargo.includes("comissao avaliadora");
  });

  // O resto da divisão faz o rodízio: 1º avaliador, 2º, 3º, volta pro 1º...
  processo.inscricoes.forEach(function (inscricao, indice)
  {
    inscricao.avaliadorEmail = avaliadores.length > 0
      ? avaliadores[indice % avaliadores.length].email.toLowerCase()
      : "";  // sem avaliador, a inscrição fica sem ninguém
  });

  return avaliadores.length;
}

// Refaz a distribuição e o resumo depois que alguém entra ou sai
// Só faz isso se a distribuição já foi ligada pelo botão
function atualizarDistribuicaoLocal()
{
  if (!processo.distribuicaoAtiva)
  {
    return;
  }

  const quantidadeAvaliadores = distribuirInscricoesLocal();
  resumoDistribuicao.textContent = quantidadeAvaliadores > 0
    ? processo.inscricoes.length + " inscrições distribuídas entre " +
    quantidadeAvaliadores + " avaliadores."
    : "Cadastre pelo menos um membro da banca avaliadora.";
  salvarProcesso(processo);
}

// Iniciais pelo nome: primeira letra do primeiro e do último nome (Ana Beatriz Lima vira AL)
function pegarIniciais(nome)
{
  const partes = nome.split(" ").filter(function (parte)
  {
    return parte !== "";  // descarta espaços repetidos
  });
  let letras = partes[0][0];
  if (partes.length > 1)
  {
    letras += partes[partes.length - 1][0];
  }
  return letras.toUpperCase();
}

// Monta o cartão de uma pessoa a partir do template do HTML
function montarPessoa(nome, email, papel, iniciais)
{
  const cartao = copiarModelo("modelo-pessoa");
  cartao.querySelector(".pessoa-iniciais").textContent = iniciais;
  cartao.querySelector(".pessoa-nome").textContent = nome;
  cartao.querySelector(".pessoa-email").textContent = email;
  cartao.querySelector(".pessoa-papel").textContent = papel;
  return cartao;
}

// Mostra a lista: primeiro as pessoas cadastradas, por último você
function mostrarPessoas()
{
  listaPessoas.innerHTML = "";  // limpa a lista antes de montar de novo

  processo.acessos.forEach(function (pessoa)
  {
    // Cargo cadastrado (acessos antigos, sem cargo, aparecem como Banca Avaliadora)
    const cartao = montarPessoa(pessoa.nome, pessoa.email, pessoa.cargo || "Banca Avaliadora", pegarIniciais(pessoa.nome));

    // Remover: abre a janela de confirmação
    cartao.querySelector(".pessoa-remover").addEventListener("click", function ()
    {
      abrirConfirmacao(cartao, pessoa);
    });
    listaPessoas.appendChild(cartao);
  });

  // Você: quem entrou no sistema, como gerente do processo
  const emailUsuario = sessionStorage.getItem("emailUsuario") || "Usuário sem login";
  const voce = montarPessoa("Você", emailUsuario, "Gerente do processo", document.getElementById("iniciais").textContent);
  voce.querySelector(".pessoa-remover").remove();  // não dá pra remover o próprio acesso
  listaPessoas.appendChild(voce);
}

// Abre a janela de confirmação e marca o cartão de vermelho
function abrirConfirmacao(cartao, pessoa)
{
  pessoaParaRemover = pessoa;
  cartaoParaRemover = cartao;
  cartao.classList.add("removendo");
  confirmacaoNome.textContent = pessoa.nome;
  janelaConfirmacao.show();  // abre a janela
}

// Toda vez que a janela termina de fechar, desmarca o cartão
// Vale pro Cancelar, pro Esc, pro clique fora e pro Remover, porque o Bootstrap avisa com o evento hidden.bs.modal
confirmacao.addEventListener("hidden.bs.modal", function ()
{
  if (cartaoParaRemover)
  {
    cartaoParaRemover.classList.remove("removendo");
  }
  pessoaParaRemover = null;
  cartaoParaRemover = null;
});

// Remover de vez: tira a pessoa dos acessos, salva e atualiza a lista
botaoConfirmar.addEventListener("click", function ()
{
  const nome = pessoaParaRemover.nome;  // guarda o nome antes de fechar a janela
  processo.acessos = processo.acessos.filter(function (pessoa)
  {
    return pessoa !== pessoaParaRemover;
  });
  atualizarDistribuicaoLocal();  // redistribui sem a pessoa removida
  salvarProcesso(processo);
  janelaConfirmacao.hide();  // fecha a janela
  mostrarPessoas();
  mostrarAviso("Acesso de " + nome + " removido.");
});

// Funções que mostram e limpam o erro de um campo (iguais às do login)
function mostrarErro(campo, areaErro, mensagem)
{
  areaErro.textContent = mensagem;    // escreve a mensagem
  campo.classList.add("is-invalid");  // classe do Bootstrap: borda vermelha e mostra o invalid-feedback
}

function limparErro(campo, areaErro)
{
  areaErro.textContent = "";
  campo.classList.remove("is-invalid");
}

// Quando a pessoa clica em CRIAR ACESSO
formAcesso.addEventListener("submit", function (evento)
{
  evento.preventDefault();  // não deixa a página recarregar

  const nome = campoNovoNome.value.trim();
  const email = campoNovoEmail.value.trim().toLowerCase();  // e-mail sempre em minúsculas
  const cargo = campoNovoCargo.value.trim();
  const senha = campoNovaSenha.value;

  // Confere se esse e-mail já tem acesso a este processo
  const jaTemAcesso = processo.acessos.some(function (pessoa)
  {
    return pessoa.email === email;
  });
  let tudoCerto = true;

  // Confere o nome
  if (nome === "")
  {
    mostrarErro(campoNovoNome, erroNovoNome, "Informe o nome da pessoa.");
    tudoCerto = false;
  }
  else
  {
    limparErro(campoNovoNome, erroNovoNome);
  }

  // Confere o e-mail
  if (!email.includes("@") || !email.includes("."))
  {
    mostrarErro(campoNovoEmail, erroNovoEmail, "Digite um e-mail válido, como nome@ic.ufal.br.");
    tudoCerto = false;
  }
  else if (jaTemAcesso)
  {
    mostrarErro(campoNovoEmail, erroNovoEmail, "Essa pessoa já tem acesso a este processo.");
    tudoCerto = false;
  }
  else
  {
    limparErro(campoNovoEmail, erroNovoEmail);
  }

  // Confere o cargo
  if (cargo === "")
  {
    mostrarErro(campoNovoCargo, erroNovoCargo, "Descreva o cargo que a pessoa vai exercer.");
    tudoCerto = false;
  }
  else
  {
    limparErro(campoNovoCargo, erroNovoCargo);
  }

  // Confere a senha
  if (senha.length < 8)
  {
    mostrarErro(campoNovaSenha, erroNovaSenha, "A senha precisa ter pelo menos 8 caracteres.");
    tudoCerto = false;
  }
  else
  {
    limparErro(campoNovaSenha, erroNovaSenha);
  }

  // Algum campo com erro: para aqui
  if (!tudoCerto)
  {
    return;
  }

  // Tudo certo: guarda a pessoa, limpa o formulário e atualiza a lista
  processo.acessos.push({ nome: nome, email: email, cargo: cargo });
  atualizarDistribuicaoLocal();  // redistribui contando a pessoa nova
  salvarProcesso(processo);
  formAcesso.reset();  // limpa os campos
  mostrarPessoas();
  mostrarAviso("Acesso criado para " + nome + ".");
});

// Botão Distribuir inscrições: liga a distribuição e mostra o resumo
botaoDistribuir.addEventListener("click", function ()
{
  const quantidadeAvaliadores = distribuirInscricoesLocal();

  // Ninguém da banca cadastrado: avisa e não liga a distribuição
  if (quantidadeAvaliadores === 0)
  {
    mostrarAviso("Cadastre alguém com cargo de banca ou comissão avaliadora antes de distribuir.");
    return;
  }

  processo.distribuicaoAtiva = true;  // daqui pra frente, entrar ou sair alguém redistribui sozinho
  salvarProcesso(processo);
  atualizarDistribuicaoLocal();
  mostrarAviso("Inscrições distribuídas entre " + quantidadeAvaliadores + " avaliadores.");
});

// Escreve o nome do processo na tela e mostra a lista
if (processo)
{
  document.getElementById("subtitulo-acessos").textContent =
    "Pessoas que podem abrir e revisar o processo " + processo.nome + ".";
  document.getElementById("confirmacao-processo").textContent = processo.nome;  // nome do processo na janela
  mostrarPessoas();

  // Distribuição já ligada antes: mostra o resumo de novo
  if (processo.distribuicaoAtiva)
  {
    atualizarDistribuicaoLocal();
  }
}
