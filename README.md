# VectorSeek Frontend

## 📋 Visão Geral

O **VectorSeek Frontend** é uma aplicação web moderna construída com Angular 17+ e Nx, projetada para fornecer uma plataforma de descoberta de conhecimento baseada em IA. O projeto utiliza uma arquitetura de monorepo com componentes standalone, lazy loading e suporte a Server-Side Rendering (SSR).

## 🏗️ Arquitetura

### Estrutura do Projeto

O projeto segue uma arquitetura monorepo utilizando **Nx** como ferramenta de gerenciamento:

```
vectorseek-frontend/
├── apps/
│   └── platform/          # Aplicação principal Angular
│       └── src/
│           ├── app/        # Componentes e rotas da aplicação
│           │   ├── auth/   # Módulo de autenticação
│           │   └── layouts/ # Layouts da aplicação
│           ├── assets/     # Arquivos estáticos (i18n, imagens)
│           └── environments/ # Configurações de ambiente
├── libs/                   # Bibliotecas compartilhadas
│   ├── data-access/       # Serviços e modelos de acesso a dados
│   └── ui/                # Componentes de UI reutilizáveis
└── third-party/           # Dependências locais (offline mode)
```

### Padrões Arquiteturais

- **Standalone Components**: Todos os componentes são standalone, eliminando a necessidade de NgModules
- **Lazy Loading**: Rotas e componentes são carregados sob demanda para otimizar performance
- **Feature-based Structure**: Organização por funcionalidades (auth, layouts, etc.)
- **Shared Libraries**: Código compartilhado em bibliotecas reutilizáveis

## 🔐 Sistema de Autenticação

O projeto implementa um sistema completo de autenticação com os seguintes fluxos:

### Rotas de Autenticação

- **`/auth/login`**: Página de login
- **`/auth/register`**: Página de registro
- **`/auth/forgot-password`**: Recuperação de senha

### Funcionalidades

1. **Login**: Autenticação com email e senha
2. **Registro**: Cadastro de novos usuários
3. **Recuperação de Senha**: Solicitação de link mágico para redefinição
4. **Refresh Token**: Renovação automática de tokens
5. **Perfil do Usuário**: Obtenção de dados do usuário autenticado

### AuthService

O `AuthService` está localizado em `libs/data-access/src/lib/auth/auth.service.ts` e fornece:

- `login(payload: LoginRequest)`: Realiza login
- `register(payload: RegisterRequest)`: Registra novo usuário
- `requestMagicLink(payload: RequestMagicLinkRequest)`: Solicita link mágico
- `refresh(payload: RefreshRequest)`: Renova tokens
- `me()`: Obtém perfil do usuário autenticado

### Validação de Formulários

O projeto utiliza **Zod** para validação de formulários, garantindo:

- Validação em tempo real
- Mensagens de erro traduzíveis
- Alinhamento com contratos da API
- Type-safety completo

Schemas disponíveis:
- `loginFormSchema` (`apps/platform/src/app/auth/schemas/login.schema.ts`)
- `registerFormSchema` (`apps/platform/src/app/auth/schemas/register.schema.ts`)
- `forgotPasswordSchema` (`apps/platform/src/app/auth/schemas/forgot-password.schema.ts`)

## 🎨 Layouts

### AuthLayoutComponent

Layout específico para páginas de autenticação (`/auth/*`):
- Design com gradiente escuro
- Container centralizado
- Header informativo

### PublicLayoutComponent

Layout para páginas públicas:
- Design limpo e moderno
- Navegação principal
- Área de conteúdo flexível

## 🌐 Internacionalização (i18n)

O projeto utiliza **@ngx-translate/core** para internacionalização:

- Idioma padrão: **pt-BR**
- Arquivos de tradução em `apps/platform/src/assets/i18n/`
- Namespace `auth` para mensagens de autenticação
- Suporte para múltiplos idiomas

## 🔌 API Integration

### Endpoints

Todos os endpoints de autenticação seguem o padrão `/api/auth/*`:

- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `POST /api/auth/magic-link` - Solicitar link mágico
- `POST /api/auth/refresh` - Renovar tokens
- `GET /api/auth/me` - Obter perfil

### Tratamento de Erros

O `AuthService` implementa tratamento robusto de erros:

- Mensagens de erro específicas por ação
- Suporte a erros de validação por campo
- Tratamento de rate limiting (Retry-After)
- Normalização de respostas da API

## 🚀 Tecnologias Utilizadas

### Core
- **Angular 17+**: Framework principal
- **Nx**: Monorepo e ferramentas de build
- **TypeScript**: Linguagem de programação
- **RxJS**: Programação reativa

### Validação e Formulários
- **Zod**: Validação de schemas
- **@colsen1996/ng-zod-form**: Integração Zod com Angular Forms

### Internacionalização
- **@ngx-translate/core**: Sistema de tradução
- **@ngx-translate/http-loader**: Carregamento de traduções

### Server-Side Rendering
- **@nguniversal/express-engine**: SSR com Express
- **Express**: Servidor Node.js

### Desenvolvimento
- **Storybook**: Documentação de componentes
- **Jest**: Framework de testes

## 📦 Estrutura de Dependências

O projeto utiliza dependências locais em `third-party/` para funcionar offline:

