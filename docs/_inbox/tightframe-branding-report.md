# Brand Naming Report: Alternatives to Slimshot

> **Historical decision record — superseded 7 August 2026.** Syntaxxed is the
> selected product name. This report is retained only to preserve the naming
> rationale and must not be used as current positioning or product guidance.

Agreed: **Slimshot is out**. Keep the underlying insight, but lose the name.

More importantly, I would **not retreat to Syntaxxed**. It sounds like a syntax formatter, parser or code-quality tool. Your product’s real value is broader: it creates the minimum useful source view, redacts credentials, and controls progressively deeper disclosure to an agent.

The strongest brand territory is therefore not **slimming**. It is:

> **Task-shaped context inside a controlled boundary.**

That territory accommodates the clipboard workflow, the local gateway, approvals, redaction and a future enterprise control plane.

## My strongest recommendation: **Tightframe**

# **Tightframe**
### **Keep AI in frame.**

This is the best evolution of the thinking behind Slimshot.

A *shot* is a single request. A *frame* is the deliberate boundary around what the AI is allowed to see. “Tight” communicates relevance, economy and control without sounding like dieting, destructive pruning or generic token compression.

It gives you several powerful marketing lines:

> **Frame the task. Not the whole repo.**

> **The right code, tightly framed.**

> **Give coding agents a task-sized view of your source.**

> **Keep secrets—and irrelevant code—out of frame.**

It also works across both product workflows:

- The developer creates a **frame** of source for a prompt.
- The gateway keeps the agent **in frame**.
- A task description determines what initially enters the frame.
- The agent may request a deeper view, but the developer controls that expansion.
- Secrets are removed before anything leaves the frame.

Unlike Slimshot, it does not restrict the story to one-shot prompting. Unlike Syntaxxed, it can grow naturally into security, governance and access control.

### The only perceptual risk

“Tightframe” could initially sound like a photography or UI design product. Fix that with a clear descriptor wherever the name first appears:

> **Tightframe — local context control for coding agents**

or:

> **Tightframe — task-sized code context, under your control**

I would style the brand as **Tightframe**, not `TightFrame`. The CLI, package and configuration names would naturally be lowercase:

```text
tightframe
tightframe build
tightframe gateway enable
.tightframe/
tightframe-context.md
```

In my preliminary exact-name web sweep, Tightframe was materially cleaner than the obvious context-compression alternatives. That is an initial filter, not trademark or domain clearance.

---

## The shortlist I would actually retain

| Name | Strategic idea | Strongest line | Verdict |
|---|---|---|---|
| **Tightframe** | Focused context within a controlled boundary | **Keep AI in frame.** | **Best overall** |
| **Needfold** | Fold the repository to what the task needs | **Give agents what they need. Keep the rest folded.** | Best coined alternative |
| **Closeheld** | Source stays close unless explicitly disclosed | **Give agents what they need. Keep the rest close.** | Best enterprise/security name |
| **Aptfold** | Source fitted to the task | **Fit the code to the task.** | Friendly developer-tool option |
| **Essenset** | The essential set of source for a task | **Only the essential source set.** | Most distinctive wildcard |

### 2. **Needfold**

This has the strongest built-in product mechanic:

> **Fold the repo to the task. Unfold more only with approval.**

It supports progressive disclosure particularly well. The initial source is folded into a compact task view; deeper implementation is unfolded only when requested.

Possible copy:

> **Needfold gives coding agents the smallest useful view of your source—and unfolds more only with your approval.**

It is more ownable than a generic “CodeFold” name, but slightly less natural in conversation than Tightframe. Someone seeing it for the first time may hesitate over whether it is “need-fold” or “needful.”

