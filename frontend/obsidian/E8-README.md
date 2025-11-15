# Épico E8 — Frontend VectorSeek (Frontend Development Sprint)

## Visão Geral

**Épico:** E8 - Frontend Development Sprint
**Data de Criação:** 12 de Novembro de 2025
**Status:** 🟡 Em Planejamento (0% completo)
**Responsável:** Frontend Team + Backend Team (parcial)

Este épico documenta todas as tarefas necessárias para completar o frontend do VectorSeek conforme mapeado em `docs/frontend/agents_vector_dev.md`. As tarefas estão organizadas por prioridade (P0 crítica, P1 importante, P2 secundária) e seguem o padrão de documentação do projeto.

---

## 📊 Status de Conclusão por Prioridade

| Prioridade | Tarefas | Status | Estimativa |
|------------|---------|--------|-----------|
| 🔴 P0 (Crítica) | 3 | ⏳ Não Iniciado | 6-8 dias |
| 🟡 P1 (Importante) | 3 | ⏳ Não Iniciado | 4-6 dias |
| 🟢 P2 (Secundária) | 3 | ⏳ Não Iniciado | 5-8 dias |
| **TOTAL** | **9** | **⏳ 0%** | **15-22 dias** |

---

## 🔴 TAREFAS CRÍTICAS (P0) — Bloqueiam fluxo principal

### E8-T1 — Sincronizar Endpoints com Backend Team
**Status:** ⏳ Não Iniciado
**Deadline:** 13 de Novembro (próximas 24h)
**Estimativa:** 1 dia
**Entregável:** Checklist de endpoints com status (✓/✗/?)

Verificar quais endpoints estão realmente funcionando no backend e quais precisam ser implementados. Criar contrato API alinhado com frontend.

**Endpoints Críticos:**
- ✓ Auth (login, register, refresh)
- ✓ Q&A (ask, history, feedback)
- ? Documentos (list, get, reprocess, delete)
- ? Workspaces (list)
- ❌ Upload (POST /api/documents/upload)
- ✓ Geração (templates, generate, progress)
- ? Cancelar geração

**Links:** [E8-T1.md](./E8-T1.md) | [agents_vector_dev.md](../frontend/agents_vector_dev.md)

---

### E8-T2 — Implementar UI para CRUD de Documentos
**Status:** ⏳ Não Iniciado
**Deadline:** 15 de Novembro
**Estimativa:** 2-3 dias
**Dependência:** E8-T1

Implementar interface para gerenciar documentos: ver detalhes, reprocessar e deletar. Os services já estão prontos.

**Componentes a Criar:**
- DocumentDetailComponent (modal/página)
- Delete confirmation modal (reutilizável)
- Integração de botões na tabela

**O que Fazer:**
- [ ] Componente de detalhes
- [ ] Botão reprocessar
- [ ] Botão deletar com confirmação
- [ ] Testes

**Links:** [E8-T2.md](./E8-T2.md)

---

### E8-T3 — Implementar Upload de Documentos
**Status:** ⏳ Não Iniciado
**Deadline:** 19 de Novembro (1 semana)
**Estimativa:** 3-4 dias (backend) + 2-3 dias (frontend)
**Prioridade:** 🔴 CRÍTICA - Bloqueia fluxo principal

Implementar funcionalidade de upload de documentos (backend + frontend). **Funcionalidade crítica que falta completamente.**

**Backend:**
- [ ] POST /api/documents/upload
- [ ] Validação (tipo, tamanho ≤100MB)
- [ ] Rate limiting (5/min)
- [ ] Verificação de quota por plano
- [ ] Integração Celery para processamento

**Frontend:**
- [ ] DocumentUploadComponent com drag-and-drop
- [ ] Validação cliente-side
- [ ] Progress bar
- [ ] Integração em DocumentsPageComponent
- [ ] Testes

**Links:** [E8-T3.md](./E8-T3.md)

---

## 🟡 TAREFAS IMPORTANTES (P1) — Importante para UX completa

### E8-T4 — Integrar Filtro de Workspace
**Status:** ⏳ Não Iniciado
**Deadline:** 16 de Novembro
**Estimativa:** 1-2 dias
**Dependência:** E8-T2

Integrar filtro de workspace na UI de documentos. O service já existe.

**O que Fazer:**
- [ ] Dropdown de workspace na barra de filtros
- [ ] Carregar workspaces ao inicializar
- [ ] Filtrar documentos por workspace
- [ ] Persistir preferência no localStorage
- [ ] Restaurar ao recarregar

**Links:** [E8-T4.md](./E8-T4.md)

---

### E8-T5 — Implementar Botão Cancelar Geração
**Status:** ⏳ Não Iniciado
**Deadline:** 16 de Novembro
**Estimativa:** 1 dia

Adicionar botão para cancelar gerações em progresso. Service já existe.

