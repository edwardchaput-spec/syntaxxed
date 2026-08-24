# Syntaxxed funding and strategic-acquisition action plan

Last updated: 6 August 2026  
Planning horizon: 18 months  
Assumption: UK-headquartered company with a global developer and enterprise
market

## Executive recommendation

Build Syntaxxed as a credible independent company and preserve acquisition as
an option. Do not present the company as being built to sell. That weakens
customer confidence, recruiting, investor leverage, and ultimately the price a
strategic buyer may pay.

The recommended sequence is:

1. Release an excellent free product for individual developers.
2. Prove repeated use and measurable context-governance value.
3. Recruit enterprise design partners before building a broad control plane.
4. Raise a focused pre-seed round against evidence, not only the roadmap.
5. Convert design partners into paid deployments.
6. Build relationships with likely strategic buyers through integrations and
   partnerships without beginning a sale process.
7. Choose between a larger seed round and a competitive acquisition process
   once the company has real leverage.

The commercial thesis should be:

> Syntaxxed is the developer-first, least-privilege context layer for coding
> agents. It governs what source code an agent receives, explains the decision,
> and supplies the minimum useful context across models and developer tools.

Token reduction is the initial developer benefit and an easily measured ROI
signal. It is not the enduring moat. The prospective moat is the combination of
policy, integrations, evaluation evidence, deployment footprint, workflow data,
and trust.

## Why this strategy is credible

The market is real, but it is becoming competitive:

- MCP moved to vendor-neutral governance under the Linux Foundation's Agentic
  AI Foundation. The project reported more than 97 million monthly SDK
  downloads, 10,000 active servers, and first-class support across the major AI
  platforms at the time of the move. This supports a vendor-neutral strategy
  rather than dependence on one model provider:
  https://blog.modelcontextprotocol.io/posts/2025-12-09-mcp-joins-agentic-ai-foundation/
- Cline demonstrated the developer-first path. It reported 2.7 million installs
  and raised $32 million to expand from an open developer product into
  enterprise administration, security, and policy:
  https://cline.bot/blog/cline-raises-32m-series-a-and-seed-funding-building-the-open-source-ai-coding-agent-that-enterprises-trust
- Backslash Security raised a $19 million Series A around security and
  governance for AI coding agents, IDEs, and MCP:
  https://www.backslash.security/press-releases/backslash-security-raises-19m-series-a-to-secure-vibe-coding-boom-in-the-enterprise-bolsters-board-with-cybersecurity-industry-leader
- CodeIntegrity raised a $5 million seed round for runtime governance of AI
  agents, showing specialist investors will fund an early control-layer
  proposition:
  https://www.codeintegrity.ai/blog/codeintegrity-seed-round
- Citrix has introduced MCP gateway capabilities in NetScaler. This validates
  enterprise demand but also proves that generic gateway functionality will be
  competed away:
  https://www.citrix.com/news/announcements/july-2026/citrix-brings-unified-governance-to-llm-and-agentic-ai-traffic-with-netscaler-mcp-gateway-capabilities.html
- Strategic acquisition appetite exists. Palo Alto Networks acquired Protect AI
  and Cisco acquired Robust Intelligence to expand their AI-security
  platforms:
  https://investors.paloaltonetworks.com/news-releases/news-release-details/palo-alto-networks-completes-acquisition-protect-ai
  and
  https://www.cisco.com/site/us/en/products/security/ai-defense/robust-intelligence-is-part-of-cisco/index.html

These examples validate the category. They do not prove that Syntaxxed will be
funded or acquired. Syntaxxed must establish a narrow, defensible reason to win.

## Strategic choices to make immediately

### 1. Choose the wedge

Recommendation: own code-context disclosure for AI-assisted software
development, not generic MCP proxying.

The initial use case is:

- A developer uses Claude Code, Codex, Cursor, Copilot, Cline, or another agent.
- Syntaxxed supplies task-relevant code at the lowest useful disclosure level.
- The developer can see and approve escalation from Outline to Logic to Source.
- The organization can later define, distribute, and audit that policy.

This is more specific than “MCP security” and more valuable than token
reduction alone.

### 2. Decide the free/open-core boundary

Recommendation: seriously evaluate an open-core model before public launch.
Security infrastructure benefits from inspectability and community trust.

Suggested boundary:

| Capability | Individual/community | Team | Enterprise |
| --- | --- | --- | --- |
| Local extension and CLI | Free | Included | Included |
| Local single-user gateway | Free | Included | Included |
| Outline, Logic, Source and redaction | Free | Included | Included |
| Local audit output | Free | Included | Included |
| Bring-your-own model/agent | Free | Included | Included |
| Repository policy file | Free | Included | Included |
| Shared policy management | — | Paid | Paid |
| Team audit and dashboards | — | Paid | Paid |
| Approval routing | — | Paid | Paid |
| SSO, SCIM and enterprise RBAC | — | — | Paid |
| Signed policy distribution | — | — | Paid |
| SIEM, DLP and device integrations | — | — | Paid |
| Private/on-premises control plane | — | — | Paid |
| SLA, support and deployment assurance | — | — | Paid |

Do not force an account merely to use the local free product. Offer an optional
account for release notifications, policy sync, community participation, or
early-access features. Source the local-first privacy advantage.

The local developer core was relicensed under Apache-2.0 on 7 August 2026. Now:

- Obtain legal confirmation that the public terms and intended commercial
  boundary are correctly expressed.
- Produce a component inventory and dependency licence report.
- Keep the current extension, CLI, and embedded gateway open; define which
  future hosted control-plane, administration, policy-distribution, and support
  services remain commercial.
- Ensure every contributor signs an appropriate contributor or IP agreement.
- Record the Apache-2.0 and commercial boundary in a short licensing decision
  memorandum.

### 3. Select the buyer and budget

The developer is the user and champion. The eventual buyers are likely to be:

- Head of Developer Platform or Developer Experience.
- Head of Application Security.
- CISO or AI Security leader.
- VP Engineering in smaller organizations.
- AI platform or infrastructure owner.

The product must create developer pull without requiring developers to own the
enterprise budget.

### 4. Define “well funded”

Recommendation: do not optimize for the largest possible first round.
“Well funded” should mean enough capital to reach the next proof point without
cutting security work.

