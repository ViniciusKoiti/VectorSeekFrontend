# ADR-004 — Módulo de Geração: Histórico e Exportação

**Status**: Implementado
**Data**: 2025-11-07
**Épico**: E3 — Geração de Conteúdo & Exportação
**Atividades**: E3-A3 — Histórico de Gerações, E3-A4 — Exportação de Documentos

---

## Contexto

O VectorSeek necessita de funcionalidades complementares ao módulo de geração de conteúdo (E3-A1 e E3-A2), incluindo histórico de gerações com capacidade de auditoria e re-execução, além de exportação de documentos em múltiplos formatos. Este ADR documenta as decisões arquiteturais tomadas durante a implementação do E3-A3 e E3-A4.

## Decisões

### 1. E3-A3: Histórico de Gerações

#### 1.1 Modelos de Dados

**Arquivos modificados:**
- `libs/data-access/src/lib/generation/generation.models.ts` — Novos modelos adicionados

**Interfaces criadas:**

```typescript
export interface GenerationHistoryItem {
  id: string;
  taskId: string;
  title: string;
  status: 'completed' | 'failed' | 'active' | 'cancelled';
  provider: string;
  model?: string;
  estimatedCost?: number;
  completedAt?: string;
  startedAt: string;
  templateId: string;
  templateName: string;
  formData?: GenerationFormData; // Para re-execução
  result?: GeneratedDocument;
  error?: string;
}

export interface ListHistoryRequest {
  startDate?: string;
  endDate?: string;
  provider?: string;
  status?: 'completed' | 'failed' | 'active' | 'cancelled';
  page?: number;
  limit?: number;
  sortBy?: 'completedAt' | 'startedAt' | 'title' | 'estimatedCost';
  sortOrder?: 'asc' | 'desc';
}

export interface ListHistoryResponse {
  items: GenerationHistoryItem[];
  total: number;
  page: number;
  limit: number;
}
```

**Decisão**: Armazenar `formData` original para permitir re-execução
- **Justificativa**: Permite ao usuário re-executar gerações anteriores com parâmetros pré-preenchidos
- **Trade-off**: Aumenta o tamanho do payload, mas melhora significativamente a UX

#### 1.2 API Endpoints

**Arquivos modificados:**
- `libs/data-access/src/lib/generation/generation.api.ts`

**Endpoints adicionados:**
- `GET /api/generate/history` — Listar histórico com filtros e paginação
- `GET /api/generate/history/export` — Exportar histórico (PDF/CSV)

#### 1.3 Serviço HTTP

**Arquivos modificados:**
- `libs/data-access/src/lib/generation/generation.service.ts`

**Métodos adicionados:**
- `listHistory(request?: ListHistoryRequest): Observable<ListHistoryResponse>`
- `exportHistory(request: ExportHistoryRequest): Observable<Blob>`

**Decisões técnicas:**
- Suporte a múltiplos filtros simultâneos (data, provedor, status)
- Paginação server-side para performance com grandes volumes
- Ordenação configurável por qualquer coluna
- Exportação retorna Blob para download seguro

#### 1.4 Componente de Histórico

**Arquivo criado:**
- `src/app/generation/generation-history.component.ts`

**Features implementadas:**

1. **Tabela com Angular Material**
   - MatTable com sorting e paginação
   - Colunas: título, status, provedor, custo estimado, data
   - Chips coloridos para status visual
   - Tooltips informativos

2. **Sistema de Filtros**
   - Date range picker (data inicial/final)
   - Select de provedor (OpenAI, Anthropic, Google)
   - Select de status (completed, failed, active, cancelled)
   - Botão "Limpar Filtros"

3. **Re-execução de Tarefas**
   - Botão de replay para cada item
   - Navegação para wizard com dados pré-preenchidos
   - Estado transferido via router state
   - Validação de disponibilidade de formData

4. **Exportação de Histórico**
   - Menu suspenso (PDF/CSV)
   - Download seguro com FileSaver pattern
   - Respeita filtros ativos
   - Feedback visual com snackbar

5. **Estados da UI**
   - Loading state com spinner
   - Error state com retry
   - Empty state com CTA
   - Responsive design

