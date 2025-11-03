# Épicos do Frontend VectorSeek (Angular)

Este documento traduz o planejamento funcional do VectorSeek para uma organização em épicos pensada para uma base Angular (v17+ com componentes standalone, SSR habilitado e integração com Nx para monorepo). Cada épico agrupa entregáveis de alto nível e lista atividades técnicas que podem ser convertidas em histórias do backlog. As descrições consideram a stack sugerida: Angular, Angular Universal, Tailwind CSS, NgRx Signal Store para estado global, Angular Material + CDK para acessibilidade e Storybook para documentação de componentes.

## Estrutura Geral do Workspace

- **Workspace Nx**: `npx create-nx-workspace vectorseek-frontend --preset=angular-monorepo`.
- **Aplicação principal**: `apps/platform` com SSR (`ng add @nguniversal/express-engine`) e roteamento baseado em `AppShellLayoutComponent`.
- **Bibliotecas compartilhadas**:
  - `libs/ui` para componentes atômicos (botões, tabelas, gráficos) documentados no Storybook.
  - `libs/data-access` com serviços REST (Axios compatível via `@angular/common/http` interceptors).
  - `libs/state` para stores NgRx Signal Store com efeitos side-effect free.
- **Configuração de autenticação**: interceptores HTTP para bearer token + refresh, guardas de rota (`AuthGuard`, `PlanGuard`).
- **Internacionalização**: `@ngx-translate/core` com arquivos JSON por módulo e fallback pt-BR.

## Épico 1 — Fundação de Autenticação & Shell da Aplicação

**Objetivo**: entregar experiência inicial autenticada, roteamento protegido e layout base.

### Escopo
- Fluxos de login, cadastro e refresh integrando `/api/auth/*`.
- App shell com `SideNavComponent`, `TopBarComponent` e placeholders de quota.
- Gestão de sessão (tokens, planos, escopos) usando Signal Store + Storage seguro.

### Atividades sugeridas
1. **Configurar módulo de autenticação (`apps/platform/src/app/auth`)**
   - Gerar componentes `LoginPageComponent`, `RegisterPageComponent`, `ForgotPasswordComponent` (placeholder).
   - Implementar `AuthService` em `libs/data-access` usando `HttpClient` + endpoints `login`, `register`, `refresh`, `me`.
2. **Implementar interceptores e guardas**
   - `AuthInterceptor` para anexar Authorization e lidar com 401/429.
   - `TokenRefreshService` com fila de requisições simultâneas.
   - `AuthGuard` (verifica token válido) e `PlanGuard` (gating por escopos).
3. **Construir App Shell**
   - `AppShellLayoutComponent` no módulo `LayoutModule` com Angular Material (`mat-sidenav-container`).
   - Placeholder para consumo de quotas (usando `QuotaSummaryComponent`).
   - Responsive design com Tailwind (grid mobile/desktop).
4. **Definir roteamento público vs protegido**
   - `app.routes.ts` separando rotas `/auth/*` e `/app/*`.
   - Resolver `UserResolver` para precargar dados (`/api/auth/me`).

## Épico 2 — Q&A & Base de Conhecimento

**Objetivo**: permitir perguntas com contexto, histórico e gerenciamento inicial de documentos vetorados.

### Escopo
- Formulário de perguntas com filtros.
- Exibição de respostas com citações e feedback.
- Listagem básica de documentos vetorados.

### Atividades sugeridas
1. **Módulo Q&A (`apps/platform/src/app/qna`)**
   - Componentes: `QuestionComposerComponent`, `CitationListComponent`, `AnswerPanelComponent`.
   - Serviços: `QnaService` (chama `/api/qna/ask`, `/api/qna/history`, `/api/qna/feedback`).
   - Signal store `QnaStore` para estado atual, histórico paginado, status loading.
2. **UI de citações**
   - Implementar accordion com Angular Material para expandir chunks.
   - Adicionar destaque de termos (`<mark>` + pipes customizados).
   - Botão “Copiar resposta” usando `Clipboard` service Angular CDK.
3. **Gestão de documentos**
   - `DocumentTableComponent` consumindo `/api/documents` (quando disponível, fallback mock).
   - Filtros por status, workspace, data de indexação.
4. **Feedback loop**
   - Modal `FeedbackDialogComponent` para rating/comentário após cada resposta.
   - Persistir via `/api/qna/feedback` e mostrar toast com `MatSnackBar`.

