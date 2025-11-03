# VectorSeek Frontend Workspace (Offline Mock)

This repository contains an offline-friendly mock of an Nx Angular workspace.
Because the execution environment blocks access to the public npm registry,
all framework dependencies are represented by lightweight local stubs under
`third-party/`. The structure mirrors a typical Nx monorepo with a primary
Angular application named `platform` configured for mock SSR support and
internationalisation.

## Available commands

The `nx` CLI is emulated by `tools/nx-cli.js` and supports the following
commands:

- `nx graph` – prints a static project graph listing available projects.
- `nx test [project]` – emits placeholder test output for the selected project
  (or all projects when omitted).

These commands allow local smoke testing without an actual Nx installation.
