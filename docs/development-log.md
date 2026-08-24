# Syntaxxed development and version log

This document is the detailed engineering record for changes that are too
implementation-specific for the public changelog. `CHANGELOG.md` remains the
short release summary; this file records architectural decisions, migrations,
verification, known limitations, and the reason for each material change.

## Recovery baseline

Before the enterprise-gateway refactor began, a compact source snapshot was
created at:

```text
.backups/syntaxxed-pre-gateway-hardening-20260806.zip
```

The archive excludes `.git`, dependencies, generated bundles, test-runtime
downloads, and historical VSIX packages. It includes the source, documentation,
manifest, lockfile, build configuration, workflows, scripts, and media assets.
The `.backups/` directory is ignored by Git.

Immediately before the product-wide Syntaxxed rebrand, a third compact recovery
snapshot was created at:

```text
.backups/syntaxxed-pre-syntaxxed-rebrand-20260807.zip
```

It excludes dependencies, generated bundles, test runtimes, Git internals,
prior backups, and packaged VSIX artifacts. It is the recovery point for the
last pre-Syntaxxed source and documentation state.

After completing the 0.2.1 public-preview release candidate, a second compact
source and documentation snapshot was created at:

```text
.backups/syntaxxed-0.2.1-release-candidate-20260807.zip
```

It excludes dependencies, generated bundles, test-runtime downloads, Git
history, prior backups, and historical VSIX packages.

## Version history

| Version | Date | Engineering state |
| --- | --- | --- |
| 0.3.0 | 2026-08-07 | Syntaxxed rebrand and product-language release candidate |
| 0.2.1 | 2026-08-07 | Free public-preview release candidate |
| 0.2.0 | 2026-08-06 | Gateway hardening foundation |
| 0.1.3 | 2026-08-05 | Security-audited local context compiler baseline |

## 0.3.0 — Syntaxxed rebrand and product-language release candidate

### Objective

Replace the development-era brand and metaphor-heavy vocabulary with one
coherent product identity suitable for free developer adoption and credible
enterprise conversations. Because no public user base depends on the old
extension identifier, this release adopts a clean Syntaxxed identity instead of
carrying permanent legacy naming into the package surface.

### Product identity

- Renamed the product, package, publisher, command category, activity view,
  walkthrough, preview provider, output channels, CLI, GitHub Action, and MCP
  gateway to **Syntaxxed**.
- Set the extension identity to `syntaxxed.syntaxxed` and the release version to
  `0.3.0`.
- Added a new Syntaxxed Marketplace PNG icon and renamed the supporting SVG assets.
- Updated public descriptions around the core proposition: building focused,
  redacted repository context for AI coding tools.

### Professional product language

The public terminology is now deliberately literal and consistent:

| Previous term | Syntaxxed term | User meaning |
| --- | --- | --- |
| Axe | Outline | Structure, declarations, types, and signatures |
| Prune | Logic | Implementation with comments and excess formatting removed |
| Preserve | Source | Complete source before secret redaction |
| Compress & Copy | Build & Copy | Prepare the selected context and copy the payload |
| Smart Intent | Task focus | Optional task description used for file relevance |
| Syntax Mode/profile | Context detail | The requested level of source disclosure |

The same vocabulary is used in the sidebar, commands, payload metadata,
previews, settings, CLI, GitHub Action, MCP schema, approvals, audit events,
tests, and documentation.

### Configuration and migration

- Replaced `syntaxxed.json` with `syntaxxed.json`.
- Renamed public configuration keys to `include_comments` and `exclude`.
- Renamed VS Code settings and commands into the `syntaxxed` namespace.
- Renamed MCP tools to `get_file_outline`, `request_file_logic`, and
  `request_file_source`.
- Renamed the MCP registration to `syntaxxed-gateway`.
- Retained bounded migration readers for legacy detail values, the previous
  JSON filename and keys, telemetry environment variables, and gateway entry.
  These fallbacks prevent accidental configuration loss without exposing old
  terminology in the normal product experience.

### Internal architecture and packaging

- Renamed the compression engine to the context builder and renamed result
  models from compressed files/tokens to prepared files/tokens.
- Renamed the AST pruning module to the source transformer and gave its
  functions operation-specific names.
