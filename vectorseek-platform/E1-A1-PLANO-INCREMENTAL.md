# E1-A1 · Plano de Desenvolvimento Incremental

**Atividade**: Configurar módulo de autenticação  
**Épico**: Épico 1 — Fundação de Autenticação & Shell da Aplicação  
**ADR de Referência**: ADR-001  
**Status Geral**: Em desenvolvimento

---

## 📊 Análise do Status Atual

### ✅ E1-A1-1: COMPLETO

**Status**: ✅ Implementado e testado

**O que foi feito:**
- ✅ Estrutura do módulo `auth` criada em `src/app/auth/`
- ✅ Rotas `/auth/login`, `/auth/register`, `/auth/forgot-password` funcionando
- ✅ Componentes standalone criados:
  - `LoginPageComponent`
  - `RegisterPageComponent`
  - `ForgotPasswordComponent`
  - `AuthLayoutComponent`
- ✅ Lazy loading configurado com `loadComponent`
- ✅ Hooks de ciclo de vida implementados (`OnInit`, `OnDestroy`)
- ✅ Estrutura compatível com SSR

**Evidências:**
- Rotas acessíveis e funcionando
- Estrutura standalone sem NgModules
- Lazy loading funcionando

---

### 🚧 E1-A1-2: EM PROGRESSO

**Status**: 🚧 Em desenvolvimento — camada `data-access` criada com modelos, endpoints e serviço tipado acompanhados de testes unitários iniciais.
**Dependência**: E1-A1-1 ✅ (completo)

**O que já foi feito até o momento:**
- Estrutura `libs/data-access/src/lib/auth/` criada dentro do projeto Angular CLI.
- Contratos TypeScript (`auth.models.ts`) e endpoints (`auth.api.ts`) definidos seguindo o formato envelope/documento descrito nos ADRs.
- `AuthService` implementado com mapeamento de DTOs para modelos da aplicação e normalização de erros amigáveis.
- Testes unitários com `HttpClientTestingModule` cobrindo fluxos felizes e principais cenários de falha.

**Próximos passos para concluir a atividade:**
- Integrar o serviço aos componentes/pages quando os formulários estiverem disponíveis.
- Acompanhar cobertura de testes para garantir a meta mínima de 70% após integração com demais camadas.
- Revisar documentação nos ADRs caso ajustes de contrato sejam necessários.
- Validar `me(): Observable<MeResponse>` assim que o endpoint estiver disponível na API simulada ou ambiente de testes.

**O que ainda falta para encerrar:**
- Validar contratos contra a API real/mock e ajustar o tratamento de erros quando necessário.
- Expor o serviço para consumo direto pelas páginas assim que os formulários estiverem prontos.
- Garantir cobertura mínima de 70% após integração end-to-end (atualmente restrita aos testes de serviço).

**Estrutura necessária:**
```
libs/
└── data-access/
    └── src/
        └── lib/
            └── auth/
                ├── auth.service.ts
                ├── auth.service.spec.ts
                ├── auth.models.ts
                └── auth.api.ts
```

---

### 🚧 E1-A1-3: PENDENTE

**Status**: 🚧 Aguardando E1-A1-2  
**Dependências**: E1-A1-1 ✅, E1-A1-2 🚧

**O que precisa ser feito:**
- Instalar dependências: `zod`, `@colsen1996/ng-zod-form`, `@ngx-translate/core`
- Criar schemas Zod em `src/app/auth/schemas/`
- Implementar formulários reativos nos componentes
- Configurar `@ngx-translate/core` com namespace `auth`
- Criar arquivos de tradução (`pt-BR.json`, `en-US.json`)
- Criar componente `FieldErrorComponent` para exibição de erros
- Integrar validações Zod com formulários Angular
- Sincronizar estados de loading e desabilitação

**Dependências a instalar:**
```bash
npm install zod @colsen1996/ng-zod-form @ngx-translate/core @ngx-translate/http-loader
```

---

### 🚧 E1-A1-4: PENDENTE

**Status**: 🚧 Aguardando E1-A1-2 e E1-A1-3  
**Dependências**: E1-A1-2 🚧, E1-A1-3 🚧

**O que precisa ser feito:**
- Instalar e configurar Storybook
- Criar histórias para os componentes de autenticação
- Documentar fluxos e estados alternativos
- Garantir cobertura mínima de 70%
- Criar documentação de QA
- Atualizar README com checklist

---

## 🎯 Plano Incremental

### Fase 1: E1-A1-2 (Implementar Serviços e Modelos) - **PRÓXIMA TAREFA**

**Objetivo**: Centralizar integrações HTTP do domínio de autenticação

**Tarefas:**
1. Criar estrutura de diretórios `libs/data-access/`
2. Implementar interfaces e tipos em `auth.models.ts`
3. Implementar `AuthService` com todos os métodos
4. Configurar tratamento de erros padronizado
5. Criar testes unitários com `HttpClientTestingModule`
6. Validar cobertura mínima de 70%

**Tempo estimado**: 2-3 dias

**Critérios de aceite:**
- ✅ Testes unitários cobrindo fluxo feliz e principais falhas
- ✅ Interfaces exportadas e reaproveitáveis
- ✅ Serviço registrado para consumo externo
- ✅ Cobertura mínima de 70%

---

### Fase 2: E1-A1-3 (Formulários Reativos com Zod e i18n)

**Objetivo**: Entregar experiência de formulário com validação e tradução

**Tarefas:**
1. Instalar dependências (Zod, ng-zod-form, ngx-translate)
2. Criar schemas Zod para login, register, forgot-password
3. Implementar formulários reativos nos componentes
4. Configurar i18n com namespace `auth`
5. Criar arquivos de tradução
6. Criar componente `FieldErrorComponent`
7. Integrar validações e estados de loading