A sensible primary pre-seed planning case is approximately £1.0 million to
£1.5 million for 18 to 24 months of runway. Final sizing must be derived from a
bottom-up hiring and operating model, not used as a vanity target.

This should fund:

- A founder.
- Two senior platform/security engineers.
- One developer-product or integrations engineer.
- Fractional product-security and enterprise go-to-market support initially.
- Independent penetration testing, legal work, design, infrastructure, and
  contingency.

If runway is currently constrained, consider a smaller SEIS-compatible angel
round or non-dilutive funding first. Avoid raising a small institutional round
that creates governance overhead but cannot fund the necessary team.

## North-star metric and evidence hierarchy

### North-star metric

**Weekly governed context requests from retained developers.**

This is stronger than downloads, prepared tokens, or gateway installations.
It demonstrates repeated use of the actual control point.

### Supporting developer metrics

Track with explicit privacy consent and without collecting source code, paths,
credentials, prompt contents, or customer repository identity:

- Marketplace and Open VSX installs.
- Activation: first successful preview, export, or gateway disclosure.
- Time to first value.
- Weekly and monthly active installations.
- Week-one and week-four retention.
- Governed requests per active developer.
- Context-detail distribution across Outline, Logic, and Source.
- Approval, denial, and escalation rates using aggregate categories only.
- Number and proportion of users enabling the gateway.
- Crash-free and error-free session rate.
- Opt-in referral, review, and community participation rate.
- Enterprise-interest conversions.

Initial targets are hypotheses to validate, not promises:

- At least 40% of qualified new installations reach first value.
- Median time to first value below five minutes.
- At least 25% week-four retention among activated users.
- At least three governed sessions per retained user per week.
- At least 20 detailed interviews with retained users.
- At least 10 identifiable organizations with multiple organic users.

### Enterprise metrics

- Repositories and active developers covered by policy.
- Percentage of agent code requests mediated by Syntaxxed.
- Requests automatically minimized, approved, denied, or escalated.
- Approval response time and approval fatigue.
- Policy-decision latency and context-response latency.
- Relevant-context recall and task-success rate.
- Source tokens transmitted compared with the control workflow.
- Prevented restricted-path or secret disclosures.
- Deployment time and support burden.
- Pilot conversion and expansion.

### Evidence hierarchy for investors and buyers

Rank evidence in this order:

1. Paid production usage.
2. Paid pilot with an agreed expansion path.
3. Signed design-partner agreement with named executive sponsor.
4. Repeated organic use inside a recognizable organization.
5. Strong retained individual-developer use.
6. Written customer references and security validation.
7. Benchmarks and independent testing.
8. Downloads, website traffic, waiting-list sign-ups, and social interest.

Do not present low-quality metrics as if they were revenue evidence.

## Master execution pipeline

Use this as the operating register. Replace role owners with names when people
join, enter actual dates, and update status every Friday.

Status vocabulary:

- **Not started:** no work product exists.
- **In progress:** an owner and dated next action exist.
- **Blocked:** the blocking decision or dependency is recorded.
- **Complete:** the definition of done has objective evidence.

