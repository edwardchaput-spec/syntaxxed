# Changelog

All notable changes to the extension are documented in this file.

## Unreleased

## 0.3.0 - 2026-08-07

### Added

- Added the Syntaxxed product identity across the extension, CLI, GitHub Action,
  local MCP gateway, preview, onboarding, schema, documentation, and release
  assets.
- Added a detailed Syntaxxed user guide and a vendor-neutral agent gateway guide.
- Added a Syntaxxed Marketplace icon and a clean `syntaxxed.syntaxxed` extension identity
  for the pre-public release.

### Changed

- Replaced Axe, Prune, and Preserve with the clearer **Outline**, **Logic**, and
  **Source** context-detail levels.
- Replaced **Compress & Copy** with **Build & Copy**, **Smart Intent** with
  **Task focus**, and profile/mode wording with **Context detail**.
- Replaced `syntaxxed.json` with `syntaxxed.json` and simplified its public keys to
  `include_comments` and `exclude`.
- Renamed public commands, settings, payload fields, CLI options, Action inputs,
  and internal APIs around context building and prepared context.
- Renamed the MCP registration to `syntaxxed-gateway` and its tools to
  `get_file_outline`, `request_file_logic`, and `request_file_source`.
- Updated the production bundle licence banner to match the Apache License 2.0
  repository licence.

### Migration

- Existing `syntaxxed.json` files and previous configuration keys remain
  readable as migration fallbacks when no `syntaxxed.json` exists.
- Previous Axe, Prune, and Preserve detail values are normalized at input
  boundaries.
- Stale `syntaxxed-gateway` entries are removed without changing unrelated MCP
  registrations.

### Documentation

- Rebranded the enterprise roadmap, funding and acquisition plan, public launch
  kit, telemetry guide, release checklist, and generated offline HTML plan.
- Marked the previous naming report as a superseded historical record.

### Testing

- Updated type, engine, extension, CLI, Action, configuration, gateway, and MCP
  integration coverage for the Syntaxxed identity and terminology.
- Strict extension and CLI type-checking passes after the migration.

## 0.2.1 - 2026-08-07

### Added

- Added an automatic first-install walkthrough and a command to reopen the
  Syntaxxed quick start.
- Added a 256-pixel Marketplace icon, Free/Preview metadata, search keywords,
  explicit workspace-extension placement, and virtual-workspace compatibility
  information.
- Added local JSON validation for `syntaxxed.json` and a public privacy
  statement covering local processing, optional telemetry, retention, and user
  controls.

### Security

- Hard-excluded `.mcp.json`, `.cursor/mcp.json`, and other `mcp.json`
  registration files from workspace and direct-file scans so live local MCP
  credentials cannot become selectable context.
- Pinned the reusable GitHub Action's Node setup and artifact upload steps to
  verified upstream commit hashes.
- Reduced the VSIX surface by excluding the CLI bundle, composite action,
  internal engineering and funding plans, and documentation generator from the
  extension package.

### Changed

- Relicensed the local developer core from the proprietary freeware EULA to the
  Apache License 2.0 and added a copyright NOTICE. Future hosted and enterprise
  services may remain separately licensed.
- Fixed unreadable unselected Syntax Mode options on Windows and other native
  dropdown renderers by applying explicit VS Code dropdown colours and native
  light/dark colour schemes.
- Changed generated `syntaxxed.json` files to start with an empty
  `custom_ignores` list. Tests, scripts, and configuration now remain eligible
  until the developer deliberately excludes them.
- Reworked installation and onboarding documentation around a downloadable
  VSIX and the first-run workflow.

### Testing

- Expanded the VS Code integration suite to 44 passing tests, including neutral
  generated configuration and MCP credential-file exclusion.

## 0.2.0 - 2026-08-06

### Added

- Added an opt-in, workspace-trust-gated MCP context gateway using Streamable
  HTTP on an operating-system-assigned loopback port.
- Added a separately generated 256-bit bearer credential for every workspace
  gateway instance.
- Added `get_axed_file`, `request_pruned_file`, and
  `request_preserved_file` MCP tools for progressively richer, one-file context
  disclosure.
- Added disclosure approvals scoped to the MCP session, workspace, relative
  path, and requested profile, with one-call and session-grant choices.
- Added content-free JSON audit events in the **Syntaxxed Gateway** output
  channel.
- Added commands to enable, disable, and inspect the gateway.
- Added safe single-file scanning and compression APIs so gateway requests do
  not require a full workspace scan.
