# Syntaxxed enterprise context gateway roadmap

## Product thesis

Syntaxxed is evolving from a local context compiler into a vendor-neutral
context and code-access policy layer between private repositories and AI coding
agents.

The target enterprise outcome is:

```text
Agent request
    -> authenticated agent and workspace identity
    -> centrally managed policy decision
    -> relevant context retrieval and classification
    -> minimum necessary disclosure
    -> optional human or delegated approval
    -> redaction and transformation
    -> attributable, auditable delivery
```

Token reduction remains useful, but it is a transformation within the gateway,
not the long-term security or commercial moat.

## Design principles

1. No workspace mutation or server exposure without informed consent.
2. Every request belongs to one authenticated client, organization, workspace,
   policy version, and audit trail.
3. The default disclosure is the minimum useful representation.
4. Transformations must preserve syntax and material semantics.
5. Secrets and restricted data are removed before an external model boundary.
6. Local and offline operation remain first-class deployment modes.
7. Vendor neutrality is maintained across models, agents, editors, and CI.
8. Security claims are limited to controls the product can actually enforce.

## Phase 0 — local gateway foundation

Status: in progress; the first hardening milestone shipped in 0.2.0 and the
Syntaxxed product-language release followed in 0.3.0.

Completed:

- Explicit gateway enablement and reversible registration.
- Trusted-workspace requirement.
- Per-workspace ephemeral Streamable HTTP servers.
- Bearer authentication and basic local-server hardening.
- Session, file, and context-detail-scoped approvals.
- Structured local audit events.
- Direct single-file access with real-path and ignore enforcement.
- Parser-backed JS/TS comment removal and safe fallback transformations.
- End-to-end authenticated MCP integration coverage.

Remaining before external design-partner deployment:

- Threat model and abuse-case document.
- Security-focused fuzzing for paths, JSON-RPC lifecycle, regex rules, and
  transformation boundaries.
- Stable non-project registration for supported clients so ephemeral credentials
  never need to appear in repository files.
- Persistent but encrypted local policy and audit storage.
- Explicit gateway state and recent-request UI in the sidebar.
- Signed release artifacts, provenance, SBOM, and installer update policy.
- Independent penetration test of the local gateway.

Exit criteria:

- No cross-workspace disclosure in multi-window and multi-root tests.
- No unauthenticated file response through supported transports.
- Safe recovery after crashes, client reconnects, stale registrations, and
  extension upgrades.
- Five design partners willing to run the local gateway against non-production
  repositories.

## Phase 1 — retrieval and policy beta

Planned capabilities:

- Incremental local repository index keyed by content hashes.
- Import, reference, and package dependency graph.
- Git-diff, open-file, diagnostic, test, and recent-edit relevance signals.
- Line- and symbol-level slices rather than whole-file-only disclosure.
- Optional local semantic index with a fully lexical/offline fallback.
- Versioned policy-as-code schema with repository, path, language, data-class,
  agent, model, and disclosure-level conditions.
- Deterministic decisions: allow, deny, redact, Outline, slice, Logic, Source,
  require approval, or route to an approved model.
- Local policy simulator explaining exactly why a request was allowed or denied.
- Adapter layer for Claude Code, Cursor, Codex, Copilot, CI, and future MCP
  clients without coupling the core policy engine to one vendor.
- Evaluation harness measuring relevant-context recall, task success, actual
  transmitted tokens, latency, redaction false positives, and approval fatigue.

Exit criteria:

- At least 95% relevant-file recall on a labelled design-partner task set.
- At least 30% lower transmitted source tokens without a material task-success
  regression.
- Cached policy decisions below 100 ms p95 and context responses below one
  second p95 for normal files.
- Three paid design-partner pilots.

## Phase 2 — enterprise control plane

Planned capabilities:

- Organization, user, group, device, repository, agent, and service identities.
- OIDC/SAML SSO, SCIM provisioning, RBAC, and delegated administration.
- Signed policy distribution with offline verification and controlled rollback.
- Device enrollment, gateway health, version compliance, and emergency disable.
- Durable append-only audit records with configurable retention.
- SIEM and observability export without source-code payloads by default.
- Organization dashboards for adoption, disclosure levels, denials, approval
  burden, context cost, and policy exceptions.
- Private cloud, on-premises, and disconnected deployment options.
- Customer-managed encryption keys and regional data-residency controls where a
  hosted component stores customer metadata.
- Enterprise release signing, SBOM, vulnerability response, DPA, subprocessors,
  support policy, backup/restore, and disaster-recovery documentation.

Exit criteria:

- Security approval at two regulated or IP-sensitive customers.
- Repeatable annual contracts rather than bespoke paid experiments.
- Independent penetration-test findings resolved.
- SOC 2 Type I controls operating with a documented Type II path.

## Phase 3 — governed organizational context

Planned capabilities:

- Cross-repository and service-level context graph.
- Enterprise data-classification and DLP integrations.
- Just-in-time approval routing to code owners, security teams, or service
  owners, with expiry and break-glass workflows.
- Policy-aware agent sandboxes or managed launchers that can make gateway
  mediation enforceable rather than advisory.
- Context lineage showing which source spans influenced an agent task or output.
- Reusable organization knowledge packs with ownership and review workflows.
- Outcome analytics connecting context decisions to correctness, security,
  review effort, cycle time, and provider spend.

## Explicit non-goals for the current phase

- Building a new general-purpose coding agent.
- Hosting or training a foundation model.
- Claiming that regular-expression secret detection is complete DLP.
- Treating prompt instructions as a security boundary.
- Building SSO, billing, and compliance infrastructure before design partners
  validate the local gateway and policy workflow.

## Evidence required before institutional fundraising

- Five or more credible enterprise design partners.
- Multiple paid pilots with both engineering and security stakeholders.
- A reproducible evaluation showing safe context reduction without degraded
  coding outcomes.
- Evidence that customers value vendor-neutral governance enough to deploy a
  separate endpoint or platform layer.
- A repeatable deployment and support model.
- A clear licensing boundary between the developer distribution and the paid
  organizational control plane.
