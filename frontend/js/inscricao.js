// SGDI | inscricao.js: revisão dos documentos de uma inscrição (OK, Não OK e motivo)

// Processo aberto e a inscrição escolhida na lista (?i= no endereço)
const processo = abrirProcessoAtual();
const posicao = Number(new URLSearchParams(window.location.search).get("i"));
const inscricao = processo ? processo.inscricoes[posicao] : null;  // sem processo, não tem inscrição

// Pega os elementos da página pelo id
const listaDocumentos = document.getElementById("documentos");
const resumoContagem = document.getElementById("resumo-contagem");
const botaoSalvar = document.getElementById("botao-salvar");

// Tipo de cada extensão, pro navegador saber como abrir o arquivo
const TIPOS_ARQUIVO = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  txt: "text/plain"
};

// Pinta o cartão conforme o resultado: verde (OK), vermelho (Não OK) ou branco
function pintar(cartao, documento)
{
  cartao.classList.toggle("ok", documento.resultado === "OK");
  cartao.classList.toggle("nao-ok", documento.resultado === "NAO_OK");
  cartao.classList.remove("sem-motivo");  // tira o destaque de motivo faltando
}

// Atualiza a contagem do resumo (ex.: 5 OK · 1 Não OK · 2 sem avaliação)
function atualizarResumo()
{
  let ok = 0;
  let naoOk = 0;
  inscricao.documentos.forEach(function (documento)
  {
    if (documento.resultado === "OK")
    {
      ok++;
    }
    else if (documento.resultado === "NAO_OK")
    {
      naoOk++;
    }
  });
  const semAvaliacao = inscricao.documentos.length - ok - naoOk;
  resumoContagem.textContent = ok + " OK · " + naoOk + " Não OK · " + semAvaliacao + " sem avaliação";
}

// Abre o arquivo do documento numa aba nova, lendo do .zip guardado no navegador
async function abrirDocumento(documento)
{
  const janela = window.open("", "_blank");  // abre a aba já no clique (senão o navegador bloqueia)
  try
  {
    const zipGuardado = await lerZip(processo.id);  // o .zip guardado na importação
    const zip = await JSZip.loadAsync(zipGuardado);
    const conteudo = await zip.file(documento.caminho).async("blob");   // só o arquivo deste documento
    const extensao = documento.arquivo.split(".").pop().toLowerCase();  // pdf, jpg, png...
    const arquivo = new Blob([conteudo], { type: TIPOS_ARQUIVO[extensao] || "application/octet-stream" });
    janela.location.href = URL.createObjectURL(arquivo);  // mostra o arquivo na aba que abriu
  }
  catch (erro)
  {
    // Não deu pra abrir: fecha a aba vazia e avisa
    if (janela)
    {
      janela.close();
    }
    mostrarAviso("Não consegui abrir " + documento.arquivo + ". Importe o .zip de novo neste navegador.");
  }
}

// Monta um cartão para cada documento da inscrição
function montarDocumentos()
{
  inscricao.documentos.forEach(function (documento, indice)
  {
    const cartao = copiarModelo("modelo-documento");
    const nome = cartao.querySelector(".documento-nome");
    const caixaMotivo = cartao.querySelector("textarea");

    // Tipo do documento como título e nome do arquivo embaixo
    nome.textContent = documento.tipo || documento.arquivo;
    cartao.querySelector(".documento-arquivo").textContent =
      documento.tipo ? documento.arquivo : "Tipo não identificado pelo nome do arquivo";

    // Liga o rótulo à caixa do motivo pelo id
    cartao.querySelector("label").htmlFor = "motivo-" + indice;
    caixaMotivo.id = "motivo-" + indice;
    caixaMotivo.value = documento.observacao;  // motivo que já tinha sido escrito
    pintar(cartao, documento);                 // cor de acordo com a avaliação salva

    // Clique no tipo do documento: abre o arquivo
    nome.addEventListener("click", function ()
    {
      abrirDocumento(documento);
    });

    // OK: marca, ou desmarca se já estava OK
    cartao.querySelector(".botao-ok").addEventListener("click", function ()
    {
      documento.resultado = documento.resultado === "OK" ? null : "OK";
      pintar(cartao, documento);
      atualizarResumo();
    });

    // Não OK: marca, ou desmarca se já estava Não OK
    cartao.querySelector(".botao-nao-ok").addEventListener("click", function ()
    {
      documento.resultado = documento.resultado === "NAO_OK" ? null : "NAO_OK";
      pintar(cartao, documento);
      atualizarResumo();
      if (documento.resultado === "NAO_OK")
      {
        caixaMotivo.focus();  // já deixa o cursor na caixa do motivo
      }
    });

    // Cada letra digitada no motivo já fica guardada no documento
    caixaMotivo.addEventListener("input", function ()
    {
      documento.observacao = caixaMotivo.value;
      cartao.classList.remove("sem-motivo");
    });

    listaDocumentos.appendChild(cartao);
  });
}

// Salvar avaliação: confere os motivos, salva e volta pra lista
botaoSalvar.addEventListener("click", function ()
{
  let faltaMotivo = false;

  // Todo Não OK precisa ter motivo
  listaDocumentos.querySelectorAll(".documento").forEach(function (cartao, indice)
  {
    const documento = inscricao.documentos[indice];
    if (documento.resultado === "NAO_OK" && documento.observacao.trim() === "")
    {
      cartao.classList.add("sem-motivo");  // destaca a caixa vazia
      faltaMotivo = true;
    }
  });

  // Faltou motivo: avisa e não salva
  if (faltaMotivo)
  {
    mostrarAviso("Escreva o motivo de cada documento marcado como Não OK.");
    return;
  }

  // Salva no navegador e volta pra lista depois de 1 segundo
  salvarProcesso(processo);
  botaoSalvar.textContent = "Salvando...";  // mostra que está salvando
  botaoSalvar.disabled = true;              // evita clicar duas vezes
  mostrarAviso("Avaliação da inscrição " + inscricao.numero + " salva.");
  setTimeout(function ()
  {
    window.location.href = "inscricoes.html";
  }, 1000);
});

// Ao voltar pela seta do navegador, destrava o botão (igual ao login)
window.addEventListener("pageshow", function ()
{
  botaoSalvar.textContent = "Salvar avaliação";
  botaoSalvar.disabled = false;
});

// Inscrição que não existe (ex.: ?i=99): volta pra lista
if (processo && !inscricao)
{
  window.location.replace("inscricoes.html");
}

// Monta a tela com o número, o candidato (ou o nome da pasta, quando não tem nome) e os documentos
if (inscricao)
{
  document.title = "Inscrição " + inscricao.numero + " | SGDI";
  document.getElementById("titulo-inscricao").textContent = "Inscrição " + inscricao.numero;
  document.getElementById("candidato").textContent = inscricao.candidato || "Pasta " + inscricao.pasta;
  document.getElementById("resumo-titulo").textContent = "Inscrição " + inscricao.numero;
  montarDocumentos();
  atualizarResumo();
}
