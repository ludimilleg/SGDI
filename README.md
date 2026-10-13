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