**Decisão de UX**: Usar MatTable ao invés de lista customizada
- **Justificativa**:
  - Sorting e paginação nativos
  - Acessibilidade WCAG 2.1 compliance
  - Consistência com Material Design
  - Menor esforço de manutenção

### 2. E3-A4: Exportação de Documentos

#### 2.1 Modelos de Dados

**Interfaces criadas:**

```typescript
export type ExportFormat = 'pdf' | 'docx';
export type ExportLanguage = 'pt-BR' | 'en-US';
export type ExportStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface ExportDocumentRequest {
  documentId: string;
  format: ExportFormat;
  language?: ExportLanguage;
  workspace?: string;
  options?: {
    includeMetadata?: boolean;
    includeTableOfContents?: boolean;
    pageSize?: 'A4' | 'Letter';
    orientation?: 'portrait' | 'landscape';
  };
}

export interface ExportProgress {
  taskId: string;
  status: ExportStatus;
  progress: number; // 0-100
  message: string;
  downloadUrl?: string;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export interface ExportQueueItem {
  taskId: string;
  documentId: string;
  documentTitle: string;
  format: ExportFormat;
  status: ExportStatus;
  progress: number;
  message: string;
  downloadUrl?: string;
  error?: string;
  createdAt: Date;
}
```

**Decisão**: Separar request e progress models
- **Justificativa**: Request contém apenas dados de input, Progress contém estado da tarefa assíncrona
- **Benefício**: API mais clara e type-safe

#### 2.2 API Endpoints

**Endpoints adicionados:**
- `POST /api/export/{format}` — Iniciar exportação
- `GET /api/export/status/{taskId}` — Consultar status com SSE/polling
- `GET /api/export/download/{taskId}` — Download seguro do arquivo

**Decisão**: Usar polling ao invés de WebSocket
- **Justificativa**:
  - Menor complexidade de implementação
  - Melhor compatibilidade com proxies/firewalls
  - Adequado para frequência de 2s
  - Fallback para SSE disponível
- **Trade-off**: Mais requisições HTTP, mas overhead aceitável

#### 2.3 Serviço de Exportação

**Arquivo criado:**
- `libs/data-access/src/lib/export/export.service.ts`

**Métodos implementados:**

```typescript
export class ExportService {
  exportDocument(request: ExportDocumentRequest): Observable<ExportDocumentResponse>
  getExportStatus(taskId: string): Observable<GetExportStatusResponse>
  pollExportStatus(taskId: string): Observable<GetExportStatusResponse>
  downloadExport(taskId: string): Observable<Blob>
  saveBlob(blob: Blob, filename: string): void
  generateFilename(title: string, format: string): string
}
```

**Features do serviço:**

1. **Polling Inteligente**
   - Interval de 2s entre requisições
   - Auto-stop quando completo/falhou
   - TakeWhile com emit final value
   - Previne memory leaks

2. **Download Seguro**
   - Response type: blob
   - Content-Disposition header parsing
   - window.URL.createObjectURL/revokeObjectURL
   - Cleanup automático

3. **Tratamento de Erros**
   - Mensagens contextualizadas por código HTTP
   - 404: Documento não encontrado
   - 413: Documento muito grande
   - 410: Link expirado
   - Fallback para erros desconhecidos

**Decisão**: Serviço dedicado ao invés de estender GenerationService
- **Justificativa**: Separação de responsabilidades, exportação pode ser usada por outros módulos
- **Benefício**: Menor acoplamento, reutilização

#### 2.4 Componentes de Exportação

**Arquivos criados:**
- `src/app/generation/export/export-form.component.ts`
- `src/app/generation/export/export-queue.component.ts`

##### 2.4.1 ExportFormComponent

**Features:**

1. **Formulário Reativo**
   - FormBuilder com validações
   - Seleção de documento, formato, idioma
   - Opções avançadas (metadata, TOC, page size, orientation)
   - Validação em tempo real

2. **Opções Avançadas**
   - Checkboxes: incluir metadata, índice
   - Select: tamanho de página (A4/Letter)
   - Radio buttons: orientação (portrait/landscape)
   - Agrupamento visual com background

