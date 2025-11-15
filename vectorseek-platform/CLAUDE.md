# CLAUDE.md

This file provides comprehensive guidance to Claude Code (claude.ai/code) and AI assistants when working with code in this repository.

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

### Git Workflow
- **Main branch:** Not specified in current setup
- **Feature branches:** Use `claude/` prefix for Claude-generated branches
- **Commit convention:** Clear, descriptive messages focusing on "why" rather than "what"
- Push with: `git push -u origin <branch-name>`

## Project Overview

**VectorSeek Platform** is a modern Angular 20 application using standalone components and Angular Signals for state management. It's a single-page application that provides Q&A, document processing, and content generation capabilities with a focus on AI-powered features.

### Tech Stack
- **Framework:** Angular 20.3.0 (standalone components, no NgModules)
- **Language:** TypeScript 5.9.2 (ES2022 target, strict mode)
- **UI Library:** Angular Material 20.2.12 + Angular CDK
- **Styling:** Tailwind CSS + component-scoped CSS
- **State Management:** Angular Signals (primary) + RxJS 7.8.0 (for HTTP/async)
- **Validation:** Zod 3.25.76 with custom Angular bridge
- **i18n:** ngx-translate/core 17.0.0 (pt-BR only currently)
- **Markdown:** ngx-markdown 20.1.0 + marked 16.4.2
- **Testing:** Karma 6.4.0 + Jasmine 5.9.0
- **Build:** Angular CLI 20.3.8

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
   - **Note:** Not using Nx despite planning docs mentioning it - single Angular CLI project

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
   - Schemas in feature module `schemas/` directories
   - Custom `zodValidator()` function bridges Zod with Angular Reactive Forms
   - Used in auth forms and generation wizard

6. **Theme System** - localStorage-persisted:
   - `ThemeService` manages light/dark theme
   - Applied via CSS attribute `data-theme="light"|dark"` on `document.body`
   - Theme toggle in auth layout and app header

### Routing Architecture

**Main Routes** (from `src/app/app.routes.ts`):
```typescript
/                       # Redirects to /auth
/auth/*                 # Public authentication routes (lazy-loaded)
  /auth/login
  /auth/register
  /auth/forgot-password
/app/*                  # Protected routes (wrapped in AppLayoutComponent)
  /app/qna             # Q&A module
  /app/documents       # Document management
  /app/generation      # Content generation wizard
/**                     # Wildcard redirects to /auth
```

**Route Strategy:**
- Lazy loading via `loadChildren()` and `loadComponent()`
- Standalone components (no NgModules)
- Functional router guards approach
- Layout-based routing (AppLayoutComponent wraps protected routes)

### Directory Structure