## Épico 3 — Geração de Conteúdo & Exportação

**Objetivo**: entregar fluxo de geração de documentos, acompanhamento de tarefas e exportações.

### Escopo
- Wizard de geração textual.
- Monitoramento de progresso assíncrono.
- Exportação PDF/DOCX e gestão de links compartilhados.

### Atividades sugeridas
1. **Wizard de geração (`GenerationModule`)**
   - `GenerationWizardComponent` com etapas (briefing, template, revisão).
   - Integração com `/api/generate/document` usando `ReactiveFormsModule` + Zod schema via `@colsen1996/ng-zod-form`.
   - Exibição de resultado (markdown viewer usando `ngx-markdown`).
2. **Painel de progresso**
   - `GenerationProgressComponent` com polling (RxJS `timer`) para `/api/generate/progress/{task_id}`.
   - Visualização de etapas com `MatStepper` e status textual.
3. **Histórico de geração**
   - `GenerationHistoryComponent` consultando `TaskStatusStore` (endpoint compartilhado) e exibindo custo/provedor.
4. **Exportação**
   - `ExportModule` com `ExportFormComponent` chamando `/api/export/{fmt}`.
   - `ExportStatusComponent` com SSE/polling para `/api/export/status/{task_id}`.
   - Download seguro usando `HttpClient` com `responseType: 'blob'`.
5. **Links compartilhados**
   - `ShareLinksComponent` para criar (`/api/share/create`), listar e revogar (`/api/share/revoke/{token}`).
   - Confirm dialogs com Angular Material `MatDialog`.

## Épico 4 — Dashboard Operacional & Quotas

**Objetivo**: oferecer visão consolidada de consumo, custos e alertas.

### Escopo
- Indicadores de quotas para documentos, tokens, mídia e links.
- Gráficos de custo por provedor/modelo.
- Alertas de budget e telemetria inicial.

### Atividades sugeridas
1. **DashboardModule**
   - `UsageOverviewComponent` agregando `/api/quotas/summary` (ou endpoint equivalente).
   - `CostChartComponent` com `ng2-charts`/Chart.js consumindo métricas do `CostTracker` (Redis + banco).
2. **Alertas de budget**
   - Serviço `BudgetService` consultando `COST_BUDGETS_USD` via endpoint configurável.
   - Componentes `BudgetAlertBanner` e `UpgradePlanModal`.
3. **Telemetry hooks**
   - Instrumentar eventos com `@sentry/angular` ou OpenTelemetry caso backend exponha collector.
   - Gravar logs locais em store para troubleshooting (somente visível para admins).

## Épico 5 — Chat Conversacional & Experiências Multimodais

**Objetivo**: criar experiência de chat persistente com suporte futuro a mídia.

### Escopo
- Lista de conversas, mensagens, override de modelo por mensagem.
- Resumo para mídias.
- Tratamento de quotas específicas (429 QuotaExceeded).

### Atividades sugeridas
1. **ChatModule**
   - Componentes: `ConversationListComponent`, `ConversationViewComponent`, `MessageComposerComponent`.
   - Serviço `ChatService` (`/api/chat/conversations`, `/messages`, `/summarize`).
   - Signal store com normalização (por `conversationId`).
2. **Suporte a modelos por mensagem**
   - Dropdown de seleção de modelo usando dados de `ModelCatalogStore`.
   - Visualização de provider/custo retornado pelo `ConversationService`.
3. **Quota handling**
   - Interceptor para respostas 429 exibindo `QuotaExceededDialogComponent`.
   - Log de tentativas bloqueadas para telemetria.
4. **Resumo multimídia**
   - `SummarizeForMediaDialog` com opções texto/imagem/vídeo/áudio.
   - Renderização de pontos-chave e ratio.

### Backlog detalhado (histórias sugeridas)

As atividades do épico 5 foram exportadas para notas individuais compatíveis com Obsidian, localizadas em `docs/frontend/obsidian`. Cada nota contém metadados (YAML frontmatter), dependências, critérios de aceite e checklists editáveis.

