// SGDI | importar.js: escolher ou arrastar o .zip, ler as inscrições e listar os processos recentes (RF02)

// Pega os elementos da página pelo id
const area = document.getElementById("area-arquivo");
const botaoEscolher = document.getElementById("botao-escolher");
const campoArquivo = document.getElementById("arquivo");
const nomeArquivo = document.getElementById("nome-arquivo");
const campoNome = document.getElementById("nome-processo");
const erroNome = document.getElementById("erro-nome");
const erroArquivo = document.getElementById("erro-arquivo");
const botaoImportar = document.getElementById("botao-importar");
let arquivoEscolhido = null;  // guarda o .zip escolhido (null = nenhum ainda)
const areaEscolhido = document.getElementById("area-escolhido");
const botaoRemover = document.getElementById("botao-remover");

// Recebe o arquivo (do botão ou do arrastar) e mostra na tela
function receberArquivo(arquivo)
{
  // Só aceita .zip
  if (!arquivo.name.toLowerCase().endsWith(".zip"))
  {
    erroArquivo.textContent = "Esse arquivo não é .zip. Escolha o .zip das inscrições.";
    return;
  }

  // Guarda o arquivo e pinta a área de verde com o nome dele
  arquivoEscolhido = arquivo;
  erroArquivo.textContent = "";
  nomeArquivo.textContent = "✓ " + arquivo.name;
  area.classList.add("com-arquivo");
  areaEscolhido.hidden = false;  // mostra o nome + Remover
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
    receberArquivo(campoArquivo.files[0]);  // [0] = o primeiro arquivo
  }
});

// Arquivo passando por cima da área
area.addEventListener("dragover", function (evento)
{
  evento.preventDefault();           // sem isso o navegador abre o arquivo numa aba nova
  area.classList.add("arrastando");  // borda azul enquanto o arquivo está em cima
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
  const arquivo = evento.dataTransfer.files[0];  // o arquivo que foi solto
  if (arquivo)
  {
    receberArquivo(arquivo);  // a mesma função do botão
  }
});

// Botão IMPORTAR: confere os campos e vai para a lista de inscrições
botaoImportar.addEventListener("click", function ()
{
  let tudoCerto = true;

  // Confere o nome do processo
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

  // Confere se tem arquivo escolhido
  if (arquivoEscolhido === null)
  {
    erroArquivo.textContent = "Escolha o arquivo .zip das inscrições.";
    tudoCerto = false;
  }

  // Tudo certo: lê o .zip e cria o processo
  // Simulado: depois vira o envio para o back-end
  if (tudoCerto)
  {
    botaoImportar.textContent = "Importando...";  // mostra que está carregando
    botaoImportar.disabled = true;                // evita clicar duas vezes
    importarProcesso(campoNome.value.trim(), arquivoEscolhido);
  }
});

// Ao voltar pela seta do navegador, destrava o botão (igual ao login)
window.addEventListener("pageshow", function ()
{
  botaoImportar.textContent = "Importar inscrições";
  botaoImportar.disabled = false;
});

// Apaga o erro do nome assim que a pessoa começa a digitar
campoNome.addEventListener("input", function ()
{
  erroNome.textContent = "";
  campoNome.classList.remove("campo-erro");
});

// Remover: volta a área ao estado inicial
botaoRemover.addEventListener("click", function ()
{
  arquivoEscolhido = null;
  campoArquivo.value = "";  // limpa o input (senão escolher o mesmo arquivo de novo não funciona)
  nomeArquivo.textContent = "";
  areaEscolhido.hidden = true;
  area.classList.remove("com-arquivo");
});

// Lista de processos recentes e a frase de lista vazia
const listaRecentes = document.getElementById("recentes");
const recentesVazio = document.getElementById("recentes-vazio");

