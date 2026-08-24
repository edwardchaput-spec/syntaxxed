# Syntaxxed privacy statement

Last updated: 7 August 2026

Syntaxxed is designed to prepare source-code context locally. Normal extension
and CLI use does not upload repository contents, filenames, workspace paths,
task descriptions, generated payloads, approval decisions, or secret matches to
Syntaxxed or to any third party.

## Data processed locally

Syntaxxed reads eligible files in workspaces selected by the user so it can:

- apply ignore, path, size, binary, and symlink rules;
- transform source according to the selected context detail;
- estimate token counts;
- identify and replace recognized secrets;
- show previews and copy a user-approved payload to the operating-system
  clipboard; and
- maintain aggregate context-build counters in VS Code extension storage.

The optional MCP gateway listens only on an operating-system-assigned loopback
port. It records content-free JSON audit events in the local **Syntaxxed
Gateway** output channel. Enabling it creates or updates `.mcp.json` and
`.cursor/mcp.json` in the selected workspace with a short-lived local endpoint
and bearer credential. Those registration files are excluded from Syntaxxed
context scans and should not be committed.

## Optional aggregate telemetry

Telemetry is disabled unless the operator explicitly supplies both
`SYNTAXXED_TELEMETRY_URL` and `SYNTAXXED_SUPABASE_ANON_KEY` in the extension or CLI
environment. When configured, Syntaxxed attempts one HTTPS event after a context
build containing only:

- estimated tokens saved;
- number of detected secret spans replaced;
- whether the event came from the CLI or extension.

There is no user, device, installation, workspace, or repository identifier in
that event. The configured endpoint operator is responsible for its retention,
access, and deletion policy.

## User controls and retention

- Prepared context remains in memory until the operation or extension session
  ends, except for copies the user places on the clipboard or writes with the
  CLI.
- Session, workspace, and lifetime savings counters stay in VS Code's local
  extension storage. Use **Reset** in the Syntaxxed sidebar to delete them.
- Gateway audit events remain in the current VS Code output session and are not
  uploaded by Syntaxxed.
- Run **Syntaxxed: Disable MCP Gateway for Workspace** before uninstalling to
  remove Syntaxxed's project registration entries automatically.

The destination application may receive a payload after the user pastes,
uploads, or otherwise submits it. That transfer is controlled by the user and
is governed by the destination provider's privacy and data-retention terms.