- [E5-A1 · Provisionar biblioteca `chat-data-access`](obsidian/E5-A1.md)
- [E5-A2 · Normalizar estado com Signal Store](obsidian/E5-A2.md)
- [E5-A3 · Construir lista de conversas](obsidian/E5-A3.md)
- [E5-A4 · Implementar visão de conversa](obsidian/E5-A4.md)
- [E5-A5 · Seleção de modelo por mensagem](obsidian/E5-A5.md)
- [E5-A6 · Tratamento de respostas 429 (QuotaExceeded)](obsidian/E5-A6.md)
- [E5-A7 · Suporte a streaming de mensagens](obsidian/E5-A7.md)
- [E5-A8 · Resumo para mídia](obsidian/E5-A8.md)
- [E5-A9 · Auditoria e telemetria de chat](obsidian/E5-A9.md)
- [E5-A10 · Testes end-to-end (Cypress ou Playwright)](obsidian/E5-A10.md)

> Para importar no Obsidian, copie a pasta `docs/frontend/obsidian` para dentro do vault desejado. O arquivo `README.md` do diretório funciona como índice principal e ativa a visualização em grafo considerando o campo `dependencies` das notas.

## Épico 6 — Catálogo de Modelos & Estimativas de Custo

**Objetivo**: permitir descoberta de modelos, filtros e cálculo de custo.

### Escopo
- Listagem filtrável de modelos.
- Detalhes por modelo com validação de plano.
- Ferramenta de estimativa de custo.

### Atividades sugeridas
1. **ModelCatalogModule**
   - `ModelListComponent` consumindo `/api/models` com filtros (capability, provedor, plano mínimo).
   - `ModelCardComponent` exibindo contexto máximo, custo/1k tokens, disponibilidade.
2. **Detalhes de modelo**
   - Rota `/app/models/:id` com `ModelDetailPageComponent` chamando `/api/models/{model_id}`.
   - Tratamento de erros 403/404/503 com componentes dedicados (`AccessDeniedState`, `ModelUnavailableState`).
3. **Estimativa de custo**
   - `CostEstimatorComponent` com formulário (tokens in/out) consumindo `/api/models/estimate-cost`.
   - Exibir breakdown com gráficos de barras.
4. **Roadmap de disponibilidade**
   - Banner informando modelos indisponíveis (OpenAI/Anthropic) com dados do registry.

## Épico 7 — Setup & Operações

**Objetivo**: disponibilizar wizard operacional para validação de ambiente e automações.

### Escopo
- Validação de componentes via `/api/setup/validate`.
- Ações automáticas `/api/setup/fix` e geração de comandos `/api/setup/commands`.
- Exibição de logs e status parcial (HTTP 206).

### Atividades sugeridas
1. **SetupModule**
   - `SetupWizardComponent` com etapas (Ambiente, Banco, Serviços, Resumo).
   - Uso de `CdkStepper` para controle customizado.
2. **Validação e feedback**
   - `ValidationResultPanel` exibindo status por componente (OK, WARNING, ERROR) com ícones Material.
   - Tratamento de respostas 206 exibindo lista de pendências.
3. **Ações automáticas**
   - `FixActionsComponent` permitindo selecionar componentes e disparar `/api/setup/fix`.
   - `CommandGeneratorComponent` gerando comandos com explicações e botão de cópia.
4. **Logs detalhados**
   - `LogDrawerComponent` com `MatExpansionPanel` para exibir logs retornados.

## Considerações sobre Abrir o Código do Frontend

- **Riscos potenciais**: exposição de estratégias proprietárias (UX, fluxos de negócio) e vetores de ataque (rotações de token, tratamento de quotas) caso o repositório seja público.
- **Mitigações**:
  - Manter repositório privado ou usar licença que restrinja uso comercial (ex.: BUSL, SSPL) se optar por abrir parcialmente.
  - Isolar configurações sensíveis (chaves, endpoints internos) em variáveis de ambiente e não commitá-las.
  - Caso deseje publicar componentes genéricos, extrair para biblioteca separada sem lógica de negócio específica.
- **Benefícios do código aberto**: comunidade pode contribuir com correções/UX, aumenta transparência de segurança, facilita recrutamento. Avalie trade-off entre vantagem competitiva e colaboração.

---

> **Próximos passos**: priorizar épicos conforme roadmap (Fase 1 → Épicos 1-3, Fase 2 → 4-6, Fase 3 → 5 expansão multimídia) e criar histórias detalhadas no board (Jira/Azure Boards) reutilizando atividades acima como referência.
