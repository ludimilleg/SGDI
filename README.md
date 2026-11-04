# SGDI

Sistema de Gerenciamento de Documentos e Inscrições (SGDI).

O repositório está dividido em:

* `backend/`: API em Python, Django e Django REST Framework.
* `frontend/`: telas em HTML, CSS e JavaScript, com Bootstrap.
* `database/`: script do banco de dados (`schema.sql`).

# Backend

Backend do Sistema de Gerenciamento de Documentos e Inscrições (SGDI), desenvolvido com Python, Django e Django REST Framework.

## Tecnologias utilizadas

* Python 3.14
* Django 6.1.2
* Django REST Framework 3.18.3
* SimpleJWT 5.5.1
* PostgreSQL (integração pendente)

## Pré-requisitos

Antes de executar o projeto, é necessário ter instalado:

* Python compatível com a versão utilizada no projeto.
* Git.

## Como executar o projeto

### 1. Acessar o diretório do backend

Na raiz do repositório, execute:

```bash
cd backend
```

### 2. Criar o ambiente virtual

Caso ainda não exista um ambiente virtual, execute:

```bash
python -m venv .venv
```

### 3. Ativar o ambiente virtual

No Windows, utilizando Git Bash:

```bash
source .venv/Scripts/activate
```

### 4. Instalar as dependências

Com o ambiente virtual ativado, execute:

```bash
python -m pip install -r requirements.txt
```

O arquivo `requirements.txt` contém as dependências e as versões utilizadas no projeto.

### 5. Configurar as variáveis de ambiente

Crie ou configure o arquivo `.env` no diretório `backend`, conforme as variáveis utilizadas em `config/settings.py`.

Preencha os valores necessários para o ambiente de execução.

**Importante:** não compartilhe o arquivo `.env` nem envie senhas ou chaves secretas para o repositório.

### 6. Verificar a configuração do Django

Execute:

```bash
python manage.py check
```

Se estiver tudo certo, o resultado será semelhante a:

```text
System check identified no issues (0 silenced).
```

### 7. Iniciar o servidor de desenvolvimento

Execute:

```bash
python manage.py runserver
```

Por padrão, o servidor estará disponível em:

`http://127.0.0.1:8000/`

Para interromper a execução, pressione `Ctrl + C` no terminal.

## Estrutura do projeto

```text
backend/
├── config/
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
├── usuarios/
│   ├── migrations/
│   │   └── 0001_initial.py
│   ├── models.py
│   └── urls.py
├── manage.py
└── requirements.txt
```

O arquivo `.env` é utilizado localmente e não deve ser versionado.

## Funcionalidades implementadas até o momento

* Estrutura inicial do projeto Django.
* Aplicação `usuarios`.
* Modelo personalizado de usuário, com autenticação por e-mail.
* Configuração inicial do Django REST Framework.
* Configuração da autenticação JWT.
* Rotas iniciais para obtenção e renovação de tokens.

### Rotas de autenticação configuradas

| Método | Endpoint                       | Finalidade                            |
| ------ | ------------------------------ | ------------------------------------- |
| POST   | `/api/usuarios/login/`         | Autenticação e obtenção de tokens JWT |
| POST   | `/api/usuarios/token/refresh/` | Renovação do access token             |

Esses endpoints estão configurados, mas ainda precisam ser testados com um usuário cadastrado e o banco de dados preparado.

## Banco de dados

A configuração atual utiliza SQLite como banco de dados local.

A integração com PostgreSQL está pendente da configuração de acesso ao banco utilizado pelo projeto.

A migração inicial do modelo `Usuario` já foi criada, mas ainda não foi aplicada ao banco de dados.

## Próximas etapas

* Configurar a conexão com o PostgreSQL.
* Aplicar as migrações no banco definitivo.
* Testar o login e a geração de tokens JWT.
* Implementar e testar rotas protegidas.
* Implementar o gerenciamento de usuários pelo responsável pelo sistema.