// Lê o .zip e monta as inscrições: cada pasta vira uma inscrição e cada arquivo vira um documento
function lerInscricoesDoZip(zip)
{
  // Caminho de todos os arquivos do .zip, deixando de fora pastas e arquivos de sistema
  const caminhos = Object.keys(zip.files).filter(function (caminho)
  {
    const nome = caminho.split("/").pop();
    return !zip.files[caminho].dir &&     // só arquivos, sem as pastas
      !caminho.startsWith("__MACOSX") &&  // pasta escondida que o Mac cria
      !nome.startsWith(".") &&            // arquivos escondidos
      nome !== "Thumbs.db" &&             // miniaturas do Windows
      nome !== "desktop.ini";             // configuração de pasta do Windows
  });

  // Quebra cada caminho nas pastas: "edital/48069 Ana/rg.pdf" vira ["edital", "48069 Ana", "rg.pdf"]
  let partes = caminhos.map(function (caminho)
  {
    return caminho.split("/");
  });

  // Enquanto todos estiverem dentro da mesma pasta de fora, tira essa pasta da frente
  // Assim tanto faz o .zip ter ou não uma pasta por fora das pastas dos candidatos
  while (partes.length > 0 && partes.every(function (parte)
    {
      return parte.length > 2 && parte[0] === partes[0][0];
    }))
  {
    partes = partes.map(function (parte)
    {
      return parte.slice(1);
    });
  }

  // Junta os arquivos por pasta de candidato
  const inscricoes = {};

  partes.forEach(function (parte, posicao)
  {
    // Arquivo solto, fora de qualquer pasta, fica de fora
    if (parte.length < 2)
    {
      return;
    }
    const pasta = parte[0];                       // pasta do candidato
    const nomeArquivo = parte[parte.length - 1];  // nome do arquivo, sem as pastas

    // Primeira vez que aparece essa pasta: cria a inscrição
    if (!inscricoes[pasta])
    {
      // Separa o número do começo da pasta e o nome do candidato (pode vir com espaço, hífen ou _ no meio)
      const encontrado = pasta.match(/^(\d+)\s*[-_]*\s*(.*)$/);
      inscricoes[pasta] = {
        numero: encontrado ? encontrado[1] : pasta,
        candidato: encontrado ? encontrado[2].replace(/_/g, " ").trim() : "",  // "Carlos_Eduardo" vira "Carlos Eduardo"
        pasta: pasta,
        documentos: []
      };
    }

    // Cada arquivo vira um documento, ainda sem avaliação
    inscricoes[pasta].documentos.push({
      arquivo: nomeArquivo,
      caminho: caminhos[posicao],
      tipo: identificarTipo(nomeArquivo),  // descoberto pelo nome do arquivo (dados.js)
      resultado: null,                     // OK, NAO_OK ou null (sem avaliação)
      observacao: ""                       // motivo, quando é Não OK
    });
  });

  // Ordem dos tipos igual à do edital (TIPOS_DOCUMENTO)
  const nomesDosTipos = TIPOS_DOCUMENTO.map(function (tipo)
  {
    return tipo.nome;
  });

  // Posição do tipo na lista (tipo não identificado vai pro fim)
  function ordemDoTipo(documento)
  {
    const posicao = nomesDosTipos.indexOf(documento.tipo);
    return posicao === -1 ? nomesDosTipos.length : posicao;
  }

  // Inscrições em ordem de número e documentos na ordem do edital
  return Object.values(inscricoes)
    .sort(function (a, b)
    {
      return a.numero.localeCompare(b.numero, "pt-BR", { numeric: true });  // numeric: 2 vem antes de 10
    })
    .map(function (inscricao)
    {
      inscricao.documentos.sort(function (a, b)
      {
        // Primeiro pela ordem do tipo e, no mesmo tipo, pela ordem alfabética do arquivo
        return ordemDoTipo(a) - ordemDoTipo(b) || a.arquivo.localeCompare(b.arquivo, "pt-BR");
      });
      return inscricao;
    });
}

// Mostra o erro embaixo da área e destrava o botão
function mostrarFalha(mensagem)
{
  erroArquivo.textContent = mensagem;
  botaoImportar.textContent = "Importar inscrições";
  botaoImportar.disabled = false;
}

