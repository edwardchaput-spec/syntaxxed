# Using Syntaxxed with AI coding agents

Syntaxxed supports two deliberately separate workflows:

1. **Build & Copy** creates reviewable repository context that you paste into
   any AI assistant.
2. The optional **Syntaxxed MCP Gateway** allows compatible agents to request
   progressively richer, redacted file views.

The clipboard workflow requires no agent integration. The gateway workflow is
intended for Claude Code, Cursor, and other clients that support project-scoped
Streamable HTTP MCP servers.

## Requirements

- VS Code 1.105.0 or newer.
- `syntaxxed-0.3.0.vsix`.
- A filesystem-backed project folder.
- Workspace Trust for gateway and configuration changes.
- An AI coding client of your choice.
- Node.js 22 or newer only for source builds or the source-tree CLI.

## 1. Install Syntaxxed

In VS Code:

1. Open **Extensions**.
2. Select the **...** menu.
3. Select **Install from VSIX...**.
4. Choose `syntaxxed-0.3.0.vsix`.
5. Reload the VS Code window if prompted.

PowerShell alternative:

```powershell
code --install-extension "C:\path\to\syntaxxed-0.3.0.vsix" --force
```

Verify:

```powershell
code --list-extensions --show-versions | Select-String "syntaxxed.syntaxxed"
```

The expected output includes `syntaxxed.syntaxxed@0.3.0`.

## 2. Open the target project

Open the repository as a folder or workspace. Syntaxxed intentionally does not
scan arbitrary folders selected from a file picker.

If the Syntaxxed icon is not visible:

1. Run **Syntaxxed: Open Context Builder** from the Command Palette.
2. Confirm the Activity Bar is visible under **View -> Appearance**.
3. Confirm `syntaxxed.syntaxxed` is enabled for the current workspace.

## 3. Build reviewable context

1. Open the Syntaxxed sidebar.
2. Wait for the workspace scan.
3. Optionally enter a plain-language task under **Task focus**.
4. Review the selected files.
5. Manually add tests, callers, types, and configuration the task requires.
6. Choose a context detail:
   - **Outline** for declarations, signatures, and structure.
   - **Logic** for implementation with comments removed.
   - **Source** for complete file content.
7. Select **Preview** beside sensitive or important files.
8. Select **Build & Copy**.
9. Paste the result into the agent conversation.

Logic is the recommended starting point. Use Outline for early exploration or a
smaller disclosure. Use Source only when the exact file text is required.

The copied context includes a labelled receipt and strict wrapper instructing
the receiving model to treat source as untrusted data. This improves context
hygiene but does not override the destination model's system instructions or
provider controls.

## 4. Review redaction and selection

Before sending sensitive code:

- Preview the output, not only the original file.
- Confirm recognized credentials have become `[REDACTED_SECRET]`.
- Confirm generated files and irrelevant modules are not selected.
- Include the tests and types required to interpret the implementation.
- Do not assume Task focus is complete semantic retrieval.

Syntaxxed's built-in and custom regular-expression rules are defence in depth. They
cannot guarantee identification of every novel, encoded, or fragmented secret.

## 5. Enable the optional MCP Gateway

The gateway is off until explicitly enabled.

1. Mark the project as trusted.
2. Run **Syntaxxed: Enable MCP Gateway for Workspace**.
3. Review the modal description.
4. Select **Enable Gateway**.
5. Restart or reconnect the MCP client if it does not automatically reload
   project configuration.

Syntaxxed writes or merges `mcpServers.syntaxxed-gateway` in:

- `.mcp.json`
- `.cursor/mcp.json`

A generated entry resembles:

```json
{
  "mcpServers": {
    "syntaxxed-gateway": {
      "type": "http",
      "url": "http://127.0.0.1:49152/mcp",
      "headers": {
        "Authorization": "Bearer GENERATED_LOCAL_CREDENTIAL"
      }
    }
  }
}
```

The port and credential change when the gateway restarts. These files can
contain an active local credential and must not be committed.

Syntaxxed merges only its own entry. Existing MCP servers and unrelated settings
are preserved. If a previous public preview left `syntaxxed-gateway`, Syntaxxed
removes that previous entry during reconciliation.

## 6. Gateway tools and approvals

### `get_file_outline`

Returns declarations, types, interfaces, signatures, and structural context for
supported JavaScript and TypeScript files while removing implementation bodies.
It is the intended first request and does not require implementation approval.

