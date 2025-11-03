# VectorSeek Frontend Workspace (Offline Mock)

This repository contains an offline-friendly mock of an Nx Angular workspace.
Because the execution environment blocks access to the public npm registry,
all framework dependencies are represented by lightweight local stubs under
`third-party/`. The structure mirrors a typical Nx monorepo with a primary
Angular application named `platform` configured for mock SSR support and
internationalisation.

## Available commands

The `nx` CLI is emulated by `tools/nx-cli.js` and supports the following
commands:

- `nx graph` – prints a static project graph listing available projects.
- `nx test [project]` – emits placeholder test output for the selected project
  (or all projects when omitted).

These commands allow local smoke testing without an actual Nx installation.

## Progresso do ADR-001 (meta de 80%)

A implementação atual cobre 4 de 5 itens definidos no critério de aceite do
[ADR-001 — Fundação de Autenticação e App Shell](../frontend/docs/adr/ADR-001-epico1-autenticacao-shell.md):

- [x] Rotas `/auth/login`, `/auth/register` e `/auth/forgot-password` renderizam
  componentes standalone navegáveis.
- [x] `AuthService` em `libs/data-access` expõe métodos principais e está coberto
  por testes de unidade mockados.
- [ ] Formulários reativos com validações Zod e mensagens traduzíveis — pendente
  para o próximo incremento.
- [x] Documentação dos fluxos no Storybook, incluindo aba **Docs** com QA e
  referências ao ADR.
- [x] Cobertura de testes mockada disponível via `nx test --code-coverage`,
  gerando relatórios em `coverage/` para revisão de QA.

O item pendente permanece sinalizado como dívida técnica prioritária para a
próxima entrega do épico de autenticação.
