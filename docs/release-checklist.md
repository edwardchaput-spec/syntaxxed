# Syntaxxed 0.3.0 public-preview release checklist

Last updated: 7 August 2026

This is the operational checklist for turning the Syntaxxed rebrand into a free,
credible public preview for individual developers. Release evidence is recorded
only after it has been rerun against the final `syntaxxed-0.3.0.vsix` artifact.

## Current release-candidate evidence

| Check | Status | Evidence |
| --- | --- | --- |
| Product identity | Pass | `Syntaxxed`, package `syntaxxed`, publisher `syntaxxed`, extension ID `syntaxxed.syntaxxed` |
| Version | Pass | `0.3.0` in the manifest and lockfile |
| Terminology | Pass | Outline, Logic, Source; Task focus; Build & Copy; Context detail |
| Type-check | Pass | `npm run typecheck` |
| Lint and production build | Pass | `npm run check` completed successfully |
| Source integration suite | Pass | 44 tests under VS Code 1.131.0 |
| Packaged-extension suite | Pass | 42 applicable tests against the exact expanded VSIX; two CLI tests are source-only |
| Windows isolated install | Pass | `syntaxxed.syntaxxed@0.3.0` installed into a clean local extension directory |
| VSIX contents | Pass | 22 archive files; only the extension bundle, user docs, schema, media, licence, notice, privacy statement, and changelog |
| Secret scan | Pass | Gitleaks 8.30.1 found no leaks in the exact expanded VSIX |
| Visual check | Partial | Current labels, native dropdown colour variables, and realistic-width fixture reviewed; final dark/light/high-contrast acceptance remains Gate 4 |
| Licence | Pass | Apache License 2.0 with matching NOTICE and production bundle banner |
| Artifact | Ready | `syntaxxed-0.3.0.vsix`, 670,995 bytes |
| SHA-256 | Ready | `a4f05f0e7a0f6c9d76142e0e9b0f15f7a064a774d8a5c79c3ac8057c4102c2b9` |

## Naming and migration decisions

- [x] Use **Syntaxxed** consistently as the product and company-facing brand.
- [x] Use `syntaxxed.syntaxxed` as the pre-public extension identifier rather than
  preserving a legacy identifier that has not yet accumulated users.
- [x] Replace Axe, Prune, and Preserve with the clearer Outline, Logic, and
  Source context-detail levels.
- [x] Replace Compress & Copy with **Build & Copy**.
- [x] Replace Smart Intent with the descriptive, optional **Task focus** field.
- [x] Use `syntaxxed.json` with `include_comments` and `exclude` settings.
- [x] Read legacy `syntaxxed.json` and previous setting values as migration
  fallbacks without advertising them as current product language.
- [x] Remove stale `syntaxxed-gateway` registrations when the new gateway is
  enabled or disabled.

## Decisions required before a broad public launch

1. **Choose the distribution route.** A direct VSIX can be shared immediately.
   Marketplace publication is preferable for install trust, discovery, updates,
   and visible usage counts.
2. **Create the permanent Marketplace publisher.** The manifest now expects the
   publisher ID `syntaxxed`; confirm that the controlled publisher account uses
   this exact identifier before publication.
3. **Provide the canonical public repository URL.** It is needed for Marketplace
   `repository`, `homepage`, `bugs`, and relative README links.
4. **Choose a support and private security-reporting address.** Do not direct
   vulnerability reports only to a public issue tracker.

## Release pipeline

### Gate 1 — product freeze

- [x] Freeze the public-preview scope at local context preparation, manual
  review, and an opt-in local MCP gateway.
- [x] Mark the Marketplace build as **Preview** and **Free**.
- [x] State that the gateway cannot mediate an agent's separate filesystem,
  terminal, or network tools.
- [x] Keep telemetry disabled unless both operator-managed environment variables
  are configured.
- [x] Hard-exclude MCP registration files containing local credentials.
- [x] Licence the local developer core under Apache-2.0 while reserving the
  option to license future hosted and enterprise products separately.

### Gate 2 — release metadata and trust

- [x] Add a 256-pixel Syntaxxed PNG icon and Marketplace presentation metadata.
- [x] Add categories, keywords, workspace placement, virtual-workspace limits,
  Free pricing, and Preview status.
- [x] Add a public privacy statement.
- [x] Add first-install onboarding and `syntaxxed.json` schema validation.
- [x] Add detailed end-user, gateway, migration, and troubleshooting guidance.
- [ ] Add canonical `repository`, `homepage`, and `bugs` metadata.
- [ ] Add a support policy and private vulnerability-reporting route.
- [ ] Remove the temporary VSIX packaging flags after the public repository
  exists.