The tool fails closed when the parser or grammar is unavailable, the extension
is unsupported, or the file contains invalid syntax. It does not fall back to
returning complete source.

### `request_file_logic`

Requests implementation logic after comment removal and conservative formatting
normalization. Syntaxxed asks the developer to approve access.

### `request_file_source`

Requests the complete source file before secret redaction. Source has a separate
approval scope from Logic.

### Approval options

- **Allow Once** permits the current call.
- **Allow This File for Session** reuses the decision for the same session,
  file, and detail level.
- **Deny** returns no requested implementation content.

Approving Logic does not approve Source. Closing the session, disabling the
gateway, or restarting it clears in-memory grants.

## 7. Inspect status and audit events

Run **Syntaxxed: Show MCP Gateway Status** to see whether the gateway is enabled and
which workspace endpoints are running.

Open **View -> Output -> Syntaxxed Gateway** to inspect local JSON audit events.
Events describe lifecycle and access decisions without recording source content,
prompts, credentials, or redacted secret values.

Version 0.3.0 audit events last only for the current output session. Durable,
signed, centrally retained enterprise audit evidence is roadmap work.

## 8. Disable the gateway

Run **Syntaxxed: Disable MCP Gateway for Workspace**.

Syntaxxed will:

- stop the loopback servers;
- clear session grants;
- discard current bearer credentials; and
- remove only `syntaxxed-gateway` and the previous preview's
  `syntaxxed-gateway` entries from supported project MCP configuration.

If a configuration file contains invalid JSON or cannot be written, Syntaxxed
leaves it unchanged and reports the failure. Repair it and run Disable again, or
remove only the Syntaxxed entry manually.

## 9. Workspace configuration

Run **Syntaxxed: Create Workspace Configuration** to create `syntaxxed.json`:

```json
{
  "include_comments": false,
  "exclude": []
}
```

Example:

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

Additional exclusions are applied after Syntaxxed's non-overridable sensitive-path
rules. Existing `syntaxxed.json` is read as a migration fallback only when
`syntaxxed.json` is absent.

## 10. Source-tree CLI

The CLI is useful for repeatable local automation but is not included in the
public VSIX.

```powershell
npm run package:cli
node .\dist\cli\index.js `
  --dir "C:\work\project" `
  --detail logic `
  --intent "investigate checkout validation" `
  --out "C:\work\project\.syntaxxed\context.md"
```

The CLI and extension use the same scanner, detail transforms, redaction rules,
task focus, and context builder.

## Security boundary

The Syntaxxed Gateway governs only calls made through its MCP tools. It cannot
remove or disable an agent's separate filesystem, terminal, network, search, or
indexing capabilities. Configure the agent itself according to the level of
containment your environment requires.

Likewise, Build & Copy controls the context Syntaxxed prepares. After the user
pastes or uploads that context, the destination application's privacy,
retention, and access terms apply.

## Troubleshooting

### No files appear

- Open a filesystem-backed folder.
- Select **Rescan Workspace**.
- Review `.gitignore` and `syntaxxed.json`.
- Check whether the target is generated, binary, symlinked, oversized, or under
  a sensitive path.

### The context is too large

- Use Task focus with concrete symbols and feature names.
- Deselect unrelated files.
- Switch from Source or Logic to Outline when structure is sufficient.
- Increase the warning threshold only after checking the receiving model's
  context limit and cost.

### Outline does not reduce a file

Structural Outline currently supports JavaScript and TypeScript families. The
interactive workflow handles other eligible languages conservatively. The MCP
Outline tool fails closed for unsupported or invalid files.

### The gateway appears offline

- Run **Syntaxxed: Show MCP Gateway Status**.
- Open **Syntaxxed Gateway** in the Output panel.
- Inspect `.mcp.json` and `.cursor/mcp.json`.
- Restart or reconnect the client after enabling the gateway.
- Re-enable the gateway if the client retained a previous endpoint.

### A request keeps prompting

Approval is scoped to the current MCP session, exact file, and context detail.
Choose **Allow This File for Session** only when that scope is appropriate.

### A redaction warning appears

Preview the prepared output. If a real credential may already have been exposed,
rotate it through the provider; removing it from a later context does not revoke
the earlier value.

## Privacy

Normal extension and CLI workflows remain local. Optional aggregate telemetry
is disabled unless explicitly configured and never includes repository content,
paths, task descriptions, prompts, or stable installation identifiers. See the
[Syntaxxed privacy statement](../PRIVACY.md).
