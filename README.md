# Syntaxxed

**Build focused, redacted repository context for AI coding tools.**

Syntaxxed is a free, local-first VS Code extension for selecting, preparing,
reviewing, and copying source-code context before it is shared with an AI coding
tool. It also includes an optional local MCP gateway that can provide compatible
agents with progressively richer file views under explicit developer control.

The extension is designed around a simple principle: your repository should be
shared with an AI assistant on your terms.

Syntaxxed does not claim to contain an agent that already has independent
filesystem, terminal, or network access. Its controls apply to context built in
the Syntaxxed interface and file requests made through the Syntaxxed MCP Gateway.

## What is included

The 0.3.0 public preview includes:

- A VS Code Activity Bar view for scanning eligible workspace files.
- Manual file inclusion and exclusion before context is built.
- Optional **Task focus** selection based on a plain-language task description.
- Three understandable context detail levels: **Outline**, **Logic**, and
  **Source**.
- A read-only per-file preview of the exact prepared and redacted output.
- Built-in detection and replacement of common credentials and private-key
  material.
- Team-specific regular-expression redaction rules.
- Non-overridable exclusions for high-risk paths, credentials, generated files,
  binaries, symlinks, and MCP registration files.
- Root and nested `.gitignore` support.
- Token estimates, a configurable context-size warning, and local usage
  statistics.
- **Build & Copy** for producing a labelled Markdown context package on the
  operating-system clipboard.
- An optional authenticated, loopback-only MCP gateway for Claude Code, Cursor,
  and other compatible clients.
- Session-scoped developer approval for implementation and complete-source
  requests made through the gateway.
- Content-free local gateway audit events.
- A source-tree CLI and composite GitHub Action for development and automation.
- A bundled JSON schema for `syntaxxed.json`.
- A restricted portfolio-evaluation licence; see [LICENSE](LICENSE).

## How Syntaxxed prepares context

```text
Workspace files
    -> path, ignore, size, binary, and symlink checks
    -> manual selection and optional Task focus
    -> Outline, Logic, or Source preparation
    -> filename and content redaction
    -> read-only preview
    -> Build & Copy or an approved MCP response
```

Every detail level passes through the same export redaction boundary. Selecting
Source does not bypass secret detection.

## Context detail levels

| Detail | Best suited to | Output |
| --- | --- | --- |
| **Outline** | Architecture review, navigation, and initial agent exploration | For supported JavaScript and TypeScript files, parser-validated declarations, types, interfaces, signatures, and class structure are retained while implementation bodies are removed. Agent-facing requests fail closed if Syntaxxed cannot produce a valid structural outline. |
| **Logic** | Debugging, implementation work, and most everyday prompts | Implementations are retained. Parser-recognized JavaScript and TypeScript comments are removed without modifying strings or regular expressions. Valid JSON is compacted. Other eligible languages receive conservative whitespace normalization. |
| **Source** | Formatting, documentation, templates, configuration, or exact-source work | The complete original file is retained before filename and content redaction. |

Logic is the default because it is the most useful general-purpose balance.
Outline usually produces the smallest context and reveals the least
implementation detail. Source should be selected deliberately when exact text
is required.

## Source discovery and selection

Syntaxxed starts with eligible text files from each open workspace folder. It then
applies:

1. Non-overridable sensitive-path exclusions.
2. File-type, binary, size, and symlink checks.
3. Root and nested `.gitignore` rules.
4. Additional exclusions from `syntaxxed.json`.
5. Manual selection in the sidebar.
6. Optional Task focus selection.

Task focus is a local lexical and symbol-based relevance aid. It is deliberately
not presented as semantic retrieval or a guarantee that every required file has
been selected. Review the result and add callers, tests, configuration, and
types when the task requires them.

## Secret and sensitive-file handling

Syntaxxed applies built-in patterns for common credential families, including
source-control tokens, cloud credentials, AI-provider keys, database connection
strings, bearer tokens, private-key material, and common assignment formats.
Custom rules can cover organization-specific formats.

Redaction is defence in depth, not a completeness guarantee. A novel, encoded,
fragmented, or unusually named credential may not match a known pattern. Always
use Preview before sharing sensitive code, and use the destination provider's
appropriate privacy and retention controls.

Filenames are passed through the same redaction boundary as file bodies. This
prevents a recognized credential embedded in a path from appearing in a payload
receipt.

