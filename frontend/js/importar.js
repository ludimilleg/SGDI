

// SGDI | importar.js: escolher ou arrastar o .zip (RF02)

// Pega os elementos da página pelo id
const area = document.getElementById("area-arquivo");
const botaoEscolher = document.getElementById("botao-escolher");
const campoArquivo = document.getElementById("arquivo");
const nomeArquivo = document.getElementById("nome-arquivo");

// Recebe o arquivo (do botão ou do arrastar) e mostra na tela
function receberArquivo(arquivo) 
{
    // Só aceita .zip (toLowerCase deixa ".ZIP" minúsculo também)
    if (!arquivo.name.toLowerCase().endsWith(".zip")) 
    {
        alert("Envie um arquivo .zip.");
        return; // para aqui e não mostra nada
    }
    nomeArquivo.textContent = "✓ " + arquivo.name;
    area.classList.add("com-arquivo"); // deixa a área verde
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
  if (arquivo) {
    receberArquivo(arquivo); // a mesma função do botão
  }
});