```
vectorseek-platform/
├── src/
│   ├── app/
│   │   ├── auth/                         # Lazy-loaded auth module
│   │   │   ├── layouts/
│   │   │   │   └── auth-layout.component.*
│   │   │   ├── components/
│   │   │   │   └── typewriter.component.*  # Animated typewriter effect
│   │   │   ├── schemas/                   # Zod validation schemas
│   │   │   │   ├── login.schema.ts
│   │   │   │   ├── register.schema.ts
│   │   │   │   └── forgot-password.schema.ts
│   │   │   ├── utils/
│   │   │   │   └── zod-validators.ts      # Zod-to-Angular bridge
│   │   │   ├── login-page.component.*
│   │   │   ├── register-page.component.*
│   │   │   ├── forgot-password.component.*
│   │   │   └── auth.routes.ts
│   │   │
│   │   ├── qna/                          # Lazy-loaded Q&A module
│   │   │   ├── documents/                # Document management sub-feature
│   │   │   │   └── document-list.component.*
│   │   │   ├── pipes/
│   │   │   │   └── markdown.pipe.ts      # Custom markdown pipe
│   │   │   ├── qna-page.component.*
│   │   │   ├── question-composer.component.*
│   │   │   ├── answer-panel.component.*
│   │   │   ├── feedback-dialog.component.*
│   │   │   └── qna.routes.ts
│   │   │
│   │   ├── generation/                   # Lazy-loaded generation module
│   │   │   ├── steps/                    # Wizard steps
│   │   │   │   ├── step-one.component.*
│   │   │   │   ├── step-two.component.*
│   │   │   │   └── step-three.component.*
│   │   │   ├── generation-wizard.component.*
│   │   │   ├── generation-progress.component.*
│   │   │   ├── generation.validation.ts
│   │   │   └── generation.routes.ts
│   │   │
│   │   ├── core/                         # Core shared utilities
│   │   │   ├── services/
│   │   │   │   └── theme.service.ts      # Light/dark theme management
│   │   │   ├── components/
│   │   │   │   ├── theme-toggle.component.*
│   │   │   │   ├── navbar.component.*
│   │   │   │   └── glow-cursor.component.*  # Custom cursor effect
│   │   │   ├── interceptors/             # (Note: interceptors at app root)
│   │   │   └── layouts/
│   │   │       └── app-layout.component.*   # Main app shell with navbar
│   │   │
│   │   ├── app.ts                        # Root component (standalone)
│   │   ├── app.config.ts                 # DI provider configuration
│   │   ├── app.routes.ts                 # Main routing
│   │   ├── auth.interceptor.ts           # Bearer token injection
│   │   └── api-url-interceptor.ts        # Base URL prepending
│   │
│   ├── assets/
│   │   └── i18n/
│   │       └── pt-BR.json                # Portuguese translations
│   │
│   └── environments/
│       ├── environment.ts                # Dev: http://localhost:8000
│       └── environment.prod.ts           # Prod: https://api.vectorseek.com
│
├── libs/                                 # Monorepo-style shared libraries
│   ├── state/                            # Signal-based state management
│   │   └── src/lib/
│   │       ├── auth/
│   │       │   └── auth.store.ts         # AuthStore (signals)
│   │       ├── qna/
│   │       │   └── qna.store.ts          # QnaStore (signals)
│   │       └── generation/
│   │           └── task-progress.service.ts  # Polling with exponential backoff
│   │
│   └── data-access/                      # API services and models
│       └── src/lib/
│           ├── auth/
│           │   ├── auth.service.ts       # AuthService
│           │   ├── auth.models.ts        # Domain models
│           │   ├── auth.api.ts           # API endpoint constants
│           │   └── schemas/              # Zod schemas
│           ├── qna/
│           │   ├── qna.service.ts
│           │   ├── qna.models.ts
│           │   └── qna.api.ts
│           ├── generation/
│           │   ├── generation.service.ts
│           │   └── generation.models.ts
│           └── documents/
│               ├── document.service.ts
│               └── document.models.ts
│
├── public/                               # Static assets
├── .vscode/                              # VS Code configuration
│   └── extensions.json                   # Recommended Angular extension
├── angular.json                          # Angular CLI configuration
├── tsconfig.json                         # Base TypeScript configuration
├── tsconfig.app.json                     # App-specific TS config
├── tsconfig.spec.json                    # Test-specific TS config
├── package.json                          # Dependencies
├── CLAUDE.md                             # This file
└── README.md                             # Basic Angular CLI README
```

## Code Patterns & Conventions

### File Naming Conventions
- **Components:** `feature-name.component.ts` (kebab-case)
- **Services:** `feature-name.service.ts`
- **Stores:** `feature-name.store.ts`
- **Models:** `feature-name.models.ts`
- **API Constants:** `feature-name.api.ts`
- **Schemas:** `feature-name.schema.ts`
- **Routes:** `feature-name.routes.ts`
- **Tests:** `*.spec.ts` (matching source file name)

### Component Structure
All components are **standalone** and follow this pattern:
```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [CommonModule, /* other imports */],
  templateUrl: './my-component.component.html',
  styleUrls: ['./my-component.component.css']
})
export class MyComponent {
  // Use inject() instead of constructor DI
  private myService = inject(MyService);

  // Public properties accessible in template
  // Methods
}
```

### Using Signals (NOT RxJS)
```typescript
// In a store (libs/state/)
import { signal, computed } from '@angular/core';

export class MyStore {
  private state = signal({
    data: null,
    loading: false,
    error: null
  });

  // Computed selectors
  data = computed(() => this.state().data);
  isLoading = computed(() => this.state().loading);

  // Update methods
  setData(newData: any) {
    this.state.update(s => ({ ...s, data: newData, loading: false }));
  }

  setLoading(loading: boolean) {
    this.state.update(s => ({ ...s, loading }));
  }
}

// In a component
import { Component, inject, effect } from '@angular/core';

export class MyComponent {
  store = inject(MyStore);

  constructor() {
    effect(() => {
      // This runs when store.data() changes
      const data = this.store.data();
      if (data) {
        console.log('Data updated:', data);
      }
    });
  }

  // Or use signals directly in template
  // Template: {{ store.data() }}
}
```