## Requirements

- VS Code 1.105.0 or newer.
- A local or remote filesystem-backed workspace.
- VS Code Workspace Trust for gateway and workspace-configuration changes.
- Node.js 22 or newer only when building from source or using the source-tree
  CLI. Node.js is not required for a normal VSIX installation.

Virtual workspaces are not supported because Syntaxxed relies on real-path,
symlink, ignore, and file-size boundaries.

## Install the VS Code extension

### Install a downloaded VSIX

1. Download `syntaxxed-0.3.0.vsix` from the release assets.
2. Open VS Code.
3. Open **Extensions**.
4. Select the **...** menu.
5. Select **Install from VSIX...**.
6. Choose the downloaded package.
7. Open a project folder.
8. Select the Syntaxxed icon in the Activity Bar.
9. Follow the Syntaxxed Getting Started walkthrough.

PowerShell installation:

```powershell
code --install-extension ".\syntaxxed-0.3.0.vsix" --force
```

Verify the installed extension identity:

```powershell
code --list-extensions --show-versions | Select-String "syntaxxed.syntaxxed"
```

The expected result includes `syntaxxed.syntaxxed@0.3.0`.

### Build and install from source

```powershell
npm ci
npm run verify:release
code --install-extension ".\syntaxxed-0.3.0.vsix" --force
```

Use `npm.cmd` instead of `npm` when local PowerShell execution policy blocks
`npm.ps1`.

## Quick start: build context

1. Open the project you want to work on.
2. Select **Syntaxxed** in the Activity Bar.
3. Wait for the workspace scan to finish.
4. Optionally describe the task under **Task focus**.
5. Review the selected file list.
6. Use **Select all**, **Clear**, and individual checkboxes to correct it.
7. Choose the required **Context detail**:
   - Outline for structure and signatures.
   - Logic for implementation without comments.
   - Source for complete file content.
8. Select **Preview** beside sensitive or important files.
9. Review the prepared and redacted virtual document.
10. Select **Build & Copy**.
11. Paste the result into the destination AI tool.

The copied Markdown contains:

- A strict instruction envelope that identifies the enclosed files as untrusted
  source data.
- The selected context detail.
- Included-file and token estimates.
- The calculated token reduction.
- The number of recognized secret spans replaced.
- A labelled section for each selected file.

Syntaxxed neutralizes matching context-envelope tags found inside source files so a
file cannot close the generated wrapper by embedding those tag names.

## Sidebar reference

### Workspace context summary

- **Selected files** is the number of files currently included.
- **Token reduction** compares estimated source and prepared tokens.
- **Source tokens** estimates the selected original text.
- **Context tokens** estimates the payload after the chosen detail transform.

These are deterministic estimates, not provider billing measurements. Tokenizers
vary between models.

### Context-size warning

Syntaxxed warns before copying when the estimated payload exceeds
`syntaxxed.tokenBudgetWarningThreshold`. When Outline can materially reduce the
selection, the warning offers **Use Outline**. Otherwise, deselect files or use
a more focused task description.

### This session

The local statistics panel shows source tokens, prepared tokens, reduction, an
estimated input-cost saving, build count, redacted-secret count, and aggregate
workspace/lifetime token reduction. No source content is stored in these
counters.

Use **Reset** to delete session, workspace, and lifetime counters.

## Optional MCP Gateway

The gateway is disabled by default. Installing or activating Syntaxxed does not
start a server, write MCP configuration, or open a port.

When explicitly enabled in a trusted workspace, Syntaxxed starts one authenticated
loopback server for each open workspace folder. Each server:

- binds to `127.0.0.1` on an operating-system-assigned port;
- receives a new 256-bit bearer credential whenever it starts;
- validates the Host header;
- rejects browser-origin requests;
- limits request size and concurrent sessions;
- owns exactly one workspace root;
- reuses the scanner's path, symlink, ignore, size, and binary checks;
- applies configured redaction before every successful file response; and
- records content-free lifecycle and decision events locally.

### Enable the gateway

1. Open the target project.
2. Mark the workspace as trusted.
3. Run **Syntaxxed: Enable MCP Gateway for Workspace**.
4. Read the modal description.
5. Select **Enable Gateway**.

Syntaxxed creates or merges a `syntaxxed-gateway` entry in:

- `.mcp.json`
- `.cursor/mcp.json`

