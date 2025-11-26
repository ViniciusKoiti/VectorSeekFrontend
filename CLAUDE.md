# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

**VectorSeek Frontend** is a monorepo containing the Angular-based frontend platform for VectorSeek, along with comprehensive architectural documentation and planning materials. The repository follows an ADR (Architectural Decision Records) driven approach with detailed epic planning and activity tracking.

## Repository Structure

```
VectorSeekFront/
├── vectorseek-platform/     # Main Angular 20 application (see vectorseek-platform/CLAUDE.md)
├── frontend/                # Documentation and planning
│   ├── docs/adr/           # Architectural Decision Records (ADR-001, ADR-002, ADR-003)
│   ├── obsidian/           # Activity tracking and operational notes
│   ├── scripts/            # Automation scripts for activity status management
│   └── epicos.md           # Epic planning documentation
└── CLAUDE.md               # This file
```

## Working Directory Context

The primary development work happens in `vectorseek-platform/`. When working on code:

1. **Navigate to the platform directory:** `cd vectorseek-platform`
2. **Follow the detailed guidance:** See `vectorseek-platform/CLAUDE.md` for comprehensive Angular application architecture, patterns, and commands

## Quick Commands

All development commands should be run from the `vectorseek-platform/` directory:

```bash
cd vectorseek-platform
npm install                    # Install dependencies
npm start                      # Start dev server (http://localhost:4200)
npm test                       # Run unit tests
npm run build                  # Build for production
```

## Documentation-Driven Development

This repository follows a strict documentation-first approach:

### Architectural Decision Records (ADRs)

All significant architectural decisions are documented in `frontend/docs/adr/`:

- **ADR-001** - Authentication Foundation & App Shell
- **ADR-002** - Authentication Flow in Angular CLI
- **ADR-003** - Q&A Module

**IMPORTANT:** When making architectural changes:
1. Always consult relevant ADRs first
2. Update ADRs before creating new documentation files
3. Reference ADR decisions in code comments when implementing complex patterns

### Epic Planning

`frontend/epicos.md` contains the detailed epic breakdown:
- **Epic 1** - Authentication Foundation & App Shell
- **Epic 8** - Q&A Module with semantic search
- Future epics for content generation, analytics, etc.

### Activity Tracking

`frontend/obsidian/` contains operational notes aligned with epic activities:
- Files follow pattern: `E{epic}-A{activity}.md` (e.g., `E1-A1.md`)
- Status tags: `in-progress`, `blocked`, `done`
- Each activity links back to relevant ADRs

### Automation Scripts

`frontend/scripts/` contains Python automation for activity management:
- Track activity status changes
- Generate reports
- Maintain consistency between planning docs

## Key Architectural Principles

### 1. ADR-Driven Architecture
- All technical decisions are traceable to ADRs
- ADRs define the "why" behind implementation choices
- Activity notes (`E*-A*.md`) provide the "how" and current status

### 2. Angular Standalone Components
- No NgModules - application uses Angular 20+ standalone components
- Lazy loading for all feature modules
- Signal-based state management (not RxJS for state)

### 3. Monorepo-Style Organization
- Shared code in `vectorseek-platform/libs/`:
  - `libs/state/` - Signal-based stores
  - `libs/data-access/` - API services and models
- Path aliases: `@vectorseek/state`, `@vectorseek/data-access`

### 4. Type Safety & Validation
- Zod schemas for all form validation
- Strict TypeScript configuration
- Custom Zod-to-Angular validator bridge

### 5. Internationalization
- `@ngx-translate/core` for i18n
- Currently pt-BR only
- Translation keys throughout: `'AUTH.LOGIN_TITLE'`, `'ERRORS.INVALID_EMAIL'`

## Feature Modules

The application is organized into feature modules (see `vectorseek-platform/CLAUDE.md` for details):

- **Auth** (`src/app/auth/`) - Login, register, password recovery
- **Q&A** (`src/app/qna/`) - Question answering with citations
- **Documents** (`src/app/qna/documents/`) - Document management
- **Generation** (`src/app/generation/`) - Content generation wizard
- **Dashboard** (`src/app/dashboard/`) - Analytics and insights
- **Settings** (`src/app/settings/`) - User preferences
- **Workspaces** (`src/app/workspaces/`) - Workspace management

## Development Workflow

### When Starting New Work

1. **Check Epic Status:** Review `frontend/obsidian/E*-A*.md` for current activity
2. **Review ADRs:** Read relevant ADRs in `frontend/docs/adr/`
3. **Read Application Guide:** See `vectorseek-platform/CLAUDE.md` for implementation patterns
4. **Navigate to Platform:** `cd vectorseek-platform`
5. **Follow Angular Patterns:** Use standalone components, Signals, Zod validation

