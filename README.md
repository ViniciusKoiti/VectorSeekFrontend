# VectorSeek Frontend

## 📌 Contexto

Este repositório concentra experimentos e documentação do frontend do VectorSeek.
A meta atual é estruturar o **Épico 1 — Fundação de Autenticação & App Shell**
seguindo as decisões registradas nos ADR-001 e ADR-002 e evoluindo gradualmente
o módulo de autenticação em Angular.

## 🗂️ Estrutura principal

| Diretório | Descrição |
|-----------|-----------|
| `frontend/` | Documentação de apoio (Obsidian) e os ADRs oficiais do produto. |
| `frontend/docs/adr/` | Registro de decisões arquiteturais. Os ADR-001 e ADR-002 detalham a fundação e o fluxo de autenticação. |
| `frontend/obsidian/` | Notas operacionais sincronizadas com o backlog. `E1-A1.md` concentra o planejamento em execução. |
| `vectorseek-platform/` | Aplicação Angular CLI oficial para o desenvolvimento do fluxo de autenticação. |

## 📚 Documentação baseada em ADR

Estamos migrando toda a documentação técnica para um único fluxo baseado em
**Architectural Decision Records (ADR)**. O documento de referência é:

- [ADR-001 — Fundação de Autenticação e App Shell](frontend/docs/adr/ADR-001-epico1-autenticacao-shell.md)
- [ADR-002 — Camadas do fluxo de autenticação no Angular CLI](frontend/docs/adr/ADR-002-fluxo-auth-angular-cli.md)

Sempre que novas decisões forem tomadas, atualize o ADR correspondente antes de
criar arquivos Markdown adicionais. As notas de atividades (como `frontend/obsidian/E1-A1.md`)
devem apenas contextualizar o trabalho em curso e apontar para os ADRs.

## 🚀 Como executar a aplicação Angular CLI

1. `cd vectorseek-platform`
2. `npm install`
3. `npm start` — sobe o shell de autenticação standalone

Essa aplicação é a referência oficial para validar UX, roteamento e integrações
do fluxo de autenticação descrito no Épico 1.

## 🎯 Estado do Épico 1 — E1-A1

- `frontend/obsidian/E1-A1.md` está **em progresso**, consolidando o inventário
  de ativos reaproveitáveis e as próximas ações alinhadas aos ADR-001 e ADR-002.
- As rotas standalone e componentes de autenticação residem em
  `vectorseek-platform/src/app/auth` e serão evoluídas incrementalmente nas
  próximas atividades.
- O `AuthService` será implementado diretamente no projeto Angular CLI,
  eliminando a dependência do workspace Nx mockado.

## 🛠️ Próximos passos recomendados

1. Evoluir formulários reativos com `@colsen1996/ng-zod-form` e traduções via
   `@ngx-translate/core`, conforme descrito nos ADR-001 e ADR-002.
2. Consolidar cobertura de testes e documentação de QA diretamente na camada de
   autenticação do Angular CLI, seguindo as diretrizes do ADR-002.
3. Atualizar os ADRs sempre que riscos ou exceções temporárias forem
   identificados, evitando a criação de novos documentos paralelos.