Existing MCP servers and unrelated settings are preserved. The generated entry
contains a machine-specific loopback endpoint and bearer credential. Do not
commit it. If an earlier preview left a `syntaxxed-gateway` entry, Syntaxxed
removes that previous entry while installing the new one.

Run **Syntaxxed: Show MCP Gateway Status** to inspect running workspace endpoints.

### Gateway tools

#### `get_file_outline`

Returns a parser-validated Outline representation of supported JavaScript or
TypeScript. This is the intended first request because implementation bodies are
removed. It does not display an implementation-access approval prompt.

For unsupported file types, parser initialization failures, missing grammars,
or invalid syntax, the agent-facing Outline request fails closed without
returning the original file.

#### `request_file_logic`

Requests implementation logic with comments and excess formatting removed.
Syntaxxed displays a modal approval unless the same MCP session already has a Logic
grant for that exact file.

#### `request_file_source`

Requests the complete source file before secret redaction. Source approval is
separate from Logic approval; approving Logic does not silently grant Source.

### Approval choices

- **Allow Once** authorizes the current request.
- **Allow This File for Session** reuses the grant only for the same MCP
  session, file, and detail level.
- **Deny** returns no requested implementation content.

Restarting the gateway rotates credentials and clears session grants.

### Local audit events

Open **View -> Output** and select **Syntaxxed Gateway**. Events are JSON lines and
may include:

- gateway and session lifecycle;
- allowed, denied, and rejected file requests;
- workspace and relative path;
- requested context detail; and
- a content-free rejection reason.

Audit events do not contain file contents, prompts, credentials, or redacted
secret values. Version 0.3.0 keeps them only in the current VS Code output
session; durable enterprise audit storage remains roadmap work.

### Disable the gateway

Run **Syntaxxed: Disable MCP Gateway for Workspace**. Syntaxxed stops local servers,
rotates away the in-memory credentials, clears session grants, and removes only
its current and previous preview registrations from supported project MCP files.

If a project configuration file is invalid JSON or cannot be written, Syntaxxed
leaves it untouched and reports the cleanup failure. Repair the file and run
Disable again, or remove only the `syntaxxed-gateway` entry manually.

## Security boundaries

### Enforced within the Syntaxxed Gateway

- Loopback-only authenticated HTTP transport.
- Per-workspace server isolation.
- Host and browser-origin checks.
- Bounded request bodies and session counts.
- Canonical workspace path and traversal checks.
- Symlink, file-size, binary, ignore, and sensitive-path checks.
- Parser-validated fail-closed Outline disclosure.
- Separate Logic and Source authorization.
- Secret redaction on every successful file response.
- Content-free local audit events.

### Not enforced by version 0.3.0

- Syntaxxed cannot disable another extension or agent's native filesystem,
  terminal, network, search, or indexing tools.
- Clipboard content is outside Syntaxxed's control after the user copies it.
- Redaction cannot guarantee detection of every possible secret.
- The gateway does not yet enforce centralized organization policy.
- Audit events are not durable, signed, or forwarded to a SIEM.
- There is no enterprise identity, role, tenant, or control plane.
- Task focus is lexical selection, not production semantic retrieval.

These are deliberate public-preview boundaries, not implied enterprise
features. See [Enterprise roadmap](docs/enterprise-roadmap.md) for planned work.

## Workspace configuration

Run **Syntaxxed: Create Workspace Configuration** in a trusted workspace to create
`syntaxxed.json` in the first workspace folder:

```json
{
  "include_comments": false,
  "exclude": []
}
```

### `include_comments`

When `true`, comments are retained where Syntaxxed has a parser-backed or
conservative transformation. Source always retains the original comments before
redaction.

### `exclude`

An array of additional gitignore-style patterns:

```json
{
  "include_comments": false,
  "exclude": [
    "docs/generated/**",
    "fixtures/private/**",
    "**/*.snapshot"
  ]
}
```

Workspace exclusions cannot override non-overridable sensitive-path rules.

For migration, version 0.3.0 can read an existing `syntaxxed.json` when
`syntaxxed.json` is absent. New configuration should use the Syntaxxed filename and
keys.

## Extension settings

Open VS Code Settings and search for `Syntaxxed`.

### `syntaxxed.tokenBudgetWarningThreshold`