| ID | Priority | Target | Owner | Dependency | Action and recommendation | Definition of done | Initial status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-01 | Critical | Day 10 | Founder + solicitor | None | Confirm company structure and execute assignment of all existing Syntaxxed IP | Signed assignments, company register and cap table stored in data room | Not started |
| C-02 | Critical | Day 15 | Founder + solicitor | C-01 | Validate the Apache-2.0 local-core and separately licensed enterprise boundary | Written licensing memorandum and legally reviewed public terms | In progress — Apache-2.0 chosen and public terms updated |
| C-03 | High | Day 20 | Founder + IP adviser | C-01 | Review Syntaxxed name, domains, marketplace IDs and trademark risk | Search recorded, filing/renaming decision made | Not started |
| C-04 | Critical | Day 20 | Founder | C-01 | Put contributor, contractor, confidentiality and invention terms in place | No person can contribute without signed terms | Not started |
| F-01 | Critical | Day 14 | Founder + accountant | C-01 | Build 24-month monthly cash model with three scenarios | Model reconciles headcount, runway, cash and milestone dates | Not started |
| F-02 | High | Day 30 | Founder + tax adviser | F-01 | Assess SEIS/EIS eligibility and R&D-relief process | Written eligibility/action note from qualified adviser | Not started |
| F-03 | High | Day 45 | Founder | F-02 + initial angels | Prepare SEIS/EIS advance-assurance evidence if appropriate | Complete submission pack with named prospective investors | Not started |
| P-01 | Critical | Day 14 | Founder/engineer | Current 0.2.0 | Test install, gateway, disable and uninstall on Windows, macOS and Linux | Signed test matrix with all critical paths passing | Not started |
| P-02 | Critical | Day 21 | Founder/engineer | P-01 | Add clear gateway state, recent decisions and stale-registration repair | User can understand and repair state without editing JSON | Not started |
| P-03 | Critical | Day 21 | Founder + privacy adviser | Metrics definition | Add privacy-safe, explicit-consent product analytics | Data dictionary, consent flow and deletion path reviewed | Not started |
| P-04 | High | Day 30 | Founder/engineer | P-01 | Create signed release, SBOM, provenance and checksum workflow | Release checklist creates verifiable artifacts automatically | Not started |
| P-05 | High | Day 30 | Founder/engineer | P-01 | Validate current Claude Code and Cursor clients; document other adapters accurately | Repeatable compatibility tests and support matrix published | Not started |
| S-01 | Critical | Day 21 | Security engineer/adviser | P-01 | Complete formal local-gateway threat model and abuse cases | Reviewed document covers identity, paths, lifecycle, bypass and recovery | Not started |
| S-02 | High | Day 45 | Engineer | S-01 | Add fuzz/property tests for paths, protocol bodies and parser boundaries | Automated tests run in CI with recorded corpus/regressions | Not started |
| S-03 | High | Month 5 | External tester | S-01 + pilot build | Commission independent penetration test | Report received and critical/high findings resolved | Not started |
| G-01 | Critical | Day 21 | Founder/product | Positioning decision | Build landing page around least-privilege code context | Page has one audience, problem, demonstration and install action | Not started |
| G-02 | High | Day 30 | Founder/product | G-01 | Produce context reduction, disclosure escalation and prevention demos | Three short reproducible demos published | Not started |
| G-03 | High | Day 30 | Founder/security | S-01 | Publish security boundaries and threat-model summary | Prospective user can see protections and non-protections before install | Not started |
| G-04 | Critical | Day 35 | Founder | P-01 to P-05 | Launch free edition through Marketplace, Open VSX and owned channels | Signed release public; support and feedback routes monitored | Not started |
| G-05 | Critical | Weekly after launch | Founder/product | G-04 | Review activation, retention, errors and user feedback | Weekly cohort report and top-three action list produced | Not started |
| R-01 | Critical | Day 15 | Founder | None | Recruit first 100 qualified testers from relevant agent workflows | Named/contactable cohort or privacy-respecting opt-in pool exists | Not started |
| R-02 | Critical | Day 60 | Founder | G-04 | Interview at least 10 activated and five churned users | Notes coded into repeated jobs, objections and triggers | Not started |
| R-03 | Critical | Day 90 | Founder | R-02 | Complete at least 20 interviews with retained users | Evidence summary changes or confirms ICP and roadmap | Not started |
| R-04 | High | Day 60 | Founder/engineer | Benchmark corpus | Publish first controlled relevance/task-success benchmark | Method, corpus licences, results and limitations reproducible | Not started |
| E-01 | Critical | Day 30 | Founder | ICP hypothesis | Create 50-account design-partner target list | Every account has ICP reason, trigger, champion hypothesis and next action | Not started |
| E-02 | Critical | Day 60 | Founder | E-01 | Complete first 10 enterprise discovery meetings | Pain, owner, current process, urgency and procurement recorded | Not started |
| E-03 | Critical | Day 90 | Founder + engineer | E-02 | Secure three technical validations | Scope, data boundary, success measure and scheduled date agreed | Not started |
| E-04 | Critical | Month 4 | Founder + solicitor | E-03 | Standardize six-week pilot, DPA and security pack | Reusable proposal and contract pack approved | Not started |
| E-05 | Critical | Month 6 | Founder | E-04 | Run five pilots and convert at least one to paid | Pilot evidence and paid agreement stored in data room | Not started |
| T-01 | High | Day 45 | Founder | Credibility gaps | Recruit security-buyer and developer-platform operating advisers | Written scope, conflicts, time, equity and deliverables agreed | Not started |
| T-02 | High | Month 5 | Founder | F-01 + funding confidence | Prepare first senior security/platform engineer scorecard | Role outcomes, interview process and compensation approved | Not started |
| V-01 | High | Day 30 | Founder | Positioning | Build 120-investor longlist and qualify first 80 | Stage, cheque, thesis, conflicts, partner and introducer recorded | Not started |
| V-02 | High | Day 60 | Founder | Metrics + F-01 | Draft deck, memorandum, model and diligence index | Materials survive review by three experienced founders/investors | Not started |
| V-03 | Critical | After Gate C | Founder + counsel | Retention + design partners | Run batched four-to-six-week pre-seed process | At least two credible lead paths or documented evidence gap | Not started |
| A-01 | Medium | Day 45 | Founder | Buyer hypotheses | Build 30-company strategic map | Product owner, rationale, overlap, route and next action recorded | Not started |
| A-02 | Medium | Day 90 | Founder/engineer | A-01 | Establish first five ecosystem relationships | Five relevant contacts and at least two integration discussions active | Not started |
| A-03 | Medium | Quarterly | Founder | A-02 | Send evidence-based strategic updates without sale solicitation | Relevant contacts receive concise product/customer/research update | Not started |
| D-01 | Critical | Day 15 | Founder | C-01 | Create data-room index and ownership/review cadence | Ten-section data room exists with owner and last-review metadata | Not started |
| D-02 | High | Monthly | Founder + accountant | D-01 | Update accounts, cap table, contracts, metrics and risk register | Monthly close completed and missing evidence assigned | Not started |

### Critical-path sequence

The first critical path is:

**C-01 → C-02 → P-01 → P-03/P-04 → G-04 → G-05 → R-03 → E-03 →
E-05 → Gate C → V-03**

Do not let investor outreach jump ahead of retention and design-partner evidence
unless immediate runway makes a bridge unavoidable.

The acquisition-option path runs alongside it at low intensity:

**A-01 → A-02 → integrations/customer overlap → executive sponsors → commercial
partnerships → Gate E**

It must not consume the product and customer time needed to create the value a
buyer would purchase.

## Eighteen-month stage-gated plan

## Stage 0 — company and launch foundation

Timing: weeks 0–4, August to early September 2026

### Objective

Make the product, company, and evidence systems safe to expose publicly.

### Tasks

#### Product and release

- Install and manually exercise the 0.2.0 VSIX in clean Windows, macOS, and
  Linux environments.
- Test Claude Code and Cursor registration against current released clients.
- Add an in-product explanation of what the gateway can and cannot mediate.
- Add a visible gateway state, recent decisions, and stale-registration repair
  workflow.
- Create a signed release process, SBOM, provenance record, and checksum page.
- Add crash reporting only if it can be privacy-preserving and opt-in.
- Create a reproducible release checklist.
- Publish a public issue template for security reports and a private security
  contact.

#### Legal and corporate

- Confirm the operating company and ownership structure with a UK startup
  solicitor and accountant.
- Execute founder IP assignment covering all existing code, designs,
  documentation, domains, trademarks, and inventions.
- Confirm no previous employment, contractor, or third-party terms claim any
  part of the IP.
- Establish a clean cap table and board/shareholder records.
- Decide the public licence and commercial licence boundary.
- Conduct a trademark and domain review for “Syntaxxed.”
- Prepare privacy notice, acceptable-use terms, end-user licence terms, and
  security disclosure policy.
- Put written contractor IP and confidentiality agreements in place before
  anyone contributes.
- Start a decision and invention log.

#### Finance

- Build a 24-month monthly cash-flow model with base, constrained, and
  accelerated cases.
- Separate product R&D, customer work, security/compliance, sales, and general
  administration costs.