There are also already products called CodeFold and SourceFold in adjacent code-context territory, so I would treat the wider “fold” naming family with some caution. ([github.com](https://github.com/maxenceleguery/codefold))

### 3. **Closeheld**

This is the strongest choice if you want the product to grow into an enterprise trust and governance brand.

> **Closeheld keeps proprietary source close and gives agents only the view their task requires.**

It feels serious, confidential and defensible. It can stretch beyond code compression into:

- disclosure policy;
- agent permissions;
- audit;
- enterprise identity;
- source egress controls;
- managed gateways.

The disadvantage is that it communicates protection better than context efficiency. It is also a little less energetic than Tightframe.

A strong hero combination would be:

# **Closeheld**
### **Your source. On a need-to-know basis.**

That is an exceptionally good enterprise proposition.

### 4. **Aptfold**

“Apt” means appropriate or exactly suited:

> **Fit the code to the task.**

It sounds like a modern developer utility and works cleanly as a CLI:

```text
aptfold build --view logic
```

However, it is slightly more abstract, and some people may hear “app-fold.” The `-fold` naming pattern is also increasingly common in technology.

### 5. **Essenset**

A coined form of **essential set**:

> **The essential source set for the task.**

It owns the idea of selecting the smallest complete set of useful files rather than merely compressing arbitrary input.

It could become a useful product noun:

```text
Essenset selected 12 relevant files.
Build an essenset for this task.
```

The downside is that you would need to teach the spelling and pronunciation. It is more ownable, but less immediately fluent.

---

## The complete Tightframe naming system

I would abandon **Axe / Prune / Preserve**. They are memorable, but they describe inconsistent actions:

- Axe and Prune are destructive.
- Preserve is a state rather than an action.
- Axe sounds much more destructive than “retain interfaces and signatures.”
- Preserve can imply that credentials are also preserved, even though redaction still runs.

The current profiles are really three progressively deeper **views**.

Use this system:

| Current term | Tightframe term | Meaning |
|---|---|---|
| Smart Intent | **Task Focus** | Select files relevant to the stated task |
| Compression profile | **View** | How deeply the source is disclosed |
| Axe | **Outline** | Types, declarations, signatures and structure |
| Prune | **Logic** | Implementation with safe reduction |
| Preserve | **Source** | Complete source, still secret-redacted |
| Generated payload | **Frame** | The task-sized context artifact |
| Compress & Copy | **Build & Copy** | Build the frame and place it on the clipboard |
| MCP Gateway | **Agent Gateway** | Local, approval-controlled access |
| Approval escalation | **Deeper View Request** | Request Logic or Source access |
| Output channel | **Gateway Audit** | Local content-free access record |

The UI becomes immediately legible:

```text
Choose a view

Outline
Types, declarations, signatures and structure.

Logic
Implementation code with safe reduction.

Source
The complete file, with secrets still redacted.
```

The agent approval dialogue becomes:

```text
Agent requests a Logic view of:

src/services/checkout.ts

Allow once
Allow for this session
Deny
```

And the MCP tool names become self-explanatory:

```text
get_file_outline
request_file_logic
request_full_source
```

That is substantially clearer than:

```text
get_axed_file
request_pruned_file
request_preserved_file
```

## Use the metaphor selectively

Do not turn every button into a photography pun. The brand should feel intelligent, not themed.

Use **frame** in four places:

- the product name;
- the generated context artifact;
- the headline;
- the idea of keeping agents within a boundary.

Keep permission, security and redaction terminology literal. Avoid labels such as “Take the shot,” “Zoom in,” “Develop,” “Exposure mode” or “Shutter.” Those would make the product feel like a novelty photography tool.

---

## Recommended README opening

```markdown
# Tightframe

**Keep AI in frame.**

Tightframe is a local context compiler and opt-in agent gateway for
AI-assisted software development.

It builds task-sized, secret-redacted views of your workspace, lets you
review exactly what will be shared, and requires approval before an agent
can access deeper source.

Choose the right view for each task:

- **Outline** — declarations, types, signatures and structure
- **Logic** — implementation code with safe reduction
- **Source** — the complete file, with secrets still redacted

Selection, transformation, redaction, approvals and gateway traffic
remain on your local machine.
```

GitHub description:

> **Task-sized, secret-redacted code context for AI agents. Local and approval-controlled.**

Marketplace subtitle:

> **Give coding agents the source they need—without handing over the whole repository.**

CLI example:

```text
tightframe build \
  --view logic \
  --intent "fix expired voucher validation" \
  --out .tightframe/context.md
```

Result messaging:

```text
Frame built

Files included:       9
Estimated tokens:     6,840
Tokens avoided:      18,220
Secrets redacted:         2
View:                 Logic
```

---

## Names I deliberately rejected

The obvious “small context” space is becoming crowded. LeanCTX and Terse already operate in direct context optimisation and agent-control territory, while Minim is now the name of a privacy-aware minimal-view approach for agents. ([leanctx.com](https://leanctx.com/))

I also dropped several initially promising ideas after screening:

- **Codense** — already used for a project that condenses codebases for LLM input.
- **Code Airlock** — already an active coding-agent isolation project.
- **RepoBrief** — already used by several AI-oriented repository briefing tools.
- **Requiset** — conceptually excellent, but too close to an active UK IT consultancy called Requisite Limited.
- **Parescope** — memorable, but too easily confused with Periscope and ParaScope.
- **Tersive** — too close to the current Terse developer product.

Code Airlock and RepoBrief are particularly close to your operating territory, not merely unrelated uses of the same words. ([github.com](https://github.com/Trivo25/code-airlock))

## My decision

I would now reduce the choice to:

1. **Tightframe**
2. **Needfold**
3. **Closeheld**

My recommendation is **Tightframe**.

It preserves the visual, compact energy you liked in Slimshot, but turns that metaphor into something strategically accurate:

> **The product does not merely make code smaller. It decides what is inside the frame.**

Before changing the repository, run **Tightframe** and **Needfold** through UKIPO exact and similar-mark searches, Companies House, GitHub organisations, npm, the VS Code Marketplace and a live registrar. Companies House availability alone is not trademark clearance, and the UK guidance specifically recommends looking for similar as well as identical marks. ([gov.uk](https://www.gov.uk/search-for-trademark))

For domains, test the exact `.dev` and `.io` first, followed by constructions such as `gettightframe.com`. A strong masterbrand on a clean developer-oriented domain is better than allowing one available `.io` to determine the whole identity.