- Default: `30000`
- Scope: resource/workspace
- Range: `1000` to `2000000`

Shows a warning before copying when the estimated prepared payload is larger
than the configured value.

### `syntaxxed.inputCostPerMillionTokens`

- Default: `3`
- Scope: resource/workspace

Used only for the local estimated cost-saving display. Set this to the input
rate for the model and provider you use. It does not affect transformation or
selection.

### `syntaxxed.customRedactionRules`

An array of named JavaScript regular expressions applied to filenames and
prepared content:

```json
{
  "syntaxxed.customRedactionRules": [
    {
      "name": "Internal service token",
      "pattern": "\\bSERVICE_TOKEN_[A-Za-z0-9]{24,}\\b",
      "flags": "i"
    }
  ]
}
```

Rules are bounded and validated. Slash delimiters are not used. Global matching
is always enabled. Invalid rules are ignored and counted in the sidebar instead
of breaking a context build.

## Files always excluded

The scanner includes non-overridable exclusions for categories such as:

- `.git`, dependency directories, generated build output, coverage, and caches;
- environment files and common credential files;
- SSH, GnuPG, Kubernetes, cloud, Terraform state/variables, and service-account
  material;
- private keys, certificates, keystores, and common signing artifacts;
- `.mcp.json` and `.cursor/mcp.json`, because they may contain bearer
  credentials;
- binaries, symlinks, and oversized files; and
- Syntaxxed's own output paths when identified by the CLI.

The exact list is maintained in the scanner and ignore engine. Review the source
and tests when evaluating Syntaxxed for a regulated environment.

## Source-tree CLI

The CLI uses the same scanner, transforms, redaction, task focus, and payload
builder as the extension. It is available from a source checkout but is not
included in the public VSIX.

Build and run it:

```powershell
npm run package:cli
npm run cli -- --dir "C:\work\my-project" --detail logic --out "C:\work\my-project\.syntaxxed\context.md"
```

Direct bundled invocation:

```powershell
node .\dist\cli\index.js --dir . --detail outline --intent "refactor checkout validation" --out .\context.md
```

CLI options:

| Option | Meaning |
| --- | --- |
| `-l, --detail <level>` | `outline`, `logic`, or `source`; defaults to `logic`. |
| `-i, --intent <query>` | Optional task focus used to select relevant files. |
| `-o, --out <filepath>` | Required Markdown output path. |
| `-d, --dir <directory>` | Workspace to scan; defaults to the current directory or `GITHUB_WORKSPACE` in Actions. |

The CLI excludes an output file that is located inside the scanned workspace so
it cannot ingest a previous generated context.

## Composite GitHub Action

`action.yml` runs the source-tree CLI and uploads the resulting artifact as
`syntaxxed-context`. A repository publishing the action must include the production
CLI bundle in its release tag.

```yaml
- name: Build Syntaxxed context
  id: syntaxxed
  uses: your-account/syntaxxed@v1
  with:
    detail: logic
    intent: investigate checkout validation
    out: syntaxxed-context.md

- name: Report token reduction
  shell: bash
  run: echo "Syntaxxed removed ${{ steps.syntaxxed.outputs.tokens-saved }} estimated tokens"
```

Inputs:

- `detail`: Outline, Logic, or Source; default `logic`.
- `intent`: optional Task focus.
- `out`: output filename; default `syntaxxed-context.md`.

Outputs:

- `output-path`
- `tokens-saved`
- `secrets-redacted`

## Optional aggregate telemetry

Telemetry is disabled unless both environment variables are explicitly set:

```text
SYNTAXXED_TELEMETRY_URL=https://YOUR_PROJECT_REF.supabase.co/rest/v1/metrics
SYNTAXXED_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

When configured, Syntaxxed attempts one short HTTPS event after a successful
context build containing only:

- estimated tokens removed;
- recognized secret spans replaced; and
- source surface (`extension` or `cli`).

No repository name, file path, source content, prompt, task description, user,
device, or stable installation identifier is included. Failures and timeouts are
absorbed and never fail or delay the context build. See [Privacy](PRIVACY.md) and
[Telemetry setup](docs/telemetry.md).

## Development and verification

Install exact locked dependencies:

```powershell
npm ci
```

Useful commands:

```powershell
npm run typecheck
npm run lint
npm run compile
npm run package
npm test
npm audit --audit-level=high
npm run verify:release
```

`npm run verify:release` type-checks, lints, creates a production bundle, runs
the VS Code extension-host test suite, packages the VSIX, and lists the packaged
contents.

The tests cover:

- current and migration context-detail names;
- parser-backed Outline and Logic behavior;
- conservative handling of unsupported languages;
- redaction of filenames and file contents;
- strict payload envelope neutralization;
- root and nested ignore rules;
- configuration creation and loading;
- sensitive MCP-registration exclusions;
- gateway authentication, request limits, isolation, approval reuse, and audit
  events;
- gateway configuration merge, migration, and cleanup;
- CLI and GitHub Action behavior;
- aggregate telemetry minimization; and
- extension activation and public commands.

## Migration from the 0.2.1 preview

Version 0.3.0 is a deliberate pre-launch identity change:

| Previous preview | Syntaxxed 0.3.0 |
| --- | --- |
| Extension ID `syntaxxed.syntaxxed` | `syntaxxed.syntaxxed` |
| Product name Syntaxxed | Syntaxxed |
| Axe | Outline |
| Prune | Logic |
| Preserve | Source |
| Compress & Copy | Build & Copy |
| `syntaxxed.json` | `syntaxxed.json` |
| `syntaxxed-gateway` | `syntaxxed-gateway` |

Because the extension identity changed, uninstall the old preview after
disabling its gateway, then install `syntaxxed-0.3.0.vsix`. Syntaxxed 0.3.0 accepts
the previous detail names at API boundaries, can read the previous workspace
configuration when the new file is absent, and removes the previous gateway
entry when reconciling MCP configuration.

## Troubleshooting

### The Syntaxxed icon is missing

- Confirm `syntaxxed.syntaxxed` is installed and enabled.
- Reload the VS Code window.
- Open **View -> Appearance -> Activity Bar** if the Activity Bar is hidden.
- Run **Syntaxxed: Open Context Builder** from the Command Palette.

### No files appear

- Confirm a filesystem-backed folder is open.
- Select **Rescan Workspace**.
- Review root and nested `.gitignore` rules.
- Review `syntaxxed.json` exclusions.
- Check whether the files are binary, symlinked, oversized, generated, or under
  a non-overridable sensitive path.

### Task focus selects the wrong files

- Use concrete symbols, paths, feature names, and error terms.
- Add tests, callers, types, and configuration manually.
- Clear Task focus to restore the full eligible list.
- Treat it as a starting point rather than complete retrieval.

### Outline does not reduce a file

- Structural Outline currently supports JavaScript and TypeScript families.
- Unsupported languages receive conservative treatment in the interactive
  workflow.
- Check that the file parses successfully.
- Reload the extension if parser resources failed to initialize.

Agent-facing Outline requests fail closed for unsupported or invalid files.

### The gateway command is disabled

- Mark the workspace as trusted.
- Open at least one workspace folder.

### The MCP client reports the gateway as offline

- Run **Syntaxxed: Show MCP Gateway Status**.
- Inspect `.mcp.json` and `.cursor/mcp.json`.
- Open the **Syntaxxed Gateway** output channel.
- Restart or reconnect the MCP client after enabling the gateway.
- Re-enable after a VS Code restart if the client retained an old endpoint.

### A file request repeatedly prompts

Grants are scoped by MCP session, file, and detail level. Logic approval does
not grant Source. Choose **Allow This File for Session** only when that exact
scope is appropriate.

### A redaction alert appears

Preview the output and verify that the relevant values were replaced. Rotate an
exposed credential according to its provider's incident process; redaction from
a new payload does not invalidate an already disclosed secret.

## Documentation

- [Agent Gateway guide](docs/agent-gateway.md)
- [Privacy statement](PRIVACY.md)
- [Enterprise roadmap](docs/enterprise-roadmap.md)
- [Development and version log](docs/development-log.md)
- [Release checklist](docs/release-checklist.md)
- [Public-preview launch kit](docs/reddit-launch-kit.md)
- [Funding and strategic-acquisition plan](docs/funding-acquisition-plan.md)
- [Changelog](CHANGELOG.md)

## Licence

This repository is published for portfolio viewing and prospective employment
evaluation only. It is not licensed for unauthorised use, copying, modification,
distribution, production use, or derivative works. See the [portfolio evaluation
license](LICENSE) and [NOTICE](NOTICE).