### Form Validation with Zod

**Step 1:** Define schema in `schemas/` directory:
```typescript
import { z } from 'zod';

export const mySchema = z.object({
  email: z.string().email('ERRORS.INVALID_EMAIL'),
  password: z.string().min(8, 'ERRORS.PASSWORD_TOO_SHORT'),
});

export type MyFormData = z.infer<typeof mySchema>;
```

**Step 2:** Use in component with custom validator:
```typescript
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { zodValidator } from '@vectorseek/data-access/auth/utils/zod-validators';
import { mySchema } from './schemas/my.schema';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  // ...
})
export class MyComponent {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    email: ['', [zodValidator(mySchema.shape.email)]],
    password: ['', [zodValidator(mySchema.shape.password)]],
  });

  onSubmit() {
    if (this.form.valid) {
      const data = this.form.value;
      // Process form
    }
  }
}
```

### HTTP Services Pattern

**API Constants** (`*.api.ts`):
```typescript
export const MY_API_ENDPOINTS = {
  getData: () => '/api/my-feature/data',
  postData: (id: string) => `/api/my-feature/${id}`,
} as const;
```

**Service Implementation** (`*.service.ts`):
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { MY_API_ENDPOINTS } from './my-feature.api';

@Injectable({ providedIn: 'root' })
export class MyService {
  private http = inject(HttpClient);

  getData(): Observable<MyData> {
    return this.http.get<MyApiResponse>(MY_API_ENDPOINTS.getData()).pipe(
      map(response => this.mapToModel(response)),
      catchError(err => this.handleError(err))
    );
  }

  private mapToModel(dto: MyApiResponse): MyData {
    // Transform snake_case API response to camelCase domain model
    return {
      userId: dto.user_id,
      userName: dto.user_name,
    };
  }

  private handleError(error: any): Observable<never> {
    // Normalize errors with translation keys
    const message = error.error?.message || 'ERRORS.UNKNOWN';
    return throwError(() => ({ message, status: error.status }));
  }
}
```

**Interceptors automatically:**
- Prepend base URL (`apiUrlInterceptor`)
- Add Bearer token from AuthStore (`authInterceptor`)

### Error Handling Patterns

**In Services:**
- Always normalize errors with translation keys
- Extract field-level validation errors when available
- Map HTTP status codes to user-friendly messages
- Handle retry logic for rate limiting (429, 503)

**Example from AuthService:**
```typescript
private normalizeError(error: any): Observable<never> {
  const apiError = error.error;

  // Field-level validation errors
  if (apiError?.errors) {
    const fieldErrors: Record<string, string[]> = {};
    for (const [field, messages] of Object.entries(apiError.errors)) {
      fieldErrors[field] = messages as string[];
    }
    return throwError(() => ({
      message: 'ERRORS.VALIDATION_FAILED',
      fieldErrors
    }));
  }

  // Rate limiting
  if (error.status === 429) {
    const retryAfter = error.headers.get('Retry-After');
    return throwError(() => ({
      message: 'ERRORS.RATE_LIMITED',
      retryAfter: parseInt(retryAfter || '60', 10)
    }));
  }

  // Generic error
  return throwError(() => ({
    message: apiError?.message || 'ERRORS.UNKNOWN',
    status: error.status
  }));
}
```

### Testing Conventions

- Test files: `*.spec.ts` alongside source files
- Goal: ≥70% coverage for `libs/data-access/` (per ADR-001)
- Use Jasmine syntax: `describe()`, `it()`, `expect()`
- Mock HTTP calls with `HttpClientTestingModule`
- Test standalone components with `TestBed.configureTestingModule()`

**Example component test:**
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyComponent } from './my.component';

describe('MyComponent', () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent] // Standalone component
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

### Styling Conventions

- **Tailwind CSS** for utility classes (responsive design, spacing, colors)
- **Component-scoped CSS** for component-specific styles
- **Angular Material** for pre-built UI components (buttons, forms, dialogs)
- **Theme variables** via `data-theme` attribute on `document.body`
- **CSS class naming:** Use descriptive kebab-case (avoid generic names)

**Example component styles:**
```css
.my-component-container {
  @apply flex flex-col gap-4 p-6;
}

