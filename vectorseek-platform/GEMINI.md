# Project Overview

This is an Angular web application called "VectorseekPlatform". Based on the file structure and dependencies, it appears to be a platform with features related to authentication, Q&A, document management, and content generation.

The project is structured using Angular's best practices, with separate modules for each feature, lazy loading for efficient loading, and a clear separation of concerns. It uses Angular Material for UI components, ngx-translate for internationalization, and Zod for data validation.

## Building and Running

### Development Server

To start a local development server, run:

```bash
ng serve
```

Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

### Building

To build the project, run:

```bash
ng build
```

The build artifacts will be stored in the `dist/` directory. The production configuration is used by default.

### Running Unit Tests

To run unit tests, execute:

```bash
ng test
```

## Development Conventions

*   **Code Style**: The project uses Prettier for code formatting. The configuration is defined in `package.json`.
*   **Components**: New components can be generated using the Angular CLI: `ng generate component component-name`.
*   **Routing**: The application uses a modular routing approach with lazy loading for feature modules. The main routes are defined in `src/app/app.routes.ts`.
*   **State Management**: The presence of a `libs/state` directory suggests that the project might be using a state management library, but further investigation is needed to confirm this.
*   **Internationalization**: The project uses `ngx-translate` for internationalization. Translation files are located in `public/assets/i18n`.