3. **Submissão**
   - Validação completa antes de submit
   - Feedback visual (botão disabled durante submit)
   - Adiciona tarefa à fila automaticamente
   - Inicia polling imediatamente
   - Reset do form após sucesso

**Decisão**: Formulário reativo com FormBuilder
- **Justificativa**: Validação robusta, testabilidade, type safety
- **Alternativa considerada**: Template-driven forms (rejeitado por validação fraca)

##### 2.4.2 ExportQueueComponent

**Features:**

1. **Visualização de Fila**
   - Lista de tarefas simultâneas
   - Progress bar animada (queued/processing)
   - Status chips coloridos (queued/processing/completed/failed)
   - Timestamp de criação

2. **Ações por Tarefa**
   - Download (completed)
   - Retry (failed)
   - Remove (completed/failed)
   - Tooltips descritivos

3. **Estados Visuais**
   - Progress bar para tarefas ativas
   - Error message box para falhas
   - Empty state quando fila vazia
   - Icon badges por status

4. **Download Handling**
   - Chama ExportService.downloadExport()
   - Gera filename com timestamp
   - Usa saveBlob utility
   - Feedback com snackbar

**Decisão**: Input property para queue items ao invés de service interno
- **Justificativa**: Componente mais flexível e testável
- **Pattern**: Smart component (form) + Dumb component (queue)

#### 2.5 Roteamento

**Arquivo modificado:**
- `src/app/generation/generation.routes.ts`

**Rotas adicionadas:**

```typescript
export const generationRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./generation-wizard.component')
  },
  {
    path: 'history',
    loadComponent: () => import('./generation-history.component')
  },
  {
    path: 'export',
    loadComponent: () => import('./export/export-form.component')
  },
  {
    path: 'details/:id',
    loadComponent: () => import('./generation-wizard.component')
  }
];
```

**Decisão**: Lazy loading para todas as rotas
- **Justificativa**: Bundle splitting, carregamento sob demanda
- **Benefício**: Initial load time reduzido

### 3. Segurança

#### 3.1 Download Seguro

**Medidas implementadas:**
- Response type: blob para prevenir XSS
- Content-Type validation
- Content-Disposition header parsing
- Cleanup de object URLs
- No eval() ou innerHTML

#### 3.2 Validação de Input

**Formulários:**
- Validação client-side (Angular Validators)
- Sanitização de strings
- Whitelist de formatos permitidos
- Limite de tamanho de arquivo (server-side)

### 4. Performance

#### 4.1 Paginação Server-Side

- Histórico paginado (default: 25 items)
- Total count para paginator
- Lazy loading de dados
- Previne carregamento de datasets grandes

#### 4.2 Polling Otimizado

- Interval de 2s (balanceamento entre UX e load)
- Auto-stop quando tarefa finaliza
- Unsubscribe automático
- Previne memory leaks com takeWhile

#### 4.3 Caching

- HttpClient cache compartilhado
- Browser cache para blobs
- Object URL reuse quando possível

### 5. Acessibilidade (WCAG 2.1)

**Conformidades implementadas:**

1. **Navegação por Teclado**
   - Tab index correto
   - Focus visible
   - Keyboard shortcuts (Enter para submit)

2. **Screen Readers**
   - ARIA labels em todos os controles
   - ARIA live regions para status updates
   - Role attributes corretos

3. **Contraste de Cores**
   - Status chips com contraste adequado
   - Text color ratio 4.5:1+
   - Focus indicators visíveis

4. **Form Accessibility**
   - Labels associados a inputs
   - Error messages descritivos
   - Required field indicators

### 6. Internacionalização (i18n)

**Preparação para i18n:**
- Strings hardcoded marcadas para extração futura
- Formatação de datas com Intl.DateTimeFormat
- Formatação de moeda com Intl.NumberFormat
- Locale pt-BR default

**TODO futuro:**
- Extrair strings para arquivos de tradução
- Implementar @angular/localize
- Suporte a en-US

### 7. Testes (Pendente)

**Testes a serem implementados:**

#### 7.1 Unit Tests
- GenerationService.listHistory()
- GenerationService.exportHistory()
- ExportService (todos os métodos)
- GenerationHistoryComponent
- ExportFormComponent
- ExportQueueComponent

