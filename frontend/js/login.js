
// SGDI | login.js: validação do formulário de login

// Pega os elementos da página pelo id
const form = document.getElementById("form-login");
const campoEmail = document.getElementById("email");
const campoSenha = document.getElementById("senha");
const erroEmail = document.getElementById("erro-email");
const erroSenha = document.getElementById("erro-senha");


// Funções que mostram e limpam o erro de um campo
function mostrarErro(campo, areaErro, mensagem) 
{
  areaErro.textContent = mensagem;     // escreve a mensagem
  campo.classList.add("campo-erro");   // pinta a borda de vermelho
}

function limparErro(campo, areaErro) 
{
  areaErro.textContent = "";
  campo.classList.remove("campo-erro");
}

// Quando a pessoa clica em ENTRAR
form.addEventListener("submit", function (evento) 
{
  evento.preventDefault();   // não deixa a página recarregar

  const email = campoEmail.value.trim();   // trim = tira espaços das pontas
  const senha = campoSenha.value;
  let tudoCerto = true;

  // Confere o e-mail
  if (email === "") 
    {
        mostrarErro(campoEmail, erroEmail, "Informe o seu e-mail.");
        tudoCerto = false;
    } 
    
  else if (!email.includes("@") || !email.includes(".")) 
    {
        mostrarErro(campoEmail, erroEmail, "Digite um e-mail válido, como nome@ic.ufal.br.");
        tudoCerto = false;
    } 
  
  else 
    {
        limparErro(campoEmail, erroEmail);
    }


  // Confere a senha
  if (senha === "") 
    {
        mostrarErro(campoSenha, erroSenha, "Informe a sua senha.");
        tudoCerto = false;
    } 
  else if (senha.length < 8) 
    {
        mostrarErro(campoSenha, erroSenha, "A senha precisa ter pelo menos 8 caracteres.");
        tudoCerto = false;
    } 
  else 
    {
        limparErro(campoSenha, erroSenha);
    }

  if (tudoCerto) 
    {
        console.log("Tudo certo! Próximo passo: entrar no sistema.");
    }
});