**O que Fazer:**
- [ ] Botão "Cancelar" no GenerationProgressComponent
- [ ] Modal de confirmação
- [ ] Parar polling após cancelamento
- [ ] Opção de reiniciar geração
- [ ] Testes

**Links:** [E8-T5.md](./E8-T5.md)

---

### E8-T6 — Implementar CRUD de Workspaces
**Status:** ⏳ Não Iniciado
**Deadline:** 23 de Novembro
**Estimativa:** 2-3 dias (backend) + 2-3 dias (frontend)
**Dependência:** E8-T1

Implementar endpoints e UI para gerenciar workspaces (criar, editar, deletar). Apenas listagem está funcional.

**Backend:**
- [ ] POST /api/workspaces
- [ ] PUT /api/workspaces/:id
- [ ] DELETE /api/workspaces/:id
- [ ] Validações e permissões

**Frontend:**
- [ ] Página `/app/workspaces`
- [ ] Tabela com workspaces
- [ ] Modal de criação/edição
- [ ] Modal de confirmação delete
- [ ] Testes

**Links:** [E8-T6.md](./E8-T6.md)

---

## 🟢 TAREFAS SECUNDÁRIAS (P2) — Melhorias que agregam valor

### E8-T7 — Implementar Histórico de Gerações
**Status:** ⏳ Não Iniciado
**Deadline:** 26 de Novembro
**Estimativa:** 1-2 dias (backend) + 2-3 dias (frontend)
**Dependência:** E8-T3

Implementar página de histórico mostrando gerações anteriores. Usuários poderão ver, filtrar e regenerar documentos.

**Backend:**
- [ ] GET /api/generate/history (com paginação e filtros)

**Frontend:**
- [ ] Página `/app/generation/history`
- [ ] Tabela com histórico
- [ ] Filtros (data, template, status)
- [ ] Botão "Regenerar"
- [ ] Modal de preview
- [ ] Testes

**Links:** [E8-T7.md](./E8-T7.md)

---

### E8-T8 — Implementar Configurações de Usuário
**Status:** ⏳ Não Iniciado
**Deadline:** 30 de Novembro
**Estimativa:** 2-3 dias (backend) + 2-3 dias (frontend)

Implementar endpoints e UI para gerenciar perfil, senha e preferências (tema, idioma, notificações).

**Backend:**
- [ ] PUT /api/auth/profile
- [ ] PUT /api/auth/password
- [ ] GET/PUT /api/auth/preferences

**Frontend:**
- [ ] Página `/app/settings` com abas
- [ ] Aba "Perfil" (nome, avatar)
- [ ] Aba "Segurança" (alterar senha)
- [ ] Aba "Preferências" (tema, idioma, notificações)
- [ ] Validações e indicador de força de senha
- [ ] Testes

**Links:** [E8-T8.md](./E8-T8.md)

---

### E8-T9 — Implementar Dashboard/Analytics
**Status:** ⏳ Não Iniciado
**Deadline:** 7 de Dezembro
**Estimativa:** 1-2 dias (backend) + 3-4 dias (frontend)
**Dependência:** E8-T2, E8-T3

Implementar dashboard com métricas de uso. Usuários verão estatísticas de documentos, perguntas, gerações e storage.

**Backend:**
- [ ] GET /api/analytics/usage
- [ ] GET /api/analytics/timeline
- [ ] GET /api/analytics/documents
- [ ] GET /api/analytics/storage

**Frontend:**
- [ ] Página `/app/dashboard`
- [ ] Cards com KPIs (Perguntas, Documentos, Gerações, Storage)
- [ ] Gráfico de timeline (linha)
- [ ] Gráfico de distribuição (pizza)
- [ ] Storage breakdown
- [ ] Alertas de limite próximo
- [ ] Testes

**Links:** [E8-T9.md](./E8-T9.md)

---

## 📅 Cronograma Proposto

### Semana 1 (12-19 Novembro)
- [ ] **E8-T1**: Sincronizar endpoints com backend (24h)
- [ ] **E8-T2**: Iniciar CRUD documentos (2-3 dias)
- [ ] **E8-T3**: Planejar e iniciar upload (backend 3-4 dias)

**Marcos:** Endpoints sincronizados, CRUD básico, upload iniciado

### Semana 2 (19-26 Novembro)
- [ ] **E8-T2**: Completar CRUD documentos (2-3 dias)
- [ ] **E8-T3**: Completar upload (frontend)
- [ ] **E8-T4**: Integrar filtro workspace (1-2 dias)
- [ ] **E8-T5**: Botão cancelar geração (1 dia)

**Marcos:** Upload funcional, filtros, interface completa

### Semana 3 (26-3 Dezembro)
- [ ] **E8-T6**: CRUD workspaces (3-4 dias)
- [ ] **E8-T7**: Histórico de gerações (2-3 dias)
- [ ] Testes e ajustes

**Marcos:** Gestão completa de workspaces, histórico