- Replaced the production bundle's obsolete closed-source/EULA banner with an
  Apache License 2.0 notice matching the repository licence and NOTICE.
- Updated the JSON schema identity to `syntaxxed.dev` and the release Action output
  to `syntaxxed-context.md` / `syntaxxed-context`.
- Kept internal funding, roadmap, and launch-planning material out of the VSIX.

### Documentation

- Rewrote the README as a detailed product and user guide covering workflow,
  context-detail levels, privacy, redaction, configuration, CLI, Action, MCP
  approvals, migration, limitations, development, and troubleshooting.
- Replaced the vendor-specific agent guide with a vendor-neutral gateway guide.
- Rebranded and updated the enterprise roadmap, funding/acquisition plan,
  launch kit, telemetry guide, release checklist, and generated offline HTML.
- Marked the earlier naming report as a superseded historical decision record.
- Added `docs/Product-Naming-Brief.html`, a self-contained, brand-neutral
  creative brief that explains the product, features, USP, long-term vision,
  naming territories, rejection criteria, scorecard, and family workshop in
  plain English. The internal brief is excluded from the public VSIX.

### Verification

- Strict extension and CLI type-checking, ESLint, and both production Webpack
  bundles pass after the API and test migration.
- The source suite passes all 44 tests under VS Code 1.131.0.
- The exact expanded VSIX passes 42 applicable tests; the two CLI/Action tests
  remain source-only because the CLI is not included in the extension package.
- The final VSIX contains 22 archive files and installs into an isolated Windows
  extension directory as `syntaxxed.syntaxxed@0.3.0`.
- Gitleaks 8.30.1 found no secrets in the exact expanded artifact.
- `syntaxxed-0.3.0.vsix` is 670,995 bytes. Its SHA-256 is
  `a4f05f0e7a0f6c9d76142e0e9b0f15f7a064a774d8a5c79c3ac8057c4102c2b9`.
- The live npm advisory audit remains pending explicit authorization because it
  sends dependency metadata to the npm registry advisory service.

## 0.2.1 — free public-preview release candidate

### Objective

Turn the hardened 0.2.0 foundation into a low-friction build suitable for free
solo-developer evaluation, direct VSIX distribution, public feedback, and later
Marketplace publication.

### Public-release presentation and onboarding

- Relicensed the local extension, CLI, and embedded gateway under Apache-2.0,
  replacing the proprietary freeware EULA, and added a copyright NOTICE. The
  licensing boundary keeps the option for future hosted and enterprise services
  to use separate commercial terms.
- Corrected the Syntax Mode dropdown so both selected and unselected options
  inherit explicit VS Code dropdown colours in dark, light, and high-contrast
  themes instead of relying on the operating system popup defaults.
- Added a dedicated 256-pixel PNG icon and Marketplace banner, category,
  keyword, Free pricing, and Preview metadata.
- Declared the extension as a workspace extension and explicitly rejected
  virtual workspaces because the security model depends on filesystem real
  paths, symlink metadata, native ignores, and file sizes.
- Added a three-step Getting Started walkthrough that opens on first install and
  can be reopened with **Syntaxxed: Open Quick Start**.
- Added a bundled JSON schema for `syntaxxed.json` and a public privacy
  statement.
- Rewrote installation guidance around the downloaded VSIX instead of assuming
  every evaluator will build from source.

### Security and packaging corrections

- Hard-excluded all `mcp.json` and `.mcp.json` files. This prevents the
  short-lived bearer token written to project MCP registration from appearing
  in the manual selection UI, clipboard payload, or gateway direct-file tools.
- Added regression coverage for both root `.mcp.json` and
  `.cursor/mcp.json`.
- Pinned the composite GitHub Action's upstream actions by verified commit SHA.
- Removed the CLI bundle, GitHub Action, internal engineering log, funding plan,
  and funding-document generator from the VSIX. Those assets remain in the
  development workspace but are not part of the installed extension.

### Developer-experience correction

- The generated `syntaxxed.json` previously excluded common tests and scripts.
  That was a poor default for unfamiliar repositories because tests often
  contain the clearest behavioral contract. New config files now start with no
  custom ignores, leaving exclusions as an explicit developer choice.

