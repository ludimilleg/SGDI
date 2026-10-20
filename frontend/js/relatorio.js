const processo = abrirProcessoAtual();
const CAMPOS_CABECALHO = ["instituicao", "edital", "descricao"];

function montarRelatorio() {
  const deferidas = [];
  const indeferidas = [];
  let pendentes = 0;

  processo.inscricoes.forEach(function (inscricao) {
    const estado = estadoInscricao(inscricao);
    if (estado === "DEFERIDA") {
      deferidas.push(inscricao.numero);
    } else if (estado === "INDEFERIDA") {
      indeferidas.push(inscricao);
    } else {
      pendentes++;
    }
  });

  document.getElementById("subtitulo-relatorio").textContent =
    processo.nome + ": " +
    plural(deferidas.length, "deferida", "deferidas") + ", " +
    plural(indeferidas.length, "indeferida", "indeferidas") + ", " +
    plural(pendentes, "pendente", "pendentes") + ".";

  const alerta = document.getElementById("alerta-pendentes");
  alerta.hidden = pendentes === 0;
  alerta.textContent = "Ainda falta revisar " + plural(pendentes, "inscrição", "inscrições") +
    ". Elas ficam fora do relatório até terem todos os documentos avaliados.";

  document.getElementById("lista-deferidas").textContent =
    deferidas.length > 0 ? juntarLista(deferidas) + "." : "Nenhuma inscrição deferida.";

  const tabela = document.getElementById("tabela-indeferidas");
  tabela.innerHTML = "";

  if (indeferidas.length === 0) {
    const linha = tabela.insertRow();
    const celula = linha.insertCell();
    celula.colSpan = 2;
    celula.textContent = "Nenhuma inscrição indeferida.";
  }

  indeferidas.forEach(function (inscricao) {
    const motivos = inscricao.documentos
      .filter(function (documento) {
        return documento.resultado === "NAO_OK";
      })
      .map(function (documento) {
        return (documento.tipo || documento.arquivo) + ": " + documento.observacao.trim().replace(/\.$/, "");
      });

    const linha = tabela.insertRow();
    linha.insertCell().textContent = inscricao.numero;
    linha.insertCell().textContent = motivos.join("; ") + ".";
  });
}

CAMPOS_CABECALHO.forEach(function (campo) {
  const entrada = document.getElementById(campo);
  const destino = document.getElementById("previa-" + campo);
  entrada.addEventListener("input", function () {
    destino.textContent = entrada.value;
    processo[campo] = entrada.value;
    salvarProcesso(processo);
  });
});

document.getElementById("botao-imprimir").addEventListener("click", function () {
  window.print();
});

document.getElementById("botao-pdf").addEventListener("click", function () {
  mostrarAviso("Escolha \"Salvar como PDF\" na janela de impressão.");
  setTimeout(function () {
    window.print();
  }, 600);
});

document.getElementById("botao-word").addEventListener("click", function () {
  const previa = document.getElementById("previa").cloneNode(true);
  const estilo =
    "<style>body{font-family:Arial,sans-serif;color:#1F2A44}" +
    ".previa-topo{text-align:center}.previa-brasao{display:none}" +
    "table{border-collapse:collapse;width:100%}th,td{border:1px solid #B7CDED;padding:8px;text-align:left}" +
    "th{background:#E6F0FA}</style>";
  const conteudo = "<html><head><meta charset='UTF-8'>" + estilo + "</head><body>" + previa.innerHTML + "</body></html>";
  const arquivo = new Blob(["﻿", conteudo], { type: "application/msword" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(arquivo);
  link.download = "relatorio-homologacao.doc";
  link.click();
  setTimeout(function () {
    URL.revokeObjectURL(link.href);
  }, 1000);
  mostrarAviso("Relatório em Word baixado.");
});

document.getElementById("botao-jpeg").addEventListener("click", async function () {
  const imagem = await html2canvas(document.getElementById("previa"), { scale: 2, backgroundColor: "#FFFFFF" });
  const link = document.createElement("a");
  link.href = imagem.toDataURL("image/jpeg", 0.92);
  link.download = "relatorio-homologacao.jpg";
  link.click();
  mostrarAviso("Relatório em JPEG baixado.");
});

if (processo) {
  CAMPOS_CABECALHO.forEach(function (campo) {
    document.getElementById(campo).value = processo[campo];
    document.getElementById("previa-" + campo).textContent = processo[campo];
  });
  montarRelatorio();
}