.my-component-title {
  @apply text-2xl font-bold text-gray-900 dark:text-gray-100;
}
```

### Feature Module Structure

When creating a new feature module:

1. **Create routes file:** `feature.routes.ts` with child routes
2. **Create main page component** (standalone)
3. **Create sub-components** in `components/` folder
4. **Create services** in `libs/data-access/feature/`
5. **Create store** in `libs/state/feature/` if shared state needed
6. **Create schemas** in `schemas/` for validation
7. **Lazy-load** in `src/app/app.routes.ts` via `loadChildren`

**Example routes file:**
```typescript
import { Routes } from '@angular/router';

export const FEATURE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./feature-page.component').then(m => m.FeaturePageComponent)
  },
  // Add child routes as needed
];
```

**In main routes:**
```typescript
{
  path: 'app',
  component: AppLayoutComponent,
  children: [
    {
      path: 'feature',
      loadChildren: () => import('./feature/feature.routes').then(m => m.FEATURE_ROUTES)
    }
  ]
}
```

## TypeScript & Build Configuration

- **Target:** ES2022
- **Strict Mode:** Full strict checks enabled (`strict: true`, `strictTemplates: true`)
- **Module Resolution:** Node
- **Path Aliases:**
  - `@vectorseek/state` → `libs/state/src/index.ts`
  - `@vectorseek/data-access` → `libs/data-access/src/index.ts`
- **Testing:** Karma + Jasmine (no e2e framework configured)
- **Bundle Budgets:** 500kB initial warning, 1MB error limit
- **Build System:** Angular application builder (modern, faster than Webpack)

## Important Notes

### Environment & Configuration
- **Environment Config:** Located in `src/environments/`
  - Dev API: `http://localhost:8000`
  - Prod API: `https://api.vectorseek.com`
- **i18n:** Uses ngx-translate with static JSON files in `src/assets/i18n/`
  - Currently pt-BR only
  - Translation keys used throughout: `'ERRORS.INVALID_EMAIL'`, `'AUTH.LOGIN_TITLE'`, etc.

### State Management
- **No Global State Slice:** AuthStore is used globally via DI; other features have their own stores
- **Token Storage:** AuthStore holds tokens; they're injected into requests via `authInterceptor`
- **Abort Patterns:** QnaStore has AbortController for request cancellation on component destroy
- **Exponential Backoff:** GenerationService uses exponential backoff for polling progress with 503 retry logic

### Code Style
- **Prettier:** 100 character line width for Angular templates
- **Formatting:** Single quotes, trailing commas where valid
- **Imports:** Group by external, Angular, internal

### Security Considerations
- **NEVER** commit sensitive data (API keys, tokens, credentials)
- **ALWAYS** use environment variables for configuration
- Tokens stored in memory only (AuthStore signal, not localStorage)
- HTTP-only approach for sensitive operations

### Performance Optimizations
- Lazy loading for all feature modules
- OnPush change detection where applicable
- Bundle size monitoring (500kB warning threshold)
- Production builds optimize automatically

### Common Pitfalls to Avoid
- ❌ Don't use RxJS for state management (use Signals instead)
- ❌ Don't create NgModules (use standalone components)
- ❌ Don't use `constructor()` for DI (use `inject()` function)
- ❌ Don't bypass Zod validation (always validate forms)
- ❌ Don't hardcode API URLs (use environment config + interceptor)
- ❌ Don't forget to clean up subscriptions (use `takeUntilDestroyed()`)
- ❌ Don't ignore TypeScript errors (strict mode enabled for a reason)

## Documentation & Planning

The repository includes comprehensive planning documentation in the `/frontend/` directory:

- **ADRs** (`docs/adr/`) - Architectural Decision Records documenting key decisions
- **Epics** (`epicos.md`) - Epic planning with detailed activities
- **Implementation Docs** - Step-by-step implementation guides
- **Obsidian Notes** (`obsidian/`) - Operational notes and activity tracking

When making architectural changes, consider documenting them in an ADR following the existing pattern.

## Development Workflow

1. **Check out feature branch** (use `claude/` prefix)
2. **Install dependencies:** `npm install`
3. **Start dev server:** `npm start`
4. **Make changes** following patterns above
5. **Write tests** for new functionality
6. **Run tests:** `npm test`
7. **Build for production:** `npm run build`
8. **Commit changes** with descriptive messages
9. **Push to feature branch:** `git push -u origin <branch-name>`

## Getting Help

- **Angular Docs:** https://angular.dev/
- **Angular Material:** https://material.angular.dev/
- **Zod:** https://zod.dev/
- **Tailwind CSS:** https://tailwindcss.com/
- **Project Documentation:** Check `/frontend/docs/` for ADRs and implementation guides
