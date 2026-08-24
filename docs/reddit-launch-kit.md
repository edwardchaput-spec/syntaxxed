# Syntaxxed public-preview launch kit

Last updated: 7 August 2026

The launch should feel like a technical release and an invitation to evaluate a
specific workflow, not a generic AI-product advertisement.

## Positioning

**One sentence:** Syntaxxed is a free VS Code extension that prepares smaller,
reviewable, secret-redacted repository context for coding agents and can
optionally expose the same policy through a local MCP gateway.

**What makes it distinct:** It is not another chat UI and it does not call a
model. The product sits before the model, where it selects and transforms source
locally, lets the developer preview the exact payload, and requires progressively
stronger approval for implementation disclosure through MCP.

**Lead with:** local processing, visible output, three context-detail levels,
credential-file exclusion, redaction, measured token reduction, and clear
limitations.

**Do not lead with:** enterprise ambitions, funding, acquisition, vague claims
about replacing context windows, or promises that redaction is complete DLP.

## Preconditions before posting

- [ ] The verified VSIX or Marketplace listing is available through a stable
  link.
- [ ] The licence is stated plainly beside the download.
- [ ] A public issue tracker and private security-reporting route exist.
- [ ] The README opens with the problem, not company language.
- [ ] A 20–40 second silent demo shows install, file selection, preview, and the
  token delta.
- [ ] The post discloses that the author built the tool and that it is a public
  preview.
- [ ] The author has read the current rules of each community immediately before
  posting.

## Suggested Reddit titles

Use one title, tailored to the community:

1. `I made a VS Code extension that lets me preview and redact coding-agent context before I send it`
2. `Free preview: local context preparation and a least-privilege MCP file gateway for VS Code`
3. `I wanted coding agents to request interfaces before implementations, so I built this local MCP gateway`

Avoid emojis, inflated savings claims, `revolutionary`, `game-changing`, and
generic `I built an AI tool` phrasing.

## Short launch post

```text
Disclosure: I built this.

Syntaxxed is a free public-preview VS Code extension for preparing repository
context before it reaches a coding agent. It does not call a model. It scans
eligible files locally, applies gitignore and sensitive-path rules, lets you
choose and preview the exact output, redacts recognised credentials, and copies
a guarded Markdown payload.

There are three context-detail levels: Outline for structure and signatures,
Logic for implementation without comments, and Source for complete content
before redaction. An optional local MCP gateway lets compatible agents request
those levels one file at a time; implementation requests require an explicit
developer decision.

The important limitation is that the gateway only governs its own MCP tools. It
cannot stop an agent that also has an unrestricted filesystem or terminal tool.
Secret detection is also defence in depth, not complete DLP.

The first release is aimed at solo developers, is free to use, and keeps normal
processing local. I am looking for concrete reports on parser failures,
redaction false positives, onboarding friction, and whether the prepared context
is actually useful in repeated work.

[stable release or Marketplace link]
```

Rewrite the post in the founder's own voice before publishing. Developer
communities are particularly sensitive to generic AI-generated promotional copy.

## Community sequence

1. **Existing peers and small private cohorts:** recruit 5–10 developers who
   will install it while the founder observes. Fix onboarding and first-copy
   failures before a broad post.
2. **VS Code-specific communities:** use a concise technical post only after the
   Marketplace page or stable release link exists. A recent r/vscode discussion
   shows strong hostility to generic AI-extension promotion and a preference for
   open source, precise problem statements, short documentation, and no hype.
3. **Claude Code or Cursor communities:** tailor the post to the local MCP
   approval workflow and include the limitation about native filesystem tools.
   Recheck each community's current promotion rules first.
4. **r/LocalLLaMA:** do not cold-post. Current Rule 4 enforcement examines the
   author's participation history; free or open-source status alone does not
   exempt self-promotion. Participate meaningfully first or ask moderators.