### Internal planning artifacts

- Added a detailed funding/acquisition execution plan and a self-contained,
  responsive HTML edition generated by `scripts/render-funding-plan-html.mjs`.
  These internal materials are excluded from the VSIX.

### Verification

- TypeScript strict type-check, ESLint, production bundling, manifest
  validation, and VS Code-hosted integration tests pass.
- The suite now contains 44 passing tests.
- The exact packaged extension passes 42 applicable tests after extraction;
  the two CLI tests remain source-only because the CLI is not shipped in the
  VSIX.
- `syntaxxed-0.2.1.vsix` installs into an isolated Windows profile as
  `syntaxxed.syntaxxed@0.2.1`, contains 24 archive files, and is 694,397 bytes. Its
  final SHA-256 is
  `8bfb208d7f06633355dc74119097733caef75e6e616873e097602ce76ab7ce67`.
- Gitleaks 8.30.1 found no secrets in the exact expanded release artifact.
- Desktop sidebar rendering was inspected at realistic panel width using a
  representative VS Code dark theme.
- Remaining non-code launch dependencies are Marketplace publisher/repository
  identity, the desired long-term licence boundary, an online dependency audit,
  and clean install checks on macOS and Linux.

## 0.2.0 — gateway hardening foundation

### Objective

Turn the experimental embedded MCP server into an explicit, workspace-scoped
foundation for the longer-term enterprise context gateway. This release does
not claim to be a complete enterprise control plane. Its purpose is to remove
unsafe lifecycle behavior, establish enforceable boundaries inside the gateway,
and make subsequent policy and audit work possible.

### Consent and workspace lifecycle

- Removed automatic creation of `CLAUDE.md` and `.cursorrules` on extension
  activation. Prompt instructions were never an enforceable security boundary
  and silently creating them could interfere with existing agent workflows.
- Removed automatic MCP server startup and project configuration mutation.
- Added explicit commands to enable, disable, and inspect gateway status.
- Gateway enablement is persisted in VS Code workspace state only after the
  developer accepts a modal explanation of the changes.
- Restricted gateway commands to trusted workspaces. The extension now declares
  limited support for VS Code Restricted Mode instead of claiming that every
  feature is safe in untrusted workspaces.
- Restricted `syntaxxed.json` creation to trusted workspaces while retaining
  read-only context preparation in Restricted Mode.
- Disabling removes only the `syntaxxed-gateway` entry and preserves every other
  MCP server and unrelated configuration value.
- Disable always attempts stale-registration cleanup, even when no live gateway
  or enabled-state flag remains, and reports any files it could not update.

### Transport, authentication, and isolation

- Replaced deprecated SSE with MCP Streamable HTTP.
- Replaced the global fixed port with an operating-system-assigned ephemeral
  port for every workspace folder.
- Each gateway instance owns exactly one workspace root. A request in one VS
  Code window can no longer fall through to a different window that happened to
  acquire a shared port first.
- Added a 256-bit random bearer token to every gateway instance.
- Added constant-time credential comparison, loopback host validation, browser
  Origin rejection, response hardening headers, a 1 MiB JSON body limit, and a
  maximum of 16 concurrent MCP sessions per workspace.
- Replaced the general-purpose web framework with Node's native HTTP server and
  moved authorization ahead of bounded JSON parsing.
- MCP configuration uses `type: "http"`, the generated endpoint URL, and an
  `Authorization` header supported by Claude Code and Cursor.
- Endpoint credentials are rotated whenever the extension recreates a gateway.
  Generated entries are machine-specific and must not be committed.

### Disclosure approvals and audit events

- Replaced the global path-only approval set with grants scoped by MCP session,
  workspace instance, relative path, and disclosure profile.
- Approving Prune access no longer silently grants Preserve access.
- Replaced the ambiguous “Approve All for Session” action with “Allow Once” and
  “Allow This File for Session”.
- Approval prompts display the workspace, complete relative path, requested
  disclosure level, and the fact that secret redaction still runs.
- Added structured, content-free audit events for gateway lifecycle, sessions,
  disclosures, denials, and rejected requests. Events currently go to the
  `Syntaxxed Gateway` VS Code output channel and are not uploaded.

### File access and performance boundary