- Added detailed gateway operations, user documentation, an engineering change
  log, and an enterprise context-gateway roadmap.

### Security

- Bound each gateway to exactly one workspace folder and rejected traversal,
  symlinks, real paths outside that root, ignored paths, binaries, oversized
  files, unauthenticated requests, unexpected Host values, and browser Origin
  requests.
- Added constant-time bearer comparison, request body limits, session limits,
  no-store and content-type hardening headers, session cleanup, and credential
  rotation when a gateway restarts.
- Replaced the general-purpose web framework with Node's native HTTP server and
  moved authentication ahead of bounded JSON parsing.
- Required an explicit modal consent step and a trusted VS Code workspace
  before the gateway can be enabled.
- Required Workspace Trust before creating `syntaxxed.json`, matching the
  extension's declared Restricted Mode boundary.
- Applied the existing sensitive-path rules and secret redaction pipeline to
  every successful MCP response, including Preserve.
- Made agent-facing Axe fail closed without returning file contents for
  unsupported extensions, unavailable parsers, or invalid syntax, preventing
  conservative full-source fallback from bypassing implementation approval.
- Removed automatic creation of `CLAUDE.md`, `.cursorrules`, and MCP
  registration during ordinary extension activation.

### Changed

- Changed the public display name from **Syntaxxed** to **Syntaxxed** while retaining
  the `syntaxxed.syntaxxed` extension identifier and legacy command/view IDs for
  upgrade compatibility.
- Replaced the deprecated fixed-port SSE gateway with authenticated MCP
  Streamable HTTP.
- Made gateway registration reversible: Syntaxxed merges only its own
  `syntaxxed-gateway` entry into `.mcp.json` and `.cursor/mcp.json`, and removes
  only that entry when disabled.
- Replaced heuristic JavaScript and TypeScript comment stripping with
  Tree-sitter comment-node removal.
- Made whitespace handling conservative for unsupported languages, preserving
  Python/YAML indentation, repeated spaces in string literals, and regular
  expression contents.
- Limited structural Axe transformation to supported JavaScript and TypeScript
  syntax. Valid JSON is parser-minified; invalid JSON and JSONC remain
  conservative.
- Declared Restricted Mode as limited support: context scanning remains
  available, while gateway and workspace-configuration mutations require
  trust.

### Migration notes

- The gateway is now disabled by default. Run **Syntaxxed: Enable MCP Gateway
  for Workspace** and accept the consent dialog to create a current endpoint.
- Existing fixed-port or SSE client entries from development builds are not
  compatible with 0.2.0. Re-enable the gateway to write an authenticated
  `type: "http"` entry.
- Generated MCP entries contain ephemeral local credentials. Do not commit
  them. Run **Syntaxxed: Disable MCP Gateway for Workspace** before uninstalling
  to remove Syntaxxed's entries automatically.
- Prune authorization does not imply Preserve authorization. Existing clients
  should expect a distinct human approval for each disclosure level.

### Testing

- Added end-to-end MCP client coverage for authentication, tool output,
  session/profile approval isolation, and audit rejection events.
- Added coverage for reversible Claude/Cursor configuration merging, safe
  direct-file access, ignore and traversal boundaries, regular expressions,
  literal whitespace, and Python/YAML indentation.
- The 0.2.0 hardening milestone contains 42 passing integration tests.

## 0.1.3 - 2026-08-05

### Documentation

- Added a complete installation and usage guide for running Syntaxxed alongside
  the Claude Code VS Code extension or terminal client.

### Security

- Expanded credential redaction across common cloud, source-control, AI,
  package-registry, messaging, and database formats.
- Added built-in exclusions for environment files, credential stores, and
  private key material.
- Prevented preview paths and scanned symlinks from escaping the open workspace.
- Added runtime validation for all webview messages.
- Moved webview code and styles into local assets and enforced a restrictive
  Content Security Policy without inline scripts or styles.
- Added dependency audit overrides for patched transitive packages.
- Added pinned CI checks for quality, dependency auditing, package contents,
  and full-history Gitleaks scanning.

### Changed

- Refactored the extension host, preview, sidebar, configuration, statistics,
  AST lifecycle, build, lint, and package configuration.
- Reduced the published extension contents to the runtime bundle, local webview
  assets, documentation, icon, and Tree-sitter grammars.
- Added integration coverage for secret redaction, export safety, preview path
  validation, command registration, and all compression profiles.