**Tempo estimado**: 2-3 dias

**Critérios de aceite:**
- ✅ Mensagens traduzidas para validações
- ✅ Estados de loading sincronizados
- ✅ Traduções armazenadas e carregadas corretamente

---

### Fase 3: E1-A1-4 (Documentação e Cobertura)

**Objetivo**: Consolidar qualidade com documentação e testes

**Tarefas:**
1. Configurar Storybook
2. Criar histórias para componentes
3. Documentar fluxos e QA
4. Validar cobertura mínima
5. Atualizar documentação

**Tempo estimado**: 1-2 dias

**Critérios de aceite:**
- ✅ Cobertura mínima de 70%
- ✅ Histórias no Storybook acessíveis
- ✅ Documentação atualizada

---

## ⚠️ Riscos Conhecidos

### 1. Estrutura de Monorepo (Nx)

**Risco**: A aplicação atual é Angular CLI standalone, mas o ADR menciona `libs/data-access` que é estrutura Nx.

**Mitigação**: 
- Criar estrutura `libs/data-access/` dentro do projeto atual
- Ou adaptar para usar serviços diretamente em `src/app/services/`
- Decisão: Criar estrutura `libs/` mesmo sem Nx para manter compatibilidade futura

### 2. Dependências Externas

**Risco**: `@colsen1996/ng-zod-form` pode ter problemas de compatibilidade com Angular 20.

**Mitigação**:
- Verificar compatibilidade antes de instalar
- Ter plano B: usar Zod diretamente com validação manual
- Testar em ambiente isolado primeiro

### 3. Cobertura de Testes

**Risco**: Alcançar 70% de cobertura pode ser desafiador.

**Mitigação**:
- Focar em testes de serviços primeiro (mais fácil de testar)
- Testes de componentes podem ser mais simples (testing de template)
- Usar `HttpClientTestingModule` para serviços HTTP

---

## ✅ Tarefas Executáveis Imediatas

### 1. Criar Estrutura de Data Access

```bash
mkdir -p libs/data-access/src/lib/auth
```

### 2. Implementar Modelos Base

Criar `libs/data-access/src/lib/auth/auth.models.ts` com interfaces:
- `LoginRequest`, `LoginResponse`
- `RegisterRequest`, `RegisterResponse`
- `RequestMagicLinkRequest`, `RequestMagicLinkResponse`
- `RefreshRequest`, `RefreshResponse`
- `MeResponse`
- `AuthSession`, `AuthTokens`, `AuthUserProfile`
- `AuthError`

### 3. Implementar AuthService

Criar `libs/data-access/src/lib/auth/auth.service.ts` com:
- Métodos HTTP tipados
- Tratamento de erros padronizado
- Uso de `inject(HttpClient)`

### 4. Criar Testes Unitários

Criar `libs/data-access/src/lib/auth/auth.service.spec.ts` com:
- Testes de fluxo feliz
- Testes de erros (401, 429, 422)
- Cobertura mínima de 70%

---

## 📋 Checklist do ADR-001 (80% para aceite)

1. ✅ Rotas `/auth/login`, `/auth/register` e `/auth/forgot-password` navegáveis e renderizando componentes standalone. **COMPLETO**
2. 🚧 `AuthService` com métodos `login`, `register`, `requestMagicLink`, `refresh` e `me`, coberto por testes. **PRÓXIMO**
3. 🚧 Formulários reativos com validações Zod e mensagens traduzíveis (namespace `auth`). **PENDENTE**
4. 🚧 Documentação dos fluxos no Storybook com instruções de QA. **PENDENTE**
5. 🚧 Cobertura de testes mínima acordada (>=70%) para `libs/data-access/auth`. **PENDENTE**

**Progresso**: 1/5 (20%) → Meta: 4/5 (80%)

---

## 🚀 Próximos Passos Imediatos

### Passo 1: Validar Estrutura Atual
- [x] Verificar rotas funcionando
- [x] Validar componentes standalone
- [x] Confirmar lazy loading

### Passo 2: Iniciar E1-A1-2
- [ ] Criar estrutura `libs/data-access/`
- [ ] Implementar `auth.models.ts`
- [ ] Implementar `auth.service.ts`
- [ ] Criar testes unitários
- [ ] Validar cobertura

### Passo 3: Preparar para E1-A1-3
- [ ] Verificar compatibilidade de dependências
- [ ] Planejar estrutura de schemas Zod
- [ ] Planejar estrutura de traduções

---

## 📝 Notas Importantes

1. **Estrutura sem Nx**: Como a aplicação é Angular CLI standalone, vamos criar a estrutura `libs/` manualmente para manter compatibilidade com o ADR.

2. **Compatibilidade Angular 20**: Todas as dependências devem ser compatíveis com Angular 20.3.0.

3. **Foco Incremental**: Focar em uma sub-atividade por vez, garantindo qualidade antes de avançar.

4. **Testes Primeiro**: Para E1-A1-2, implementar testes junto com o serviço (TDD pode ajudar).

5. **Referência ao ADR**: Sempre referenciar ADR-001 nas decisões de implementação.

---

## ✅ Confirmação para Próxima Fase

**Recomendação**: Marcar E1-A1-2 como `in-progress` e começar a implementação dos serviços e modelos.

**Próxima tarefa executável**: Criar estrutura `libs/data-access/` e implementar `auth.models.ts` com todas as interfaces necessárias.

**Comando sugerido** (quando pronto):
```bash
./frontend/scripts/start_activity.py E1-A1-2
```

---

**Última atualização**: Baseado na análise da implementação E1-A1-1 e documentação ADR-001 e E1-A1-*

