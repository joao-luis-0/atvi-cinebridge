# Cinebridge — Recomendação de Equipes

Microsserviço acadêmico em **Node.js, TypeScript e Fastify** para recomendar profissionais e formar equipes de projetos audiovisuais.

## Padrões de projeto

| Atividade | Padrões |
|---|---|
| ATVI | Strategy, Template Method, Observer, Visitor |
| ATVII | Prototype, Factory Method, Abstract Factory |
| ATVIII | Adapter, Composite, Decorator |

A ATVIII acrescenta integrações simuladas (armazenamento, pagamentos e cadastros), pacotes aninhados de serviços e decoradores de cache, auditoria e compressão gzip. Para profissionais sem histórico ou avaliações, a orquestração admite um **fallback de início de cadastro** quando a filtragem colaborativa não encontra pontuação positiva, respeitando especialidades e orçamento.

## Executar

É necessário ter Node.js e npm instalados.

```bash
npm ci
npm run dev
```

- Saúde da API: `GET http://localhost:3000/health`
- Recomendações: `POST http://localhost:3000/recomendacoes`

## Verificar

```bash
npm run build
npm test -- --runInBand
npm run test:coverage -- --runInBand
```

Na revisão de 02/11/2026, a compilação passou e **187 testes passaram (36 suítes)**. Cobertura Jest: **95,63% das instruções**, **83,54% dos ramos**, **94,71% das funções** e **96,66% das linhas**. Esses números são da execução local da revisão, não uma garantia para ambientes diferentes.

## Banco de dados

A API funciona **sem PostgreSQL**, em memória. O projeto contém entidades TypeORM e opção de registrar solicitações e respostas em PostgreSQL, mas **a persistência integral de projetos, profissionais, equipes e convites ainda não está implementada**. Configurações de referência estão em `.env.example`; o processo precisa receber essas variáveis de ambiente para habilitar a persistência. Não publique senhas ou arquivos `.env`.

## Organização

- `src/`: domínio, aplicação, adaptadores, persistência e API HTTP
- `tests/`: testes unitários e de integração
- `scripts/`: verificações auxiliares e benchmark

Projeto acadêmico — Cinebridge.