### Semana 4+ (3+ Dezembro)
- [ ] **E8-T8**: Configurações de usuário (3-4 dias)
- [ ] **E8-T9**: Dashboard/Analytics (3-4 dias)
- [ ] Features secundárias e polishing

**Marcos:** Sistema completo, analytics, user preferences

---

## 🔗 Dependências Entre Tarefas

```
E8-T1 (Sincronizar Endpoints)
  ↓
  ├─→ E8-T2 (CRUD Documentos)
  │    ↓
  │    ├─→ E8-T4 (Filtro Workspace)
  │    └─→ E8-T3 (Upload)
  │         ↓
  │         ├─→ E8-T7 (Histórico Gerações)
  │         └─→ E8-T9 (Dashboard)
  │
  ├─→ E8-T3 (Upload)
  │
  ├─→ E8-T5 (Botão Cancelar) [independente]
  │
  └─→ E8-T6 (CRUD Workspaces)
      ↓
      └─→ E8-T4 (Filtro Workspace)

Parallelizáveis: E8-T5, E8-T8
```

---

## 📊 Resumo de Estimativas

| Tarefa | Backend | Frontend | Total |
|--------|---------|----------|-------|
| E8-T1 | —— | —— | **1 dia** |
| E8-T2 | —— | 2-3 dias | **2-3 dias** |
| E8-T3 | 3-4 dias | 2-3 dias | **5-7 dias** |
| E8-T4 | —— | 1-2 dias | **1-2 dias** |
| E8-T5 | —— | 1 dia | **1 dia** |
| E8-T6 | 2-3 dias | 2-3 dias | **4-6 dias** |
| E8-T7 | 1-2 dias | 2-3 dias | **3-5 dias** |
| E8-T8 | 2-3 dias | 2-3 dias | **4-6 dias** |
| E8-T9 | 1-2 dias | 3-4 dias | **4-6 dias** |
| **TOTAL** | **11-19 dias** | **16-23 dias** | **28-40 dias** |

**Timeline Realista:** 4-6 semanas com 2 devs (1 backend, 1 frontend)

---

## 🎯 Critério de Sucesso

### Funcionalidades Críticas (DEVE TER)
- [ ] Upload de documentos funcional
- [ ] CRUD completo de documentos
- [ ] Endpoints sincronizados com backend
- [ ] Autenticação e autorização

### Funcionalidades Importantes (DEVERIA TER)
- [ ] Filtro de workspace
- [ ] Cancelar geração
- [ ] CRUD de workspaces
- [ ] Histórico de gerações

### Funcionalidades Desejáveis (PODERIA TER)
- [ ] Configurações de usuário
- [ ] Dashboard/Analytics

---

## 📋 Padrões Obrigatórios

Todos as implementações devem seguir:

1. **Frontend**
   - Angular 16+ com componentes standalone
   - Reactive Forms
   - Material Design components
   - OnDestroy com unsubscribe adequado
   - Testes unitários (Jasmine)

2. **Backend**
   - FastAPI com Pydantic v2
   - SQLAlchemy 2.0+ async
   - Validações de entrada
   - Documentação de endpoints
   - Testes com pytest

3. **Geral**
   - Documentação clara em código
   - Error handling robusto
   - Testes obrigatórios
   - Seguir CLAUDE.md

---

## 📁 Estrutura de Arquivos

```
docs/TASKS/
├── E8-T1.md (Sincronizar endpoints)
├── E8-T2.md (CRUD Documentos)
├── E8-T3.md (Upload Documentos)
├── E8-T4.md (Filtro Workspace)
├── E8-T5.md (Botão Cancelar)
├── E8-T6.md (CRUD Workspaces)
├── E8-T7.md (Histórico Gerações)
├── E8-T8.md (Configurações Usuário)
├── E8-T9.md (Dashboard/Analytics)
└── E8-README.md (este arquivo)
```

---

## 🔗 Links Relacionados

- [agents_vector_dev.md](../frontend/agents_vector_dev.md) — Documento original com análise
- [Status_Implementação.md](../frontend/status/Status_Implementação.md) — Estado atual frontend
- [Endpoints_Pendentes.md](../frontend/status/Endpoints_Pendentes.md) — Endpoints faltantes
- [CLAUDE.md](../../CLAUDE.md) — Padrões do projeto

---

## 📝 Notas Importantes

1. **E8-T1 é crítica** — Sem sincronização de endpoints, todo o resto fica bloqueado
2. **Upload é crítico** — Bloqueia fluxo principal de valor
3. **Paralelização** — E8-T5 e E8-T8 podem ser feitas em paralelo
4. **Testes** — Cada tarefa requer testes obrigatórios antes de considerar completa
5. **Documentação** — Manter docs atualizadas conforme progride

---

**Criado em:** 12 de Novembro de 2025
**Última Atualização:** 12 de Novembro de 2025
**Status:** 🟡 Em Planejamento
**Próxima Ação:** Iniciar E8-T1 — Sincronizar Endpoints
