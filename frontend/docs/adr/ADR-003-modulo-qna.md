# ADR-003 — Módulo Q&A (Perguntas e Respostas)

**Status**: Implementado
**Data**: 2025-11-06
**Épico**: E2 — Q&A & Base de Conhecimento
**Atividade**: E2-A1 — Provisionar módulo Q&A

---

## Contexto

O VectorSeek necessita de um módulo de perguntas e respostas (Q&A) que permita aos usuários fazer perguntas sobre sua base de conhecimento e receber respostas contextualizadas com citações dos documentos fonte. Este ADR documenta as decisões arquiteturais tomadas durante a implementação do E2-A1.

## Decisões

### 1. Arquitetura de Camadas

Seguindo o padrão estabelecido no E1 (Autenticação), o módulo Q&A foi estruturado em três camadas principais:

#### 1.1 Camada de Data Access (`libs/data-access/src/lib/qna`)

**Arquivos criados:**
- `qna.models.ts` — Interfaces e tipos de domínio
- `qna.api.ts` — Definição de endpoints da API
- `qna.service.ts` — Serviço HTTP para comunicação com backend
- `qna.service.spec.ts` — Testes unitários do serviço

**Responsabilidades:**
- Comunicação com API REST (`/api/qna/*`)
- Tratamento de erros HTTP com mensagens contextualizadas
- Transformação de DTOs em modelos de domínio
- Suporte a AbortController para cancelamento de requisições

**Endpoints implementados:**
- `POST /api/qna/ask` — Fazer uma pergunta
- `GET /api/qna/history` — Buscar histórico com paginação
- `POST /api/qna/feedback` — Enviar feedback sobre respostas

#### 1.2 Camada de State (`libs/state/src/lib/qna`)

**Arquivos criados:**
- `qna.store.ts` — Store gerenciado por Angular Signals

**Responsabilidades:**
- Gerenciamento centralizado de estado usando signals nativos
- Estado reativo com computed signals
- Suporte a paginação de histórico
- Controle de loading e erros

**Estado gerenciado:**
```typescript
interface QnaState {
  currentQuestion: string;
  currentAnswer: Answer | null;
  history: QnaHistoryEntry[];
  loading: boolean;
  error: QnaError | null;
  pagination: PaginationState;
}
```

**Escolha de Signal Store nativo vs NgRx:**
- **Decisão**: Usar Angular Signals nativos ao invés de @ngrx/signals
- **Justificativa**:
  - Menos dependências externas
  - API mais simples e direta
  - Signals nativos já fornecem reatividade necessária
  - Performance adequada para o escopo do módulo
  - Facilita manutenção futura

#### 1.3 Camada de Componentes (`src/app/qna`)

**Componentes criados:**

1. **QuestionComposerComponent**
   - Formulário para entrada de perguntas
   - Suporte a Ctrl+Enter / Cmd+Enter para submit
   - Estados de loading e erro
   - Componente standalone reutilizável

2. **AnswerPanelComponent**
   - Exibição de respostas com formatação
   - Lista expansível de citações (accordion)
   - Cópia de resposta para clipboard
   - Botão de feedback
   - Visualização de metadados (modelo, provedor, tokens)

3. **QnaPageComponent**
   - Orquestração dos componentes
   - Integração com store e serviços
   - Lista de histórico com paginação
   - Estados vazios e de loading

### 2. Roteamento Lazy Loading

```typescript
// app.routes.ts
{
  path: 'app',
  children: [
    {
      path: 'qna',
      loadChildren: () => import('./qna/qna.routes').then(m => m.qnaRoutes)
    }
  ]
}
```

**Benefícios:**
- Bundle splitting automático
- Carregamento sob demanda
- Melhor performance inicial

### 3. Padrões de Desenvolvimento

#### 3.1 Componentes Standalone
- Todos os componentes são standalone (sem módulos)
- Imports explícitos de dependências
- Melhor tree-shaking

#### 3.2 Signals e Reatividade
- Signal Store para estado global
- Computed signals para valores derivados
- Effects para sincronização de UI

