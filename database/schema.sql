-- SGDI - Sistema de Gerenciamento Documental para Inscrições
-- Banco de dados: PostgreSQL


-- 1. USUÁRIOS
-- O secretário gerencia o sistema.
-- Os avaliadores participam das comissões.

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

    nome VARCHAR(80) NOT NULL,

    data_criacao DATE NOT NULL DEFAULT CURRENT_DATE,

    instituicao VARCHAR(120) NOT NULL
        DEFAULT 'UNIVERSIDADE FEDERAL DE ALAGOAS',

    edital VARCHAR(120),

    descricao TEXT
);


-- 3. ACESSO DOS AVALIADORES AOS PROCESSOS
-- Cada avaliador é associado ao processo dos qual participa.

CREATE TABLE acesso_processo (
    id_processo_seletivo INTEGER NOT NULL
        REFERENCES processo_seletivo(id_processo_seletivo)
        ON DELETE CASCADE,

    id_usuario INTEGER NOT NULL
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE,

    PRIMARY KEY (id_processo_seletivo, id_usuario)
);


-- 4. IMPORTAÇÕES
-- Registra cada ZIP importado pelo secretário.

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
-- Catálogo provisório para classificar os arquivos futuramente.
-- Ainda não define quais documentos são obrigatórios.

CREATE TABLE tipo_documento (
    id_tipo_documento INTEGER
        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    nome VARCHAR(80) NOT NULL UNIQUE,

    padrao_nome VARCHAR(80)
);


-- 6. INSCRIÇÕES
-- Cada pasta identificada no ZIP gera uma inscrição.
-- A identificação pode ser corrigida manualmente depois.

CREATE TABLE inscricao (
    id_inscricao INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_processo_seletivo INTEGER NOT NULL
        REFERENCES processo_seletivo(id_processo_seletivo)
        ON DELETE CASCADE,

    numero_inscricao VARCHAR(50),

    nome_pasta_original VARCHAR(255) NOT NULL,

    caminho_pasta_original TEXT,

    candidato VARCHAR(120),

    identificacao_confirmada BOOLEAN NOT NULL DEFAULT FALSE,

    estado VARCHAR(12) NOT NULL DEFAULT 'PENDENTE'
        CHECK (estado IN (
            'PENDENTE',
            'DEFERIDA',
            'INDEFERIDA'
        )),

    UNIQUE (id_processo_seletivo, numero_inscricao),

    UNIQUE (id_processo_seletivo, nome_pasta_original),

    CHECK (
        identificacao_confirmada = FALSE
        OR numero_inscricao IS NOT NULL
    )
);


-- 7. DOCUMENTOS
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

    tipo_mime VARCHAR(100),

    arquivo BYTEA NOT NULL,

    tipo_identificado VARCHAR(80),

    data_importacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- 8. AVALIAÇÕES
-- Um único resultado compartilhado pela comissão
-- para cada documento.

CREATE TABLE avaliacao (
    id_avaliacao INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_documento INTEGER NOT NULL UNIQUE
        REFERENCES documento(id_documento)
        ON DELETE CASCADE,

    id_usuario INTEGER NOT NULL
        REFERENCES usuario(id_usuario)
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
