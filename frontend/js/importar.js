

// SGDI | importar.js: escolher ou arrastar o .zip (RF02)

// Pega os elementos da página pelo id
const area = document.getElementById("area-arquivo");
const botaoEscolher = document.getElementById("botao-escolher");
const campoArquivo = document.getElementById("arquivo");
const nomeArquivo = document.getElementById("nome-arquivo");
const campoNome = document.getElementById("nome-processo");
const erroNome = document.getElementById("erro-nome");
const erroArquivo = document.getElementById("erro-arquivo");
const botaoImportar = document.getElementById("botao-importar");
let arquivoEscolhido = null; // guarda o .zip escolhido (null = nenhum ainda)
const areaEscolhido = document.getElementById("area-escolhido");
const botaoRemover = document.getElementById("botao-remover");

// Recebe o arquivo (do botão ou do arrastar) e mostra na tela
function receberArquivo(arquivo) 
{
  if (!arquivo.name.toLowerCase().endsWith(".zip")) 
  {
    erroArquivo.textContent = "Esse arquivo não é .zip. Escolha o .zip das inscrições.";
    return;
  }

  arquivoEscolhido = arquivo;
  erroArquivo.textContent = "";
  nomeArquivo.textContent = "✓ " + arquivo.name;
  area.classList.add("com-arquivo");
  areaEscolhido.hidden = false; // mostra o nome + Remover
}

// O botão "clica" no input escondido, que abre a janela do Windows
botaoEscolher.addEventListener("click", function () 
{
    campoArquivo.click();
});

// Quando a pessoa escolhe um arquivo na janela
campoArquivo.addEventListener("change", function () 
{
    if (campoArquivo.files.length > 0) 
    {
        receberArquivo(campoArquivo.files[0]); // [0] = o primeiro arquivo
    }
});

// Arquivo passando por cima da área
area.addEventListener("dragover", function (evento) 
{
  evento.preventDefault(); // sem isso o navegador abre o arquivo numa aba nova
  area.classList.add("arrastando");
});

// Arquivo saiu de cima da área sem soltar
area.addEventListener("dragleave", function () 
{
  area.classList.remove("arrastando");
});

// Soltou o arquivo na área
area.addEventListener("drop", function (evento) 
{
  evento.preventDefault();
  area.classList.remove("arrastando");
  const arquivo = evento.dataTransfer.files[0]; // o arquivo que foi solto
  if (arquivo) 
  {
    receberArquivo(arquivo); // a mesma função do botão
  }
});

// Botão IMPORTAR: confere os campos e vai para a lista de inscrições
botaoImportar.addEventListener("click", function () 
{
  let tudoCerto = true;

  if (campoNome.value.trim() === "") 
  {
    erroNome.textContent = "Informe o nome do processo.";
    campoNome.classList.add("campo-erro");
    tudoCerto = false;
  } 
  else 
  {
    erroNome.textContent = "";
    campoNome.classList.remove("campo-erro");
  }

  if (arquivoEscolhido === null) 
  {
    erroArquivo.textContent = "Escolha o arquivo .zip das inscrições.";
    tudoCerto = false;
  }

  // Simulado: depois vira o envio para o back-end
  if (tudoCerto) 
  {
    botaoImportar.textContent = "Importando...";
    botaoImportar.disabled = true;
    importarProcesso(campoNome.value.trim(), arquivoEscolhido);
  }
});

// 9. Ao voltar pela seta do navegador, destrava o botão (igual ao login)
window.addEventListener("pageshow", function () 
{
  botaoImportar.textContent = "Importar inscrições";
  botaoImportar.disabled = false;
});

// 10. Apaga o erro do nome assim que a pessoa começa a digitar
campoNome.addEventListener("input", function () 
{
  erroNome.textContent = "";
  campoNome.classList.remove("campo-erro");
});

// 11. Remover: volta a área ao estado inicial
botaoRemover.addEventListener("click", function () 
{
  arquivoEscolhido = null;
  campoArquivo.value = ""; // limpa o input (senão escolher o mesmo arquivo de novo não funciona)
  nomeArquivo.textContent = "";
  areaEscolhido.hidden = true;
  area.classList.remove("com-arquivo");
});

const listaRecentes = document.getElementById("recentes");
const recentesVazio = document.getElementById("recentes-vazio");

