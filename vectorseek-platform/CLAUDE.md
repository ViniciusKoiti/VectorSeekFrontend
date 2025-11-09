# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Commands

### Development
- `npm start` - Start dev server on http://localhost:4200/
- `npm run build` - Build for production
- `npm run watch` - Build in watch mode during development
- `npm test` - Run unit tests with Karma/Jasmine
- `npm run ng -- generate component <name>` - Scaffold a new component

### Common Development Tasks
- Run a single test: `npm test -- --include='**/specific.spec.ts'`
- Run tests in headless mode: `npm test -- --watch=false --browsers=ChromeHeadless`
- Build with source maps: `npm run build -- --source-map`

## Project Overview

**VectorSeek Platform** is a modern Angular 20 application using standalone components and Angular Signals for state management. It's a single-page application that provides Q&A, document processing, and content generation capabilities.

## Architecture

### Module Organization
The application uses **standalone components** (no NgModules) with lazy-loaded feature modules:

- **Auth Module** (`src/app/auth/`) - Login, register, forgot-password flows with Zod schema validation
- **Q&A Module** (`src/app/qna/`) - Question answering with citation tracking and user feedback
- **Generation Module** (`src/app/generation/`) - Multi-step content generation wizard with progress polling
- **Core Module** (`src/app/core/`) - Theme service, interceptors, shared utilities

### Key Architectural Patterns

1. **Monorepo-like Structure** - Shared code organized in `libs/` folders:
   - `libs/state/` - Angular Signals-based store (AuthStore, QnaStore, TaskProgressService)
   - `libs/data-access/` - API services and data models

2. **Signals for State Management** - Not RxJS-based:
   - `AuthStore` - Writable signal with computed selectors for session/user/tokens
   - `QnaStore` - Complex state with pagination, error handling, abort controller
   - Components use `effect()` to subscribe to signal changes
   - Pattern: Services inject stores and use `computed()` for derived state

3. **Lazy Loading** - All features loaded on-demand:
   - Routes in `src/app/app.routes.ts` use `loadChildren` and `loadComponent`
   - Path aliases configured in `tsconfig.json`: `@vectorseek/state`, `@vectorseek/data-access`

4. **HTTP Layer**:
   - Functional interceptors (Angular v14+): `authInterceptor` (adds Bearer token), `apiUrlInterceptor` (prepends base URL)
   - Services in `libs/data-access/` handle API communication
   - Base URL from `environment.apiUrl` (dev: `http://localhost:8000`, prod: `https://api.vectorseek.com`)

5. **Validation** - Zod schema-based:
   - Schemas in `libs/data-access/auth/schemas/`
   - Custom `zodValidator()` function bridges Zod with Angular Reactive Forms
   - Used in auth forms and generation wizard

6. **Theme System** - localStorage-persisted:
   - `ThemeService` manages light/dark theme
   - Applied via CSS attribute `data-theme="light"|dark"` on `document.body`
   - Theme toggle in auth layout and app header

### Directory Structure

```
src/app/
├── auth/                  # Lazy-loaded auth module
│   ├── auth.routes.ts     # Auth child routes
│   ├── pages/             # Login, register, forgot-password
│   └── layouts/           # AuthLayoutComponent (theme toggle)
├── qna/                   # Lazy-loaded Q&A module
│   ├── qna.routes.ts
│   ├── pages/
│   ├── components/        # QuestionComposer, AnswerPanel, FeedbackDialog
│   └── documents/         # Document management sub-feature
├── generation/            # Lazy-loaded generation module
│   ├── generation.routes.ts
│   ├── pages/
│   ├── components/
│   └── steps/             # Generation wizard steps
├── core/
│   ├── services/          # ThemeService
│   ├── components/        # ThemeToggleComponent
│   └── (no shared folder - interceptors at root)
├── app.ts                 # Root component (standalone)
├── app.config.ts          # DI provider configuration
├── app.routes.ts          # Main routing
├── auth.interceptor.ts    # Bearer token injection
└── api-url-interceptor.ts # Base URL prepending

libs/
├── state/
│   ├── auth/              # AuthStore (signals)
│   ├── qna/               # QnaStore (signals)
│   └── generation/        # TaskProgressService (RxJS + exponential backoff)
└── data-access/
    ├── auth/              # AuthService, models, schemas
    ├── qna/               # QnaService, models
    ├── generation/        # GenerationService
    └── documents/         # DocumentService
```

## Important Patterns & Conventions

### Using Signals (NOT RxJS)
```typescript
// In a service
export class MyStore {
  private state = signal({ /* initial state */ });
  myData = computed(() => this.state().someField);

  updateData(newData) {
    this.state.update(s => ({ ...s, someField: newData }));
  }
}

// In a component
export class MyComponent {
  store = inject(MyStore);

  constructor() {
    effect(() => {
      // This runs when store.myData changes
      console.log(this.store.myData());
    });
  }
}
```

### Form Validation with Zod
```typescript
import { zodValidator } from '@vectorseek/data-access';
import { mySchema } from './schemas/my.schema';

// In form setup
this.form = this.fb.group({
  email: ['', [zodValidator(mySchema.shape.email)]],
});
```

### HTTP Services Pattern
```typescript
export class MyService {
  private http = inject(HttpClient);
  private apiUrl = 'endpoint'; // Interceptor prepends base URL

  getData() {
    return this.http.get<MyResponse>(this.apiUrl).pipe(
      catchError(err => this.handleError(err))
    );
  }
}
```

### Feature Module Structure
1. Create routes file: `feature.routes.ts` with child routes
2. Create main page component (standalone)
3. Create sub-components in `components/` folder
4. Lazy-load in `src/app/app.routes.ts` via `loadChildren`
5. If shared state needed, add to `libs/state/`

## TypeScript & Build Configuration

- **Target:** ES2022
- **Strict Mode:** Full strict checks enabled (`strictTemplates: true`)
- **Testing:** Karma + Jasmine (no e2e framework configured)
- **Bundle Budgets:** 500kB initial warning, 1MB error limit
- **Dev Server Default:** Production configuration (optimized builds)

## Important Notes

- **Environment Config:** Located in `src/environments/` - Dev API is `http://localhost:8000`
- **i18n:** Uses ngx-translate with static JSON files in `src/assets/i18n/` (currently pt-BR only)
- **No Global State Slice:** AuthStore is used globally via DI; other features have their own stores
- **Token Storage:** AuthStore holds tokens; they're injected into requests via `authInterceptor`
- **Abort Patterns:** QnaStore has abort controller for request cancellation on component destroy
- **Exponential Backoff:** GenerationService uses exponential backoff for polling progress with 503 retry logic
- **Code Style:** Prettier configured with 100 character line width for Angular templates