### When Making Architectural Changes

1. **Identify Affected ADR:** Determine which ADR(s) govern the area
2. **Propose Changes:** Update or create new ADR following existing format
3. **Get Alignment:** Ensure changes align with epic goals
4. **Update Activity Notes:** Reflect progress in relevant `E*-A*.md` files
5. **Implement:** Follow patterns in `vectorseek-platform/CLAUDE.md`

### Git Workflow

- **Branch Naming:** Use `claude/` prefix for Claude-generated branches
- **Commits:** Clear, descriptive messages focusing on "why" over "what"
- **ADR References:** Link commits to ADR decisions when relevant

## Important Constraints

### What to Avoid

- ❌ **Don't bypass ADRs** - All significant decisions should reference or update ADRs
- ❌ **Don't create parallel documentation** - Update ADRs instead of creating new MD files
- ❌ **Don't use RxJS for state** - Use Angular Signals (see `vectorseek-platform/CLAUDE.md`)
- ❌ **Don't create NgModules** - Use standalone components only
- ❌ **Don't ignore Epic planning** - Check `frontend/epicos.md` for context

### What to Embrace

- ✅ **ADR-first approach** - Document decisions before implementation
- ✅ **Signal-based state** - Use Angular Signals for reactive state management
- ✅ **Zod validation** - Type-safe form validation aligned with backend contracts
- ✅ **Incremental delivery** - Follow 80% acceptance criteria from ADRs
- ✅ **Activity tracking** - Update Obsidian notes to reflect progress

## Testing Strategy

- **Unit Tests:** Karma + Jasmine (≥70% coverage for `libs/data-access/`)
- **Test Files:** `*.spec.ts` alongside source files
- **Mocking:** `HttpClientTestingModule` for API mocking
- **Standalone Testing:** `TestBed.configureTestingModule({ imports: [Component] })`

## Environment Configuration

- **Development API:** `http://localhost:8000`
- **Production API:** `https://api.vectorseek.com`
- **Environment Files:** `vectorseek-platform/src/environments/`

## Key Technologies

- **Framework:** Angular 20.3.0 with standalone components
- **Language:** TypeScript 5.9.2 (ES2022, strict mode)
- **UI:** Angular Material 20 + Tailwind CSS
- **State:** Angular Signals + RxJS (HTTP only)
- **Validation:** Zod 3.25.76
- **i18n:** ngx-translate 17.0.0
- **Testing:** Karma 6.4 + Jasmine 5.9

## Getting Help

### Documentation Priority

1. **Application-specific:** See `vectorseek-platform/CLAUDE.md`
2. **Architecture decisions:** Read ADRs in `frontend/docs/adr/`
3. **Epic context:** Check `frontend/epicos.md`
4. **Current activities:** Review `frontend/obsidian/E*-A*.md`

### External Resources

- Angular Docs: https://angular.dev/
- Angular Material: https://material.angular.dev/
- Zod: https://zod.dev/

## Translation Keys (pt-BR)

The application uses ngx-translate with Portuguese (Brazil) as the primary language. Translation keys are located in `vectorseek-platform/src/assets/i18n/pt-BR.json` and follow this structure:

- **AUTH.*** - Authentication module (login, register, etc.)
- **QNA.*** - Q&A module
- **GENERATION.*** - Content generation
- **ERRORS.*** - Error messages
- **COMMON.*** - Shared/common translations

When adding new features, always add corresponding translation keys.

## Notes for AI Assistants

1. **Start with Context:** Always check the relevant ADR and activity notes before making changes
2. **Respect the Architecture:** Follow the patterns defined in ADRs and `vectorseek-platform/CLAUDE.md`
3. **Document Decisions:** When making architectural choices, propose ADR updates
4. **Test Coverage:** Maintain ≥70% coverage for `libs/data-access/`
5. **Use Signals:** Prefer Angular Signals over RxJS for state management
6. **Standalone Components:** Never create NgModules
7. **Validate with Zod:** Use Zod schemas for all form validation
8. **Translation Keys:** Always use i18n keys, never hardcode Portuguese text

## Current Epic Status

**Epic 1 (Authentication Foundation)** - In Progress
- E1-A1: Configure authentication module (see `frontend/obsidian/E1-A1.md`)
- Focus: Login, register, password recovery with Zod validation

**Epic 8 (Q&A Module)** - Partial Implementation
- Document management with upload, reprocess, delete
- Q&A interface with citations
- Feedback system

See `frontend/epicos.md` for complete epic breakdown and future roadmap.
