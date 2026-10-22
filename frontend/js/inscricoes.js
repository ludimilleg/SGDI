// SGDI | inscricoes.js: lista de inscrições do processo, com legenda e busca

// Processo aberto (sem processo, o dados.js manda de volta pra tela de importar)
const processo = abrirProcessoAtual();

// Pega os elementos da página pelo id
const tituloProcesso = document.getElementById("titulo-processo");
const subtituloProcesso = document.getElementById("subtitulo-processo");
const grade = document.getElementById("grade-inscricoes");
const busca = document.getElementById("busca");
const buscaVazia = document.getElementById("busca-vazia");

// Classe do cartão e texto da situação pra cada estado da inscrição
const APARENCIA = {
  DEFERIDA: { classe: "ok", texto: "Documentos OK" },          // cartão verde
  INDEFERIDA: { classe: "pendente", texto: "Com pendência" },  // cartão vermelho
  PENDENTE: { classe: "", texto: "A revisar" }                 // cartão branco
};

// Monta o título e um cartão para cada inscrição do .zip
function mostrarInscricoes()
{
  document.title = processo.nome + " | SGDI";  // nome do processo na aba do navegador
  tituloProcesso.textContent = processo.nome;
  subtituloProcesso.textContent =  // ex.: 12 inscrições importadas de mestrado.zip em 20/10/2026.
    plural(processo.inscricoes.length, "inscrição importada", "inscrições importadas") +
    " de " + processo.arquivoZip + " em " + formatarData(processo.dataCriacao) + ".";

  // Quantas inscrições em cada estado, pra legenda
  const contagem = { DEFERIDA: 0, INDEFERIDA: 0, PENDENTE: 0 };

  processo.inscricoes.forEach(function (inscricao, posicao)
  {
    // Situação da inscrição e quantos documentos já foram avaliados
    const estado = estadoInscricao(inscricao);
    const avaliados = contarAvaliados(inscricao);
    contagem[estado]++;

    // Cartão novo a partir do template, com link pra tela da inscrição
    const cartao = copiarModelo("modelo-inscricao");
    cartao.href = "inscricao.html?i=" + posicao;  // ?i= é a posição da inscrição na lista

    // A revisar não tem classe, o cartão fica branco
    if (APARENCIA[estado].classe)
    {
      cartao.classList.add(APARENCIA[estado].classe);
    }
    cartao.querySelector(".inscricao-numero").textContent = inscricao.numero;
    cartao.querySelector(".inscricao-candidato").textContent = inscricao.candidato;

    // Texto da situação e o detalhe que vai embaixo dela
    let status = APARENCIA[estado].texto;
    let detalhe = "";
    const faltam = inscricao.documentos.length - avaliados;  // documentos ainda sem avaliação
    const pendencias = contarPendencias(inscricao);          // documentos Não OK

    // Revisão começada: mostra quantos documentos já foram avaliados
    if (estado === "PENDENTE" && avaliados > 0)
    {
      status = "Em revisão: " + avaliados + " de " + inscricao.documentos.length;
    }

    // Com pendência e ainda com documento a revisar
    if (estado === "INDEFERIDA" && faltam > 0)
    {
      detalhe = plural(pendencias, "pendência", "pendências") + " · " +
        plural(faltam, "documento a revisar", "documentos a revisar");
    }

    // Com pendência e todos os documentos já avaliados
    else if (estado === "INDEFERIDA")
    {
      detalhe = "Revisão concluída com " + plural(pendencias, "pendência", "pendências");
    }

    // Escreve a situação e o detalhe no cartão (detalhe vazio some pelo CSS)
    cartao.querySelector(".inscricao-status").textContent = status;
    cartao.querySelector(".inscricao-detalhe").textContent = detalhe;

    // Número e nome sem acento, guardados no cartão pra busca
    cartao.dataset.busca = normalizar(inscricao.numero + " " + inscricao.candidato);
    grade.appendChild(cartao);
  });

  // Contagem da legenda
  document.getElementById("conta-ok").textContent = contagem.DEFERIDA;
  document.getElementById("conta-pendente").textContent = contagem.INDEFERIDA;
  document.getElementById("conta-revisar").textContent = contagem.PENDENTE;
}

// Busca: a cada letra digitada, esconde os cartões que não batem
busca.addEventListener("input", function ()
{
  const termo = normalizar(busca.value.trim());  // sem acento, igual ao que foi guardado no cartão
  let visiveis = 0;

  grade.querySelectorAll(".inscricao").forEach(function (cartao)
  {
    const aparece = cartao.dataset.busca.includes(termo);
    cartao.hidden = !aparece;  // esconde o que não bate
    if (aparece)
    {
      visiveis++;
    }
  });

  // Nenhum cartão aparecendo: mostra a frase de busca vazia
  buscaVazia.hidden = visiveis > 0;
});

// Só monta a tela se achou o processo
if (processo)
{
  mostrarInscricoes();
}