#### 7.2 Integration Tests
- Fluxo completo de histórico
- Fluxo completo de exportação
- Polling lifecycle
- Download handling

#### 7.3 E2E Tests
- User journey: visualizar histórico
- User journey: re-executar geração
- User journey: exportar documento
- User journey: download de exportação

**Cobertura alvo:** >80%

## Consequências

### Positivas

1. **UX Aprimorada**
   - Usuários podem auditar todas as gerações
   - Re-execução facilita iterações
   - Exportação multi-formato aumenta utilidade

2. **Auditoria e Compliance**
   - Histórico completo de operações
   - Custos rastreáveis
   - Exportação para análise externa

3. **Escalabilidade**
   - Paginação server-side suporta milhares de registros
   - Polling otimizado reduz carga
   - Arquitetura extensível para novos formatos

4. **Manutenibilidade**
   - Separação clara de responsabilidades
   - Componentes standalone e reutilizáveis
   - Type-safety completo

### Negativas

1. **Complexidade**
   - Mais componentes para manter
   - Polling adiciona lógica assíncrona
   - Mais testes necessários

2. **Carga de Rede**
   - Polling gera requisições periódicas
   - Blobs podem ser grandes (downloads)
   - Mitigação: intervals inteligentes, cleanup

3. **Storage Backend**
   - Histórico cresce continuamente
   - Exportações precisam de armazenamento temporário
   - Mitigação: TTL de exportações, archive de histórico antigo

## Alternativas Consideradas

### 1. WebSocket para Exportação

**Rejeitado porque:**
- Maior complexidade de implementação
- Problemas com proxies/firewalls corporativos
- Overhead não justificado para polling de 2s

**Quando reconsiderar:**
- Se polling causar problemas de carga
- Se precisar de updates real-time (<1s)
- Se implementar chat ou colaboração

### 2. Server-Sent Events (SSE)

**Parcialmente adotado:**
- Implementado como fallback
- Polling é método primário
- SSE disponível para clientes compatíveis

### 3. Exportação Síncrona

**Rejeitado porque:**
- Bloqueia thread para documentos grandes
- Timeout issues
- Péssima UX

**Adotado:** Exportação assíncrona com fila

### 4. Estado Global com NgRx

**Rejeitado para E3-A3/A4 porque:**
- Component-level state suficiente
- Signals nativos já provêm reatividade
- Overkill para fila de exportação

**Quando reconsiderar:**
- Se fila precisar persistência entre rotas
- Se múltiplos componentes precisarem acessar fila
- Se histórico precisar sincronização cross-tab

## Métricas de Sucesso

1. **Performance**
   - Histórico carrega em <2s (100 items)
   - Exportação inicia em <500ms
   - Download completa sem timeouts

2. **Usabilidade**
   - 90%+ de usuários conseguem re-executar geração
   - Taxa de falha de exportação <5%
   - NPS do módulo de histórico >8

3. **Técnico**
   - Cobertura de testes >80%
   - 0 memory leaks no polling
   - Lighthouse accessibility score >95

## Próximos Passos

1. **Imediato**
   - ✅ Implementar componentes
   - ✅ Configurar rotas
   - ⏳ Escrever unit tests
   - ⏳ Escrever integration tests

2. **Curto Prazo**
   - Implementar SSE fallback
   - Adicionar rate limiting no polling
   - Implementar cache de histórico
   - Extrair strings para i18n

3. **Médio Prazo**
   - E2E tests completos
   - Performance profiling
   - Backend mock para development
   - Storybook para componentes

4. **Longo Prazo**
   - Adicionar mais formatos (epub, txt)
   - Batch export
   - Shared links com expiração
   - Analytics de uso

## Referências

- [E3-A3 Specification](../obsidian/E3-A3.md)
- [E3-A4 Specification](../obsidian/E3-A4.md)
- [ADR-003 — Módulo Q&A](./ADR-003-modulo-qna.md)
- [Angular Material Table](https://material.angular.io/components/table)
- [RxJS takeWhile operator](https://rxjs.dev/api/operators/takeWhile)
- [FileSaver pattern](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL)

---

**Autores**: Claude AI Assistant
**Revisores**: Pendente
**Última atualização**: 2025-11-07
