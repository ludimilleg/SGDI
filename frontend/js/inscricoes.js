const processo = abrirProcessoAtual();
const tituloProcesso = document.getElementById("titulo-processo");
const subtituloProcesso = document.getElementById("subtitulo-processo");
const grade = document.getElementById("grade-inscricoes");
const busca = document.getElementById("busca");
const buscaVazia = document.getElementById("busca-vazia");

const APARENCIA = {
  DEFERIDA: { classe: "ok", texto: "Documentos OK" },
  INDEFERIDA: { classe: "pendente", texto: "Com pendência" },
  PENDENTE: { classe: "", texto: "A revisar" }
};

function mostrarInscricoes() {
  document.title = processo.nome + " | SGDI";
  tituloProcesso.textContent = processo.nome;
  subtituloProcesso.textContent =
    plural(processo.inscricoes.length, "inscrição importada", "inscrições importadas") +
    " de " + processo.arquivoZip + " em " + formatarData(processo.dataCriacao) + ".";

  const contagem = { DEFERIDA: 0, INDEFERIDA: 0, PENDENTE: 0 };

  processo.inscricoes.forEach(function (inscricao, posicao) {
    const estado = estadoInscricao(inscricao);
    const avaliados = contarAvaliados(inscricao);
    contagem[estado]++;

    const cartao = copiarModelo("modelo-inscricao");
    cartao.href = "inscricao.html?i=" + posicao;
    if (APARENCIA[estado].classe) {
      cartao.classList.add(APARENCIA[estado].classe);
    }
    cartao.querySelector(".inscricao-numero").textContent = inscricao.numero;
    cartao.querySelector(".inscricao-candidato").textContent = inscricao.candidato;

    let status = APARENCIA[estado].texto;
    let detalhe = "";
    const faltam = inscricao.documentos.length - avaliados;
    const pendencias = contarPendencias(inscricao);

    if (estado === "PENDENTE" && avaliados > 0) {
      status = "Em revisão: " + avaliados + " de " + inscricao.documentos.length;
    }

    if (estado === "INDEFERIDA" && faltam > 0) {
      detalhe = plural(pendencias, "pendência", "pendências") + " · " +
        plural(faltam, "documento a revisar", "documentos a revisar");
    } else if (estado === "INDEFERIDA") {
      detalhe = "Revisão concluída com " + plural(pendencias, "pendência", "pendências");
    }

    cartao.querySelector(".inscricao-status").textContent = status;
    cartao.querySelector(".inscricao-detalhe").textContent = detalhe;

    cartao.dataset.busca = normalizar(inscricao.numero + " " + inscricao.candidato);
    grade.appendChild(cartao);
  });

  document.getElementById("busca-vazia").hidden = true;
  document.getElementById("conta-ok").textContent = contagem.DEFERIDA;
  document.getElementById("conta-pendente").textContent = contagem.INDEFERIDA;
  document.getElementById("conta-revisar").textContent = contagem.PENDENTE;
}

busca.addEventListener("input", function () {
  if (grade.children.length === 0) {
    buscaVazia.hidden = true;
    return;
  }
  const termo = normalizar(busca.value.trim());
  let visiveis = 0;

  grade.querySelectorAll(".inscricao").forEach(function (cartao) {
    const aparece = cartao.dataset.busca.includes(termo);
    cartao.hidden = !aparece;
    if (aparece) {
      visiveis++;
    }
  });

  buscaVazia.hidden = visiveis > 0;
});

if (processo) {
  mostrarInscricoes();
}