- Engage an accountant familiar with UK R&D claims and venture-backed software.
- Assess SEIS/EIS eligibility and prepare for advance assurance with professional
  advice. HMRC expects an incorporated company, a UTR, a business plan,
  forecasts, use of funds, and evidence of prospective investors:
  https://www.gov.uk/guidance/venture-capital-schemes-apply-for-advance-assurance
- Review R&D tax-relief eligibility rather than assuming every engineering cost
  qualifies. Current HMRC guidance covers the merged RDEC and enhanced
  R&D-intensive support schemes:
  https://www.gov.uk/guidance/research-and-development-rd-tax-relief-the-merged-scheme-and-enhanced-rd-intensive-support

#### Evidence and analytics

- Define the precise activation and retention events.
- Write a telemetry data dictionary showing every collected field and why it is
  needed.
- Add opt-in product analytics that contain no code, file paths, prompts,
  credentials, repository names, user identity, or device fingerprint.
- Create a weekly product-metrics report.
- Define a benchmark corpus using permissively licensed repositories and
  synthetic restricted-data fixtures.

### Exit criteria

- Clean installation and removal on all three desktop platforms.
- No automatic network server or workspace mutation without consent.
- Release signing/provenance plan documented.
- IP ownership and contribution terms documented.
- Licence strategy decided.
- Privacy-safe activation and retention measurement operational.
- Public landing page, documentation, and onboarding ready.

## Stage 1 — free developer validation

Timing: weeks 5–12, September to October 2026

### Objective

Prove that solo developers repeatedly choose Syntaxxed when working with coding
agents.

### Developer acquisition pipeline

| Stage | User action | Product task | Primary measure |
| --- | --- | --- | --- |
| Discover | Sees a concrete use case | Publish demos and technical content | Qualified visits |
| Evaluate | Reads security model or watches demo | Clear comparison and threat model | Install-page conversion |
| Install | Installs extension | Marketplace/Open VSX and signed VSIX | Installs |
| Activate | Produces first preview/export/request | Five-minute guided onboarding | Activation rate |
| Reach value | Sees useful context reduction/control | Before/after receipt and explanation | Time to value |
| Retain | Uses it in later agent sessions | Reliable workflow and status UI | W1/W4 retention |
| Advocate | Reviews, stars, refers, contributes | Community and feedback loops | Referrals/reviews |
| Qualify | Indicates team/security need | Enterprise-interest call to action | Qualified leads |

### Acquisition tasks

- Publish to the VS Code Marketplace and Open VSX only after repository,
  support, privacy, and release metadata are complete.
- Produce three short demonstrations:
  - Reduce a large repository to task-relevant context.
  - Show progressive Outline to Logic to Source disclosure.
  - Show a secret or restricted path being prevented without exposing it.
- Publish the threat model and an honest “what Syntaxxed does not protect”
  article.
- Publish a transparent context-quality and efficiency benchmark.
- Create starter configurations for common TypeScript repositories.
- Add integrations and instructions for Claude Code, Cursor, Codex, Cline, and
  GitHub Copilot where supported.
- Participate helpfully in relevant developer communities; do not mass-post or
  manufacture engagement.
- Ask every retained user for a 20-minute interview.
- Run a weekly onboarding review using recordings only where the user has
  explicitly consented and no source content can be captured.
- Ship at least one user-visible improvement every two weeks during validation.

### Interview questions

- What job were you trying to complete?
- What agent and repository type were involved?
- What did you do before Syntaxxed?
- Was context size, confidentiality, relevance, or control the main problem?
- Which part felt unnecessary or confusing?
- When would you bypass Syntaxxed?
- Would you be disappointed if it disappeared?
- Does your employer already have a policy for coding agents?
- Who would care about team-wide visibility or policy?
- Would you introduce the product internally?

Avoid asking “Would you pay?” in isolation. Ask what existing budget, process,
or risk the product could replace.

### Exit criteria

Proceed when:

- Retention approaches the stated hypotheses or shows a clear improving trend.
- At least 20 retained users have completed interviews.
- At least five users have independently introduced Syntaxxed to colleagues.
- At least 10 organizations show multi-user or enterprise interest.
- The top three use cases are consistent enough to guide the next release.

If activation is low, fix onboarding before marketing. If activation is high
but retention is low, fix recurring value before fundraising.

## Stage 2 — enterprise discovery and design partners

Timing: months 3–6, November 2026 to January 2027

### Objective

Turn bottom-up usage into three to five serious enterprise design partners.

### Initial ideal-customer profile

Prioritize organizations that:

- Employ approximately 200 to 5,000 software engineers.
- Have meaningful proprietary code or regulated data.
- Already use two or more coding agents.
- Have an established developer-platform or application-security team.
- Permit controlled experimentation without a year-long procurement cycle.
- Can provide a technical champion and an executive or budget sponsor.

Strong early vertical hypotheses include fintech, cybersecurity, developer
infrastructure, B2B SaaS, regulated software, and IP-sensitive engineering.
Do not commit to a regulated-sector sales motion until product and compliance
capacity can support it.

### Design-partner pipeline

Recommended initial funnel:

| Stage | Target count | Exit requirement |
| --- | ---: | --- |
| Named target accounts | 50 | Matches ICP and has an identifiable trigger |
| Warm introductions or relevant inbound | 30 | Champion or sponsor accepts contact |
| Discovery meetings | 20 | Confirmed workflow, pain, owner, and urgency |
| Technical validations | 10 | Real repository test with agreed boundaries |
| Design-partner proposals | 7 | Scope, success criteria, responsibilities |
| Active pilots | 5 | Agreement signed and deployment started |
| Paid pilots or contracts | 3 | Money received or binding procurement path |

These are planning numbers, not guaranteed conversion rates.

### Pipeline roles

- **Champion:** staff engineer, developer-experience lead, or application
  security engineer who wants the product to succeed.
- **Technical owner:** developer-platform or AI-platform team.
- **Security approver:** AppSec, product security, or CISO delegate.
- **Economic buyer:** VP Engineering, platform leader, CISO, or CTO.
- **Blockers:** procurement, legal, data protection, endpoint engineering, and
  works councils where applicable.

Do not treat a friendly developer without access to a budget sponsor as a
complete design partner.

### Discovery tasks

- Create an account brief before every call: agent adoption, repositories,
  security posture, likely owner, relevant public initiatives, and trigger.