# Frontend

Frontend do SGDI, desenvolvido com HTML, CSS e JavaScript, usando Bootstrap nos componentes.

## Como executar o frontend

1. Abra a pasta do repositório no VS Code.
2. Clique em **Go Live** (extensão Live Server).
3. Acesse `http://127.0.0.1:5500/frontend/index.html`.

Por enquanto o frontend simula o sistema: o login aceita qualquer e-mail e senha válidos, e as inscrições vêm do arquivo `.zip` importado, guardadas no navegador (localStorage e IndexedDB).

## Bibliotecas

As bibliotecas são carregadas por CDN, sem instalação:

| Biblioteca        | Para que serve                             |
| ----------------- | ------------------------------------------ |
| Bootstrap 5.3.8   | Componentes e grid das telas               |
| JSZip 3.10.1      | Abrir o `.zip` das inscrições no navegador |
| html2canvas 1.4.1 | Exportar o relatório em JPEG               |

## Estrutura

```text
frontend/
├── index.html        login
├── importar.html     importar o .zip e processos recentes
├── inscricoes.html   lista de inscrições do processo
├── inscricao.html    revisão dos documentos de uma inscrição
├── acessos.html      pessoas com acesso e distribuição das inscrições
├── relatorio.html    relatório de homologação
├── css/              base.css (tema e estilos comuns) + um arquivo por tela
└── js/               dados.js (funções comuns), topo.js (barra do topo) + um arquivo por tela
```

## O que mudou com o Bootstrap

* **Carregamento:** todo HTML carrega o CSS do Bootstrap antes do `base.css` e o JS do Bootstrap antes dos nossos scripts.
* **Tema:** o `base.css` passa as cores e a fonte do SGDI para as variáveis do Bootstrap (`--bs-...`). O visual do Figma foi mantido.
* **Botões:** `.botao`, `.botao-secundario`, `.botao-perigo` e `.botao-neutro` viraram `btn-primary`, `btn-outline-primary`, `btn-danger` e `btn-outline-secondary`.
* **Campos:** usam `form-label` e `form-control`. O erro usa `is-invalid` e `invalid-feedback` no lugar da classe `campo-erro`.
* **Cartões:** `.cartao` virou `card`.
* **Menu:** virou um `dropdown`. O código que abria e fechava o menu saiu do `topo.js`.
* **Janelas de confirmação:** as de excluir processo e remover acesso viraram `modal`. Saíram do `importar.js` e do `acessos.js` os blocos de Cancelar, Esc e clique fora.
* **Aviso no pé da tela:** o `mostrarAviso` agora usa um `toast`, e as telas chamam ele do mesmo jeito.
* **Grid:** o login e o formulário de novo acesso usam `row` e `col`, e se ajustam ao celular.
* **Outros componentes:** OK e Não OK ficaram num `btn-group`, a opção de incluir o nome no relatório virou `form-check` e o aviso de pendentes virou `alert`.
* **O que não mudou:** a lógica das telas e os arquivos `dados.js`, `inscricoes.js`, `inscricao.js` e `relatorio.js`. A prévia do relatório não usa classes do Bootstrap, para o JPEG, o Word e o PDF saírem iguais.

## Vantagens do Bootstrap

* **Menos código próprio:** estilos que se repetiam em várias telas agora vêm prontos (o `login.css`, por exemplo, caiu de 146 para 80 linhas).
* **Menos JavaScript:** menu, janelas e avisos já abrem, fecham e respondem ao Esc sozinhos.
* **Responsivo:** o grid ajusta as telas ao celular sem media queries escritas à mão.
* **Padrão:** botões, campos e mensagens de erro ficam iguais em todas as telas, e quem entra no projeto já conhece as classes.
* **Acessibilidade:** os componentes já vêm com foco pelo teclado e atributos para leitores de tela.