function lerInscricoesDoZip(zip) {
  const caminhos = Object.keys(zip.files).filter(function (caminho) {
    const nome = caminho.split("/").pop();
    return !zip.files[caminho].dir
      && !caminho.startsWith("__MACOSX")
      && !nome.startsWith(".")
      && nome !== "Thumbs.db"
      && nome !== "desktop.ini";
  });

  let partes = caminhos.map(function (caminho) {
    return caminho.split("/");
  });

  while (partes.length > 0 && partes.every(function (parte) {
    return parte.length > 2 && parte[0] === partes[0][0];
  })) {
    partes = partes.map(function (parte) {
      return parte.slice(1);
    });
  }

  const inscricoes = {};

  partes.forEach(function (parte, posicao) {
    if (parte.length < 2) {
      return;
    }
    const pasta = parte[0];
    const nomeArquivo = parte[parte.length - 1];

    if (!inscricoes[pasta]) {
      const encontrado = pasta.match(/^(\d+)\s*[-_]*\s*(.*)$/);
      inscricoes[pasta] = {
        numero: encontrado ? encontrado[1] : pasta,
        candidato: encontrado ? encontrado[2].replace(/_/g, " ").trim() : "",
        pasta: pasta,
        documentos: []
      };
    }

    inscricoes[pasta].documentos.push({
      arquivo: nomeArquivo,
      caminho: caminhos[posicao],
      tipo: identificarTipo(nomeArquivo),
      resultado: null,
      observacao: ""
    });
  });

  const nomesDosTipos = TIPOS_DOCUMENTO.map(function (tipo) {
    return tipo.nome;
  });

  function ordemDoTipo(documento) {
    const posicao = nomesDosTipos.indexOf(documento.tipo);
    return posicao === -1 ? nomesDosTipos.length : posicao;
  }

  return Object.values(inscricoes)
    .sort(function (a, b) {
      return a.numero.localeCompare(b.numero, "pt-BR", { numeric: true });
    })
    .map(function (inscricao) {
      inscricao.documentos.sort(function (a, b) {
        return ordemDoTipo(a) - ordemDoTipo(b) || a.arquivo.localeCompare(b.arquivo, "pt-BR");
      });
      return inscricao;
    });
}

function mostrarFalha(mensagem) {
  erroArquivo.textContent = mensagem;
  botaoImportar.textContent = "Importar inscrições";
  botaoImportar.disabled = false;
}

async function importarProcesso(nome, arquivo) {
  let zip;
  try {
    zip = await JSZip.loadAsync(arquivo);
  } catch (erro) {
    mostrarFalha("Não consegui abrir esse .zip. Veja se ele abre normalmente no seu computador.");
    return;
  }

  const inscricoes = lerInscricoesDoZip(zip);
  if (inscricoes.length === 0) {
    mostrarFalha("Não achei pastas de candidatos nesse .zip. Cada candidato precisa ter a sua pasta.");
    return;
  }

  const processo = {
    id: String(Date.now()),
    nome: nome,
    arquivoZip: arquivo.name,
    dataCriacao: new Date().toISOString(),
    instituicao: "UNIVERSIDADE FEDERAL DE ALAGOAS",
    edital: "",
    descricao: "Processo seletivo " + nome,
    acessos: [],
    inscricoes: inscricoes
  };

  try {
    await guardarZip(processo.id, arquivo);
  } catch (erro) {
    console.warn("O .zip não foi guardado no navegador; os documentos não vão abrir.", erro);
  }

  salvarProcesso(processo);
  window.location.href = "inscricoes.html?p=" + processo.id;
}

const confirmacao = document.getElementById("confirmacao");
const confirmacaoNome = document.getElementById("confirmacao-nome");
let processoParaExcluir = null;
let cartaoParaExcluir = null;

function mostrarRecentes() {
  listaRecentes.querySelectorAll(".recente").forEach(function (cartao) {
    cartao.remove();
  });

  const processos = lerProcessos();
  recentesVazio.hidden = processos.length > 0;

  processos.forEach(function (processo) {
    const revisadas = processo.inscricoes.filter(function (inscricao) {
      return estadoInscricao(inscricao) !== "PENDENTE";
    }).length;

    const cartao = copiarModelo("modelo-recente");
    const link = cartao.querySelector(".recente-link");
    link.href = "inscricoes.html?p=" + processo.id;
    link.querySelector("strong").textContent = processo.nome;
    link.querySelector("span").textContent =
      plural(processo.inscricoes.length, "inscrição", "inscrições") + ", " +
      plural(revisadas, "revisada", "revisadas") +
      " · importado em " + formatarData(processo.dataCriacao);

    cartao.querySelector(".recente-excluir").addEventListener("click", function () {
      processoParaExcluir = processo;
      cartaoParaExcluir = cartao;
      cartao.classList.add("excluindo");
      confirmacaoNome.textContent = processo.nome;
      confirmacao.hidden = false;
    });

    listaRecentes.appendChild(cartao);
  });
}

function fecharConfirmacao() {
  confirmacao.hidden = true;
  if (cartaoParaExcluir) {
    cartaoParaExcluir.classList.remove("excluindo");
  }
  processoParaExcluir = null;
  cartaoParaExcluir = null;
}

document.getElementById("botao-cancelar").addEventListener("click", fecharConfirmacao);

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

document.getElementById("botao-confirmar").addEventListener("click", function () {
  const nome = processoParaExcluir.nome;
  const id = processoParaExcluir.id;
  excluirProcesso(id);
  apagarZip(id).catch(function () {});
  fecharConfirmacao();
  mostrarRecentes();
  mostrarAviso("Processo " + nome + " excluído.");
});

mostrarRecentes();