- Map the existing workflow from agent request to code disclosure.
- Quantify current agent usage, model costs, data-policy constraints, incidents,
  manual reviews, and blocked deployments.
- Identify whether the buyer values cost, confidentiality, policy, audit, or
  enablement most.
- Establish a named success metric and current baseline.
- Confirm procurement and security-review steps before proposing dates.
- Ask for access to both the developer champion and security/platform buyer.

### Six-week pilot structure

Week 0:

- Signed pilot agreement, DPA where required, scope, repositories, users,
  deployment boundary, and success criteria.

Week 1:

- Baseline agent workflow, policy workshop, installation, and threat-model
  review.

Weeks 2–4:

- Controlled use, weekly feedback, incident review, latency and task-success
  measurement, and policy tuning.

Week 5:

- Expansion test across an additional team or repository.

Week 6:

- Executive readout, quantified outcome, security findings, roadmap gaps,
  production proposal, and reference decision.

Recommended success criteria:

- Meaningful reduction in transmitted source context without material task
  success regression.
- No cross-workspace or unauthorized disclosure in the pilot boundary.
- Acceptable p95 response latency.
- Approval burden within an agreed limit.
- Positive developer satisfaction.
- Security/platform sponsor agrees there is a production problem worth funding.

Prefer paid pilots. If an unpaid pilot is strategically necessary, require
executive sponsorship, a fixed end date, structured feedback, a reference or
case-study discussion, and a pre-agreed commercial conversion decision.

### Exit criteria

- Three to five active design partners.
- At least one paid pilot.
- Two written or recorded executive-level statements of the problem.
- A ranked enterprise roadmap based on repeated requirements.
- A deployment and support model that does not require bespoke engineering for
  every account.

## Stage 3 — primary pre-seed process

Timing: prepare during months 3–5; run a concentrated process once Stage 2
evidence is credible

### Objective

Raise enough capital to build the pilot-ready enterprise product and team while
retaining strategic freedom.

### Recommended investor segmentation

Build a list of 80 to 120 relevant investors across:

- UK SEIS/EIS angels with cybersecurity, enterprise software, or developer-tool
  experience.
- Specialist cybersecurity seed funds.
- Developer-infrastructure and open-source investors.
- B2B enterprise-software seed funds.
- Selected US seed funds comfortable leading a UK company.
- Operators who have built developer tools, security platforms, or enterprise
  go-to-market teams.
- Non-dilutive grant and Contracts for Innovation opportunities.

Monitor Innovate UK opportunities continuously rather than relying on a
specific competition. For example, the 2026 Cyber Scale competition funded
commercial cybersecurity demonstrations in critical sectors but is now closed:
https://www.ukri.org/opportunity/contracts-for-innovation-cyber-scale-in-critical-sectors/

UK seed fundraising is possible but selective. The British Business Bank
reported that UK smaller-business equity deal count fell 15.1% in 2024 even
though £10.8 billion was invested. Run a deliberate, time-bounded process:
https://www.british-business-bank.co.uk/about/research-and-publications/small-business-equity-tracker-2025

### Investor pipeline

Recommended funnel for a concentrated process:

| Stage | Planning target | Definition |
| --- | ---: | --- |
| Longlist | 120 | Broadly plausible stage/thesis/geography |
| Qualified | 80 | Check size, ownership, conflicts, track record |
| Warm intro requested | 60 | Named introducer and tailored rationale |
| First meetings | 35–45 | Investor has seen deck and evidence |
| Partner meetings | 12–18 | Fund-level interest, not associate research |
| Active diligence | 5–8 | Data room, references, product/security review |
| Credible term sheets | 2 or more | Comparable economics and clean terms |
| Lead and close | 1 lead plus syndicate | Funds received and announced |

### Pipeline fields

Track:

- Fund and partner.
- Stage, cheque range, reserve strategy, and ownership target.
- Relevant investments and conflicts.
- Cybersecurity, developer-tool, open-source, and enterprise expertise.
- Geography and lead capability.
- Warm introducer and relationship strength.
- First contact, last contact, next action, owner, and deadline.
- Current stage and probability.
- Key objection.
- Reference calls requested.
- Data-room access.
- Decision process and partnership meeting date.
- Term details and legal status.

### Fundraising materials

Prepare before opening the process:

- Twelve-slide main deck.
- Two-page investment memorandum.
- Five-minute product demonstration.
- One-page architecture and security boundary.
- Market and competitor map.
- Developer traction dashboard with cohort retention.
- Design-partner pipeline and anonymized evidence.
- Benchmark report.
- Eighteen- and twenty-four-month financial model.
- Hiring plan and use of funds.
- Cap table.
- Product roadmap with stage gates.
- Data room.
- Customer and expert references.
- Clear answer to acquisition-platform risk.

Suggested deck flow:

1. Agent adoption creates uncontrolled code-context disclosure.
2. Existing controls govern models, endpoints, or MCP tools but not the minimum
   necessary code context.
3. Syntaxxed demonstrates progressive, reviewable disclosure.
4. Free developers create bottom-up distribution.
5. Enterprise policy and audit create the commercial expansion.
6. Evidence: retention, governed requests, benchmarks, and design partners.
7. Market and timing.
8. Competition and differentiation.
9. Business model.
10. Roadmap and team.
11. Financial plan and milestones.
12. Round size and use of funds.

### Process recommendations

- Do not drip investor conversations over six months.
- Complete preparation and reference cultivation first.
- Run first meetings in a four- to six-week batch to create comparable timing.
- Start with knowledgeable but non-critical investors, refine the pitch, then
  approach priority leads.
- Send a short weekly update to engaged investors.
- Keep product and customer momentum visible during the process.
- Perform reference checks on investors, including how they behave when a
  company misses plan.
- Compare liquidation preference, option-pool treatment, board control,
  protective provisions, pro-rata rights, and founder vesting—not only
  valuation.
- Avoid strategic rights of first refusal or exclusivity that could discourage
  future acquirers.
- Use an experienced startup solicitor for the round.

### SEIS/EIS recommendation

