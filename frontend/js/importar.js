

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
    setTimeout(function () { window.location.href = "inscricoes.html"; }, 800);
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