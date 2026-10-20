const processo = abrirProcessoAtual();
const posicao = Number(new URLSearchParams(window.location.search).get("i"));
const inscricao = processo ? processo.inscricoes[posicao] : null;

const listaDocumentos = document.getElementById("documentos");
const resumoContagem = document.getElementById("resumo-contagem");
const botaoSalvar = document.getElementById("botao-salvar");

const TIPOS_ARQUIVO = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  txt: "text/plain"
};

function pintar(cartao, documento) {
  cartao.classList.toggle("ok", documento.resultado === "OK");
  cartao.classList.toggle("nao-ok", documento.resultado === "NAO_OK");
  cartao.classList.remove("sem-motivo");
}

function atualizarResumo() {
  let ok = 0;
  let naoOk = 0;
  inscricao.documentos.forEach(function (documento) {
    if (documento.resultado === "OK") {
      ok++;
    } else if (documento.resultado === "NAO_OK") {
      naoOk++;
    }
  });
  const semAvaliacao = inscricao.documentos.length - ok - naoOk;
  resumoContagem.textContent = ok + " OK · " + naoOk + " Não OK · " + semAvaliacao + " sem avaliação";
}

async function abrirDocumento(documento) {
  const janela = window.open("", "_blank");
  try {
    const zipGuardado = await lerZip(processo.id);
    const zip = await JSZip.loadAsync(zipGuardado);
    const conteudo = await zip.file(documento.caminho).async("blob");
    const extensao = documento.arquivo.split(".").pop().toLowerCase();
    const arquivo = new Blob([conteudo], { type: TIPOS_ARQUIVO[extensao] || "application/octet-stream" });
    janela.location.href = URL.createObjectURL(arquivo);
  } catch (erro) {
    if (janela) {
      janela.close();
    }
    mostrarAviso("Não consegui abrir " + documento.arquivo + ". Importe o .zip de novo neste navegador.");
  }
}

function montarDocumentos() {
  inscricao.documentos.forEach(function (documento, indice) {
    const cartao = copiarModelo("modelo-documento");
    const nome = cartao.querySelector(".documento-nome");
    const caixaMotivo = cartao.querySelector("textarea");

    nome.textContent = documento.tipo || documento.arquivo;
    cartao.querySelector(".documento-arquivo").textContent =
      documento.tipo ? documento.arquivo : "Tipo não identificado pelo nome do arquivo";
    cartao.querySelector("label").htmlFor = "motivo-" + indice;
    caixaMotivo.id = "motivo-" + indice;
    caixaMotivo.value = documento.observacao;
    pintar(cartao, documento);

    nome.addEventListener("click", function () {
      abrirDocumento(documento);
    });

    cartao.querySelector(".botao-ok").addEventListener("click", function () {
      documento.resultado = documento.resultado === "OK" ? null : "OK";
      pintar(cartao, documento);
      atualizarResumo();
    });

    cartao.querySelector(".botao-nao-ok").addEventListener("click", function () {
      documento.resultado = documento.resultado === "NAO_OK" ? null : "NAO_OK";
      pintar(cartao, documento);
      atualizarResumo();
      if (documento.resultado === "NAO_OK") {
        caixaMotivo.focus();
      }
    });

    caixaMotivo.addEventListener("input", function () {
      documento.observacao = caixaMotivo.value;
      cartao.classList.remove("sem-motivo");
    });

    listaDocumentos.appendChild(cartao);
  });
}

botaoSalvar.addEventListener("click", function () {
  let faltaMotivo = false;

  listaDocumentos.querySelectorAll(".documento").forEach(function (cartao, indice) {
    const documento = inscricao.documentos[indice];
    if (documento.resultado === "NAO_OK" && documento.observacao.trim() === "") {
      cartao.classList.add("sem-motivo");
      faltaMotivo = true;
    }
  });

  if (faltaMotivo) {
    mostrarAviso("Escreva o motivo de cada documento marcado como Não OK.");
    return;
  }

  salvarProcesso(processo);
  botaoSalvar.textContent = "Salvando...";
  botaoSalvar.disabled = true;
  mostrarAviso("Avaliação da inscrição " + inscricao.numero + " salva.");
  setTimeout(function () {
    window.location.href = "inscricoes.html";
  }, 1000);
});

window.addEventListener("pageshow", function () {
  botaoSalvar.textContent = "Salvar avaliação";
  botaoSalvar.disabled = false;
});

if (processo && !inscricao) {
  window.location.replace("inscricoes.html");
}

if (inscricao) {
  document.title = "Inscrição " + inscricao.numero + " | SGDI";
  document.getElementById("titulo-inscricao").textContent = "Inscrição " + inscricao.numero;
  document.getElementById("candidato").textContent = inscricao.candidato || "Pasta " + inscricao.pasta;
  document.getElementById("resumo-titulo").textContent = "Inscrição " + inscricao.numero;
  montarDocumentos();
  atualizarResumo();
}