Obtain professional advice early. HMRC's 2026 statistics report that £276
million was raised under SEIS in 2024–25 and that information/communications
companies represented 42% of SEIS investment. Advance assurance can materially
help UK angel conversations:
https://www.gov.uk/government/statistics/enterprise-investment-scheme-and-seed-enterprise-investment-scheme-may-2026/enterprise-investment-scheme-and-seed-enterprise-investment-scheme-2026

HMRC generally requires evidence of prospective investors for a first advance
assurance application, so cultivate named angel interest before filing:
https://www.gov.uk/hmrc-internal-manuals/venture-capital-schemes-manual/vcm60230

### Exit criteria

- A lead investor with relevant expertise.
- At least 18 months of post-close runway under the base plan.
- Clean terms that preserve the ability to raise or sell later.
- Hiring scorecards ready before funds arrive.
- Board reporting and financial controls ready.

If the company cannot secure two credible term-sheet paths, diagnose the gap
rather than accepting structurally poor terms. Likely causes are insufficient
retention, weak enterprise evidence, unclear differentiation, or team risk.

## Stage 4 — enterprise alpha and paid conversion

Timing: months 6–12, February to July 2027

### Product priorities

Build only capabilities repeatedly required by design partners:

1. Versioned repository and organization policy.
2. Explainable decisions and policy simulation.
3. Stable client registration without secrets in project files.
4. Encrypted local policy and audit storage.
5. Signed policy distribution and offline verification.
6. Identity-aware decisions for user, device, workspace, agent, and model.
7. Central audit metadata without source payloads by default.
8. SIEM export.
9. Administrative APIs and deployment automation.
10. Additional parser-backed languages selected by customer usage.
11. Retrieval evaluation and dependency-aware context selection.
12. Integration adapters for the highest-usage agent platforms.

Do not build billing, extensive dashboards, or broad integrations before the
underlying policy and deployment model has been validated.

### Security priorities

- Complete a formal threat model and abuse-case review.
- Fuzz path handling, JSON-RPC lifecycle, parser boundaries, and policy inputs.
- Add tamper-resistant update and release verification.
- Commission an independent penetration test before production deployment.
- Establish vulnerability intake, severity, response, and disclosure SLAs.
- Produce an incident-response plan and run a tabletop exercise.
- Automate SBOM generation and dependency/vulnerability review.
- Add tenant, organization, and identity isolation tests.
- Define data retention and deletion controls.
- Establish least-privilege production access and auditable administrative
  operations.
- Start a SOC 2 readiness gap assessment only when customer demand justifies
  it; do not mistake a compliance project for product security.

### Commercial priorities

- Convert at least three pilots to annual contracts.
- Define packaging and pricing around governed developers, repositories, or
  policy coverage rather than token savings alone.
- Establish an implementation package with a fixed scope.
- Create a standard security review pack.
- Produce two approved case studies.
- Track gross retention, expansion, support cost, sales cycle, and deployment
  time.
- Avoid customer-specific forks; use feature flags and versioned policy.

### Team plan

Recommended first hires:

1. Senior security/platform engineer: authentication, policy, audit, endpoint
   security, and distributed systems.
2. Senior developer-product/integrations engineer: editor and agent adapters,
   onboarding, reliability, and cross-platform delivery.
3. Product-minded enterprise engineer or solutions architect once pilots
   require repeatable deployments.
4. Developer relations or product marketing only after retention is strong.
5. Account executive only after the founder has personally closed repeatable
   paid pilots.

Use advisors to add credibility, not to substitute for operators. Seek:

- A former CISO or application-security buyer.
- A developer-platform leader.
- An enterprise-security founder with fundraising and M&A experience.

Define their time, deliverables, conflicts, confidentiality, equity, and term in
writing. Avoid ornamental advisory boards.

### Exit criteria

- Three or more paid annual customers or convincingly contracted equivalents.
- Repeatable deployment under an agreed target time.
- Two referenceable customers.
- Independent security review completed with major findings resolved.
- Evidence that context reduction does not materially harm task completion.
- Clear expansion path from one team to the wider organization.

## Stage 5 — seed round or strategic process

Timing: months 12–18, August 2027 to January 2028

### Choose the path using evidence

Pursue a seed round when:

- Retention and paid conversion are strong.
- The market opportunity is larger than the current product.
- The team wants to build an independent category leader.
- Additional capital can predictably accelerate integrations, sales, and
  control-plane development.

Consider a strategic process when:

- Multiple credible buyers express interest.
- A platform owner can distribute the product materially faster.
- Integration dependency makes strategic ownership unusually valuable.
- The likely risk-adjusted acquisition outcome exceeds the independent plan.
- Investors, founders, employees, and customers can be treated fairly.

Do not start a formal sale because fundraising is temporarily difficult. That
usually produces weak leverage.

## Strategic-acquirer pipeline

### Buyer hypotheses

These are research targets, not assertions that any company wants to acquire
Syntaxxed.

| Buyer category | Examples to research | Strategic reason |
| --- | --- | --- |
| Model and coding-agent platforms | Anthropic, OpenAI, Microsoft/GitHub, Cursor, Cline | Native context policy, enterprise trust, agent differentiation |
| Developer platforms | GitLab, JetBrains, Atlassian, JFrog, Harness, Coder, Docker | Governed AI development across repositories and workspaces |
| Cybersecurity platforms | Palo Alto Networks, Cisco, CyberArk, Snyk, GitGuardian, CrowdStrike, Check Point, Google/Wiz | AI data security, application security, identity and policy |
| Gateway and infrastructure vendors | Cloudflare, F5, Citrix/NetScaler, Kong, Redpanda | Extend traffic/tool governance into code-context decisions |
| Enterprise AI governance vendors | Backslash, Noma, WitnessAI, Protect AI business inside Palo Alto | Fill a developer-context and code-disclosure product gap |

### Build a 30-company strategic map

For each organization record:

- Relevant product line and executive owner.
- Build, partner, or buy rationale.
- Existing competing capability.
- Integration surface.
- Distribution advantage.
- Recent acquisitions and likely appetite.
- Internal champion or route to one.
- What evidence would make Syntaxxed strategically important.
- Conflict and information-sharing risk.
- Relationship stage and next action.

### Strategic relationship stages