5. **r/LLMDevs:** current guidance allows free open-source projects without prior
   approval, but non-free or open-core projects require moderator approval and a
   clear disclaimer. Apache-2.0 removes the proprietary-freeware blocker, but
   the separately licensed enterprise roadmap may still make moderators regard
   Syntaxxed as open-core; ask before posting.
6. **Broad programming communities:** use only when the post teaches a generally
   useful context-engineering or security lesson. Do not submit a product link as
   the entire value of the post.

Community behavior and rules change. Recheck immediately before every post; do
not copy the same post into multiple subreddits on the same day.

## Demo script

Keep the recording under 40 seconds:

1. Open a small public TypeScript repository.
2. Open Syntaxxed and show the local file list.
3. Enter `change checkout validation` into Task focus.
4. Deselect one irrelevant file and preview a selected file.
5. Switch between Logic and Outline so viewers can see the disclosure difference.
6. Copy the payload and show the before/after token estimate plus any redaction
   alert.
7. End on the privacy/limitations line, not an enterprise waitlist.

Never record a private repository, real credential, bearer token, local path
containing a person's name, or live project MCP configuration.

## Likely questions and direct answers

### Why not let the agent read the repository directly?

That remains the right choice for many developers. Syntaxxed is for situations
where the developer wants to inspect the initial context, reduce irrelevant
input, or require a separate decision before an MCP tool returns implementation
detail.

### Is token reduction the moat?

No. It is the immediate measurable benefit. The longer-term value would be
consistent policy, integrations, evaluation evidence, and enterprise audit and
administration—not whitespace removal.

### Does it prevent source-code exfiltration?

No. It governs context prepared through Syntaxxed and calls made through its own
gateway. It cannot constrain unrelated agent tools or provider behavior.

### Is the redaction complete?

No. It handles many common credential formats and custom patterns, but formats
change and organization-specific or entropy-only secrets may be missed. Preview
and normal secret-management controls remain necessary.

### Is it open source?

Yes. Answer: `The current local developer core—including the VS Code extension,
CLI, and embedded MCP gateway—is open source under Apache License 2.0. Future
hosted and enterprise control-plane services may be separately licensed.`

### What data leaves the machine?

Normal context processing is local. Optional aggregate telemetry is disabled
unless the operator supplies both endpoint environment variables. A payload
leaves the machine only when the user submits it to another application.

## Seven-day launch cadence

| Day | Action |
| --- | --- |
| -3 to -1 | Observe five clean installs; fix every first-run blocker; prepare demo and exact hash |
| 0 | Publish one primary post in the best-fit community; respond to every technical question |
| 1 | Ship only urgent fixes; record objections and repeated confusion verbatim |
| 2 | Publish a technical deep dive or architecture diagram, not a duplicate promo |
| 3 | Contact 5–10 relevant extension, MCP, or agent-tool maintainers privately and individually |
| 4–5 | Release a small patch only if evidence justifies it; otherwise keep learning |
| 7 | Report install, activation, repeat-use, issue, and retention evidence; decide the next cohort |

## Evidence to capture

- number of clean installs that reach a first copied payload;
- time from install to first useful output;
- repeated use after seven days;
- most selected context-detail level and typical repository language;
- false-positive and missed-secret reports;
- requests for unsupported structural languages;
- gateway enablement and denial behavior;
- exact user language describing the problem and the value.

## Sources checked for launch constraints

- [VS Code extension publishing and Marketplace presentation](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [VS Code extension manifest fields](https://code.visualstudio.com/api/references/extension-manifest)
- [Recent r/vscode discussion about extension promotion](https://www.reddit.com/r/vscode/comments/1rl12ib/whats_the_best_and_least_annoying_way_to_promote/)
- [r/LocalLLaMA Rule 4 enforcement explanation](https://www.reddit.com/r/LocalLLaMA/comments/1v1v1je/removed/)
- [r/LLMDevs self-promotion clarification](https://www.reddit.com/r/LLMDevs/comments/1mvuw5x/community_rule_update_clarifying_our/)