// Cria o processo a partir do .zip e vai pra lista de inscrições
async function importarProcesso(nome, arquivo)
{
  // Abre o .zip com o JSZip (biblioteca carregada no importar.html)
  let zip;
  try
  {
    zip = await JSZip.loadAsync(arquivo);
  }
  catch (erro)
  {
    mostrarFalha("Não consegui abrir esse .zip. Veja se ele abre normalmente no seu computador.");
    return;
  }

  // Lê as inscrições e para se o .zip não tiver nenhuma pasta de candidato
  const inscricoes = lerInscricoesDoZip(zip);
  if (inscricoes.length === 0)
  {
    mostrarFalha("Não achei pastas de candidatos nesse .zip. Cada candidato precisa ter a sua pasta.");
    return;
  }

  // Dados do processo, guardados no navegador
  const processo = {
    id: String(Date.now()),  // a hora atual em milissegundos vira um id único
    nome: nome,
    arquivoZip: arquivo.name,
    dataCriacao: new Date().toISOString(),
    instituicao: "UNIVERSIDADE FEDERAL DE ALAGOAS",
    edital: "",  // preenchido na tela do relatório
    descricao: "Processo seletivo " + nome,
    acessos: [],  // pessoas cadastradas na tela de acessos
    inscricoes: inscricoes
  };

  // Guarda o .zip no navegador pra abrir os documentos depois, na tela da inscrição
  try
  {
    await guardarZip(processo.id, arquivo);
  }
  catch (erro)
  {
    // Se não der pra guardar, segue sem o .zip (só não vai dar pra abrir os arquivos)
    console.warn("O .zip não foi guardado no navegador; os documentos não vão abrir.", erro);
  }

  // Salva o processo e abre a lista de inscrições dele
  salvarProcesso(processo);
  window.location.href = "inscricoes.html?p=" + processo.id;
}

// Janela de confirmação para excluir um processo recente
const confirmacao = document.getElementById("confirmacao");
const confirmacaoNome = document.getElementById("confirmacao-nome");
let processoParaExcluir = null;  // processo que vai ser excluído
let cartaoParaExcluir = null;    // cartão dele na lista

// Mostra os processos recentes (o mais recente primeiro)
function mostrarRecentes()
{
  // Apaga os cartões que já estavam na tela antes de montar de novo
  listaRecentes.querySelectorAll(".recente").forEach(function (cartao)
  {
    cartao.remove();
  });

  // Sem processo nenhum: mostra a frase de lista vazia
  const processos = lerProcessos();
  recentesVazio.hidden = processos.length > 0;

  processos.forEach(function (processo)
  {
    // Quantas inscrições já têm resultado (deferida ou com pendência)
    const revisadas = processo.inscricoes.filter(function (inscricao)
    {
      return estadoInscricao(inscricao) !== "PENDENTE";
    }).length;

    // Monta o cartão a partir do template do HTML
    const cartao = copiarModelo("modelo-recente");
    const link = cartao.querySelector(".recente-link");
    link.href = "inscricoes.html?p=" + processo.id;  // ?p= diz qual processo abrir
    link.querySelector("strong").textContent = processo.nome;
    link.querySelector("span").textContent =  // ex.: 12 inscrições, 3 revisadas · importado em 20/10/2026
      plural(processo.inscricoes.length, "inscrição", "inscrições") + ", " +
      plural(revisadas, "revisada", "revisadas") +
      " · importado em " + formatarData(processo.dataCriacao);

    // Excluir: marca o cartão de vermelho e abre a janela de confirmação
    cartao.querySelector(".recente-excluir").addEventListener("click", function ()
    {
      processoParaExcluir = processo;
      cartaoParaExcluir = cartao;
      cartao.classList.add("excluindo");
      confirmacaoNome.textContent = processo.nome;
      confirmacao.hidden = false;
    });

    listaRecentes.appendChild(cartao);
  });
}

// Fecha a janela e desmarca o cartão
function fecharConfirmacao()
{
  confirmacao.hidden = true;
  if (cartaoParaExcluir)
  {
    cartaoParaExcluir.classList.remove("excluindo");
  }
  processoParaExcluir = null;
  cartaoParaExcluir = null;
}

// Cancelar fecha sem excluir
document.getElementById("botao-cancelar").addEventListener("click", fecharConfirmacao);

// Clique no fundo escuro, fora da janela, também fecha
confirmacao.addEventListener("click", function (evento)
{
  if (evento.target === confirmacao)
  {
    fecharConfirmacao();
  }
});

// Esc também fecha
document.addEventListener("keydown", function (evento)
{
  if (evento.key === "Escape" && !confirmacao.hidden)
  {
    fecharConfirmacao();
  }
});

// Excluir de vez: apaga o processo e o .zip guardado e atualiza a lista
document.getElementById("botao-confirmar").addEventListener("click", function ()
{
  const nome = processoParaExcluir.nome;
  const id = processoParaExcluir.id;
  excluirProcesso(id);
  apagarZip(id).catch(function () {});  // se o .zip já não existir, segue sem erro
  fecharConfirmacao();
  mostrarRecentes();
  mostrarAviso("Processo " + nome + " excluído.");
});

// Monta a lista assim que a tela abre
mostrarRecentes();