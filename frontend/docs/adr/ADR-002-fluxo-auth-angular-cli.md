# ADR-002 — Camadas do fluxo de autenticação no Angular CLI

## Contexto

A atividade **E1-A1 · Configurar módulo de autenticação** precisava avançar para
implementação efetiva, porém o time mantinha duas bases paralelas: um workspace
Nx mockado (`vectorseek-frontend/`) e a aplicação Angular CLI
(`vectorseek-platform/`). Essa duplicidade gerava dúvidas sobre onde evoluir o
código, dificultava a leitura das notas do Obsidian e atrasava a definição de um
roteiro claro para os fluxos de autenticação (login, cadastro, recuperação de
acesso). Além disso, o módulo de autenticação carecia de um recorte em camadas
que permitisse distribuir o trabalho em atividades menores e rastreáveis.

## Decisão

1. **Concentrar o desenvolvimento no Angular CLI (`vectorseek-platform/`)**,
   suspendendo o uso do workspace Nx mockado até que a fundação de autenticação
   esteja estável.
2. **Organizar a entrega da E1-A1 em quatro camadas complementares**:
   apresentação, aplicação, experiência e qualidade, cada uma representada pelas
   atividades E1-A1-1 a E1-A1-4.
3. **Manter os componentes standalone e roteamento dedicado** na camada de
   apresentação, garantindo lazy loading em `src/app/auth`.
4. **Encapsular integrações HTTP e modelos tipados** em
   `src/app/auth/services`, incluindo testes com `HttpClientTestingModule` para a
   camada de aplicação.
5. **Aplicar formulários reativos com validação Zod e i18n** em `src/app/auth`,
   reforçando a camada de experiência conforme diretrizes de UX e acessibilidade.
6. **Documentar os fluxos no Storybook e monitorar cobertura mínima de 70%**,
   compondo a camada de qualidade e estabelecendo critérios objetivos de aceite.
7. **Atualizar as notas do Obsidian** para refletir o novo recorte em camadas e
   apontar os ADRs como fonte única de decisão.

## Justificativa

- Centralizar no Angular CLI elimina divergências entre ambientes e simplifica o
  onboarding de quem dará continuidade ao fluxo de autenticação.
- O recorte em camadas facilita a paralelização das atividades, reforçando o
  alinhamento com o backlog do Obsidian e oferecendo checkpoints claros de
  evolução.
- Preservar componentes standalone e serviços tipados mantém a arquitetura
  preparada para futura migração para Nx sem retrabalho significativo.
- Validar formulários com Zod e internacionalização desde o início reduz
  inconsistências com o backend e melhora a experiência do usuário final.
- Storybook e cobertura de testes fornecem visibilidade e confiança para o time
  de QA, assegurando o critério de aceite de 80% estabelecido anteriormente.

## Consequências

- O workspace Nx ficará desatualizado até que se planeje uma migração ou
  sincronização posterior; riscos e pendências deverão ser rastreados como
  follow-ups.
- As rotinas de build e teste devem ser revisitadas para garantir que `ng test`,
  `ng build` e `ng run storybook:serve` atendam às novas exigências de qualidade.
- A dependência de bibliotecas adicionais (`@ngx-translate/core`,
  `@colsen1996/ng-zod-form`) exige alinhamento com o time de backend para definir
  contratos de validação e mensagens padronizadas.

## Plano de ação imediato

1. E1-A1-1 — provisionar rotas e componentes standalone (`src/app/auth`).
2. E1-A1-2 — implementar serviços HTTP e modelos tipados (`src/app/auth/services`).
3. E1-A1-3 — configurar formulários com Zod e internacionalização.
4. E1-A1-4 — documentar fluxos no Storybook e garantir cobertura mínima de 70%.

## Status

Aceita — decisões vigentes enquanto a atividade E1-A1 estiver em execução no
Angular CLI.