| Stage | Purpose | Exit requirement |
| --- | --- | --- |
| Monitor | Understand strategy and product movement | Named owner and quarterly review |
| Ecosystem contact | Establish a credible relationship | Relevant product/BD contact responds |
| Integration | Demonstrate complementary value | Working integration or joint user |
| Executive sponsor | Link to roadmap and customer need | Director/VP-level sponsor |
| Commercial partnership | Prove combined distribution/value | Agreement, referrals, or marketplace |
| Strategic dialogue | Explore build/partner/buy choices | Authorized executive conversation |
| Formal indication | Establish price/process seriousness | Written non-binding indication |
| Diligence | Validate company and asset | NDA, data room, timetable |
| Competitive process | Create leverage and certainty | Multiple credible parties |
| Definitive agreement | Negotiate complete outcome | Board/shareholder approvals and signed deal |

### Relationship strategy

- Lead with integrations, standards work, customer evidence, or research—not
  “please acquire us.”
- Attend and contribute to MCP/Agentic AI Foundation events where technically
  relevant.
- Publish original security and context-evaluation research.
- Seek marketplace listings and interoperability partnerships.
- Give strategic contacts concise quarterly updates.
- Never disclose source code, customer-confidential data, detailed unpublished
  roadmap, or patentable material without a justified process and appropriate
  agreement.
- Assume a potential buyer may also choose to build the feature.
- Keep at least three buyer categories warm so one relationship cannot control
  the outcome.

### Acquisition value drivers

Strategic buyers will pay for assets that are faster or safer to buy than
build:

- A retained developer distribution channel.
- Enterprise customers and procurement approvals.
- Deep integrations across competing agents.
- A proven low-latency policy engine.
- Evaluation datasets and reproducible benchmarks.
- Unique policy and context-decision intellectual property.
- A trusted security brand and research capability.
- A senior team that is difficult to recruit.
- Standards influence.
- High-quality telemetry about aggregate policy behavior, collected lawfully
  and without customer source content.

Downloads without retention, a codebase without customers, or a generic proxy
are unlikely to command a strong strategic price.

### M&A readiness tasks

- Maintain complete IP assignments and dependency records.
- Keep the cap table, Companies House records, board approvals, option grants,
  and tax filings current.
- Avoid undocumented promises to employees, advisors, investors, or customers.
- Use assignable customer and supplier contracts with sensible change-of-control
  terms.
- Record all security incidents and their remediation.
- Separate customer data and secrets from diligence materials.
- Maintain monthly management accounts and revenue reconciliation.
- Track customer concentration and any unusual side letters.
- Document architecture, deployment, support, roadmap, and key-person risk.
- Prepare retention and incentive scenarios for the team.
- Engage specialist M&A counsel before sharing a data room.
- Engage an M&A adviser only when the expected deal size, complexity, and buyer
  competition justify the fee and process.

### Do not grant

Without specific legal advice and compelling value, avoid:

- Acquisition exclusivity during ordinary partnership discussions.
- Rights of first refusal over the whole company.
- Broad most-favoured-customer pricing.
- Unlimited IP indemnities.
- Ownership of general product improvements by a pilot customer.
- Strategic investor vetoes that block future fundraising or sale.
- Customer rights to source or models beyond narrowly defined escrow events.

## Data room structure

Create this now and maintain it monthly:

1. Corporate
   - Incorporation, articles, registers, board/shareholder minutes.
2. Capitalization
   - Cap table, share issuances, options, convertibles, investor rights.
3. Finance and tax
   - Management accounts, bank records, forecasts, tax returns, R&D support.
4. Intellectual property
   - Founder/employee/contractor assignments, licences, trademarks, invention
     log, open-source inventory.
5. Product and technology
   - Architecture, roadmap, release process, SBOM, uptime and quality metrics.
6. Security and privacy
   - Threat models, tests, incidents, policies, subprocessors, retention.
7. Customers and market
   - Contracts, pipeline, references, cohort data, research, competition.
8. Commercial
   - Pricing, partnerships, suppliers, insurance, material commitments.
9. People
   - Employment and advisory agreements, options, organization and hiring plan.
10. Fundraising or transaction
   - Deck, term sheets, diligence tracker, disclosure schedule, approvals.

Every file should have an owner, last-reviewed date, and confidentiality
classification.

## Operating pipelines

Maintain four separate pipelines. A contact may appear in more than one, but
the purpose and next action must remain distinct.

### Developer pipeline fields

- Week/cohort.
- Source channel.
- Qualified visits.
- Installs.
- Activated installations.
- Time to first value.
- Week-one retained.
- Week-four retained.
- Weekly governed requests.
- Gateway-enabled installations.
- Interviewed users.
- Referrals/reviews.
- Enterprise leads.
- Top failure and requested feature.

### Design-partner pipeline fields

- Account.
- Segment and size.
- Champion, technical owner, security approver, and economic buyer.
- Agent platforms used.
- Pain and triggering event.
- Current disclosure/control process.
- Stage.
- Baseline metric.
- Proposed pilot and success metric.
- Security/procurement status.
- Commercial value.
- Probability.
- Last contact, next action, owner, and deadline.
- Loss reason.

### Investor pipeline fields

- Fund/angel and partner.
- Investor category.
- Stage and cheque range.
- Lead capability.
- Relevant investments/conflicts.
- Warm introducer.
- Thesis fit.
- Stage in process.
- Objection.
- References.
- Last contact, next action, owner, and deadline.
- Probability and expected amount.
- Term-sheet notes.

### Strategic-acquirer pipeline fields

- Company and business unit.
- Product/executive owner.
- Buyer category.
- Strategic gap and overlap.
- Integration opportunity.
- Internal champion.
- Relationship stage.
- Evidence shared.
- Confidentiality boundary.
- Recent M&A pattern.
- Estimated strategic fit: high, medium, or low.
- Last contact, next action, owner, and deadline.

### Weekly pipeline discipline

Every open record must have one dated next action. Review:

- Monday: product metrics and developer cohorts.
- Tuesday: user interviews and design-partner pipeline.
- Wednesday: product/security delivery.
- Thursday: investor and strategic relationships.
- Friday: cash, hiring, risks, decisions, and written weekly update.

Close or downgrade stale opportunities rather than letting the CRM become a
wish list.

## First 30, 60, and 90 days

### Days 1–30

