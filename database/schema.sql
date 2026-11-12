-- SGDI - Sistema de Gerenciamento Documental para Inscrições
-- Banco de dados: PostgreSQL


-- 1. USUÁRIOS
-- O secretário(tiago) gerencia o sistema.
-- Os avaliadores participam das comissões.
-- Regras que dependem do perfil são validadas pela API, sem duplicar o perfil
-- em tabelas relacionadas.

CREATE TABLE usuario (
    id_usuario INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(80) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    senha_hash VARCHAR(128) NOT NULL,

    tipo_usuario VARCHAR(20) NOT NULL
        CHECK (tipo_usuario IN ('SECRETARIO', 'AVALIADOR'))
);


-- 2. PROCESSOS SELETIVOS
-- Cada processo representa uma seleção específica.

CREATE TABLE processo_seletivo (
    id_processo_seletivo INTEGER
        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_usuario_responsavel INTEGER NOT NULL
        REFERENCES usuario(id_usuario)
        ON DELETE RESTRICT,

    nome VARCHAR(80) NOT NULL,

    data_criacao DATE NOT NULL DEFAULT CURRENT_DATE,

    semestre VARCHAR(20),

    instituicao VARCHAR(120) NOT NULL
        DEFAULT 'UNIVERSIDADE FEDERAL DE ALAGOAS',

    edital VARCHAR(120),

    titulo_relatorio VARCHAR(120),

    texto_cabecalho TEXT,

    descricao TEXT
);


-- 3. ACESSO DOS AVALIADORES AOS PROCESSOS
-- Cada avaliador é associado ao processo dos qual participa.

CREATE TABLE acesso_processo (
    id_processo_seletivo INTEGER NOT NULL
        REFERENCES processo_seletivo(id_processo_seletivo)
        ON DELETE CASCADE,

    id_usuario INTEGER NOT NULL,

    FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE,

    PRIMARY KEY (id_processo_seletivo, id_usuario)
);


-- 4. IMPORTAÇÕES
-- Registra cada ZIP importado pelo secretário.
-- A API deve validar o perfil do usuário que iniciou a importação.

CREATE TABLE importacao (
    id_importacao INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_processo_seletivo INTEGER NOT NULL
        REFERENCES processo_seletivo(id_processo_seletivo)
        ON DELETE CASCADE,

    id_usuario INTEGER NOT NULL
        REFERENCES usuario(id_usuario)
        ON DELETE RESTRICT,

    nome_arquivo_zip VARCHAR(255) NOT NULL,

    data_inicio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    data_fim TIMESTAMP,

    status VARCHAR(25) NOT NULL DEFAULT 'PROCESSANDO'
        CHECK (status IN (
            'PROCESSANDO',
            'CONCLUIDA',
            'CONCLUIDA_COM_ERROS',
            'FALHOU'
        )),

    mensagem_erro TEXT
);


-- 5. TIPOS DE DOCUMENTOS
-- Catálogo provisório para classificar os arquivos futuramente. (quase impossivel, nomeação aleatoriq)
-- Ainda não define quais documentos são obrigatórios. 

CREATE TABLE tipo_documento (
    id_tipo_documento INTEGER
        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    nome VARCHAR(80) NOT NULL UNIQUE,

    padrao_nome VARCHAR(80)
);


-- 6. INSCRIÇÕES
-- Cada pasta identificada no ZIP gera uma inscrição.
-- O resultado final é calculado a partir das avaliações dos documentos.

CREATE TABLE inscricao (
    id_inscricao INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_processo_seletivo INTEGER NOT NULL
        REFERENCES processo_seletivo(id_processo_seletivo)
        ON DELETE CASCADE,

    numero_inscricao VARCHAR(50),

    nome_pasta_original VARCHAR(255) NOT NULL,

    caminho_pasta_original TEXT,

    candidato VARCHAR(120),

    UNIQUE (id_processo_seletivo, numero_inscricao),

    UNIQUE (id_processo_seletivo, nome_pasta_original)
);


-- 7. DISTRIBUIÇÃO DAS INSCRIÇÕES
-- Mantém o histórico de distribuição; somente uma atribuição pode estar ativa.
-- A API valida que o avaliador pertence à comissão do processo.

