// SGDI | dados.js: funções e dados usados por todas as telas internas

// Tipos de documento do edital e as palavras que identificam cada um no nome do arquivo
// As palavras ficam sem acento porque o nome do arquivo é comparado já sem acento
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

// Deixa o texto em minúsculas e sem acento (é vira e, ç vira c)
// O NFD separa a letra do acento e o replace apaga os acentos
function normalizar(texto)
{
  return texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Descobre o tipo do documento pelo nome do arquivo (null quando nenhuma palavra bate)
function identificarTipo(nomeArquivo)
{
  const palavrasDoArquivo = normalizar(nomeArquivo).split(/[^a-z0-9]+/);  // quebra o nome em palavras

  // Primeiro tipo que tiver alguma palavra igual a uma palavra do arquivo
  const tipo = TIPOS_DOCUMENTO.find(function (tipo)
  {
    return tipo.palavras.some(function (palavra)
    {
      return palavrasDoArquivo.includes(palavra);
    });
  });
  return tipo ? tipo.nome : null;
}

// Lista de processos importados, guardada no navegador
function lerProcessos()
{
  return JSON.parse(localStorage.getItem("sgdiProcessos") || "[]");  // sem nada guardado, começa com a lista vazia
}

// Salva o processo e coloca ele no começo da lista (vira o mais recente)
function salvarProcesso(processo)
{
  // Todos os outros processos, menos a versão antiga deste
  const outros = lerProcessos().filter(function (item)
  {
    return item.id !== processo.id;
  });
  localStorage.setItem("sgdiProcessos", JSON.stringify([processo].concat(outros)));
}

// Abre o processo que a pessoa está usando
// Se o endereço tiver ?p=id, esse processo passa a ser o atual
function abrirProcessoAtual()
{
  const idNaUrl = new URLSearchParams(window.location.search).get("p");
  if (idNaUrl)
  {
    localStorage.setItem("sgdiProcessoAtual", idNaUrl);
  }

  // Procura o processo atual na lista
  const id = localStorage.getItem("sgdiProcessoAtual");
  const processo = lerProcessos().find(function (item)
  {
    return item.id === id;
  });

  // Processo não encontrado: volta pra tela de importar
  if (!processo)
  {
    window.location.replace("importar.html");  // replace não deixa voltar pra esta tela pela seta
    return null;
  }
  return processo;
}

// Situação da inscrição, com os mesmos nomes do banco: DEFERIDA, INDEFERIDA ou PENDENTE
function estadoInscricao(inscricao)
{
  const resultados = inscricao.documentos.map(function (documento)
  {
    return documento.resultado;
  });

  // Um documento Não OK já deixa a inscrição com pendência
  if (resultados.includes("NAO_OK"))
  {
    return "INDEFERIDA";
  }

  // Todos os documentos OK: inscrição deferida
  if (resultados.length > 0 && resultados.every(function (resultado)
    {
      return resultado === "OK";
    }))
  {
    return "DEFERIDA";
  }

  // Ainda tem documento sem avaliação
  return "PENDENTE";
}

// Quantos documentos da inscrição já foram avaliados (OK ou Não OK)
function contarAvaliados(inscricao)
{
  return inscricao.documentos.filter(function (documento)
  {
    return documento.resultado !== null;
  }).length;
}

// Escreve a quantidade com a palavra certa: 1 pendente, 2 pendentes
function plural(quantidade, singular, varios)
{
  return quantidade + " " + (quantidade === 1 ? singular : varios);
}

// Junta uma lista em texto: "a, b e c"
function juntarLista(itens)
{
  if (itens.length <= 1)
  {
    return itens.join("");
  }

  // Todos com vírgula, menos o último, que vem com "e"
  return itens.slice(0, -1).join(", ") + " e " + itens[itens.length - 1];
}

// Data no formato brasileiro (dia/mês/ano)
function formatarData(dataIso)
{
  return new Date(dataIso).toLocaleDateString("pt-BR");
}

// Copia o conteúdo de um template do HTML pra montar um cartão novo
function copiarModelo(id)
{
  return document.getElementById(id).content.firstElementChild.cloneNode(true);
}

// Abre o banco do navegador (IndexedDB) onde ficam guardados os arquivos .zip
// O localStorage só guarda texto, por isso o .zip vai pra cá
function abrirBanco()
{
  return new Promise(function (resolver, rejeitar)
  {
    const pedido = indexedDB.open("sgdi", 1);
    pedido.onupgradeneeded = function ()
    {
      pedido.result.createObjectStore("zips");  // na primeira vez, cria a gaveta "zips"
    };
    pedido.onsuccess = function ()
    {
      resolver(pedido.result);
    };
    pedido.onerror = function ()
    {
      rejeitar(pedido.error);
    };
  });
}

// Guarda o .zip do processo, com o id do processo como chave
async function guardarZip(idProcesso, arquivo)
{
  const banco = await abrirBanco();
  return new Promise(function (resolver, rejeitar)
  {
    const transacao = banco.transaction("zips", "readwrite");
    transacao.objectStore("zips").put(arquivo, idProcesso);
    transacao.oncomplete = resolver;
    transacao.onerror = function ()
    {
      rejeitar(transacao.error);
    };
  });
}

// Lê de volta o .zip guardado do processo
async function lerZip(idProcesso)
{
  const banco = await abrirBanco();
  return new Promise(function (resolver, rejeitar)
  {
    const pedido = banco.transaction("zips").objectStore("zips").get(idProcesso);
    pedido.onsuccess = function ()
    {
      resolver(pedido.result);
    };
    pedido.onerror = function ()
    {
      rejeitar(pedido.error);
    };
  });
}

// Quantos documentos da inscrição estão Não OK
function contarPendencias(inscricao)
{
  return inscricao.documentos.filter(function (documento)
  {
    return documento.resultado === "NAO_OK";
  }).length;
}

// Exclui o processo da lista
function excluirProcesso(idProcesso)
{
  const restantes = lerProcessos().filter(function (processo)
  {
    return processo.id !== idProcesso;
  });
  localStorage.setItem("sgdiProcessos", JSON.stringify(restantes));

  // Se era o processo atual, esquece ele também
  if (localStorage.getItem("sgdiProcessoAtual") === idProcesso)
  {
    localStorage.removeItem("sgdiProcessoAtual");
  }
}

// Apaga o .zip guardado do processo
async function apagarZip(idProcesso)
{
  const banco = await abrirBanco();
  return new Promise(function (resolver, rejeitar)
  {
    const transacao = banco.transaction("zips", "readwrite");
    transacao.objectStore("zips").delete(idProcesso);
    transacao.oncomplete = resolver;
    transacao.onerror = function ()
    {
      rejeitar(transacao.error);
    };
  });
}

// Cargo da pessoa pelo e-mail, procurando nos acessos de todos os processos
// Quem não está em nenhum acesso é quem importou, ou seja, o gerente do processo
function pegarCargo(email)
{
  const emailProcurado = email.toLowerCase();
  for (const processo of lerProcessos())
  {
    const pessoa = processo.acessos.find(function (acesso)
    {
      return acesso.email === emailProcurado;
    });
    if (pessoa)
    {
      return pessoa.cargo || "Banca Avaliadora";  // acessos antigos, sem cargo, contam como banca
    }
  }
  return "Gerente do processo";
}