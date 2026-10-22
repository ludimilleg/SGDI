// SGDI | relatorio.js: relatório de homologação (prévia e exportar em JPEG, Word e PDF)

// Processo aberto (sem processo, o dados.js manda de volta pra tela de importar)
const processo = abrirProcessoAtual();

// Campos do cabeçalho do relatório (o id do campo é o mesmo nome do dado no processo)
const CAMPOS_CABECALHO = ["instituicao", "edital", "descricao"];

// Monta a prévia: lista de deferidas, tabela de indeferidas e aviso das que faltam revisar
function montarRelatorio()
{
  const deferidas = [];
  const indeferidas = [];
  let pendentes = 0;

  // Separa as inscrições pela situação
  processo.inscricoes.forEach(function (inscricao)
  {
    const estado = estadoInscricao(inscricao);
    if (estado === "DEFERIDA")
    {
      deferidas.push(inscricao.numero);  // deferida só precisa do número
    }
    else if (estado === "INDEFERIDA")
    {
      indeferidas.push(inscricao);  // indeferida precisa dos documentos pra montar os motivos
    }
    else
    {
      pendentes++;  // pendente fica fora do relatório
    }
  });

  // Resumo embaixo do título (ex.: Mestrado 2027.1: 5 deferidas, 2 indeferidas, 1 pendente.)
  document.getElementById("subtitulo-relatorio").textContent =
    processo.nome + ": " +
    plural(deferidas.length, "deferida", "deferidas") + ", " +
    plural(indeferidas.length, "indeferida", "indeferidas") + ", " +
    plural(pendentes, "pendente", "pendentes") + ".";

  // Aviso azul só aparece quando ainda tem inscrição pendente
  const alerta = document.getElementById("alerta-pendentes");
  alerta.hidden = pendentes === 0;
  alerta.textContent = "Ainda falta revisar " + plural(pendentes, "inscrição", "inscrições") +
    ". Elas ficam fora do relatório até terem todos os documentos avaliados.";

  // Números das deferidas separados por vírgula (ex.: 48069, 48071 e 48075.)
  document.getElementById("lista-deferidas").textContent =
    deferidas.length > 0 ? juntarLista(deferidas) + "." : "Nenhuma inscrição deferida.";

  // Tabela das indeferidas: limpa antes de montar de novo
  const tabela = document.getElementById("tabela-indeferidas");
  tabela.innerHTML = "";

  // Nenhuma indeferida: uma linha só, ocupando as duas colunas
  if (indeferidas.length === 0)
  {
    const linha = tabela.insertRow();
    const celula = linha.insertCell();
    celula.colSpan = 2;
    celula.textContent = "Nenhuma inscrição indeferida.";
  }

  // Uma linha por inscrição indeferida: número e motivos
  indeferidas.forEach(function (inscricao)
  {
    // Motivos dos documentos Não OK, no formato "Tipo: motivo"
    const motivos = inscricao.documentos
      .filter(function (documento)
      {
        return documento.resultado === "NAO_OK";
      })
      .map(function (documento)
      {
        // Tipo (ou nome do arquivo) e o motivo, sem o ponto final
        return (documento.tipo || documento.arquivo) + ": " + documento.observacao.trim().replace(/\.$/, "");
      });

    const linha = tabela.insertRow();
    linha.insertCell().textContent = inscricao.numero;
    linha.insertCell().textContent = motivos.join("; ") + ".";  // motivos separados por ponto e vírgula
  });
}

// A cada letra digitada no cabeçalho, atualiza a prévia e salva no processo
CAMPOS_CABECALHO.forEach(function (campo)
{
  const entrada = document.getElementById(campo);
  const destino = document.getElementById("previa-" + campo);
  entrada.addEventListener("input", function ()
  {
    destino.textContent = entrada.value;
    processo[campo] = entrada.value;
    salvarProcesso(processo);
  });
});

// PDF: abre a janela de impressão (o CSS de impressão deixa só a prévia)
document.getElementById("botao-pdf").addEventListener("click", function ()
{
  mostrarAviso("Escolha \"Salvar como PDF\" na janela de impressão.");
  setTimeout(function ()
  {
    window.print();
  }, 600);  // espera o aviso aparecer antes de abrir a janela
});

// Word: monta um .doc com o HTML da prévia e baixa o arquivo
document.getElementById("botao-word").addEventListener("click", function ()
{
  const previa = document.getElementById("previa").cloneNode(true);  // cópia da prévia, pra não mexer na tela

  // Estilo simples dentro do .doc, porque o Word não lê o CSS da página
  const estilo =
    "<style>body{font-family:Arial,sans-serif;color:#1F2A44}" +
    ".previa-topo{text-align:center}.previa-brasao{display:none}" +
    "table{border-collapse:collapse;width:100%}th,td{border:1px solid #B7CDED;padding:8px;text-align:left}" +
    "th{background:#E6F0FA}</style>";
  const conteudo = "<html><head><meta charset='UTF-8'>" + estilo + "</head><body>" + previa.innerHTML + "</body></html>";

  // O caractere invisível no começo do arquivo faz o Word ler os acentos certinho
  const arquivo = new Blob(["﻿", conteudo], { type: "application/msword" });

  // Link temporário que baixa o arquivo sozinho
  const link = document.createElement("a");
  link.href = URL.createObjectURL(arquivo);
  link.download = "relatorio-homologacao.doc";
  link.click();
  setTimeout(function ()
  {
    URL.revokeObjectURL(link.href);  // libera a memória do arquivo depois do download
  }, 1000);
  mostrarAviso("Relatório em Word baixado.");
});

// JPEG: tira uma "foto" da prévia com o html2canvas e baixa a imagem
document.getElementById("botao-jpeg").addEventListener("click", async function ()
{
  // scale 2 deixa a imagem mais nítida
  const imagem = await html2canvas(document.getElementById("previa"), { scale: 2, backgroundColor: "#FFFFFF" });
  const link = document.createElement("a");
  link.href = imagem.toDataURL("image/jpeg", 0.92);  // 92% de qualidade
  link.download = "relatorio-homologacao.jpg";
  link.click();
  mostrarAviso("Relatório em JPEG baixado.");
});

// Preenche o cabeçalho com o que já estava salvo e monta a prévia
if (processo)
{
  CAMPOS_CABECALHO.forEach(function (campo)
  {
    document.getElementById(campo).value = processo[campo];
    document.getElementById("previa-" + campo).textContent = processo[campo];
  });
  montarRelatorio();
}