- Added a direct single-file scanner for MCP tools.
- Agent requests no longer scan and retain the whole repository just to return
  one file.
- The direct scanner applies the same ignore, hard credential exclusion,
  maximum-size, binary, real-path, and symlink policies as a workspace scan.
- Traversal, absolute-path escape, missing, linked, ignored, binary, and
  oversized requests fail closed.
- Agent-facing Axe also fails closed for unsupported extensions, unavailable
  parsers, and syntax-invalid files. The manual clipboard workflow retains its
  conservative fallback because the developer previews and initiates that
  disclosure directly.

### Compression correctness

- Removed global repeated-whitespace collapsing. It could alter string literals,
  flatten Python indentation, and change nested YAML meaning.
- Removed heuristic comment stripping for languages without a parser-backed
  implementation.
- JavaScript and TypeScript comment removal now uses Tree-sitter comment nodes,
  preserving strings, template literals, regular expressions, indentation, and
  comment-like text inside literals.
- Valid JSON still uses parser-backed minification. Invalid JSON and JSONC fall
  back to conservative line normalization.
- Unsupported languages now receive safe trailing-whitespace and excess-blank-
  line normalization rather than potentially destructive transformations.

### Verification

- TypeScript strict type-check: passed.
- ESLint: passed.
- Webpack development and production builds: passed without warnings. Moving
  the gateway to native HTTP reduced the minified extension bundle from about
  2.15 MiB to 928 KiB.
- VS Code integration suite: 42 passing tests on VS Code 1.131.0.
- New coverage includes authenticated and unauthenticated MCP connections,
  malformed and oversized request rejection, Streamable HTTP tool calls,
  session/profile approval isolation, audit events, safe regular-expression and
  literal handling, Python/YAML indentation, direct single-file scanning, path
  traversal rejection, and reversible MCP configuration merging.

### Migration from 0.1.3

1. Installing or activating Syntaxxed no longer starts the gateway.
2. Run `Syntaxxed: Enable MCP Gateway for Workspace` in a trusted workspace.
3. Review the generated `.mcp.json` and `.cursor/mcp.json` entries.
4. Restart or reconnect the agent's MCP client if it does not watch config
   changes automatically.
5. Before committing, omit the machine-specific `syntaxxed-gateway` entries.
6. Run `Syntaxxed: Disable MCP Gateway for Workspace` before uninstalling if you
   want Syntaxxed to remove its entries automatically.

### Known limitations retained intentionally

- The gateway governs only reads made through its MCP tools. It cannot prevent a
  coding agent from using a separate native filesystem tool. Enforced mediation
  requires future agent hooks, sandboxing, or an enterprise-managed launcher.
- Audit events are local and session-oriented; there is no signed durable audit
  store or central control plane yet.
- Smart Intent remains lexical filename, path, and JS/TS symbol ranking rather
  than dependency-aware or semantic retrieval.
- Structural Axe pruning is currently limited to JavaScript and TypeScript.
- Project MCP registration is the portable integration supported by both target
  clients, but the generated endpoint and bearer credential are machine-specific.
- The local savings dashboard remains an estimate and is not reconciled with
  provider billing records.
- The private development manifest permits local VSIX packaging without a
  repository URL. Marketplace publication requires real repository, homepage,
  and issue-tracker metadata so relative documentation links resolve correctly.

See `docs/enterprise-roadmap.md` for the planned progression from this
foundation to a centrally governed enterprise product.

## 0.1.3 — audited local compiler baseline

Version 0.1.3 established the shared extension/CLI engine, three compression
profiles, local secret redaction, preview UI, token budget warnings, local ROI
statistics, nested `.gitignore` traversal, custom redaction expressions,
aggregate opt-in telemetry, the GitHub Action, and the initial embedded MCP
experiment. Its security work added CSP enforcement, webview message validation,
preview path containment, symlink rejection, dependency overrides, Gitleaks CI,
and a minimal publish bundle.

The principal architectural shortcomings carried into the 0.2.0 work were
automatic workspace mutation, a global unauthenticated fixed-port SSE server,
approval grants shared across clients and disclosure levels, whole-workspace
rescans per MCP request, and lossy text transformations for whitespace-sensitive
languages.