CREATE TABLE distribuicao_inscricao (
    id_distribuicao INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_inscricao INTEGER NOT NULL
        REFERENCES inscricao(id_inscricao)
        ON DELETE CASCADE,

    id_usuario INTEGER NOT NULL
        REFERENCES usuario(id_usuario)
        ON DELETE RESTRICT,

    data_distribuicao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    ativa BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE UNIQUE INDEX uq_distribuicao_inscricao_ativa
    ON distribuicao_inscricao (id_inscricao)
    WHERE ativa;

CREATE INDEX idx_distribuicao_inscricao_avaliador_ativo
    ON distribuicao_inscricao (id_usuario)
    WHERE ativa;


-- 8. DOCUMENTOS
-- Armazena os arquivos encontrados no ZIP.
-- O tipo do documento pode ficar desconhecido inicialmente.

CREATE TABLE documento (
    id_documento INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_inscricao INTEGER NOT NULL
        REFERENCES inscricao(id_inscricao)
        ON DELETE CASCADE,

    id_importacao INTEGER
        REFERENCES importacao(id_importacao)
        ON DELETE SET NULL,

    id_tipo_documento INTEGER
        REFERENCES tipo_documento(id_tipo_documento)
        ON DELETE RESTRICT,

    nome_arquivo_original VARCHAR(255) NOT NULL,

    caminho_original TEXT NOT NULL,

    tipo_mime VARCHAR(100), -- pdf, jpg, png, docx, etc

    arquivo BYTEA NOT NULL,

    data_importacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documento_inscricao
    ON documento (id_inscricao);


-- 9. AVALIAÇÕES
-- O avaliador responsável registra o resultado dos documentos
-- da inscrição que recebeu na distribuição. O responsável é obtido
-- pela relação entre documento, inscrição e distribuição. A API deve validar
-- que a distribuição é ativa e pertence à mesma inscrição do documento.

CREATE TABLE avaliacao (
    id_avaliacao INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_documento INTEGER NOT NULL UNIQUE
        REFERENCES documento(id_documento)
        ON DELETE CASCADE,

    id_distribuicao INTEGER NOT NULL
        REFERENCES distribuicao_inscricao(id_distribuicao)
        ON DELETE RESTRICT,

    resultado VARCHAR(10) NOT NULL
        CHECK (resultado IN ('OK', 'NAO_OK')),

    observacao TEXT,

    data_avaliacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK (
        resultado <> 'NAO_OK'
        OR NULLIF(BTRIM(observacao), '') IS NOT NULL
    )
);


-- 10. STATUS DAS INSCRIÇÕES
-- O status é derivado das avaliações para evitar armazenar um valor duplicado.
-- Qualquer avaliação NAO_OK torna a inscrição indeferida; todas as avaliações
-- OK tornam-na deferida; inscrições sem documentos ou com avaliação incompleta
-- permanecem pendentes.

CREATE VIEW inscricao_com_status AS
SELECT
    i.id_inscricao,
    i.id_processo_seletivo,
    i.numero_inscricao,
    i.nome_pasta_original,
    i.candidato,
    COUNT(d.id_documento) AS total_documentos,
    COUNT(a.id_avaliacao) AS documentos_avaliados,
    COUNT(
        CASE
            WHEN a.resultado = 'NAO_OK' THEN a.id_avaliacao
        END
    ) AS documentos_nao_ok,
    CASE
        WHEN COUNT(
            CASE
                WHEN a.resultado = 'NAO_OK' THEN a.id_avaliacao
            END
        ) > 0 THEN 'INDEFERIDA'
        WHEN COUNT(d.id_documento) > 0
            AND COUNT(a.id_avaliacao) = COUNT(d.id_documento)
            THEN 'DEFERIDA'
        ELSE 'PENDENTE'
    END AS status
FROM inscricao AS i
LEFT JOIN documento AS d
    ON d.id_inscricao = i.id_inscricao
LEFT JOIN avaliacao AS a
    ON a.id_documento = d.id_documento
GROUP BY
    i.id_inscricao,
    i.id_processo_seletivo,
    i.numero_inscricao,
    i.nome_pasta_original,
    i.candidato;

-- Contadores por processo para a listagem de inscrições.
CREATE VIEW contagem_inscricao_por_status AS
SELECT
    id_processo_seletivo,
    status,
    COUNT(*) AS total_inscricoes
FROM inscricao_com_status
GROUP BY
    id_processo_seletivo,
    status;
