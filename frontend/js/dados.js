const TIPOS_DOCUMENTO = [
  { nome: "RG ou CNH", palavras: ["rg", "cnh", "identidade"] },
  { nome: "CPF", palavras: ["cpf"] },
  { nome: "Comprovante de residência", palavras: ["residencia", "endereco"] },
  { nome: "Diploma da graduação", palavras: ["diploma", "certidao", "conclusao"] },
  { nome: "Histórico escolar", palavras: ["historico"] },
  { nome: "Currículo Lattes", palavras: ["lattes", "curriculo"] },
  { nome: "Pré-projeto de pesquisa", palavras: ["projeto"] },
  { nome: "Declaração de cópias autênticas", palavras: ["declaracao", "anexo"] }
];

function normalizar(texto) {
  return texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function identificarTipo(nomeArquivo) {
  const palavrasDoArquivo = normalizar(nomeArquivo).split(/[^a-z0-9]+/);
  const tipo = TIPOS_DOCUMENTO.find(function (tipo) {
    return tipo.palavras.some(function (palavra) {
      return palavrasDoArquivo.includes(palavra);
    });
  });
  return tipo ? tipo.nome : null;
}

function lerProcessos() {
  return JSON.parse(localStorage.getItem("sgdiProcessos") || "[]");
}

function salvarProcesso(processo) {
  const outros = lerProcessos().filter(function (item) {
    return item.id !== processo.id;
  });
  localStorage.setItem("sgdiProcessos", JSON.stringify([processo].concat(outros)));
}

function abrirProcessoAtual() {
  const idNaUrl = new URLSearchParams(window.location.search).get("p");
  if (idNaUrl) {
    localStorage.setItem("sgdiProcessoAtual", idNaUrl);
  }
  const id = localStorage.getItem("sgdiProcessoAtual");
  const processo = lerProcessos().find(function (item) {
    return item.id === id;
  });
  if (!processo) {
    window.location.replace("importar.html");
    return null;
  }
  return processo;
}

function estadoInscricao(inscricao) {
  const resultados = inscricao.documentos.map(function (documento) {
    return documento.resultado;
  });
  if (resultados.includes("NAO_OK")) {
    return "INDEFERIDA";
  }
  if (resultados.length > 0 && resultados.every(function (resultado) { return resultado === "OK"; })) {
    return "DEFERIDA";
  }
  return "PENDENTE";
}

function contarAvaliados(inscricao) {
  return inscricao.documentos.filter(function (documento) {
    return documento.resultado !== null;
  }).length;
}

function plural(quantidade, singular, varios) {
  return quantidade + " " + (quantidade === 1 ? singular : varios);
}

function juntarLista(itens) {
  if (itens.length <= 1) {
    return itens.join("");
  }
  return itens.slice(0, -1).join(", ") + " e " + itens[itens.length - 1];
}

function formatarData(dataIso) {
  return new Date(dataIso).toLocaleDateString("pt-BR");
}

function copiarModelo(id) {
  return document.getElementById(id).content.firstElementChild.cloneNode(true);
}

function abrirBanco() {
  return new Promise(function (resolver, rejeitar) {
    const pedido = indexedDB.open("sgdi", 1);
    pedido.onupgradeneeded = function () {
      pedido.result.createObjectStore("zips");
    };
    pedido.onsuccess = function () {
      resolver(pedido.result);
    };
    pedido.onerror = function () {
      rejeitar(pedido.error);
    };
  });
}

async function guardarZip(idProcesso, arquivo) {
  const banco = await abrirBanco();
  return new Promise(function (resolver, rejeitar) {
    const transacao = banco.transaction("zips", "readwrite");
    transacao.objectStore("zips").put(arquivo, idProcesso);
    transacao.oncomplete = resolver;
    transacao.onerror = function () {
      rejeitar(transacao.error);
    };
  });
}

async function lerZip(idProcesso) {
  const banco = await abrirBanco();
  return new Promise(function (resolver, rejeitar) {
    const pedido = banco.transaction("zips").objectStore("zips").get(idProcesso);
    pedido.onsuccess = function () {
      resolver(pedido.result);
    };
    pedido.onerror = function () {
      rejeitar(pedido.error);
    };
  });
}