#### 3.3 TypeScript Strict Mode
- Tipos explícitos e validados
- Null safety
- Property access restrictions

#### 3.4 Tratamento de Erros
- Mensagens contextualizadas por ação
- Códigos de erro HTTP específicos
- Retry-After headers processados
- Erros exibidos na UI

### 4. Estilização

**Decisão**: CSS inline nos componentes (não Tailwind inicialmente)

**Justificativa:**
- Tailwind não estava configurado no projeto
- CSS inline permite desenvolvimento mais rápido
- Possibilidade de migração futura para Tailwind
- Estilos encapsulados por componente

**Padrões aplicados:**
- Design system consistente (cores, espaçamentos, tipografia)
- Componentes responsivos
- Estados visuais claros (hover, disabled, loading)
- Feedback visual (animações, transições)

### 5. Funcionalidades Implementadas

✅ **Composição de perguntas**
- Textarea com validação
- Atalho de teclado (Ctrl+Enter)
- Estados de disabled durante loading

✅ **Exibição de respostas**
- Formatação de texto preservada
- Citações expansíveis com score
- Metadados do modelo usado
- Cópia para clipboard

✅ **Histórico de perguntas**
- Lista paginada de interações anteriores
- Navegação entre páginas
- Seleção de item para revisitar
- Timestamp relativo (ex: "2h atrás")

✅ **Gestão de estado**
- Loading states
- Error handling
- Paginação
- Cancelamento de requisições

### 6. Funcionalidades Pendentes (próximas atividades)

⏳ **E2-A2 — UI de citações expandíveis**
- Já implementado parcialmente
- Possível melhoria: highlight de termos buscados

⏳ **E2-A3 — Gestão de documentos vetorados**
- Nova página/componente para listar documentos
- Filtros por status, workspace, data

⏳ **E2-A4 — Feedback de respostas**
- Modal de feedback com rating e comentário
- Integração já preparada no AnswerPanelComponent

⏳ **Virtual Scroll (opcional)**
- Para históricos muito longos
- Requer instalação do Angular CDK
- Não crítico para MVP

## Consequências

### Positivas

1. **Arquitetura consistente** — Segue o mesmo padrão do módulo de autenticação
2. **Separação de responsabilidades** — Camadas bem definidas
3. **Reusabilidade** — Componentes isolados e testáveis
4. **Performance** — Lazy loading e bundle splitting
5. **Manutenibilidade** — Código tipado e documentado
6. **Testabilidade** — Serviços e store facilmente testáveis

### Negativas / Trade-offs

1. **Signals nativos vs NgRx** — Pode requerer migração futura se complexidade aumentar
2. **CSS inline** — Pode gerar inconsistências se não documentado
3. **Virtual Scroll não implementado** — Listas muito longas podem ter performance degradada
4. **Feedback modal não implementado** — Funcionalidade incompleta (E2-A4)

## Compatibilidade

- **Angular**: 20.3.0+
- **TypeScript**: 5.9.2+
- **Navegadores**: Modernos com suporte a ES2022

## Testes

### Implementados
- ✅ Testes unitários do QnaService
- ✅ Verificação de compilação TypeScript

### Pendentes
- ⏳ Testes de componentes (E2-A1 checklist)
- ⏳ Testes end-to-end
- ⏳ Testes de integração com API mock

## Documentação de Referência

- [E2-A1 — Provisionar módulo Q&A](../../obsidian/E2-A1.md)
- [ADR-001 — Fundação de Autenticação](./ADR-001-epico1-autenticacao-shell.md)
- [ADR-002 — Fluxo Auth Angular CLI](./ADR-002-fluxo-auth-angular-cli.md)

## Próximos Passos

1. **Implementar E2-A2** — Melhorar UI de citações com highlight
2. **Implementar E2-A3** — Página de gestão de documentos
3. **Implementar E2-A4** — Modal de feedback
4. **Adicionar testes** — Coverage mínimo de 80%
5. **Configurar Tailwind** — Migrar estilos inline
6. **Instalar Angular CDK** — Se necessário para virtual scroll

---

**Autores**: Claude Code
**Revisores**: Pendente
**Última atualização**: 2025-11-06