### Gate 3 — local release verification

Run from a clean dependency installation where practical:

```powershell
npm ci --ignore-scripts
npm run check
npm test
npm audit --audit-level=high
npm exec -- vsce ls --tree
npm run package:vsix
Get-FileHash -Algorithm SHA256 .\syntaxxed-0.3.0.vsix
```

- [x] Type-check, lint, production build, and manifest validation pass.
- [x] Source integration tests pass: 44 tests.
- [x] Tests pass against the exact packaged extension after extraction: 42
  applicable tests; the two CLI/Action tests are source-only because the CLI is
  not included in the VSIX.
- [x] The final publishable file list is minimal and expected: 22 archive files.
- [x] The expanded VSIX passes a Gitleaks 8.30.1 secret scan.
- [ ] The live npm advisory audit contains no high-severity finding.
- [x] Record the exact artifact size and SHA-256 above.

### Gate 4 — cross-platform acceptance

Run on clean Windows, macOS, and Linux machines with a supported VS Code stable
release:

- [x] Windows: install the final VSIX into an isolated extension directory and
  verify `syntaxxed.syntaxxed@0.3.0`.
- [ ] macOS and Linux: repeat the isolated installation.
- [ ] Open the walkthrough, scan a sample TypeScript project, preview a file,
  and use Build & Copy in Logic.
- [ ] Verify Outline transformation, Source preview, `syntaxxed.json` exclusions,
  custom redaction rules, Reset Stats, and Restricted Mode.
- [ ] Enable the gateway in a disposable trusted project, connect one supported
  MCP client, exercise all three tools, deny one request, inspect the audit
  output, disable the gateway, and confirm unrelated registrations remain.
- [ ] Confirm dark, light, high-contrast, and native dropdown readability.

### Gate 5 — distribution

For a direct preview:

- [ ] Upload the exact verified VSIX and publish its SHA-256 beside it.
- [ ] Include the licence, privacy statement, release notes, supported VS Code
  version, and direct install/uninstall instructions.
- [ ] Label the VSIX as an unsigned direct preview if it is not distributed by
  the Marketplace.

For Marketplace publication:

- [ ] Create or verify the permanent `syntaxxed` publisher ID.
- [ ] Add the canonical public URLs to `package.json`.
- [ ] Repackage without missing-repository or relative-link bypass flags.
- [ ] Inspect the rendered Marketplace README, walkthrough, and icon.
- [ ] Publish using Microsoft's current secure authentication flow without
  placing a publishing credential in the repository or shell history.
- [ ] Install the Marketplace build into a clean VS Code profile and repeat the
  five-minute acceptance path.

## Five-minute user acceptance path

1. Install Syntaxxed and open a small TypeScript project.
2. Follow the automatically opened quick-start walkthrough.
3. Open the Syntaxxed view and wait for the local scan.
4. Enter `change checkout validation` in Task focus.
5. Review the selected files and preview one in Logic.
6. Select **Build & Copy** and verify the payload envelope, redaction markers,
   and token estimate.
7. Switch to Outline and confirm function bodies are removed from valid
   TypeScript.
8. Switch to Source and confirm the preview is complete except for redactions.
9. Confirm `.mcp.json` and `.cursor/mcp.json` never appear in the file list.
10. Optionally enable and disable the gateway in a disposable workspace.

## Launch observability without invasive telemetry

Track these weekly for the first public cohort:

- Marketplace installs and uninstalls, or release downloads if sideloaded;
- clean installs that reach a first useful Build & Copy action;
- time to first useful context and repeat use at days 7 and 30;
- reported parser failures, false-positive redactions, and missing-language
  requests;
- the selected context-detail level and typical repository language;
- the number of developers who enable the gateway after first using manual
  context preparation.

Downloads are not adoption. The first credible milestone is a group of
unrelated developers who use Syntaxxed repeatedly and can explain the problem it
solved.

## Rollback

- Retain the pre-rebrand and 0.2.1 source snapshots privately in `.backups`.
- If 0.3.0 has a security or data-integrity defect, stop promotion, remove the
  affected public asset, publish a concise advisory, and ship a higher patch
  version. Never replace a released file silently under the same version.
- Advise users to disable the gateway before uninstalling so project MCP
  registrations are removed automatically.