- Todas as dependências Angular estão em `third-party/@angular/`
- Bibliotecas de terceiros em `third-party/`
- Permite desenvolvimento sem acesso ao npm registry

## 🛣️ Sistema de Rotas

### Rotas Principais

```typescript
/                    → PublicLayoutComponent
/auth                → AuthLayoutComponent (redireciona para /auth/login)
/auth/login          → LoginPageComponent
/auth/register       → RegisterPageComponent
/auth/forgot-password → ForgotPasswordComponent
```

### Lazy Loading

Todas as rotas utilizam lazy loading para otimização:

```typescript
{
  path: 'auth',
  loadChildren: () => import('./auth/auth.routes').then(m => m.authRoutes)
}
```

## 📝 Componentes Standalone

Todos os componentes são standalone, permitindo:

- Importação seletiva
- Tree-shaking otimizado
- Código mais limpo sem NgModules
- Melhor performance

Exemplo:
```typescript
@Component({
  selector: 'vectorseek-login-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  // ...
})
```

## 🧪 Testes

O projeto inclui testes unitários para:

- `AuthService` (com HttpClientTestingModule)
- Componentes de autenticação
- Cobertura mínima de 70% para `libs/data-access/auth`

## 🎯 Status do Projeto

### ✅ Implementado

- [x] Rotas de autenticação (`/auth/login`, `/auth/register`, `/auth/forgot-password`)
- [x] `AuthService` completo com todos os métodos
- [x] Schemas de validação Zod para formulários
- [x] Layouts (AuthLayout e PublicLayout)
- [x] Estrutura de internacionalização
- [x] Testes unitários do AuthService
- [x] Documentação no Storybook

### 🚧 Em Desenvolvimento

- [ ] Formulários reativos completos com validação Zod integrada
- [ ] Guardas de rota para proteção de rotas privadas
- [ ] Interceptors HTTP para gerenciamento de tokens
- [ ] Signal Store para gerenciamento de estado de sessão

## 🚀 Como Executar

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn

### Instalação

```bash
# Navegue até o diretório do projeto
cd vectorseek-frontend

# As dependências já estão em third-party/
# Não é necessário npm install
```

### Desenvolvimento

```bash
# Execute o servidor de desenvolvimento
nx serve platform

# Ou use o comando do Nx CLI
npm run nx serve platform
```

### Build

```bash
# Build de produção
nx build platform

# Build com SSR
nx build platform --configuration=production
```

### Testes

```bash
# Executar todos os testes
nx test

# Testes com cobertura
nx test --code-coverage
```

### Servidor SSR

```bash
# Build SSR
nx build platform

# Executar servidor Express
node apps/platform/server.ts
```

## 📚 Documentação Adicional

- **ADR-001**: Decisões arquiteturais sobre autenticação (`frontend/docs/adr/ADR-001-epico1-autenticacao-shell.md`)
- **Épicos**: Documentação de épicos e atividades (`frontend/epicos.md`)
- **Obsidian**: Notas detalhadas de desenvolvimento (`frontend/obsidian/`)

## 🏢 Organização do Código

### Conventions

- **Componentes**: PascalCase (ex: `LoginPageComponent`)
- **Serviços**: PascalCase com sufixo Service (ex: `AuthService`)
- **Interfaces**: PascalCase (ex: `LoginRequest`, `AuthTokens`)
- **Arquivos**: kebab-case (ex: `login-page.component.ts`)
- **Selectors**: kebab-case com prefixo `vectorseek-` (ex: `vectorseek-login-page`)

### Padrões de Código

- TypeScript strict mode
- Componentes standalone
- Injeção de dependências com `inject()`
- Uso de RxJS para operações assíncronas
- Validação com Zod
- Mensagens traduzíveis

## 🔄 Fluxo de Dados

```
Component → AuthService → HTTP Client → API Backend
                ↓
         Mapeamento de DTOs
                ↓
         Tratamento de Erros
                ↓
         Observable<Response>
```

## 📊 Estrutura de Dados

### Modelos Principais

- **AuthTokens**: Tokens de acesso e refresh
- **AuthUserProfile**: Perfil do usuário
- **AuthSession**: Sessão completa (tokens + usuário)
- **AuthError**: Erros normalizados da API

### DTOs da API

- **AuthApiSessionDto**: Resposta de login/registro
- **AuthApiProfileDto**: Perfil do usuário da API
- **AuthApiTokensDto**: Tokens da API
- **AuthApiEnvelope**: Envelope padrão de resposta

## 🎨 Design System

O projeto utiliza um design system consistente:

- **Cores**: Paleta baseada em Tailwind CSS
- **Tipografia**: Sistema de fontes escalável
- **Espaçamento**: Grid system com gaps consistentes
- **Componentes**: Estilos inline nos componentes (futura migração para CSS modules ou SCSS)

## 🤝 Contribuindo

1. Siga os padrões de código estabelecidos
2. Mantenha a cobertura de testes acima de 70%
3. Documente novas funcionalidades
4. Atualize o ADR quando necessário
5. Crie stories no Storybook para novos componentes

## 📄 Licença

Este projeto é privado e proprietário.

---

**Desenvolvido com ❤️ para VectorSeek Platform**