- Finalize licensing and incorporation/IP position.
- Complete clean cross-platform release testing.
- Add privacy-safe activation and retention analytics.
- Complete threat model and public security boundaries.
- Establish signed/provenance-aware release process.
- Build landing page, demo, onboarding, feedback, and enterprise-interest flow.
- Create product, design-partner, investor, and acquirer pipeline trackers.
- Identify the first 100 individual testers.
- Build a 50-account design-partner list.
- Build a 120-investor longlist but do not start the formal raise.
- Build a 30-company strategic map.
- Recruit two credible operational advisors.
- Prepare SEIS/EIS and R&D-relief questions for professional advisers.

### Days 31–60

- Launch the free product.
- Interview at least 10 activated and five churned users.
- Publish the threat model and first benchmark.
- Release two onboarding improvements based on evidence.
- Start warm discovery with 10 target enterprise accounts.
- Obtain three technical-validation commitments.
- Draft deck, financial model, and data-room index.
- Start investor relationship-building through advice conversations, not a
  formal process.
- Begin two ecosystem/integration conversations.

### Days 61–90

- Reach 20 or more completed retained-user interviews.
- Produce the first cohort retention report.
- Decide whether the wedge and messaging are validated.
- Start up to five technical enterprise validations.
- Convert the best opportunities into written design-partner proposals.
- Finalize pilot terms and standard security-review material.
- Decide whether metrics support a fundraising launch.
- If yes, lock the round size, milestones, list, references, and six-week
  process calendar.
- If no, publish the learning, revise the product, and delay fundraising rather
  than pitching weak evidence.

## Risk register and recommended responses

| Risk | Early indicator | Response |
| --- | --- | --- |
| Product is perceived as a token-compression feature | Interest but low retention or willingness to deploy | Lead with least-privilege context policy and measurable disclosure control |
| Agents bypass the gateway through filesystem/shell tools | High unmanaged read volume | Build adapters, launch controls, and policy-aware execution integrations; state limits honestly |
| Large vendors copy generic gateway features | Similar product announcements | Focus on code-specific policy, evaluations, integrations, and developer distribution |
| Free users do not convert to enterprise leads | Strong individual use but no organizational pull | Add team visibility and internal-introduction workflows; interview platform/security buyers |
| Enterprise requirements overwhelm a small team | Every pilot requests bespoke deployment | Narrow ICP, standardize pilot, reject non-repeatable work |
| Security failure damages trust | Disclosure incident, stale credentials, weak release process | Fail closed, test boundaries, signed releases, incident process, independent review |
| Open-core fork competes with company | Cloud vendors repackage core | Keep control plane, managed policy, certifications, brand, support, and enterprise integrations differentiated |
| Closed source slows trust and adoption | Security teams refuse opaque mediator | Publish threat model, SBOM and tests; reconsider open-core boundary |
| Solo-founder risk blocks investment | Investors question delivery and enterprise credibility | Add senior operators, strong design partners, and a clear first-hire plan |
| Fundraising distracts from adoption | Product velocity and interviews drop | Time-box the raise and maintain weekly product/customer targets |
| Early strategic interest anchors a low price | One buyer requests exclusivity before traction | Keep alternatives active and do not run a single-buyer process |
| Poor corporate hygiene blocks a deal | Missing assignments, unclear licence, cap-table errors | Maintain the data room and quarterly legal/IP review |

## Decision gates

### Gate A — public launch

Pass only if:

- Product installation and removal are reliable.
- Security boundaries are documented.
- Analytics are privacy-safe.
- Licence/IP position is clear.
- Support and incident routes exist.

### Gate B — enterprise build

Pass only if:

- Retained users validate the recurring problem.
- At least three organizations request related controls.
- Requirements converge around a repeatable policy/deployment model.

### Gate C — primary pre-seed

Pass only if:

- Retention evidence is defensible.
- Design partners include credible champions and buyers.
- The use of funds reaches paid enterprise evidence.
- The team and security plan are credible.

### Gate D — seed

Pass only if:

- Paid conversion and deployment are repeatable.
- Customer references exist.
- Expansion economics are plausible.
- Capital accelerates an already working motion.

### Gate E — formal acquisition process

Pass only if:

- At least two credible buyers could participate.
- The company has enough runway to say no.
- Corporate, IP, security, financial, and customer diligence are ready.
- The board has compared the independent and acquisition outcomes.

## What not to do

- Do not spend a year building SSO, dashboards, and billing before design
  partners validate the core policy product.
- Do not count downloads as retained users.
- Do not make unenforceable claims that Syntaxxed controls every agent tool.
- Do not use customer source code to train or benchmark without explicit,
  specific permission.
- Do not publish vanity token-savings claims without task-success controls.
- Do not let a free tier create an uncapped cloud-compute liability.
- Do not hire a large sales team before founder-led sales is repeatable.
- Do not accept an investor solely because they offer the highest valuation.
- Do not approach companies asking to be acquired before building leverage.
- Do not allow one strategic partner to restrict relationships with others.

## Recommended immediate founder priorities

For the next quarter, allocate attention approximately as follows:

- 40% product quality, onboarding, and retention.
- 25% developer interviews and community.
- 20% design-partner discovery.
- 10% company, finance, IP, and funding preparation.
- 5% strategic ecosystem relationships.

The priority changes after repeatable design-partner demand:

- 40% enterprise product and security.
- 25% pilots and customer success.
- 20% hiring and management.
- 10% fundraising and finance.
- 5% strategic relationships.

## Final recommendation

The most credible route to both substantial funding and a strong outright
acquisition is the same: build a product developers actively choose, prove that
organizations need to govern it, and maintain multiple strategic options.

The next irreversible expenditure should not be a large enterprise control
plane. It should be the smallest set of work that proves:

1. developers retain the free product;
2. companies experience a real governance problem;
3. Syntaxxed improves that problem without degrading developer outcomes; and
4. a repeatable buyer will pay for shared policy, identity, audit, and control.

Once those facts exist, the enterprise roadmap becomes financeable and the
company becomes strategically valuable. Until then, disciplined evidence
creation is more important than feature volume.

This plan is commercial and operating guidance, not legal, tax, investment, or
accounting advice. Use qualified UK advisers for corporate structure, SEIS/EIS,
R&D relief, employment, privacy, fundraising documents, and any transaction.
