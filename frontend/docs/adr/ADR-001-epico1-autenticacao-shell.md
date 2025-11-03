# ADR-001 — Fundação de Autenticação e App Shell

## Contexto

O roadmap do VectorSeek prevê um conjunto amplo de funcionalidades voltadas à descoberta de conhecimento baseado em IA. Antes de evoluir para fluxos avançados (Q&A, geração de conteúdo e dashboards), é necessário estabelecer uma fundação sólida que garanta autenticação segura, gestão de sessão e um layout consistente capaz de sustentar futuras jornadas do usuário. O documento de épicos (`frontend/epicos.md`) descreve o **Épico 1 — Fundação de Autenticação & Shell da Aplicação**, com atividades detalhadas nas notas do Obsidian, em especial a **E1-A1 · Configurar módulo de autenticação**.

Os requisitos de negócio destacam:

- Fluxos de login, cadastro e recuperação de acesso integrados aos endpoints `/api/auth/*`.
- Manutenção segura de tokens e dados de sessão com renovação transparente.
- Estrutura de roteamento que separe áreas públicas (`/auth/*`) e privadas (`/app/*`), fornecendo base para guardas de acesso e quotas.
- Internacionalização desde o primeiro incremento, garantindo mensagens amigáveis em pt-BR.

## Decisão

1. **Criar o módulo de autenticação standalone** dentro de `apps/platform/src/app/auth`, utilizando componentes autônomos do Angular 17+ e roteamento dedicado para `LoginPageComponent`, `RegisterPageComponent` e `ForgotPasswordComponent`.
2. **Centralizar integrações HTTP em `libs/data-access`**, expondo um `AuthService` tipado com modelos compartilhados (login, cadastro, refresh, perfil) e preparado para lidar com respostas de erro padronizadas.
3. **Adotar formulários reativos com validação via Zod** (`@colsen1996/ng-zod-form`) para alinhar o front com os contratos do backend e permitir feedback instantâneo ao usuário.
4. **Preparar infraestrutura de internacionalização** com `@ngx-translate/core`, estabelecendo o namespace `auth` para mensagens dos formulários e erros provenientes da API.
5. **Definir critérios de qualidade mínimos** para a primeira entrega: cobertura de testes unitários dos serviços HTTP, documentação dos fluxos no Storybook (`docs tab`) e estruturação inicial das rotas públicas.

## Justificativa

- O módulo standalone isola responsabilidades, facilita lazy loading e mantém o app shell enxuto para futuras expansões de layout.
- Concentrar acessos à API em `libs/data-access` favorece reutilização e testabilidade, respeitando a arquitetura Nx proposta em `epicos.md`.
- A validação com Zod evita divergências entre front e back, reduzindo retrabalho durante homologação.
- A tradução antecipada melhora a experiência do usuário final e prepara terreno para múltiplos idiomas exigidos por clientes enterprise.
- Os critérios de qualidade propostos promovem confiança na fundação da aplicação, permitindo que demais épicos reaproveitem padrões definidos aqui.

## Consequências

- Exige configuração inicial de dependências adicionais (`@ngx-translate/core`, `@colsen1996/ng-zod-form`), aumentando ligeiramente o esforço de bootstrap.
- Adoção de Signal Store para sessão será detalhada nas atividades subsequentes do Épico 1 (E1-A2 em diante), mas depende desta base para funcionar corretamente.
- A documentação em Storybook demanda pipeline de CI para publicação futura; entretanto, já garante alinhamento de UX/QA nas primeiras iterações.

## Critério de aceite (80%)

Consideraremos a atividade E1-A1 aceita quando, ao executar o checklist abaixo, pelo menos 80% dos itens estiverem concluídos com evidências registradas em PR ou documentação de QA:

1. Rotas `/auth/login`, `/auth/register` e `/auth/forgot-password` navegáveis e renderizando componentes standalone.
2. `AuthService` com métodos `login`, `register`, `requestMagicLink`, `refresh` e `me`, coberto por testes em `HttpClientTestingModule`.
3. Formulários reativos com validações Zod e mensagens traduzíveis (namespace `auth`).
4. Documentação dos fluxos no Storybook com instruções de QA.
5. Cobertura de testes mínima acordada (>=70%) para `libs/data-access/auth`.

A conclusão de quatro dos cinco itens (80%) habilita o aceite parcial da atividade, permitindo avanço para guardas, interceptores e app shell. Itens remanescentes devem ser tratados como dívidas técnicas priorizadas no sprint subsequente.

## Status

Proposta — aguardando validação da liderança técnica e do time de produto para prosseguir com implementação.
